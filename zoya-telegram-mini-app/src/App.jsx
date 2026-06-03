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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function AppContent() {
  const [user, setUser] = useState(null)
  const [initData, setInitData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [errorType, setErrorType] = useState(null)
  const [offerCount, setOfferCount] = useState(0)

  // Login
  useEffect(() => {
    const initUser = async () => {
      try {
        const tg = window.Telegram?.WebApp
        if (!tg?.initData) {
          setError('Bu app faqat Telegram orqali ochiladi')
          setErrorType('no_telegram')
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
        } else if (data.requiresBotLink) {
          setError('Botda telefon raqamingizni ulang')
          setErrorType('not_linked')
        } else {
          setError(data.error || 'Kirish amalga oshmadi')
          setErrorType('server')
        }
      } catch (err) {
        setError('Server bilan ulanishda xato')
        setErrorType('server')
      } finally {
        setLoading(false)
      }
    }
    initUser()
  }, [])

  // Takliflar sonini yuklash (login bo'lgandan keyin)
  useEffect(() => {
    if (!initData) return
    fetch(`${API_URL}/api/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData })
    })
      .then(r => r.json())
      .then(d => { if (d.success) setOfferCount(d.counts.total) })
      .catch(() => {})
  }, [initData])

  if (loading) return (
    <div style={{
      display:'flex', flexDirection:'column',
      justifyContent:'center', alignItems:'center',
      height:'100vh', gap:16,
    }}>
      <div style={{
        width:40, height:40, border:'3px solid #f3f3f3',
        borderTop:'3px solid #007A6B', borderRadius:'50%',
        animation:'spin 1s linear infinite',
      }}/>
      <p style={{ color:'#999', fontSize:14 }}>Yuklanmoqda...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error) {
    const isNotLinked = errorType === 'not_linked'
    return (
      <div style={{
        display:'flex', flexDirection:'column', justifyContent:'center',
        alignItems:'center', height:'100vh', textAlign:'center', padding:32, gap:16,
      }}>
        <div style={{ fontSize:52 }}>{isNotLinked ? '📱' : '🔐'}</div>
        <p style={{ fontSize:17, fontWeight:600, color:'#333', margin:0 }}>
          {isNotLinked ? 'Akkauntingizni ulang' : 'Telegram orqali kiring'}
        </p>
        <p style={{ fontSize:14, color:'#888', margin:0, lineHeight:1.5 }}>
          {isNotLinked
            ? '@Zoya_app_bot ga o\'ting va /start bosib, telefon raqamingizni yuboring'
            : error}
        </p>
        {isNotLinked && (
          <a href="https://t.me/Zoya_app_bot" style={{
            marginTop:8, padding:'12px 28px', background:'#007A6B',
            color:'white', borderRadius:12, textDecoration:'none',
            fontSize:15, fontWeight:500,
          }}>Botni ochish</a>
        )}
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="app-content">
      <Routes>
        <Route path="/"            element={<Home user={user} initData={initData} />} />
        <Route path="/listing/:id" element={<ListingDetail user={user} initData={initData} />} />
        <Route path="/my-listings" element={<MyListings user={user} initData={initData} />} />
        <Route path="/post"        element={<PostListing user={user} initData={initData} />} />
        <Route path="/profile"     element={<Profile user={user} initData={initData} />} />
        <Route path="/offers/*"    element={<Offers user={user} initData={initData} onRead={() => setOfferCount(0)} />} />
      </Routes>
      <Navigation offerCount={offerCount} />
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
