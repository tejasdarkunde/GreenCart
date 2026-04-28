import React, { useState } from 'react'
import { assets, categories } from '../../assets/assets'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const ProductList = () => {

    const {products, currency, axios, fetchProducts} = useAppContext()
    const [editingId, setEditingId] = useState(null)
    const [editPrice, setEditPrice] = useState('')
    const [editOfferPrice, setEditOfferPrice] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [aiPricing, setAiPricing] = useState(null)
    const [loadingAiPrice, setLoadingAiPrice] = useState(false)

    const toggleStock = async (id,inStock)=>{
        try {
             const {data}=await axios.post('/api/product/stock',{id,inStock});
             if(data.success){
                  fetchProducts();
                  toast.success(data.message)
             }else{
                toast.error(data.message)
             }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const startEditing = async (product) => {
        setEditingId(product._id)
        setEditPrice(product.price)
        setEditOfferPrice(product.offerPrice)
        setAiPricing(null)
        
        // Fetch AI pricing suggestion
        setLoadingAiPrice(true)
        try {
            const { data } = await axios.get(`/api/ai/suggested-price/${product._id}`)
            if (data.success) {
                setAiPricing(data.data)
            }
        } catch (e) { /* Ignore */ }
        finally { setLoadingAiPrice(false) }
    }

    const cancelEditing = () => {
        setEditingId(null)
        setEditPrice('')
        setEditOfferPrice('')
        setAiPricing(null)
    }

    const applyAiSuggestion = () => {
        if (aiPricing) {
            setEditPrice(aiPricing.suggestedPrice)
            setEditOfferPrice(aiPricing.suggestedOfferPrice)
        }
    }

    const savePrice = async (id) => {
        try {
            if(Number(editOfferPrice) > Number(editPrice)){
                return toast.error("Offer price cannot be greater than price")
            }
            const {data} = await axios.post('/api/product/update', {
                id,
                price: Number(editPrice),
                offerPrice: Number(editOfferPrice)
            })
            if(data.success){
                toast.success(data.message)
                fetchProducts()
                cancelEditing()
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategory === 'All' || product.category.toLowerCase() === selectedCategory.toLowerCase()
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

  return (
    <div className="flex-1 py-10 flex flex-col justify-between">
            <div className="w-full md:p-10 p-4">
                <div className="flex justify-between items-center pb-4 max-sm:flex-col gap-4">
                    <h2 className="text-lg font-medium">All Products</h2>
                    <div className="flex gap-4">
                        <select 
                            value={selectedCategory} 
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 text-sm outline-green-400"
                        >
                            <option value="All">All Categories</option>
                            {categories.map((cat, idx) => (
                                <option key={idx} value={cat.path}>{cat.text}</option>
                            ))}
                        </select>
                        <div className="flex items-center border border-gray-300 rounded px-3 py-2 bg-white flex-1 max-w-64">
                            <img src={assets.search_icon} alt="search" className="w-4 h-4 mr-2" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full text-sm outline-none text-gray-700"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center max-w-5xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
                    <table className="md:table-auto table-fixed w-full overflow-hidden">
                        <thead className="text-gray-900 text-sm text-left">
                            <tr>
                                <th className="px-4 py-3 font-semibold truncate">Product</th>
                                <th className="px-4 py-3 font-semibold truncate">Category</th>
                                <th className="px-4 py-3 font-semibold truncate hidden md:table-cell">Price</th>
                                <th className="px-4 py-3 font-semibold truncate hidden md:table-cell">Offer Price</th>
                                <th className="px-4 py-3 font-semibold truncate">In Stock</th>
                                <th className="px-4 py-3 font-semibold truncate hidden md:table-cell">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-500">
                            {filteredProducts.map((product) => (
                                <tr key={product._id} className="border-t border-gray-500/20">
                                    <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 truncate">
                                        <div className="border border-gray-300 rounded p-2">
                                            <img src={product.image[0]} alt="Product" className="w-16" />
                                        </div>
                                        <span className="truncate max-sm:hidden w-full">{product.name}</span>
                                    </td>
                                    <td className="px-4 py-3">{product.category}</td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        {editingId === product._id ? (
                                            <input
                                                type="number"
                                                value={editPrice}
                                                onChange={(e) => setEditPrice(e.target.value)}
                                                className="w-20 border border-gray-300 rounded px-2 py-1 outline-green-400"
                                            />
                                        ) : (
                                            <span>{currency}{product.price}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        {editingId === product._id ? (
                                            <input
                                                type="number"
                                                value={editOfferPrice}
                                                onChange={(e) => setEditOfferPrice(e.target.value)}
                                                className="w-20 border border-gray-300 rounded px-2 py-1 outline-green-400"
                                            />
                                        ) : (
                                            <span className="text-green-600 font-medium">{currency}{product.offerPrice}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
                                            <input onClick={()=>toggleStock(product._id, !product.inStock)} checked={product.inStock} type="checkbox" className="sr-only peer" readOnly />
                                            <div className="w-12 h-7 bg-slate-300 rounded-full peer peer-checked:bg-green-400 transition-colors duration-200"></div>
                                            <span className="dot absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
                                        </label>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        {editingId === product._id ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => savePrice(product._id)}
                                                    className="px-3 py-1 bg-green-400 text-white rounded text-xs hover:bg-green-500 transition cursor-pointer"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={cancelEditing}
                                                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400 transition cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => startEditing(product)}
                                                className="px-3 py-1 border border-green-400 text-green-500 rounded text-xs hover:bg-green-400 hover:text-white transition cursor-pointer"
                                            >
                                                Edit Price
                                            </button>
                                        )}
                                        {/* AI Pricing Suggestion */}
                                        {editingId === product._id && aiPricing && (
                                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                                                <div className="flex items-center gap-1 font-medium text-amber-700 mb-1">
                                                    <span>💡</span> AI Suggests
                                                </div>
                                                <p className="text-amber-600">
                                                    Price: {currency}{aiPricing.suggestedPrice} | Offer: {currency}{aiPricing.suggestedOfferPrice}
                                                </p>
                                                <p className="text-amber-500 text-[10px] mt-0.5">{aiPricing.reasoning}</p>
                                                <button
                                                    onClick={applyAiSuggestion}
                                                    className="mt-1 px-2 py-0.5 bg-amber-400 text-white rounded text-[10px] hover:bg-amber-500 transition cursor-pointer"
                                                >
                                                    Apply Suggestion
                                                </button>
                                            </div>
                                        )}
                                        {editingId === product._id && loadingAiPrice && (
                                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                                                <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                                                Loading AI suggestion...
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
  )
}

export default ProductList
