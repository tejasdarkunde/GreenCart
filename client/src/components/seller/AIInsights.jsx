import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';

const AIInsights = () => {
    const { axios, currency } = useAppContext();
    const [forecast, setForecast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchForecast();
    }, []);

    const fetchForecast = async () => {
        try {
            const { data } = await axios.get('/api/ai/forecast');
            if (data.success) {
                setForecast(data.data);
            } else {
                toast.error(data.message || 'Failed to load AI insights');
            }
        } catch (error) {
            console.error('Forecast error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🤖</span>
                    <h3 className="text-lg font-medium text-gray-700">AI Insights</h3>
                </div>
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                </div>
            </div>
        );
    }

    if (!forecast) return null;

    // Forecast chart data — historical + predicted
    const historicalDates = forecast.historicalData?.dates?.slice(-14).map(d => {
        const date = new Date(d);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) || [];

    const forecastDates = forecast.dailyForecast?.map(f => {
        const date = new Date(f.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) || [];

    const historicalValues = forecast.historicalData?.values?.slice(-14) || [];
    const forecastValues = forecast.dailyForecast?.map(f => f.predictedOrders) || [];

    const chartData = {
        labels: [...historicalDates, ...forecastDates],
        datasets: [
            {
                label: 'Historical Orders',
                data: [...historicalValues, ...Array(forecastValues.length).fill(null)],
                borderColor: '#4ade80',
                backgroundColor: 'rgba(74, 222, 128, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#4ade80',
            },
            {
                label: 'Predicted Orders',
                data: [...Array(historicalValues.length - 1).fill(null), historicalValues[historicalValues.length - 1], ...forecastValues],
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4,
                borderDash: [5, 5],
                pointRadius: 4,
                pointBackgroundColor: '#f59e0b',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                position: 'top',
                labels: { font: { size: 11 }, usePointStyle: true, padding: 15 }
            },
        },
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 10 } },
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 } } },
        },
    };

    const trendColors = {
        rising: 'text-green-600 bg-green-50',
        falling: 'text-red-600 bg-red-50',
        stable: 'text-blue-600 bg-blue-50',
        new: 'text-purple-600 bg-purple-50',
    };

    const trendIcons = {
        rising: '📈',
        falling: '📉',
        stable: '➡️',
        new: '🆕',
    };

    const tabs = [
        { id: 'overview', label: '📊 Overview', },
        { id: 'products', label: '🔥 Products', },
        { id: 'alerts', label: '⚠️ Alerts', count: (forecast.restockAlerts?.length || 0) },
        { id: 'promotions', label: '🎯 Promotions', },
    ];

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                        <span className="text-xl">🤖</span>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">AI Insights & Forecast</h3>
                        <p className="text-white/70 text-xs">Powered by machine learning analysis</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-white/80 text-xs">Overall Trend</p>
                    <p className="text-white font-semibold text-sm capitalize">
                        {forecast.summary?.overallTrend === 'growing' ? '📈 Growing' :
                         forecast.summary?.overallTrend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                    </p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 border-b border-gray-100">
                <div className="px-4 py-3 text-center border-r border-gray-100">
                    <p className="text-xs text-gray-400">Avg Daily Orders</p>
                    <p className="text-lg font-bold text-gray-800">{forecast.summary?.avgDailyOrders || 0}</p>
                </div>
                <div className="px-4 py-3 text-center border-r border-gray-100">
                    <p className="text-xs text-gray-400">Last 30 Days</p>
                    <p className="text-lg font-bold text-gray-800">{forecast.summary?.totalOrdersLast30Days || 0}</p>
                </div>
                <div className="px-4 py-3 text-center">
                    <p className="text-xs text-gray-400">Next 7 Days (est.)</p>
                    <p className="text-lg font-bold text-amber-600">
                        {forecast.dailyForecast?.reduce((sum, d) => sum + d.predictedOrders, 0) || 0}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 text-xs font-medium transition-all cursor-pointer relative ${
                            activeTab === tab.id
                                ? 'text-green-600'
                                : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className="ml-1 bg-red-100 text-red-600 text-[9px] px-1.5 py-0.5 rounded-full">{tab.count}</span>
                        )}
                        {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-green-400 rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
                {/* Overview Tab — Forecast Chart */}
                {activeTab === 'overview' && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-3">Order Forecast (14-day history + 7-day prediction)</h4>
                        <div className="h-64">
                            <Line data={chartData} options={chartOptions} />
                        </div>
                        <div className="mt-4 grid grid-cols-7 gap-1">
                            {forecast.dailyForecast?.map((day, i) => (
                                <div key={i} className="text-center p-2 rounded-lg bg-amber-50 border border-amber-100">
                                    <p className="text-[10px] text-gray-400">{day.dayName}</p>
                                    <p className="text-sm font-bold text-amber-600">{day.predictedOrders}</p>
                                    <p className="text-[9px] text-gray-400">{day.confidence}%</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Products Tab — Trending Products */}
                {activeTab === 'products' && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-600 mb-3">Product Demand Trends (Last 30 Days)</h4>
                        {forecast.productTrends?.map((product, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
                                <span className="text-sm font-bold text-gray-300 w-5">{i + 1}</span>
                                {product.image && (
                                    <img src={product.image} alt="" className="w-10 h-10 rounded object-cover border border-gray-200" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 truncate">{product.name}</p>
                                    <p className="text-xs text-gray-400">{product.category} • {product.weeklyVelocity}/week</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${trendColors[product.trend] || 'text-gray-500 bg-gray-50'}`}>
                                        {trendIcons[product.trend]} {product.trendPercent > 0 ? '+' : ''}{product.trendPercent}%
                                    </span>
                                    <p className="text-xs text-gray-400 mt-1">{product.recentSales} sold</p>
                                </div>
                            </div>
                        ))}
                        {(!forecast.productTrends || forecast.productTrends.length === 0) && (
                            <p className="text-gray-400 text-center py-8 text-sm">No product data available yet</p>
                        )}
                    </div>
                )}

                {/* Alerts Tab */}
                {activeTab === 'alerts' && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-600 mb-3">⚠️ Restock Alerts</h4>
                        {forecast.restockAlerts?.map((alert, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                                <span className="text-lg mt-0.5">⚠️</span>
                                {alert.image && (
                                    <img src={alert.image} alt="" className="w-10 h-10 rounded object-cover border border-amber-200" />
                                )}
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-amber-800">{alert.name}</p>
                                    <p className="text-xs text-amber-600 mt-0.5">{alert.alert}</p>
                                </div>
                            </div>
                        ))}
                        {(!forecast.restockAlerts || forecast.restockAlerts.length === 0) && (
                            <div className="text-center py-8">
                                <span className="text-3xl">✅</span>
                                <p className="text-gray-400 text-sm mt-2">No urgent restock alerts</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Promotions Tab */}
                {activeTab === 'promotions' && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-600 mb-3">🎯 Promotion Suggestions</h4>
                        {forecast.promotionSuggestions?.map((suggestion, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                                <span className="text-lg mt-0.5">💡</span>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-800">{suggestion.day}</p>
                                    <p className="text-xs text-blue-600 mt-0.5">{suggestion.reason}</p>
                                </div>
                            </div>
                        ))}
                        {(!forecast.promotionSuggestions || forecast.promotionSuggestions.length === 0) && (
                            <p className="text-gray-400 text-center py-8 text-sm">No specific promotion suggestions at this time</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIInsights;
