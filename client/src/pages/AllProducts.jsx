import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import ProductCard from '../components/ProductCard'
import { categories } from '../assets/assets'

const AllProducts = () => {

    const {products, searchQuery} = useAppContext()
    const [filteredProducts, setFilteredProducts] = useState([])
    const [localSearch, setLocalSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [sortOption, setSortOption] = useState('default')

    useEffect(() => {
        let result = [...products].filter(p => p.inStock)

        // Search filter (combine navbar search + local search)
        const query = searchQuery?.length > 0 ? searchQuery : localSearch
        if (query && query.length > 0) {
            result = result.filter(
                product => product.name.toLowerCase().includes(query.toLowerCase())
            )
        }

        // Category filter
        if (selectedCategory !== 'All') {
            result = result.filter(
                product => product.category.toLowerCase() === selectedCategory.toLowerCase()
            )
        }

        // Sort
        if (sortOption === 'low-to-high') {
            result.sort((a, b) => a.offerPrice - b.offerPrice)
        } else if (sortOption === 'high-to-low') {
            result.sort((a, b) => b.offerPrice - a.offerPrice)
        } else if (sortOption === 'newest') {
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        }

        setFilteredProducts(result)
    }, [products, searchQuery, localSearch, selectedCategory, sortOption])

  return (
    <div className='mt-16 flex flex-col'>
      <div className='flex flex-col item-end w-max'>
        <p className='text-2xl font-medium uppercase'>All products</p>
        <div className='w-16 h-0.5 bg-green-400 rounded-full'></div>
      </div>

      {/* Search & Filter Bar */}
      <div className='flex flex-col sm:flex-row gap-3 mt-6 items-start sm:items-center flex-wrap'>
        {/* Search Input */}
        <div className='flex items-center border border-gray-300 rounded-full px-4 py-2 w-full sm:w-72 bg-white'>
          <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search products..."
            className='w-full outline-none bg-transparent text-sm placeholder-gray-400'
          />
          {localSearch && (
            <button onClick={() => setLocalSearch('')} className='text-gray-400 hover:text-gray-600 ml-1 cursor-pointer'>
              ✕
            </button>
          )}
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className='border border-gray-300 rounded-full px-4 py-2 text-sm outline-none bg-white cursor-pointer'
        >
          <option value="All">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.path} value={cat.path}>{cat.text}</option>
          ))}
        </select>

        {/* Sort Dropdown */}
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className='border border-gray-300 rounded-full px-4 py-2 text-sm outline-none bg-white cursor-pointer'
        >
          <option value="default">Sort by: Default</option>
          <option value="low-to-high">Price: Low to High</option>
          <option value="high-to-low">Price: High to Low</option>
          <option value="newest">Newest First</option>
        </select>

        {/* Results Count */}
        <span className='text-sm text-gray-400 ml-auto'>
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6 lg:grid-cols-5 mt-6'>
          {filteredProducts.map((product, index) => (
            <ProductCard key={index} product={product} />
          ))}
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center py-20'>
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className='text-lg text-gray-400 font-medium'>No products found</p>
          <p className='text-sm text-gray-300 mt-1'>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}

export default AllProducts
