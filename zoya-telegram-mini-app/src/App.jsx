import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Profile from './pages/Profile'
import MyListings from './pages/MyListings'
import PostListing from './pages/PostListing'
import ListingDetail from './pages/ListingDetail'
import Offers from './pages/Offers'
import Navigation from './components/Navigation'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://miniapp-production-6b94.up.railway.app'

// ── Ro'yxatdan o'tish modali ─────────────────────────────────────
function RegisterModal({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
      zIndex: 9999, display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '24px 24px 0 0',
          width: '100%', padding: '32px 24px 44px',
          fontFamily: "'DM Sans','Segoe UI',sans-serif",
        }}
      >
        {/* Chiziq */}
        <div style={{ width: 40, height: 4, background: '#E5E7EB', borderRadius: 99, margin: '0 auto 24px' }} />

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 52, margin: '0 0 12px' }}>🔒</p>
          <p style={{ fontSize: 19, fontWeight: 800, color: '#1E2730', margin: '0 0 10px', lineHeight: 1.3 }}>
            Bu funksiyadan foydalanish uchun ro'yxatdan o'ting
          </p>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
            Ro'yxatdan o'tish <strong>10 soniya</strong> vaqt oladi va mutlaqo <strong>bepul</strong>.
          </p>
        </div>

        {/* Afzalliklar */}
        <div style={{ background: '#F0FAF5', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
          {[
            { icon: '📸', text: "Kiyimlaringizni e'lon qiling" },
            { icon: '🔄', text: 'Boshqalar bilan almashing' },
            { icon: '🛍️', text: 'Arzon narxda sotib oling' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < 2 ? 8 : 0 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{item.text}</span>
            </div>
          ))}
        </div>

        <a
          href="https://t.me/Zoya_app_bot"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '15px',
            background: '#007A6B', color: 'white', borderRadius: 16,
            textDecoration: 'none', fontSize: 16, fontWeight: 700,
            boxSizing: 'border-box',
          }}
        >
          📱 Telefon raqamni ulash
        </a>

        <button
          onClick={onClose}
          style={{
            display: 'block', width: '100%', padding: '13px',
            background: 'none', border: 'none', color: '#9AA5B4',
            fontSize: 14, cursor: 'pointer', marginTop: 8,
            fontWeight: 500,
          }}
        >
          ❌ Bekor qilish
        </button>
      </div>
    </div>
  )
}

// Context — barcha sahifalarga guest holatini uzatish
export function useAuth() {
  return window.__zoyaAuth || { user: null, isGuest: true, showRegister: () => {} }
}

function AppContent() {
  const [user, setUser]           = useState(null)
  const [isGuest, setIsGuest]     = useState(false)
  const [initData, setInitData]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [offerCount, setOfferCount] = useState(0)
  const [showRegisterModal, setShowRegisterModal] = useState(false)

  // Global ga chiqarish — barcha sahifalar foydalanadi
  window.__zoyaAuth = {
    user, isGuest, initData,
    showRegister: () => setShowRegisterModal(true),
  }

  useEffect(() => {
    const initUser = async () => {
      try {
        const tg = window.Telegram?.WebApp
        if (!tg?.initData) {
          setError('Bu app faqat Telegram orqali ochiladi')
          setLoading(false)
          return
        }
        tg.ready()
        tg.expand()
        const telegramInitData = tg.initData
        const response = await fetch(`${API_URL}/api/auth/telegram-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: telegramInitData })
        })
        const data = await response.json()
        if (data.success && data.user) {
          setUser(data.user)
          setInitData(telegramInitData)
          setIsGuest(false)
        } else if (data.isGuest) {
          // Kuzatuvchi — user yo'q, lekin kirish mumkin
          setIsGuest(true)
          setInitData(telegramInitData)
        } else {
          setError(data.error || 'Kirish amalga oshmadi')
        }
      } catch (err) {
        setError('Server bilan ulanishda xato')
      } finally {
        setLoading(false)
      }
    }
    initUser()
  }, [])

  useEffect(() => {
    if (!initData || isGuest) return
    fetch(`${API_URL}/api/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData })
    })
      .then(r => r.json())
      .then(d => { if (d.success) setOfferCount(d.counts.total) })
      .catch(() => {})
  }, [initData, isGuest])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #f3f3f3', borderTop: '3px solid #007A6B', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#999', fontSize: 14 }}>Yuklanmoqda...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', textAlign: 'center', padding: 32, gap: 16 }}>
      <div style={{ fontSize: 52 }}>🔐</div>
      <p style={{ fontSize: 17, fontWeight: 600, color: '#333', margin: 0 }}>Telegram orqali kiring</p>
      <p style={{ fontSize: 14, color: '#888', margin: 0 }}>{error}</p>
    </div>
  )

  return (
    <div className="app-content">
      {showRegisterModal && <RegisterModal onClose={() => setShowRegisterModal(false)} />}
      <Routes>
        <Route path="/"            element={<Home user={user} isGuest={isGuest} initData={initData} />} />
        <Route path="/listing/:id" element={<ListingDetail user={user} isGuest={isGuest} initData={initData} />} />
        <Route path="/my-listings" element={<MyListings user={user} isGuest={isGuest} initData={initData} />} />
        <Route path="/post"        element={<PostListing user={user} isGuest={isGuest} initData={initData} />} />
        <Route path="/profile"     element={<Profile user={user} isGuest={isGuest} initData={initData} />} />
        <Route path="/offers/*"    element={<Offers user={user} isGuest={isGuest} initData={initData} onRead={() => setOfferCount(0)} />} />
      </Routes>
      <Navigation offerCount={isGuest ? 0 : offerCount} isGuest={isGuest} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
