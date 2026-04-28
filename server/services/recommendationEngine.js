import Order from "../models/Order.js";
import Product from "../models/Product.js";
import UserInteraction from "../models/UserInteraction.js";

/**
 * Recommendation Engine
 * Uses hybrid collaborative + content-based filtering to suggest products.
 * 
 * Collaborative: "Users who bought X also bought Y"
 * Content-based: Same category, similar tags, similar price range
 * Popularity: viewCount, purchaseCount
 */

// Cache for pre-computed similarities (refreshed periodically)
let similarityCache = {};
let lastCacheTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Build a co-purchase matrix from order history.
 * Returns Map<productId, Map<productId, count>>
 */
async function buildCoPurchaseMatrix() {
    const orders = await Order.find({
        status: { $ne: 'Cancelled' },
        $or: [{ paymentType: "COD" }, { isPaid: true }]
    }).select('items');

    const matrix = {};

    for (const order of orders) {
        const productIds = order.items.map(item => item.product.toString());

        // For every pair of products in the same order, increment co-purchase count
        for (let i = 0; i < productIds.length; i++) {
            for (let j = 0; j < productIds.length; j++) {
                if (i === j) continue;
                if (!matrix[productIds[i]]) matrix[productIds[i]] = {};
                matrix[productIds[i]][productIds[j]] = (matrix[productIds[i]][productIds[j]] || 0) + 1;
            }
        }
    }

    return matrix;
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
    const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
    let dotProduct = 0, magA = 0, magB = 0;

    for (const key of keys) {
        const a = vecA[key] || 0;
        const b = vecB[key] || 0;
        dotProduct += a * b;
        magA += a * a;
        magB += b * b;
    }

    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Get content-based similarity score between two products
 */
function contentSimilarity(productA, productB) {
    let score = 0;

    // Same category = high match
    if (productA.category === productB.category) score += 0.5;

    // Tag overlap
    if (productA.tags && productB.tags) {
        const commonTags = productA.tags.filter(t => productB.tags.includes(t));
        const totalTags = new Set([...productA.tags, ...productB.tags]).size;
        if (totalTags > 0) score += 0.3 * (commonTags.length / totalTags);
    }

    // Similar price range (within 30%)
    const priceRatio = Math.min(productA.offerPrice, productB.offerPrice) /
                       Math.max(productA.offerPrice, productB.offerPrice);
    if (priceRatio > 0.7) score += 0.2 * priceRatio;

    return score;
}

/**
 * Refresh the product similarity cache
 */
async function refreshSimilarityCache() {
    const now = Date.now();
    if (now - lastCacheTime < CACHE_DURATION && Object.keys(similarityCache).length > 0) {
        return; // Cache is still fresh
    }

    const coPurchaseMatrix = await buildCoPurchaseMatrix();
    const products = await Product.find({}).lean();
    const productMap = {};
    products.forEach(p => { productMap[p._id.toString()] = p; });

    const newCache = {};

    for (const product of products) {
        const pid = product._id.toString();
        const scores = [];

        for (const other of products) {
            const oid = other._id.toString();
            if (pid === oid) continue;

            // Collaborative score
            let collabScore = 0;
            if (coPurchaseMatrix[pid] && coPurchaseMatrix[pid][oid]) {
                collabScore = Math.min(coPurchaseMatrix[pid][oid] / 10, 1); // Normalize to 0-1
            }

            // Content score
            const contentScore = contentSimilarity(product, other);

            // Popularity boost
            const popularityScore = Math.min((other.purchaseCount || 0) / 100, 1);

            // Hybrid weighted score
            const finalScore = 0.5 * collabScore + 0.35 * contentScore + 0.15 * popularityScore;

            if (finalScore > 0.05) {
                scores.push({ productId: oid, score: finalScore });
            }
        }

        // Sort by score descending, keep top 20
        scores.sort((a, b) => b.score - a.score);
        newCache[pid] = scores.slice(0, 20);
    }

    similarityCache = newCache;
    lastCacheTime = now;
    console.log(`[AI] Recommendation cache refreshed. ${Object.keys(newCache).length} products indexed.`);
}

/**
 * Get personalized recommendations for a user
 * @param {string} userId 
 * @param {number} limit
 * @returns {Array} recommended product IDs with scores
 */
export async function getRecommendationsForUser(userId, limit = 10) {
    await refreshSimilarityCache();

    // Get user's interaction history
    const interactions = await UserInteraction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    const userOrders = await Order.find({
        userId,
        status: { $ne: 'Cancelled' }
    }).select('items').lean();

    // Collect products the user has interacted with
    const interactedProducts = new Set();
    const interactionWeights = {};

    // Weight by interaction type
    const weights = { purchase: 1.0, cart: 0.7, view: 0.3, search: 0.2 };

    for (const interaction of interactions) {
        const pid = interaction.productId;
        interactedProducts.add(pid);
        interactionWeights[pid] = Math.max(
            interactionWeights[pid] || 0,
            weights[interaction.interactionType] || 0.1
        );
    }

    // Also add products from orders
    for (const order of userOrders) {
        for (const item of order.items) {
            const pid = item.product.toString();
            interactedProducts.add(pid);
            interactionWeights[pid] = Math.max(interactionWeights[pid] || 0, 1.0);
        }
    }

    // Score candidate products
    const candidateScores = {};

    for (const [interactedPid, weight] of Object.entries(interactionWeights)) {
        const similar = similarityCache[interactedPid] || [];
        for (const { productId, score } of similar) {
            if (interactedProducts.has(productId)) continue; // Don't recommend already-seen
            candidateScores[productId] = (candidateScores[productId] || 0) + score * weight;
        }
    }

    // Sort candidates by score
    const sorted = Object.entries(candidateScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

    // If not enough recommendations, fill with popular products
    if (sorted.length < limit) {
        const popularProducts = await Product.find({
            inStock: true,
            _id: { $nin: [...interactedProducts, ...sorted.map(s => s[0])] }
        })
        .sort({ purchaseCount: -1, viewCount: -1 })
        .limit(limit - sorted.length)
        .lean();

        for (const p of popularProducts) {
            sorted.push([p._id.toString(), 0.1]);
        }
    }

    return sorted.map(([productId, score]) => ({ productId, score }));
}

/**
 * Get similar products for a given product
 * @param {string} productId 
 * @param {number} limit
 * @returns {Array} similar product IDs with scores
 */
export async function getSimilarProducts(productId, limit = 5) {
    await refreshSimilarityCache();

    const similar = similarityCache[productId] || [];

    if (similar.length < limit) {
        // Fallback: get products from same category
        const product = await Product.findById(productId).lean();
        if (product) {
            const categoryProducts = await Product.find({
                category: product.category,
                inStock: true,
                _id: { $ne: productId }
            }).limit(limit).lean();

            const existingIds = new Set(similar.map(s => s.productId));
            for (const cp of categoryProducts) {
                const cpId = cp._id.toString();
                if (!existingIds.has(cpId)) {
                    similar.push({ productId: cpId, score: 0.2 });
                }
            }
        }
    }

    return similar.slice(0, limit);
}

/**
 * Force refresh the recommendation cache
 */
export async function forceRefreshCache() {
    lastCacheTime = 0;
    await refreshSimilarityCache();
}
