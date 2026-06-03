import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function PostListing({ user }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Libos',
    coinPrice: '',
    size: '',
    condition: 'Yaxshi',
    gender: 'women',
    images: [],
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-4xl">🔐</div>
        <p className="text-gray-600">Iltimos, Telegram orqali kiring</p>
      </div>
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    
    for (const file of files) {
      if (formData.images.length >= 5) {
        alert('Maksimum 5 ta rasm')
        break
      }
      
      // Simple base64 encoding (Production: use Cloud Storage)
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, event.target.result]
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title || !formData.coinPrice) {
      alert('Sarlavha va narx kiritish majburiy')
      return
    }

    setLoading(true)

    try {
      const initData = window.Telegram?.WebApp?.initData
      
      const response = await axios.post(`${API_URL}/api/listings`, {
        initData,
        ...formData,
        coinPrice: parseInt(formData.coinPrice),
      })

      if (response.data.success) {
        alert('Elon muvaffaqiyatli joylashtirildi! ✅')
        navigate('/')
      }
    } catch (error) {
      alert('Xato: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-r from-teal-700 to-teal-600 text-white p-4 mb-6">
        <h1 className="text-2xl font-bold">Yangi Elon ➕</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sarlavha *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Masalan: Yaxshi holat libosi"
            maxLength={100}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tavsif
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Mahsulot haqida ma'lumot"
            maxLength={500}
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kategoriya
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option>Libos</option>
            <option>Poyabzal</option>
            <option>Sumka</option>
            <option>Aksessuar</option>
            <option>Sport</option>
          </select>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jins
          </label>
          <div className="flex gap-4">
            {['Ayol', 'Erkak', 'Bola'].map(g => (
              <label key={g} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={formData.gender === g}
                  onChange={handleChange}
                />
                {g}
              </label>
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            O'lcham
          </label>
          <select
            name="size"
            value={formData.size}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          >
            <option value="">Tanlang</option>
            <option>XS</option>
            <option>S</option>
            <option>M</option>
            <option>L</option>
            <option>XL</option>
            <option>XXL</option>
          </select>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Holati
          </label>
          <select
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          >
            <option>Yangi (tegli)</option>
            <option>Yangi (tegsiz)</option>
            <option>Juda yaxshi</option>
            <option>Yaxshi</option>
            <option>Qanoatarli</option>
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Narx (koin) *
          </label>
          <input
            type="number"
            name="coinPrice"
            value={formData.coinPrice}
            onChange={handleChange}
            placeholder="1000"
            min="1"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <p className="text-xs text-gray-500 mt-1">1 koin = 1 so'm</p>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rasmlar ({formData.images.length}/5)
          </label>
          <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-teal-500 transition-all">
            <div className="text-center">
              <div className="text-2xl mb-2">📸</div>
              <p className="text-sm text-gray-600">Rasm tanlang</p>
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          
          {/* Image Preview */}
          {formData.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {formData.images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img} alt={`preview-${i}`} className="w-full h-20 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        images: prev.images.filter((_, idx) => idx !== i)
                      }))
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {loading ? '🔄 Joylashtirilmoqda...' : 'Elon Joylash ✅'}
        </button>
      </form>
    </div>
  )
}