import Order from "../models/Order.js";
import Product from "../models/Product.js";

/**
 * Demand Forecasting Engine
 * Uses Exponential Moving Average (EMA) and trend analysis to predict future demand.
 */

/**
 * Calculate Exponential Moving Average
 * @param {Array<number>} data - Array of values
 * @param {number} period - EMA period
 * @returns {Array<number>}
 */
function calculateEMA(data, period) {
    if (data.length === 0) return [];
    
    const multiplier = 2 / (period + 1);
    const ema = [data[0]]; // First value is the same

    for (let i = 1; i < data.length; i++) {
        ema.push((data[i] - ema[i - 1]) * multiplier + ema[i - 1]);
    }

    return ema;
}

/**
 * Calculate linear regression for trend estimation
 * @param {Array<number>} values
 * @returns {{ slope: number, intercept: number }}
 */
function linearRegression(values) {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: values[0] || 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += values[i];
        sumXY += i * values[i];
        sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope: isNaN(slope) ? 0 : slope, intercept: isNaN(intercept) ? 0 : intercept };
}

/**
 * Get demand forecast data
 * @returns {Object} forecast data with predictions, alerts, and suggestions
 */
export async function getDemandForecast() {
    const now = new Date();
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);

    // Get all valid orders from last 90 days
    const orders = await Order.find({
        status: { $ne: 'Cancelled' },
        $or: [{ paymentType: "COD" }, { isPaid: true }],
        createdAt: { $gte: ninetyDaysAgo }
    }).populate('items.product').lean();

    // === 1. Daily Order Forecast ===
    // Build daily order counts for last 90 days
    const dailyCounts = {};
    for (let d = new Date(ninetyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
        dailyCounts[d.toISOString().split('T')[0]] = 0;
    }

    orders.forEach(order => {
        const date = new Date(order.createdAt).toISOString().split('T')[0];
        if (dailyCounts[date] !== undefined) {
            dailyCounts[date]++;
        }
    });

    const dateKeys = Object.keys(dailyCounts).sort();
    const dailyValues = dateKeys.map(d => dailyCounts[d]);

    // Calculate EMA (7-day) for smoothed trend
    const ema = calculateEMA(dailyValues, 7);
    const { slope, intercept } = linearRegression(dailyValues.slice(-30)); // Trend from last 30 days

    // Forecast next 7 days
    const dailyForecast = [];
    for (let i = 1; i <= 7; i++) {
        const forecastDate = new Date(now);
        forecastDate.setDate(forecastDate.getDate() + i);

        // Combine EMA trend with linear regression
        const emaForecast = ema.length > 0 ? ema[ema.length - 1] : 0;
        const regressionForecast = slope * (dailyValues.length + i) + intercept;
        const predicted = Math.max(0, Math.round((emaForecast * 0.6 + regressionForecast * 0.4)));

        // Confidence decreases for further-out predictions
        const confidence = Math.max(30, Math.round(90 - (i * 8)));

        dailyForecast.push({
            date: forecastDate.toISOString().split('T')[0],
            dayName: forecastDate.toLocaleDateString('en-US', { weekday: 'short' }),
            predictedOrders: predicted,
            confidence,
        });
    }

    // === 2. Product Demand Analysis ===
    const productDemand = {};
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

    orders.forEach(order => {
        order.items.forEach(item => {
            if (!item.product) return;
            const pid = item.product._id.toString();
            const isRecent = new Date(order.createdAt) >= thirtyDaysAgo;

            if (!productDemand[pid]) {
                productDemand[pid] = {
                    productId: pid,
                    name: item.product.name,
                    category: item.product.category,
                    image: item.product.image?.[0] || '',
                    recentSales: 0,
                    olderSales: 0,
                    totalQuantity: 0,
                };
            }

            if (isRecent) {
                productDemand[pid].recentSales += item.quantity;
            } else if (new Date(order.createdAt) >= sixtyDaysAgo) {
                productDemand[pid].olderSales += item.quantity;
            }
            productDemand[pid].totalQuantity += item.quantity;
        });
    });

    // Calculate trend for each product
    const productTrends = Object.values(productDemand).map(p => {
        let trend = 'stable';
        let trendPercent = 0;
        if (p.olderSales > 0) {
            trendPercent = ((p.recentSales - p.olderSales) / p.olderSales) * 100;
            if (trendPercent > 25) trend = 'rising';
            else if (trendPercent < -25) trend = 'falling';
        } else if (p.recentSales > 0) {
            trend = 'new';
            trendPercent = 100;
        }

        return {
            ...p,
            trend,
            trendPercent: Math.round(trendPercent),
            weeklyVelocity: Math.round((p.recentSales / 4) * 10) / 10, // avg per week
        };
    });

    // Sort by recent sales for trending products
    productTrends.sort((a, b) => b.recentSales - a.recentSales);

    // === 3. Restock Alerts ===
    const restockAlerts = productTrends
        .filter(p => p.trend === 'rising' && p.weeklyVelocity > 2)
        .map(p => ({
            productId: p.productId,
            name: p.name,
            image: p.image,
            weeklyVelocity: p.weeklyVelocity,
            trend: p.trend,
            alert: `Selling ${p.weeklyVelocity} units/week (↑${p.trendPercent}%). Ensure adequate stock.`,
        }));

    // === 4. Promotion Suggestions ===
    // Analyze day-of-week patterns
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    const dayOfWeekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    orders.forEach(order => {
        const day = new Date(order.createdAt).getDay();
        dayOfWeekCounts[day]++;
    });

    const avgDailyOrders = dayOfWeekCounts.reduce((a, b) => a + b, 0) / 7;
    const promotionSuggestions = [];

    dayOfWeekCounts.forEach((count, i) => {
        if (count < avgDailyOrders * 0.7) {
            promotionSuggestions.push({
                day: dayOfWeekNames[i],
                reason: `${dayOfWeekNames[i]}s have ${Math.round((1 - count / avgDailyOrders) * 100)}% fewer orders — ideal for promotions`,
            });
        }
    });

    // Add falling-demand products as promotion candidates
    const fallingProducts = productTrends
        .filter(p => p.trend === 'falling')
        .slice(0, 3)
        .map(p => ({
            day: 'Any day',
            reason: `"${p.name}" demand down ${Math.abs(p.trendPercent)}% — consider a promotional offer`,
        }));

    promotionSuggestions.push(...fallingProducts);

    // === Build historical data for chart ===
    const last30Dates = dateKeys.slice(-30);
    const last30Values = dailyValues.slice(-30);

    return {
        dailyForecast,
        productTrends: productTrends.slice(0, 10),
        restockAlerts: restockAlerts.slice(0, 5),
        promotionSuggestions: promotionSuggestions.slice(0, 5),
        historicalData: {
            dates: last30Dates,
            values: last30Values,
        },
        summary: {
            avgDailyOrders: Math.round(avgDailyOrders * 10) / 10,
            totalOrdersLast30Days: orders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo).length,
            overallTrend: slope > 0.1 ? 'growing' : slope < -0.1 ? 'declining' : 'stable',
        }
    };
}
