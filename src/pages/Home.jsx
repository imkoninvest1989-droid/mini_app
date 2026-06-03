import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import ListingCard from '../components/ListingCard'
import SearchBar from '../components/SearchBar'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function Home() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchListings()
  }, [category])

  const fetchListings = async (searchQuery = '') => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (category) params.append('category', category)

      const response = await axios.get(
        `${API_URL}/api/search?${params.toString()}`
      )
      setListings(response.data.listings || [])
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query) => {
    fetchListings(query)
  }

  const categories = [
    { id: 'all', name: '🔄 Barchasi', emoji: '' },
    { id: 'Libos', name: '👕 Libos', emoji: 'Libos' },
    { id: 'Poyabzal', name: '👟 Poyabzal', emoji: 'Poyabzal' },
    { id: 'Sumka', name: '👜 Sumka', emoji: 'Sumka' },
    { id: 'Aksessuar', name: '💍 Aksessuar', emoji: 'Aksessuar' },
  ]

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-teal-700 to-teal-600 text-white p-4 z-10">
        <h1 className="text-2xl font-bold mb-4">ZOYA 🔄</h1>
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Categories */}
      <div className="overflow-x-auto p-4 sticky top-16 bg-white border-b border-gray-200">
        <div className="flex gap-2 min-w-full">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id === 'all' ? '' : cat.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                (category === '' && cat.id === 'all') || category === cat.emoji
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {listings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onClick={() => navigate(`/listing/${listing.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-500 text-center">
              Hech qanday elon topilmadi
            </p>
          </div>
        )}
      </div>

      {/* Download App Button */}
      <div className="fixed bottom-24 left-4 right-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
        <p className="text-sm font-medium mb-2">📱 To'liq imkoni bilan ishlash uchun:</p>
        
          href="https://play.google.com/store/apps/details?id=com.zoya" 
          className="block w-full bg-white text-orange-600 py-3 rounded-lg font-bold text-center hover:bg-gray-100 transition-all"
        >
          ZOYA App ni Yuklash
        </a>
      </div>
    </div>
  )
}