import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import toast from 'react-hot-toast'

const statusOptions = ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']

const statusColors = {
    'Order Placed': 'bg-blue-100 text-blue-700',
    'Packed': 'bg-yellow-100 text-yellow-700',
    'Shipped': 'bg-purple-100 text-purple-700',
    'Out for Delivery': 'bg-orange-100 text-orange-700',
    'Delivered': 'bg-green-100 text-green-700',
    'Cancelled': 'bg-red-100 text-red-700',
}

const Orders = () => {

  const {currency, axios} = useAppContext()
  const [orders, setOrders] = useState([])
  const [selectedStatus, setSelectedStatus] = useState('All')

  const fetchOrders = async () =>{
    try {
        const {data} = await axios.get('/api/order/seller');
        if(data.success){
          setOrders(data.orders)
        }else{
          toast.error(data.message)
        }
    } catch (error) {
        toast.error(error.message)
    }
  };

  const updateStatus = async (orderId, status) => {
    // Block "Delivered" if COD cash not collected
    if (status === 'Delivered') {
        const order = orders.find(o => o._id === orderId)
        if (order && order.paymentType === 'COD' && !order.isPaid) {
            toast.error('Please collect cash payment before marking as Delivered!')
            return
        }
    }
    try {
        const {data} = await axios.post('/api/order/status', { orderId, status })
        if(data.success){
            toast.success(data.message)
            fetchOrders()
        }else{
            toast.error(data.message)
        }
    } catch (error) {
        toast.error(error.message)
    }
  }

  const markAsPaid = async (orderId) => {
    try {
        const {data} = await axios.post('/api/order/mark-paid', { orderId })
        if(data.success){
            toast.success(data.message)
            fetchOrders()
        }else{
            toast.error(data.message)
        }
    } catch (error) {
        toast.error(error.message)
    }
  }

  useEffect(()=> {
    fetchOrders();
  },[])

  const filteredOrders = orders.filter(order => {
    return selectedStatus === 'All' || order.status === selectedStatus
  })

  return (
    <div className='no-scrollbar flex-1 h-[95vh] overflow-y-scroll'>
      <div className="md:p-10 p-4 space-y-4">
              <div className="flex justify-between items-center max-w-4xl">
                  <h2 className="text-lg font-medium">Orders List</h2>
                  <select 
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="border border-gray-300 rounded px-3 py-1.5 text-sm outline-green-400 cursor-pointer"
                  >
                      <option value="All">All Statuses</option>
                      {statusOptions.map(s => (
                          <option key={s} value={s}>{s}</option>
                      ))}
                  </select>
              </div>
              
              {filteredOrders.length === 0 && (
                  <p className="text-gray-500 py-4">No orders found matching the selected filter.</p>
              )}

              {filteredOrders.map((order, index) => (
                  <div key={index} className="flex flex-col gap-4 p-5 max-w-4xl rounded-md border border-gray-300">
                      {/* Order Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                              <img className="w-10 h-10 object-cover" src={assets.box_icon} alt="boxIcon" />
                              <div>
                                  <p className="text-xs text-gray-400">Order #{order._id.slice(-8)}</p>
                                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}</p>
                              </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                              {order.status}
                          </span>
                      </div>

                      {/* Order Items */}
                      <div className="border-t border-gray-200 pt-3">
                          {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between py-1">
                                  <p className="text-sm">
                                      {item.product.name}{" "}<span className="text-green-400">x {item.quantity}</span>
                                  </p>
                                  <p className="text-sm text-gray-500">{currency}{item.product.offerPrice * item.quantity}</p>
                              </div>
                          ))}
                      </div>

                      {/* Customer & Payment Info */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-t border-gray-200 pt-3">
                          <div className="text-sm text-black/60">
                              <p className='text-black/80 font-medium'>{order.address.firstName} {order.address.lastName}</p>
                              <p>{order.address.street}, {order.address.city}</p>
                              <p>{order.address.state}, {order.address.zipcode}, {order.address.country}</p>
                              <p>{order.address.phone}</p>
                          </div>

                          <div className="text-sm space-y-1">
                              <p className="font-medium text-lg">{currency}{order.amount}</p>
                              <p>Method: <span className="font-medium">{order.paymentType}</span></p>
                              <p>Payment: <span className={`font-medium ${order.isPaid ? 'text-green-500' : 'text-red-500'}`}>
                                  {order.isPaid ? '✅ Paid' : '⏳ Pending'}
                              </span></p>
                          </div>
                      </div>

                      {/* Admin Actions */}
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 border-t border-gray-200 pt-3">
                          <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-500">Status:</label>
                              <select
                                  value={order.status}
                                  onChange={(e) => updateStatus(order._id, e.target.value)}
                                  className="border border-gray-300 rounded px-3 py-1.5 text-sm outline-green-400 cursor-pointer"
                                  disabled={order.status === 'Delivered' || order.status === 'Cancelled'}
                              >
                                  {order.status === 'Cancelled'
                                      ? <option value="Cancelled">Cancelled</option>
                                      : order.status === 'Delivered'
                                          ? <option value="Delivered">Delivered</option>
                                          : statusOptions.filter(s => s !== 'Cancelled').map(s => (
                                              <option key={s} value={s}>{s}</option>
                                          ))
                                  }
                              </select>
                          </div>

                          {/* COD Collect Cash Button - hide for cancelled/delivered orders */}
                          {order.paymentType === 'COD' && !order.isPaid && order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                              <button
                                  onClick={() => markAsPaid(order._id)}
                                  className="px-4 py-1.5 bg-green-400 text-white rounded text-sm hover:bg-green-500 transition cursor-pointer flex items-center gap-1"
                              >
                                  💵 Collect Cash
                              </button>
                          )}

                          {/* Cancel Button */}
                          {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                              <button
                                  onClick={() => updateStatus(order._id, 'Cancelled')}
                                  className="px-4 py-1.5 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200 transition cursor-pointer"
                              >
                                  Cancel Order
                              </button>
                          )}
                      </div>
                  </div>
              ))}
          </div>
        </div>
  )
}

export default Orders
