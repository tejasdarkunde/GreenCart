import Order from "../models/Order.js";
import Product from "../models/Product.js";

/**
 * Smart Pricing Engine
 * Analyzes category averages, demand trends, and competition to suggest optimal pricing.
 */

/**
 * Get pricing suggestion for a product
 * @param {string} productId
 * @returns {Object} { suggestedPrice, suggestedOfferPrice, confidence, reasoning }
 */
export async function getSuggestedPrice(productId) {
    const product = await Product.findById(productId).lean();
    if (!product) return null;

    // 1. Get category statistics
    const categoryProducts = await Product.find({
        category: product.category,
        _id: { $ne: productId }
    }).lean();

    const categoryAvgPrice = categoryProducts.length > 0
        ? categoryProducts.reduce((sum, p) => sum + p.price, 0) / categoryProducts.length
        : product.price;

    const categoryAvgOfferPrice = categoryProducts.length > 0
        ? categoryProducts.reduce((sum, p) => sum + p.offerPrice, 0) / categoryProducts.length
        : product.offerPrice;

    // 2. Get demand trend (orders in last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

    const recentOrders = await Order.find({
        'items.product': productId,
        status: { $ne: 'Cancelled' },
        createdAt: { $gte: thirtyDaysAgo }
    }).lean();

    const olderOrders = await Order.find({
        'items.product': productId,
        status: { $ne: 'Cancelled' },
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    }).lean();

    const recentDemand = recentOrders.length;
    const olderDemand = olderOrders.length;

    // Determine demand trend
    let demandTrend = 'stable';
    let demandChangePercent = 0;

    if (olderDemand > 0) {
        demandChangePercent = ((recentDemand - olderDemand) / olderDemand) * 100;
        if (demandChangePercent > 20) demandTrend = 'increasing';
        else if (demandChangePercent < -20) demandTrend = 'decreasing';
    } else if (recentDemand > 0) {
        demandTrend = 'new_demand';
        demandChangePercent = 100;
    }

    // 3. Calculate suggested prices
    let suggestedPrice = product.price;
    let suggestedOfferPrice = product.offerPrice;
    const reasons = [];

    // Price vs category average analysis
    const priceVsCategoryRatio = product.offerPrice / categoryAvgOfferPrice;

    if (demandTrend === 'increasing') {
        if (priceVsCategoryRatio < 0.9) {
            // Below average price + high demand → can increase
            suggestedOfferPrice = Math.round(product.offerPrice * 1.1);
            suggestedPrice = Math.round(product.price * 1.08);
            reasons.push(`Demand up ${Math.round(demandChangePercent)}% — room to increase price (currently below category avg)`);
        } else {
            // At or above average + high demand → hold or slight increase
            suggestedOfferPrice = Math.round(product.offerPrice * 1.05);
            suggestedPrice = Math.round(product.price * 1.03);
            reasons.push(`Strong demand — slight price increase recommended`);
        }
    } else if (demandTrend === 'decreasing') {
        if (priceVsCategoryRatio > 1.1) {
            // Above average price + low demand → decrease
            suggestedOfferPrice = Math.round(categoryAvgOfferPrice * 0.95);
            suggestedPrice = Math.round(categoryAvgPrice);
            reasons.push(`Demand down ${Math.round(Math.abs(demandChangePercent))}% — consider reducing to category average`);
        } else {
            // Below average + low demand → slight decrease
            suggestedOfferPrice = Math.round(product.offerPrice * 0.95);
            suggestedPrice = product.price;
            reasons.push(`Lower demand trend — promotional pricing suggested`);
        }
    } else {
        if (priceVsCategoryRatio < 0.8) {
            suggestedOfferPrice = Math.round(categoryAvgOfferPrice * 0.9);
            suggestedPrice = Math.round(categoryAvgPrice * 0.95);
            reasons.push(`Priced significantly below category average — room to increase`);
        } else if (priceVsCategoryRatio > 1.2) {
            suggestedOfferPrice = Math.round(categoryAvgOfferPrice * 1.05);
            suggestedPrice = Math.round(categoryAvgPrice * 1.1);
            reasons.push(`Priced above category average — consider aligning with market`);
        } else {
            reasons.push(`Pricing is well-aligned with market — no changes needed`);
        }
    }

    // Ensure offer price < price
    if (suggestedOfferPrice >= suggestedPrice) {
        suggestedOfferPrice = Math.round(suggestedPrice * 0.85);
    }

    // Ensure prices don't go below 1
    suggestedPrice = Math.max(suggestedPrice, 1);
    suggestedOfferPrice = Math.max(suggestedOfferPrice, 1);

    // Calculate confidence (higher with more data)
    const dataPoints = recentDemand + olderDemand + categoryProducts.length;
    const confidence = Math.min(Math.round((dataPoints / 20) * 100), 95);

    return {
        suggestedPrice,
        suggestedOfferPrice,
        currentPrice: product.price,
        currentOfferPrice: product.offerPrice,
        categoryAvgPrice: Math.round(categoryAvgPrice),
        categoryAvgOfferPrice: Math.round(categoryAvgOfferPrice),
        demandTrend,
        demandChangePercent: Math.round(demandChangePercent),
        confidence: Math.max(confidence, 30), // Minimum 30% confidence
        reasoning: reasons.join('. '),
    };
}
