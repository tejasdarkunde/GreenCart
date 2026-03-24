import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const statusSteps = ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered']

const statusColors = {
    'Order Placed': 'bg-blue-100 text-blue-700 border-blue-300',
    'Packed': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'Shipped': 'bg-purple-100 text-purple-700 border-purple-300',
    'Out for Delivery': 'bg-orange-100 text-orange-700 border-orange-300',
    'Delivered': 'bg-green-100 text-green-700 border-green-300',
    'Cancelled': 'bg-red-100 text-red-700 border-red-300',
}

const MyOrders = () => {

  const [myOrders, setMyOrders] = useState([])
  const {currency, axios, user} = useAppContext()

  const fetchMyOrders = async ()=>{
      try {
          const {data} = await axios.get('/api/order/user')
          if(data.success)
          {
             setMyOrders(data.orders)
          }

      } catch (error) {
          console.log(error);
      }
  }

  const cancelOrder = async (orderId) => {
      if (!confirm('Are you sure you want to cancel this order?')) return
      try {
          const { data } = await axios.post('/api/order/cancel', { orderId })
          if (data.success) {
              toast.success(data.message)
              fetchMyOrders()
          } else {
              toast.error(data.message)
          }
      } catch (error) {
          toast.error(error.message)
      }
  }

  useEffect(()=>{
    if(user)
    {
      fetchMyOrders()
    }
  },[user])

  const getStepIndex = (status) => {
    const idx = statusSteps.indexOf(status)
    return idx === -1 ? 0 : idx
  }

  return (
    <div className='mt-16 pb-16'>
        <div className='flex flex-col items-end w-max mb-8'>
          <p className='text-2xl font-medium uppercase'>My orders</p>
          <div className='w-16 h-0.5 bg-green-400 rounded-full'></div>
        </div>

        {myOrders.length === 0 && (
          <p className="text-gray-400 text-center py-10">No orders yet. Start shopping!</p>
        )}

        {myOrders.map((order, index)=>(
          <div key={index} className='border border-gray-300 rounded-lg mb-10 p-4 py-5 max-w-4xl'>
            {/* Order Header */}
            <div className='flex justify-between items-start md:items-center text-gray-400 md:font-medium max-md:flex-col gap-2 mb-4'>
              <span className="text-sm">Order #{order._id.slice(-8)}</span>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[order.status] || 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                  {order.status}
                </span>
                {/* Cancel Order Button */}
                {(order.status === 'Order Placed' || order.status === 'Packed') && (
                  <button
                    onClick={() => cancelOrder(order._id)}
                    className="px-3 py-1 rounded-full text-xs font-medium border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

            {/* Status Timeline */}
            {order.status !== 'Cancelled' && (
              <div className="mb-6 px-2">
                <div className="flex items-center justify-between relative">
                  {/* Progress Line Background */}
                  <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 rounded-full"></div>
                  {/* Progress Line Filled */}
                  <div
                    className="absolute top-4 left-0 h-1 bg-green-400 rounded-full transition-all duration-500"
                    style={{ width: `${(getStepIndex(order.status) / (statusSteps.length - 1)) * 100}%` }}
                  ></div>

                  {statusSteps.map((step, i) => {
                    const currentIdx = getStepIndex(order.status)
                    const isCompleted = i <= currentIdx
                    const isCurrent = i === currentIdx

                    return (
                      <div key={step} className="flex flex-col items-center relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
                          ${isCompleted
                            ? 'bg-green-400 border-green-400 text-white'
                            : 'bg-white border-gray-300 text-gray-400'
                          }
                          ${isCurrent ? 'ring-4 ring-green-100 scale-110' : ''}
                        `}>
                          {isCompleted ? '✓' : i + 1}
                        </div>
                        <p className={`text-[10px] mt-2 text-center max-w-[70px] leading-tight
                          ${isCompleted ? 'text-green-600 font-medium' : 'text-gray-400'}
                        `}>
                          {step}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Cancelled Banner */}
            {order.status === 'Cancelled' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-center">
                <p className="text-red-600 font-medium">❌ This order has been cancelled</p>
              </div>
            )}

            {/* Order Info Row */}
            <div className='flex justify-between items-center text-gray-400 text-sm mb-2 flex-wrap gap-2'>
              <span>Payment: {order.paymentType}</span>
              <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
              <span className="font-medium text-gray-800">Total: {currency}{order.amount}</span>
            </div>

            {/* Order Items */}
            {order.items.map((item, idx)=>(
              <div key={idx} className={`relative bg-white text-gray-500/70 ${order.items.length !== idx + 1 && "border-b"} border-gray-300 flex flex-col md:flex-row md:items-center justify-between p-4 py-5 md:gap-16 w-full max-w-4xl`} >
                <div className='flex items-center mb-4 md:mb-0'>
                  <div className='bg-green-400/10 p-4 rounded-lg'>
                    <img src={item.product.image[0]} alt="" className='w-16 h-16' />
                  </div>
                  <div className='ml-4'>
                    <h2 className='text-xl font-medium text-gray-800'>{item.product.name}</h2>
                    <p>Category: {item.product.category}</p>
                  </div>
                </div>
                <div className='flex flex-col justify-center md:ml-8 mb-4 md:mb-0'>
                  <p>Qty: {item.quantity || "1"}</p>
                </div>
                <p className='text-green-400 text-lg font-medium'>
                  {currency}{item.product.offerPrice * item.quantity}
                </p>
              </div>
            ))}

            {/* Payment Status */}
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Payment Status: <span className={`font-medium ${order.isPaid ? 'text-green-500' : 'text-orange-500'}`}>
                  {order.isPaid ? '✅ Paid' : '⏳ Pending'}
                </span>
              </p>
            </div>
          </div>
        ))}
    </div>
  )
}

export default MyOrders

