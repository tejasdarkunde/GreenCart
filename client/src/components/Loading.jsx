import React, { useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { useLocation } from 'react-router-dom'

const Loading = () => {
    const { navigate, setCartItems, cartLoadedFromServer } = useAppContext()
    let { search } = useLocation()
    const query = new URLSearchParams(search)
    const nextUrl = query.get('next');

    useEffect(()=>{
        if(nextUrl){
            // For order success redirect, clear the cart since payment went through
            if (nextUrl === 'my-orders') {
                cartLoadedFromServer.current = true; // Allow cart sync
                setCartItems({});
            }
            setTimeout(()=>{
                navigate(`/${nextUrl}`)
            }, 3000) // Reduced from 5s to 3s for better UX
        }
    },[nextUrl])

  return (
    <div className='flex flex-col justify-center items-center h-screen gap-4'>
        <div className='animate-spin rounded-full h-24 w-24 border-4 border-gray-300 border-t-green-500'></div>
        <p className='text-gray-500 text-sm'>Processing your order...</p>
    </div>
  )
}

export default Loading
