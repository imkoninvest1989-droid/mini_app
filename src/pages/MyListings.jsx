import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function MyListings({ user }) {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchListings()
  }, [user])

  const fetchListings = async () => {
    try {
      const initData = window.Telegram?.WebApp?.initData
      const response = await axios.post(`${API_URL}/api/user-listings`, { initData })
      setListings(response.data.listings || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Elonni o\'chirmoqchimisiz?')) return

    try {
      const initData = window.Telegram?.WebApp?.initData
      await axios.post(`${API_URL}/api/listings/${id}/delete`, { initData })
      setListings(listings.filter(l => l.id !== id))
      alert('Elon o\'chirildi ✅')
    } catch (error) {
      alert('Xato: ' + error.message)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>
  }

  return (
    <div className="pb-24 p-4">
      <h1 className="text-2xl font-bold mb-4">Mening Elonlarim</h1>
      
      {listings.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-4xl mb-4">📭</div>
          <p>Hali elon joylashmadingiz</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map(listing => (
            <div key={listing.id} className="bg-white p-4 rounded-lg border border-gray-200 flex gap-3">
              {listing.images?.[0] && (
                <img src={listing.images[0]} alt={listing.title} className="w-20 h-20 object-cover rounded" />
              )}
              <div className="flex-1">
                <h3 className="font-bold">{listing.title}</h3>
                <p className="text-orange-500 font-bold">{listing.coinPrice} koin</p>
                <p className="text-xs text-gray-500">Status: {listing.status}</p>
              </div>
              <button
                onClick={() => handleDelete(listing.id)}
                className="text-red-500 font-bold p-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}