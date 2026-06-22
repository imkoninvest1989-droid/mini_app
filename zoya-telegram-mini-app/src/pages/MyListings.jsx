import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'https://miniapp-production-6b94.up.railway.app'

const STATUS = {
  active:    { label: 'Aktiv',       color: '#007A6B', bg: '#E8F5F3' },
  exchanged: { label: 'Almashingan', color: '#7B5EA7', bg: '#F3EEFF' },
  sold:      { label: 'Sotilgan',    color: '#E8833A', bg: '#FFF3E8' },
  completed: { label: 'Yakunlangan', color: '#3B82F6', bg: '#EFF6FF' },
  pending:   { label: 'Kutilmoqda', color: '#F59E0B', bg: '#FFFBEB' },
  inactive:  { label: 'Noaktiv',    color: '#9AA5B4', bg: '#F4F6F8' },
}

const TABS = [
  { key: 'all',       label: 'Barchasi'    },
  { key: 'active',    label: 'Aktiv'       },
  { key: 'exchanged', label: 'Almashingan' },
  { key: 'sold',      label: 'Sotilgan'    },
]

export default function MyListings({ user, isGuest, initData }) {
  if (isGuest) {
    const { showRegister } = window.__zoyaAuth || {}
    return (
      <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', height:'80vh', textAlign:'center', padding:32, gap:16, fontFamily:"'DM Sans',sans-serif" }}>
        <p style={{ fontSize:48, margin:0 }}>📋</p>
        <p style={{ fontSize:17, fontWeight:700, color:'#1E2730', margin:0 }}>Mening e'lonlarim</p>
        <p style={{ fontSize:14, color:'#9AA5B4', margin:0 }}>E'lonlaringizni ko'rish uchun akkaunt kerak</p>
        <button onClick={() => showRegister?.()} style={{ padding:'13px 28px', background:'#007A6B', color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer', width:'100%' }}>
          📱 Ro'yxatdan o'tish
        </button>
      </div>
    )
  }
  const navigate = useNavigate()
  const [allListings, setAllListings] = useState([])
  const [tab, setTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const listings = tab === 'all'
    ? allListings
    : allListings.filter(l => l.status === tab)

  useEffect(() => {
    if (!initData) { setError('Avtorizatsiya topilmadi'); setLoading(false); return }

    fetch(`${API_URL}/api/user-listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData })
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => { if (data.success) setAllListings(data.listings); else setError(data.error) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [initData])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('O\'chirishni tasdiqlaysizmi?')) return
    try {
      const r = await fetch(`${API_URL}/api/listings/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData })
      })
      const data = await r.json()
      if (data.success) setAllListings(p => p.filter(l => l.id !== id))
      else alert(data.error)
    } catch { alert('Xato yuz berdi') }
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
      <div style={{
        width:36, height:36, border:'3px solid #f3f3f3',
        borderTop:'3px solid #007A6B', borderRadius:'50%',
        animation:'spin 1s linear infinite'
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{ padding:'20px', textAlign:'center', color:'#d32f2f', marginTop:'40px' }}>
      ❌ {error}
    </div>
  )

  // Tab uchun son
  const count = (key) => key === 'all' ? allListings.length : allListings.filter(l => l.status === key).length

  return (
    <div style={{ minHeight:'100vh', background:'#F2F4F7', paddingBottom:90,
      fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

      {/* HEADER */}
      <div style={{
        position:'sticky', top:0, zIndex:10,
        background:'white', borderBottom:'1px solid #EAEEF2',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px' }}>
          <button onClick={() => navigate(-1)} style={{
            width:36, height:36, borderRadius:10, border:'none',
            background:'#F4F6F8', fontSize:18, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>←</button>
          <h2 style={{ margin:0, fontSize:16, fontWeight:700, flex:1, color:'#1E2730' }}>
            Mening e'lonlarim
          </h2>
          <span style={{ fontSize:13, color:'#9AA5B4', fontWeight:600 }}>
            {allListings.length} ta
          </span>
        </div>

        {/* TABS */}
        <div style={{ display:'flex', gap:6, padding:'0 16px 12px', overflowX:'auto' }}>
          {TABS.map(t => {
            const active = tab === t.key
            const n = count(t.key)
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding:'6px 12px', borderRadius:20, border:'none', cursor:'pointer',
                background: active ? '#007A6B' : '#F4F6F8',
                color: active ? 'white' : '#555',
                fontSize:12, fontWeight:600, whiteSpace:'nowrap',
                display:'flex', alignItems:'center', gap:5,
                flexShrink:0,
              }}>
                {t.label}
                {n > 0 && (
                  <span style={{
                    background: active ? 'rgba(255,255,255,0.3)' : '#E0E5EA',
                    color: active ? 'white' : '#555',
                    borderRadius:10, padding:'1px 6px', fontSize:10, fontWeight:700
                  }}>{n}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ padding:'14px 14px' }}>
        {listings.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'#999' }}>
            <p style={{ fontSize:44, margin:'0 0 12px' }}>📭</p>
            <p style={{ fontSize:16, fontWeight:600, margin:0, color:'#333' }}>
              {tab === 'all' ? 'E\'lonlar yo\'q' : `${TABS.find(t=>t.key===tab)?.label} e'lonlar yo'q`}
            </p>
            {tab === 'all' && (
              <>
                <p style={{ fontSize:13, margin:'8px 0 20px' }}>Birinchi e'loningizni joylang!</p>
                <button onClick={() => navigate('/post')} style={{
                  padding:'12px 28px', background:'#007A6B', color:'white',
                  border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer'
                }}>➕ E'lon joylash</button>
              </>
            )}
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {listings.map(item => {
                const st = STATUS[item.status] || STATUS.inactive
                const isActive = item.status === 'active'
                return (
                  <div key={item.id} onClick={() => navigate(`/listing/${item.id}`)}
                    style={{
                      background:'white', borderRadius:14, overflow:'hidden',
                      border:'1px solid #EAEEF2', cursor:'pointer',
                      opacity: isActive ? 1 : 0.85,
                    }}
                  >
                    {/* Rasm */}
                    <div style={{ position:'relative' }}>
                      {item.images?.[0]
                        ? <img src={item.images[0]} alt={item.title}
                            style={{ width:'100%', height:120, objectFit:'cover' }}/>
                        : <div style={{
                            width:'100%', height:120, background:'#F4F6F8',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:28, color:'#ccc'
                          }}>📷</div>
                      }
                      {/* Status badge — rasm ustida */}
                      <span style={{
                        position:'absolute', top:7, left:7,
                        background: st.bg, color: st.color,
                        fontSize:10, fontWeight:700, padding:'3px 8px',
                        borderRadius:20, letterSpacing:'0.2px',
                      }}>{st.label}</span>
                    </div>

                    <div style={{ padding:'10px' }}>
                      <p style={{
                        fontSize:13, fontWeight:600, margin:'0 0 3px',
                        color:'#1E2730', overflow:'hidden',
                        textOverflow:'ellipsis', whiteSpace:'nowrap'
                      }}>{item.title}</p>
                      <p style={{ fontSize:13, fontWeight:700, color:'#E8833A', margin:'0 0 8px' }}>
                        {item.coinPrice?.toLocaleString()} koin
                      </p>

                      {/* Faqat aktiv e'lonlarni o'chirish mumkin */}
                      {isActive && (
                        <button onClick={(e) => handleDelete(item.id, e)} style={{
                          width:'100%', padding:'6px', background:'#ffebee',
                          color:'#d32f2f', border:'none', borderRadius:8,
                          fontSize:11, fontWeight:600, cursor:'pointer'
                        }}>O'chirish</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {tab === 'all' && (
              <button onClick={() => navigate('/post')} style={{
                width:'100%', marginTop:16, padding:14,
                background:'#007A6B', color:'white', border:'none',
                borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer'
              }}>➕ Yangi e'lon</button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
