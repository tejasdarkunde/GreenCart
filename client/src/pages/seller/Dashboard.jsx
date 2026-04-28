import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import AIInsights from '../../components/seller/AIInsights'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
)

const Dashboard = () => {
    const { axios, currency } = useAppContext()
    const [dashData, setDashData] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchDashboard = async () => {
        try {
            const { data } = await axios.get('/api/order/dashboard')
            if (data.success) {
                setDashData(data.data)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboard()
    }, [])

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center h-[95vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
            </div>
        )
    }

    if (!dashData) {
        return (
            <div className="flex-1 flex items-center justify-center h-[95vh]">
                <p className="text-gray-500">No data available</p>
            </div>
        )
    }

    // Short date labels (Mar 20, Mar 21...)
    const shortLabels = dashData.dateLabels.map(d => {
        const date = new Date(d)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })

    const ordersChartData = {
        labels: shortLabels,
        datasets: [{
            label: 'Orders',
            data: dashData.orderCounts,
            borderColor: '#4ade80',
            backgroundColor: 'rgba(74, 222, 128, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#4ade80',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
        }]
    }

    const revenueChartData = {
        labels: shortLabels,
        datasets: [{
            label: 'Revenue (₹)',
            data: dashData.revenueCounts,
            backgroundColor: 'rgba(74, 222, 128, 0.7)',
            borderColor: '#22c55e',
            borderWidth: 1,
            borderRadius: 6,
        }]
    }

    const topProductsChartData = {
        labels: dashData.topProductNames,
        datasets: [{
            label: 'Units Sold',
            data: dashData.topProductQuantities,
            backgroundColor: [
                '#4ade80',
                '#22c55e',
                '#16a34a',
                '#15803d',
                '#166534',
            ],
            borderColor: '#fff',
            borderWidth: 3,
        }]
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { maxTicksLimit: 8, font: { size: 11 } }
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: { font: { size: 11 } }
            }
        }
    }

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { padding: 20, font: { size: 12 } }
            },
        },
    }

    const stats = [
        { label: 'Total Orders', value: dashData.totalOrders, icon: '📦' },
        { label: 'Total Revenue', value: `${currency}${dashData.totalRevenue}`, icon: '💰' },
        { label: 'Total Products', value: dashData.totalProducts, icon: '🛒' },
        { label: 'Avg Order Value', value: `${currency}${dashData.avgOrderValue}`, icon: '📊' },
        { label: 'Cancelled Orders', value: dashData.totalCancelled, icon: '❌' },
    ]

    return (
        <div className="flex-1 h-[95vh] overflow-y-scroll no-scrollbar">
            <div className="md:p-10 p-4">
                <h2 className="text-2xl font-semibold mb-8 text-gray-800">Dashboard</h2>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">{stat.icon}</span>
                                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Orders Over Time */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-medium text-gray-700 mb-4">Orders Over Time (Last 30 Days)</h3>
                        <div className="h-64">
                            <Line data={ordersChartData} options={chartOptions} />
                        </div>
                    </div>

                    {/* Revenue Over Time */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-medium text-gray-700 mb-4">Revenue Over Time (Last 30 Days)</h3>
                        <div className="h-64">
                            <Bar data={revenueChartData} options={chartOptions} />
                        </div>
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Products */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-medium text-gray-700 mb-4">Top 5 Best Selling Products</h3>
                        <div className="h-72">
                            {dashData.topProductNames.length > 0 ? (
                                <Doughnut data={topProductsChartData} options={doughnutOptions} />
                            ) : (
                                <p className="text-gray-400 text-center mt-20">No sales data yet</p>
                            )}
                        </div>
                    </div>

                    {/* Selling Rate Table */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-medium text-gray-700 mb-4">Selling Rate</h3>
                        <div className="overflow-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-2 font-semibold text-gray-600">Product</th>
                                        <th className="text-right py-3 px-2 font-semibold text-gray-600">Units Sold</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashData.topProductNames.map((name, i) => (
                                        <tr key={i} className="border-b border-gray-100">
                                            <td className="py-3 px-2 text-gray-700">{name}</td>
                                            <td className="py-3 px-2 text-right">
                                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                                                    {dashData.topProductQuantities[i]} sold
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {dashData.topProductNames.length === 0 && (
                                        <tr>
                                            <td colSpan="2" className="py-8 text-center text-gray-400">No sales data yet</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* AI Insights Section */}
                <div className="mt-6">
                    <AIInsights />
                </div>
            </div>
        </div>
    )
}

export default Dashboard
