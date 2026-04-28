import { GoogleGenerativeAI } from "@google/generative-ai";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import UserInteraction from "../models/UserInteraction.js";
import ChatHistory from "../models/ChatHistory.js";
import { getRecommendationsForUser, getSimilarProducts, forceRefreshCache } from "../services/recommendationEngine.js";
import { getSuggestedPrice } from "../services/pricingEngine.js";
import { getDemandForecast } from "../services/forecastEngine.js";

// Initialize Gemini (lazy, only when needed)
let genAI = null;
function getGenAI() {
    if (!genAI && process.env.GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
}

// ========================
// CHATBOT
// ========================

// AI Chat: /api/ai/chat
export const aiChat = async (req, res) => {
    try {
        const userId = req.userId;
        const { message, conversationHistory = [] } = req.body;

        if (!message || !message.trim()) {
            return res.json({ success: false, message: "Message is required" });
        }

        const ai = getGenAI();
        if (!ai) {
            return res.json({ success: false, message: "AI service not configured. Please set GEMINI_API_KEY." });
        }

        // Build context
        const products = await Product.find({ inStock: true }).select('name category offerPrice price description').lean();
        const productCatalog = products.map(p =>
            `${p.name} (${p.category}) - ₹${p.offerPrice} (MRP: ₹${p.price})`
        ).join('\n');

        // Get user's recent orders for context
        let orderContext = '';
        if (userId) {
            const recentOrders = await Order.find({
                userId,
                $or: [{ paymentType: "COD" }, { isPaid: true }]
            })
            .populate('items.product', 'name')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

            if (recentOrders.length > 0) {
                orderContext = '\n\nUser\'s Recent Orders:\n' + recentOrders.map(o =>
                    `- Order #${o._id.toString().slice(-6)} (${o.status}) - ₹${o.amount} - ${new Date(o.createdAt).toLocaleDateString()}: ${o.items.map(i => i.product?.name || 'Unknown').join(', ')}`
                ).join('\n');
            }
        }

        const systemPrompt = `You are GreenCart AI Assistant — a friendly, helpful grocery shopping assistant for the GreenCart online store.

STORE INFORMATION:
- GreenCart is an online grocery delivery platform
- Free shipping on all orders
- Payment methods: Cash on Delivery (COD) and Online Payment (Stripe)
- 2% tax is added to all orders
- Orders can be cancelled before shipping

AVAILABLE PRODUCTS:
${productCatalog}
${orderContext}

INSTRUCTIONS:
1. Help users find products, suggest recipes, track orders, and answer store-related questions
2. When suggesting products, always mention the exact product name and price from the catalog
3. If asked about a product not in our catalog, politely say we don't carry it and suggest alternatives
4. Be friendly, concise, and helpful
5. For order tracking, use the order info provided above
6. You can suggest recipes using available products
7. Keep responses under 200 words unless the user asks for detail
8. When suggesting products, list them with this format: **Product Name** - ₹Price

IMPORTANT: Only reference products that exist in our catalog above.`;

        // Build chat history
        const model = ai.getGenerativeModel({ model: process.env.AI_CHATBOT_MODEL || "gemini-2.0-flash" });

        const chatMessages = [
            { role: 'user', parts: [{ text: systemPrompt + '\n\nNow start the conversation. The user says: ' + (conversationHistory.length === 0 ? message : 'Hi') }] },
            { role: 'model', parts: [{ text: "Hello! 🌿 Welcome to GreenCart! I'm your AI shopping assistant. How can I help you today? I can help you find products, suggest recipes, track your orders, or answer any questions about our store!" }] },
        ];

        // Add conversation history
        for (const msg of conversationHistory.slice(-8)) {
            chatMessages.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            });
        }

        // Add current message if it's not already in history
        if (conversationHistory.length > 0) {
            chatMessages.push({ role: 'user', parts: [{ text: message }] });
        }

        const chat = model.startChat({ history: chatMessages.slice(0, -1) });
        const result = await chat.sendMessage(chatMessages[chatMessages.length - 1].parts[0].text);
        const reply = result.response.text();

        // Find products mentioned in the reply
        const suggestedProducts = [];
        for (const product of products) {
            if (reply.toLowerCase().includes(product.name.toLowerCase())) {
                suggestedProducts.push(product);
            }
        }

        // Save to chat history
        if (userId) {
            await ChatHistory.findOneAndUpdate(
                { userId },
                {
                    $push: {
                        messages: {
                            $each: [
                                { role: 'user', content: message },
                                { role: 'assistant', content: reply, suggestedProducts: suggestedProducts.map(p => p._id) }
                            ]
                        }
                    }
                },
                { upsert: true, new: true }
            );
        }

        res.json({
            success: true,
            reply,
            suggestedProducts: suggestedProducts.slice(0, 4),
        });

    } catch (error) {
        console.log('[AI Chat Error - Fallback Mode Active]', error.message);
        
        try {
            let reply = "I'm currently in offline/fallback mode due to AI limits, but I'm still here! I've found some popular products you might like. You can also try our regular search feature.";
            let suggestedProducts = [];
            
            // Retrieve message from request body since the try block variable is out of scope
            const message = req.body?.message;

            // Smart Fallback: Try to find products matching the user's message
            if (message && typeof message === 'string') {
                // Extract potential keywords (words > 2 letters)
                const keywords = message.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 2);
                
                for (const kw of keywords) {
                    const matches = await Product.find({
                        inStock: true,
                        $or: [
                            { name: { $regex: kw, $options: 'i' } },
                            { category: { $regex: kw, $options: 'i' } },
                            { tags: { $regex: kw, $options: 'i' } }
                        ]
                    }).limit(4).lean();
                    suggestedProducts.push(...matches);
                }
                
                // Remove duplicate products
                suggestedProducts = Array.from(new Set(suggestedProducts.map(p => p._id.toString())))
                                         .map(id => suggestedProducts.find(p => p._id.toString() === id))
                                         .slice(0, 4);
                
                if (suggestedProducts.length > 0) {
                    reply = "I'm currently running in basic mode. Based on what you asked, here are some products you might be looking for:";
                }
            }

            // If no matching products found, show popular ones
            if (suggestedProducts.length === 0) {
                suggestedProducts = await Product.find({ inStock: true }).sort({ purchaseCount: -1 }).limit(4).lean();
            }

            res.json({ 
                success: true, 
                reply, 
                suggestedProducts,
                isFallback: true
            });
        } catch (fallbackError) {
            console.error('[AI Chat Fallback Crash]', fallbackError);
            res.json({ success: false, message: "A critical error occurred in fallback mode: " + fallbackError.message });
        }
    }
};

// ========================
// SMART SEARCH
// ========================

// Smart Search: /api/ai/smart-search
export const smartSearch = async (req, res) => {
    try {
        const { query } = req.body;

        if (!query || !query.trim()) {
            return res.json({ success: false, message: "Search query is required" });
        }

        const ai = getGenAI();
        if (!ai) {
            // Fallback to basic search
            const products = await Product.find({
                inStock: true,
                name: { $regex: query, $options: 'i' }
            }).lean();
            return res.json({ success: true, products, interpretation: `Showing results for "${query}"` });
        }

        // Get all products for context
        const allProducts = await Product.find({ inStock: true }).lean();
        const categories = [...new Set(allProducts.map(p => p.category))];

        const model = ai.getGenerativeModel({ model: process.env.AI_CHATBOT_MODEL || "gemini-2.0-flash" });

        const prompt = `You are a search query interpreter for a grocery store.

Available categories: ${categories.join(', ')}

User's search query: "${query}"

Analyze this search query and return ONLY a valid JSON object (no markdown, no code blocks) with:
{
  "keywords": ["list", "of", "relevant", "product", "keywords"],
  "categories": ["matching", "categories"],
  "priceRange": { "min": null, "max": null },
  "sortBy": "relevance" or "price_low" or "price_high",
  "interpretation": "Human-readable interpretation of what the user is looking for"
}

Rules:
- keywords should include the direct search terms AND related/synonym terms
- categories should only include exact matches from the available categories
- priceRange min/max should be numbers or null if not specified
- interpretation should be a friendly sentence explaining how you understood the query`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();

        // Clean up response — remove markdown code blocks if present
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let searchParams;
        try {
            searchParams = JSON.parse(responseText);
        } catch {
            // Fallback to basic search
            const products = await Product.find({
                inStock: true,
                name: { $regex: query, $options: 'i' }
            }).lean();
            return res.json({ success: true, products, interpretation: `Showing results for "${query}"` });
        }

        // Build MongoDB query from AI-parsed intent
        let mongoQuery = { inStock: true };
        const orConditions = [];

        // Keyword matching
        if (searchParams.keywords && searchParams.keywords.length > 0) {
            for (const kw of searchParams.keywords) {
                orConditions.push({ name: { $regex: kw, $options: 'i' } });
                orConditions.push({ description: { $regex: kw, $options: 'i' } });
                orConditions.push({ tags: { $regex: kw, $options: 'i' } });
            }
        }

        // Category matching
        if (searchParams.categories && searchParams.categories.length > 0) {
            orConditions.push({ category: { $in: searchParams.categories.map(c => new RegExp(c, 'i')) } });
        }

        if (orConditions.length > 0) {
            mongoQuery.$or = orConditions;
        }

        // Price range
        if (searchParams.priceRange) {
            if (searchParams.priceRange.min !== null) {
                mongoQuery.offerPrice = { ...mongoQuery.offerPrice, $gte: searchParams.priceRange.min };
            }
            if (searchParams.priceRange.max !== null) {
                mongoQuery.offerPrice = { ...mongoQuery.offerPrice, $lte: searchParams.priceRange.max };
            }
        }

        // Sort
        let sort = {};
        if (searchParams.sortBy === 'price_low') sort = { offerPrice: 1 };
        else if (searchParams.sortBy === 'price_high') sort = { offerPrice: -1 };
        else sort = { purchaseCount: -1 };

        const products = await Product.find(mongoQuery).sort(sort).lean();

        // If no results from AI search, fallback to basic
        if (products.length === 0) {
            const fallbackProducts = await Product.find({
                inStock: true,
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { category: { $regex: query, $options: 'i' } }
                ]
            }).lean();

            return res.json({
                success: true,
                products: fallbackProducts,
                interpretation: searchParams.interpretation || `Showing results for "${query}"`,
                aiPowered: true
            });
        }

        res.json({
            success: true,
            products,
            interpretation: searchParams.interpretation || `Showing results for "${query}"`,
            aiPowered: true
        });

    } catch (error) {
        console.log('[AI Search Error]', error.message);
        // Fallback to basic search
        const products = await Product.find({
            inStock: true,
            $or: [
                { name: { $regex: req.body.query || '', $options: 'i' } },
                { category: { $regex: req.body.query || '', $options: 'i' } },
            ]
        }).lean();
        res.json({ success: true, products, interpretation: `Showing results for "${req.body.query}"` });
    }
};

// ========================
// RECOMMENDATIONS
// ========================

// Get Recommendations: /api/ai/recommendations
export const getRecommendations = async (req, res) => {
    try {
        const userId = req.userId;
        const recommendations = await getRecommendationsForUser(userId, 10);

        // Fetch full product details
        const productIds = recommendations.map(r => r.productId);
        const products = await Product.find({
            _id: { $in: productIds },
            inStock: true
        }).lean();

        // Preserve recommendation order
        const productMap = {};
        products.forEach(p => { productMap[p._id.toString()] = p; });

        const orderedProducts = recommendations
            .map(r => productMap[r.productId])
            .filter(Boolean);

        res.json({ success: true, products: orderedProducts });
    } catch (error) {
        console.log('[AI Recommendation Error]', error.message);
        // Fallback: return popular products
        const products = await Product.find({ inStock: true })
            .sort({ purchaseCount: -1 })
            .limit(10)
            .lean();
        res.json({ success: true, products });
    }
};

// Get Similar Products: /api/ai/similar/:productId
export const getSimilarProductsAPI = async (req, res) => {
    try {
        const { productId } = req.params;
        const similar = await getSimilarProducts(productId, 5);

        const productIds = similar.map(s => s.productId);
        const products = await Product.find({
            _id: { $in: productIds },
            inStock: true
        }).lean();

        res.json({ success: true, products });
    } catch (error) {
        console.log('[AI Similar Error]', error.message);
        res.json({ success: true, products: [] });
    }
};

// ========================
// TRACK INTERACTION
// ========================

// Track Interaction: /api/ai/track
export const trackInteraction = async (req, res) => {
    try {
        const userId = req.userId;
        const { productId, interactionType } = req.body;

        if (!productId || !interactionType) {
            return res.json({ success: false, message: "productId and interactionType are required" });
        }

        await UserInteraction.create({ userId, productId, interactionType });

        // Update product counts
        if (interactionType === 'view') {
            await Product.findByIdAndUpdate(productId, { $inc: { viewCount: 1 } });
        } else if (interactionType === 'purchase') {
            await Product.findByIdAndUpdate(productId, { $inc: { purchaseCount: 1 } });
        }

        res.json({ success: true });
    } catch (error) {
        res.json({ success: true }); // Don't fail silently for tracking
    }
};

// ========================
// PRICING (SELLER)
// ========================

// Get Suggested Price: /api/ai/suggested-price/:productId
export const suggestedPrice = async (req, res) => {
    try {
        const { productId } = req.params;
        const suggestion = await getSuggestedPrice(productId);

        if (!suggestion) {
            return res.json({ success: false, message: "Product not found" });
        }

        res.json({ success: true, data: suggestion });
    } catch (error) {
        console.log('[AI Pricing Error]', error.message);
        res.json({ success: false, message: error.message });
    }
};

// ========================
// DEMAND FORECAST (SELLER)
// ========================

// Get Demand Forecast: /api/ai/forecast
export const demandForecast = async (req, res) => {
    try {
        const forecast = await getDemandForecast();
        res.json({ success: true, data: forecast });
    } catch (error) {
        console.log('[AI Forecast Error]', error.message);
        res.json({ success: false, message: error.message });
    }
};

// ========================
// IMAGE RECOGNITION
// ========================

// Recognize Image: /api/ai/recognize-image
export const recognizeImage = async (req, res) => {
    try {
        const { image } = req.body; // base64 image string

        if (!image) {
            return res.json({ success: false, message: "Image data is required" });
        }

        const ai = getGenAI();
        if (!ai) {
            return res.json({ success: false, message: "AI service not configured" });
        }

        const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Remove data URL prefix if present
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data,
                }
            },
            { text: 'Identify the grocery/food item(s) in this image. Return ONLY a JSON object (no markdown): { "items": ["item1", "item2"], "confidence": 0.9 }. Keep item names simple (e.g., "apple", "milk", "bread").' }
        ]);

        let responseText = result.response.text().trim();
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let recognized;
        try {
            recognized = JSON.parse(responseText);
        } catch {
            recognized = { items: [], confidence: 0 };
        }

        // Find matching products
        const matchedProducts = [];
        if (recognized.items && recognized.items.length > 0) {
            for (const item of recognized.items) {
                const products = await Product.find({
                    inStock: true,
                    $or: [
                        { name: { $regex: item, $options: 'i' } },
                        { tags: { $regex: item, $options: 'i' } },
                        { category: { $regex: item, $options: 'i' } },
                    ]
                }).limit(3).lean();
                matchedProducts.push(...products);
            }
        }

        // Deduplicate
        const uniqueProducts = [];
        const seenIds = new Set();
        for (const p of matchedProducts) {
            if (!seenIds.has(p._id.toString())) {
                seenIds.add(p._id.toString());
                uniqueProducts.push(p);
            }
        }

        res.json({
            success: true,
            recognized: recognized.items || [],
            confidence: recognized.confidence || 0,
            products: uniqueProducts.slice(0, 6),
        });

    } catch (error) {
        console.log('[AI Image Error - Fallback Mode Active]', error.message);
        const fallbackProducts = await Product.find({ inStock: true }).sort({ purchaseCount: -1 }).limit(3).lean();
        
        res.json({ 
            success: true, 
            recognized: ["Image Recognition Unavailable (Quota Exceeded)"], 
            confidence: 0,
            products: fallbackProducts,
            isFallback: true
        });
    }
};

// ========================
// CHAT HISTORY
// ========================

// Get Chat History: /api/ai/chat-history
export const getChatHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const history = await ChatHistory.findOne({ userId }).lean();

        res.json({
            success: true,
            messages: history?.messages?.slice(-20) || []
        });
    } catch (error) {
        res.json({ success: true, messages: [] });
    }
};

// Clear Chat History: /api/ai/clear-chat
export const clearChatHistory = async (req, res) => {
    try {
        const userId = req.userId;
        await ChatHistory.findOneAndUpdate(
            { userId },
            { messages: [] }
        );
        res.json({ success: true, message: "Chat history cleared" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
