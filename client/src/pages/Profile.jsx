import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const Profile = () => {
    const { user, setUser, axios, navigate, currency } = useAppContext()
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState('')
    const [addresses, setAddresses] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!user) {
            navigate('/')
            return
        }
        setName(user.name || '')
        fetchAddresses()
    }, [user])

    const fetchAddresses = async () => {
        try {
            const { data } = await axios.get('/api/address/get')
            if (data.success) {
                setAddresses(data.addresses)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Name cannot be empty')
            return
        }
        setLoading(true)
        try {
            const { data } = await axios.put('/api/user/update', { name: name.trim() })
            if (data.success) {
                setUser(data.user)
                setIsEditing(false)
                toast.success('Profile updated successfully')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    return (
        <div className='mt-16 pb-16 max-w-2xl mx-auto'>
            <div className='flex flex-col items-end w-max mb-8'>
                <p className='text-2xl font-medium uppercase'>My Profile</p>
                <div className='w-16 h-0.5 bg-green-400 rounded-full'></div>
            </div>

            {/* Profile Card */}
            <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6'>
                <div className='flex items-center gap-4 mb-6'>
                    <div className='w-16 h-16 rounded-full bg-green-400 flex items-center justify-center text-white text-2xl font-bold'>
                        {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                        <h2 className='text-xl font-semibold text-gray-800'>{user.name}</h2>
                        <p className='text-gray-400 text-sm'>{user.email}</p>
                    </div>
                </div>

                <hr className='border-gray-200 mb-6' />

                {/* Name Field */}
                <div className='mb-4'>
                    <label className='text-sm font-medium text-gray-500 uppercase tracking-wide'>Name</label>
                    {isEditing ? (
                        <input
                            type='text'
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className='w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-400 transition'
                        />
                    ) : (
                        <p className='mt-1 text-gray-800 text-lg'>{user.name}</p>
                    )}
                </div>

                {/* Email Field (read-only) */}
                <div className='mb-6'>
                    <label className='text-sm font-medium text-gray-500 uppercase tracking-wide'>Email</label>
                    <p className='mt-1 text-gray-800 text-lg'>{user.email}</p>
                    {isEditing && <p className='text-xs text-gray-400 mt-1'>Email cannot be changed</p>}
                </div>

                {/* Action Buttons */}
                <div className='flex gap-3'>
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className='px-6 py-2 bg-green-400 text-white rounded-full hover:bg-green-500 transition cursor-pointer disabled:opacity-50 font-medium'
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => { setIsEditing(false); setName(user.name) }}
                                className='px-6 py-2 border border-gray-300 text-gray-600 rounded-full hover:bg-gray-50 transition cursor-pointer font-medium'
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className='px-6 py-2 border border-green-400 text-green-500 rounded-full hover:bg-green-50 transition cursor-pointer font-medium'
                        >
                            Edit Profile
                        </button>
                    )}
                </div>
            </div>

            {/* Saved Addresses */}
            <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
                <div className='flex justify-between items-center mb-4'>
                    <h3 className='text-lg font-medium text-gray-800'>Saved Addresses</h3>
                    <button
                        onClick={() => navigate('/add-address')}
                        className='text-sm text-green-400 hover:text-green-500 cursor-pointer font-medium'
                    >
                        + Add New
                    </button>
                </div>

                {addresses.length === 0 ? (
                    <p className='text-gray-400 text-center py-6'>No saved addresses</p>
                ) : (
                    <div className='space-y-3'>
                        {addresses.map((addr, index) => (
                            <div key={index} className='border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition'>
                                <p className='text-gray-700 font-medium'>{addr.firstName} {addr.lastName}</p>
                                <p className='text-gray-500 text-sm mt-1'>
                                    {addr.street}, {addr.city}, {addr.state} {addr.zipcode}
                                </p>
                                <p className='text-gray-500 text-sm'>{addr.country}</p>
                                {addr.phone && <p className='text-gray-400 text-xs mt-1'>📞 {addr.phone}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Profile
