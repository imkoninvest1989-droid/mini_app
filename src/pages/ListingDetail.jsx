import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function ListingDetail() {
  const { id } = useParams()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imageIndex, setImageIndex] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    fetchListing()
  }, [id])

  const fetchListing = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/listings/${id}`)
      setListing(response.data.listing)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-4xl">😕</div>
        <p className="text-gray-600">Elon topilmadi</p>
        <button
          onClick={() => navigate('/')}
          className="bg-teal-600 text-white px-6 py-2 rounded-lg"
        >
          Orqaga
        </button>
      </div>
    )
  }

  const images = listing.images || []

  return (
    <div className="pb-32">
      {/* Back Button */}
      <div className="flex items-center gap-2 p-4 bg-white border-b">
        <button
          onClick={() => navigate('/')}
          className="text-2xl"
        >
          ←
        </button>
        <h1 className="font-bold">Elon Tafsiloti</h1>
      </div>

      {/* Image Gallery */}
      {images.length > 0 ? (
        <div className="relative bg-gray-200">
          <img
            src={images[imageIndex]}
            alt={`${imageIndex + 1}`}
            className="w-full h-80 object-cover"
          />
          
          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setImageIndex((imageIndex - 1 + images.length) % images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
              >
                ‹
              </button>
              <button
                onClick={() => setImageIndex((imageIndex + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
              >
                ›
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {imageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="w-full h-80 bg-gray-300 flex items-center justify-center text-gray-500">
          📸 Rasm yo'q
        </div>
      )}

      {/* Details */}
      <div className="p-4 space-y-4">
        {/* Title & Price */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{listing.title}</h2>
          <p className="text-3xl font-bold text-orange-500 mt-2">
            💰 {listing.coinPrice?.toLocaleString()} koin
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-100 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Kategoriya</p>
            <p className="font-bold">{listing.category}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg">
            <p className="text-xs text-gray-600">O'lcham</p>
            <p className="font-bold">{listing.size || '-'}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Holati</p>
            <p className="font-bold">{listing.condition}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Jins</p>
            <p className="font-bold">
              {listing.gender === 'women' ? '👩' : listing.gender === 'men' ? '👨' : '👶'}
              {listing.gender}
            </p>
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Tavsif</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{listing.description}</p>
          </div>
        )}

        {/* Seller Info */}
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            {listing.userAvatar && (
              <img
                src={listing.userAvatar}
                alt={listing.userName}
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <p className="font-bold text-gray-800">{listing.userName}</p>
              <p className="text-sm text-gray-600">
                Eloni: {new Date(listing.createdAt?.toDate?.() || listing.createdAt).toLocaleDateString('uz-UZ')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 space-y-3">
        <button className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold py-4 rounded-lg transition-all">
          💬 Xabar Jo'natish
        </button>
        
          href="https://play.google.com/store/apps/details?id=com.zoya"
          className="block w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-lg text-center transition-all"
        >
          🔄 Mini App da Offer Jo'natish
        </a>
      </div>
    </div>
  )
}