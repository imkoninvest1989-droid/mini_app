import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import '../styles/PostListing.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://miniapp-production-6b94.up.railway.app'

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
      <div className="auth-required">
        <div className="icon">🔐</div>
        <p>Iltimos, Telegram orqali kiring</p>
      </div>
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX = 1200
          let w = img.width, h = img.height
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round(h * MAX / w); w = MAX }
            else       { w = Math.round(w * MAX / h); h = MAX }
          }
          canvas.width = w; canvas.height = h
          canvas.getContext('2d').drawImage(img, 0, 0, w, h)
          resolve(canvas.toDataURL('image/jpeg', 0.75))
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    for (const file of files) {
      if (formData.images.length >= 5) {
        alert('Maksimum 5 ta rasm')
        break
      }
      const compressed = await compressImage(file)
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, compressed]
      }))
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

      // ── DEV muhitda: initData yo'q bo'lsa, user ma'lumotini to'g'ridan yuborish
      if (!initData && import.meta.env.DEV) {
        const response = await axios.post(`${API_URL}/api/listings-dev`, {
          user: {
            id: user.telegramId || '123456789',
            first_name: user.fullName || 'Test',
            username: user.username || 'testuser',
            photo_url: user.avatar || '',
          },
          ...formData,
          coinPrice: parseInt(formData.coinPrice),
        })

        if (response.data.success) {
          alert('Elon muvaffaqiyatli joylashtirildi! ✅')
          navigate('/')
        }
        return
      }

      // ── PRODUCTION: haqiqiy Telegram initData bilan
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
    <div className="post-listing pb-24">
      <div className="header-bar">
        <h1>Yangi Elon ➕</h1>
      </div>

      <form onSubmit={handleSubmit} className="form-container">
        {/* Sarlavha */}
        <div className="form-group">
          <label>Sarlavha *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Masalan: Yaxshi holat libosi"
            maxLength={100}
            className="form-input"
          />
        </div>

        {/* Tavsif */}
        <div className="form-group">
          <label>Tavsif</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Mahsulot haqida ma'lumot"
            maxLength={500}
            rows="3"
            className="form-input"
          />
        </div>

        {/* Kategoriya */}
        <div className="form-group">
          <label>Kategoriya</label>
          <select name="category" value={formData.category} onChange={handleChange} className="form-input">
            <option>Libos</option>
            <option>Poyabzal</option>
            <option>Sumka</option>
            <option>Aksessuar</option>
            <option>Sport</option>
          </select>
        </div>

        {/* Jins */}
        <div className="form-group">
          <label>Jins</label>
          <div className="radio-group">
            {['Ayol', 'Erkak', 'Bola'].map(g => (
              <label key={g} className="radio-label">
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

        {/* O'lcham */}
        <div className="form-group">
          <label>O'lcham</label>
          <select name="size" value={formData.size} onChange={handleChange} className="form-input">
            <option value="">Tanlang</option>
            <option>XS</option>
            <option>S</option>
            <option>M</option>
            <option>L</option>
            <option>XL</option>
            <option>XXL</option>
          </select>
        </div>

        {/* Holati */}
        <div className="form-group">
          <label>Holati</label>
          <select name="condition" value={formData.condition} onChange={handleChange} className="form-input">
            <option>Yangi (tegli)</option>
            <option>Yangi (tegsiz)</option>
            <option>Juda yaxshi</option>
            <option>Yaxshi</option>
            <option>Qanoatarli</option>
          </select>
        </div>

        {/* Narx */}
        <div className="form-group">
          <label>Narx (koin) *</label>
          <input
            type="number"
            name="coinPrice"
            value={formData.coinPrice}
            onChange={handleChange}
            placeholder="1000"
            min="1"
            className="form-input"
          />
          <small>1 koin = 1 so'm</small>
        </div>

        {/* Rasmlar */}
        <div className="form-group">
          <label>Rasmlar ({formData.images.length}/5)</label>
          <label className="file-upload">
            <div className="upload-content">
              <div className="icon">📸</div>
              <p>Rasm tanlang</p>
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="file-input"
            />
          </label>

          {formData.images.length > 0 && (
            <div className="image-preview">
              {formData.images.map((img, i) => (
                <div key={i} className="preview-item">
                  <img src={img} alt={`preview-${i}`} />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      images: prev.images.filter((_, idx) => idx !== i)
                    }))}
                    className="remove-btn"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? '🔄 Joylashtirilmoqda...' : 'Elon Joylash ✅'}
        </button>
      </form>
    </div>
  )
}
