import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import PostListing from './pages/PostListing'
import ListingDetail from './pages/ListingDetail'
import MyListings from './pages/MyListings'
import Profile from './pages/Profile'
import Navigation from './components/Navigation'
import './App.css'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Telegram foydalanuvchi ma'lumotlarini olish
    const initData = window.Telegram?.WebApp?.initData
    if (initData) {
      const params = new URLSearchParams(initData)
      const userData = JSON.parse(params.get('user') || '{}')
      setUser(userData)
      console.log('Telegram foydalanuvchi:', userData)
    }
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/post" element={<PostListing user={user} />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/my-listings" element={<MyListings user={user} />} />
          <Route path="/profile" element={<Profile user={user} />} />
        </Routes>
        <Navigation />
      </div>
    </BrowserRouter>
  )
}

export default App