import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'https://miniapp-production-6b94.up.railway.app'

export default function ListingDetail({ user, initData }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imgIndex, setImgIndex] = useState(0)
  const [modal, setModal] = useState(null) // 'buy' | 'swap' | 'price'

  useEffect(() => {
    fetch(`${API_URL}/api/listings/${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setListing(d.listing) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
      <div style={{ width:32, height:32, border:'3px solid #f3f3f3', borderTop:'3px solid #007A6B', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!listing) return (
    <div style={{ padding:20, textAlign:'center', color:'#999', marginTop:60 }}>
      <p style={{ fontSize:40 }}>🔍</p>
      <p>E'lon topilmadi</p>
    </div>
  )

  const isOwner  = listing.userId === user?.uid
  const images   = listing.images || []
  const canAfford = (user?.balance?.coins ?? 0) >= listing.coinPrice

  return (
    <div style={{ background:'#F2F4F7', minHeight:'100vh', paddingBottom:100, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

      {/* ── GALLERY ─────────────────────────────────────────────── */}
      <div style={{ position:'relative', background:'#1a1a1a' }}>
        <button onClick={() => navigate(-1)} style={{
          position:'absolute', top:14, left:14, zIndex:10,
          width:36, height:36, borderRadius:'50%', border:'none',
          background:'rgba(0,0,0,0.4)', color:'white', fontSize:18, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>←</button>

        {images.length > 0 ? (
          <>
            <img src={images[imgIndex]} alt={listing.title} style={{ width:'100%', height:300, objectFit:'cover', display:'block' }} />
            {images.length > 1 && (
              <>
                <div style={{ position:'absolute', bottom:12, left:0, right:0, display:'flex', justifyContent:'center', gap:6 }}>
                  {images.map((_, i) => (
                    <div key={i} onClick={() => setImgIndex(i)} style={{
                      width: i === imgIndex ? 20 : 6, height:6, borderRadius:3,
                      background: i === imgIndex ? 'white' : 'rgba(255,255,255,0.4)',
                      cursor:'pointer', transition:'all 0.2s',
                    }} />
                  ))}
                </div>
                {imgIndex > 0 && (
                  <button onClick={() => setImgIndex(i => i-1)} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.3)', border:'none', color:'white', width:32, height:32, borderRadius:'50%', fontSize:16, cursor:'pointer' }}>‹</button>
                )}
                {imgIndex < images.length-1 && (
                  <button onClick={() => setImgIndex(i => i+1)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.3)', border:'none', color:'white', width:32, height:32, borderRadius:'50%', fontSize:16, cursor:'pointer' }}>›</button>
                )}
              </>
            )}
          </>
        ) : (
          <div style={{ width:'100%', height:280, display:'flex', alignItems:'center', justifyContent:'center', fontSize:60, color:'#555' }}>📷</div>
        )}
      </div>

      <div style={{ padding:'16px 16px 0' }}>

        {/* ── TITLE & PRICE ───────────────────────────────────── */}
        <div style={{ background:'white', borderRadius:16, padding:'16px', marginBottom:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)' }}>
          <h1 style={{ margin:'0 0 6px', fontSize:20, fontWeight:700, color:'#1E2730' }}>{listing.title}</h1>
          <p style={{ margin:0, fontSize:24, fontWeight:800, color:'#E8833A' }}>
            {listing.coinPrice?.toLocaleString()} koin
          </p>
          {isOwner && (
            <span style={{ display:'inline-block', marginTop:8, background:'#F0FAF5', color:'#007A6B', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20 }}>
              Bu sizning e'loningiz
            </span>
          )}
        </div>

        {/* ── DETAILS GRID ────────────────────────────────────── */}
        <div style={{ background:'white', borderRadius:16, padding:'16px', marginBottom:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { icon:'📏', label:"O'lcham",    value: listing.size       || '—' },
              { icon:'✨', label:'Holati',     value: listing.condition  || '—' },
              { icon:'🏷️', label:'Kategoriya', value: listing.category   || '—' },
              { icon:'👁️', label:"Ko'rildi",   value: listing.views ?? 0       },
            ].map(({ icon, label, value }) => (
              <div key={label}>
                <p style={{ fontSize:11, color:'#9AA5B4', margin:'0 0 3px', fontWeight:600 }}>{icon} {label}</p>
                <p style={{ fontSize:15, fontWeight:600, color:'#1E2730', margin:0 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── DESCRIPTION ─────────────────────────────────────── */}
        {listing.description && (
          <div style={{ background:'white', borderRadius:16, padding:'16px', marginBottom:12, boxShadow:'0 1px 8px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#9AA5B4', letterSpacing:'0.6px', margin:'0 0 8px' }}>TAVSIF</p>
            <p style={{ fontSize:14, color:'#555', lineHeight:1.7, margin:0 }}>{listing.description}</p>
          </div>
        )}

        {/* ── SELLER ──────────────────────────────────────────── */}
        <div style={{ background:'white', borderRadius:16, padding:'16px', marginBottom:16, boxShadow:'0 1px 8px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg,#F4A942,#E8833A)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'white', flexShrink:0 }}>
            {(listing.userName || 'U')[0].toUpperCase()}
          </div>
          <div>
            <p style={{ margin:0, fontSize:11, color:'#9AA5B4', fontWeight:600 }}>SOTUVCHI</p>
            <p style={{ margin:0, fontSize:15, fontWeight:600, color:'#1E2730' }}>{listing.userName}</p>
          </div>
        </div>

        {/* ── ACTION BUTTONS (faqat o'ziniki bo'lmasa) ────────── */}
        {!isOwner && listing.status === 'active' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <button onClick={() => setModal('buy')} style={{
              width:'100%', padding:'15px', background:'linear-gradient(135deg,#F4A942,#E8833A)',
              color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer',
            }}>🛍️ Sotib Olish</button>

            <button onClick={() => setModal('swap')} style={{
              width:'100%', padding:'15px', background:'linear-gradient(135deg,#1A7A58,#0A3D2E)',
              color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer',
            }}>🔄 Almashish</button>

            <button onClick={() => setModal('price')} style={{
              width:'100%', padding:'15px', background:'white',
              color:'#007A6B', border:'2px solid #007A6B', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer',
            }}>🏷️ Narx Taklif Qilish</button>
          </div>
        )}

        {!isOwner && listing.status !== 'active' && (
          <div style={{ padding:'14px', background:'#F4F6F8', borderRadius:14, textAlign:'center', color:'#9AA5B4', fontWeight:600 }}>
            Bu e'lon band yoki yakunlangan
          </div>
        )}
      </div>

      {/* ── MODALS ──────────────────────────────────────────────── */}
      {modal === 'buy' && (
        <BuyModal listing={listing} user={user} initData={initData} canAfford={canAfford}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); navigate('/') }}
        />
      )}
      {modal === 'swap' && (
        <SwapModal listing={listing} user={user} initData={initData}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); navigate('/') }}
        />
      )}
      {modal === 'price' && (
        <PriceModal listing={listing} user={user} initData={initData}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null) }}
        />
      )}
    </div>
  )
}

// ── Modal wrapper ──────────────────────────────────────────────────
function ModalWrap({ onClose, children }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end', zIndex:1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', background:'white', borderRadius:'20px 20px 0 0', padding:'20px', maxHeight:'85vh', overflowY:'auto' }}>
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
      <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:'#1E2730' }}>{title}</h3>
      <button onClick={onClose} style={{ background:'#F4F6F8', border:'none', borderRadius:'50%', width:32, height:32, fontSize:16, cursor:'pointer' }}>✕</button>
    </div>
  )
}

// ── SOTIB OLISH MODAL ─────────────────────────────────────────────
function BuyModal({ listing, user, initData, canAfford, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleBuy = async () => {
    setLoading(true); setError(null)
    try {
      const r = await fetch(`${API_URL}/api/orders`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ initData, itemId: listing.id })
      })
      const d = await r.json()
      if (d.success) onSuccess()
      else setError(d.error)
    } catch { setError('Server bilan ulanishda xato') }
    finally { setLoading(false) }
  }

  return (
    <ModalWrap onClose={onClose}>
      <ModalHeader title="🛍️ Sotib Olish" onClose={onClose} />

      <div style={{ background:'#F8FAFB', borderRadius:12, padding:'14px', marginBottom:14 }}>
        <p style={{ margin:'0 0 4px', fontSize:13, color:'#9AA5B4' }}>Mahsulot</p>
        <p style={{ margin:'0 0 8px', fontSize:15, fontWeight:700, color:'#1E2730' }}>{listing.title}</p>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#555' }}>
          <span>Narxi:</span><span style={{ fontWeight:700, color:'#E8833A' }}>{listing.coinPrice?.toLocaleString()} koin</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#555', marginTop:4 }}>
          <span>Sizning balansingiz:</span><span style={{ fontWeight:700, color: canAfford ? '#007A6B' : '#EF4444' }}>{(user?.balance?.coins ?? 0).toLocaleString()} koin</span>
        </div>
        <div style={{ borderTop:'1px solid #EAEEF2', marginTop:10, paddingTop:10, display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontWeight:700, color:'#1E2730' }}>Jami:</span>
          <span style={{ fontSize:16, fontWeight:800, color:'#E8833A' }}>{listing.coinPrice?.toLocaleString()} koin</span>
        </div>
      </div>

      {!canAfford && (
        <div style={{ background:'#FEF2F2', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#EF4444', fontWeight:600 }}>
          ⚠️ Balansingiz yetarli emas. Kerak: {(listing.coinPrice - (user?.balance?.coins ?? 0)).toLocaleString()} koin
        </div>
      )}
      {error && <div style={{ background:'#FEF2F2', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#EF4444' }}>{error}</div>}

      <div style={{ display:'flex', gap:10 }}>
        <button onClick={onClose} style={{ flex:1, padding:'13px', background:'#F4F6F8', border:'none', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' }}>Bekor</button>
        <button onClick={handleBuy} disabled={!canAfford || loading} style={{
          flex:2, padding:'13px', background: canAfford ? 'linear-gradient(135deg,#F4A942,#E8833A)' : '#ccc',
          color:'white', border:'none', borderRadius:12, fontSize:14, fontWeight:700,
          cursor: canAfford ? 'pointer' : 'not-allowed',
        }}>
          {loading ? '⏳ Yuborilmoqda...' : '✅ Sotib Olish'}
        </button>
      </div>
    </ModalWrap>
  )
}

// ── ALMASHISH MODAL ───────────────────────────────────────────────
function SwapModal({ listing, user, initData, onClose, onSuccess }) {
  const [myListings, setMyListings] = useState([])
  const [selected, setSelected]     = useState(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/api/user-listings`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ initData })
    })
      .then(r => r.json())
      .then(d => { if (d.success) setMyListings(d.listings.filter(l => l.status === 'active' && l.id !== listing.id)) })
      .catch(() => {})
      .finally(() => setLoadingList(false))
  }, [])

  const handleSwap = async () => {
    if (!selected) return
    setLoading(true); setError(null)
    try {
      const r = await fetch(`${API_URL}/api/swaps`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ initData, toItemId: listing.id, fromItemId: selected.id, addCoins: 0 })
      })
      const d = await r.json()
      if (d.success) onSuccess()
      else setError(d.error)
    } catch { setError('Server bilan ulanishda xato') }
    finally { setLoading(false) }
  }

  // Avtomatik hisoblash: selected (meniki) vs listing (ularnikiː)
  const myPrice    = selected?.coinPrice || 0
  const theirPrice = listing.coinPrice || 0
  const rawDiff    = myPrice - theirPrice
  const priceDiff  = Math.abs(rawDiff)
  // rawDiff < 0 → meniki arzonroq → men farqni to'layman
  // rawDiff > 0 → meniki qimmatroq → u tomon farqni to'laydi
  const iPay       = rawDiff < 0

  return (
    <ModalWrap onClose={onClose}>
      <ModalHeader title="🔄 Almashish Taklifi" onClose={onClose} />

      <div style={{ background:'#F0FAF5', borderRadius:12, padding:'12px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20 }}>🎯</span>
        <div>
          <p style={{ margin:0, fontSize:11, color:'#9AA5B4' }}>Almashish so'ralgan</p>
          <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#1E2730' }}>{listing.title}</p>
          <p style={{ margin:0, fontSize:12, color:'#E8833A' }}>{listing.coinPrice?.toLocaleString()} koin</p>
        </div>
      </div>

      <p style={{ fontSize:12, fontWeight:700, color:'#9AA5B4', letterSpacing:'0.5px', margin:'0 0 10px' }}>O'Z E'LONLARINGIZ</p>

      {loadingList ? (
        <p style={{ textAlign:'center', color:'#999', padding:'20px 0' }}>⏳ Yuklanmoqda...</p>
      ) : myListings.length === 0 ? (
        <div style={{ textAlign:'center', padding:'20px 0', color:'#9AA5B4' }}>
          <p style={{ fontSize:32, margin:'0 0 8px' }}>📭</p>
          <p style={{ fontSize:13, margin:0 }}>Aktiv e'lonlaringiz yo'q</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
          {myListings.map(item => (
            <div key={item.id} onClick={() => setSelected(selected?.id === item.id ? null : item)}
              style={{
                display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                border: selected?.id === item.id ? '2px solid #007A6B' : '1px solid #EAEEF2',
                borderRadius:12, cursor:'pointer',
                background: selected?.id === item.id ? '#F0FAF5' : 'white',
              }}
            >
              {item.images?.[0]
                ? <img src={item.images[0]} style={{ width:48, height:48, borderRadius:8, objectFit:'cover', flexShrink:0 }} />
                : <div style={{ width:48, height:48, borderRadius:8, background:'#F4F6F8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>📷</div>
              }
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#1E2730' }}>{item.title}</p>
                <p style={{ margin:0, fontSize:12, color:'#E8833A' }}>{item.coinPrice?.toLocaleString()} koin</p>
              </div>
              {selected?.id === item.id && <span style={{ color:'#007A6B', fontSize:18 }}>✓</span>}
            </div>
          ))}
        </div>
      )}

      {selected && priceDiff === 0 && (
        <div style={{ background:'#E8F5F3', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#007A6B', fontWeight:600 }}>
          ✅ Narxlar teng — qo'shimcha coin kerak emas
        </div>
      )}
      {selected && priceDiff > 0 && iPay && (
        <div style={{ background:'#FFFBEB', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#F59E0B', fontWeight:600 }}>
          💰 Sizning e'loningiz {priceDiff.toLocaleString()} koin arzonroq — siz farqni to'laysiz (balansingizdan ushlanadi)
        </div>
      )}
      {selected && priceDiff > 0 && !iPay && (
        <div style={{ background:'#EFF6FF', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#3B82F6', fontWeight:600 }}>
          💰 Sizning e'loningiz {priceDiff.toLocaleString()} koin qimmatroq — u tomon farqni to'laydi
        </div>
      )}

      {error && <div style={{ background:'#FEF2F2', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#EF4444' }}>{error}</div>}

      <div style={{ display:'flex', gap:10 }}>
        <button onClick={onClose} style={{ flex:1, padding:'13px', background:'#F4F6F8', border:'none', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' }}>Bekor</button>
        <button onClick={handleSwap} disabled={!selected || loading} style={{
          flex:2, padding:'13px', background: selected ? 'linear-gradient(135deg,#1A7A58,#0A3D2E)' : '#ccc',
          color:'white', border:'none', borderRadius:12, fontSize:14, fontWeight:700,
          cursor: selected ? 'pointer' : 'not-allowed',
        }}>
          {loading ? '⏳ Yuborilmoqda...' : '✅ Taklif Yuborish'}
        </button>
      </div>
    </ModalWrap>
  )
}

// ── NARX TAKLIF MODAL ─────────────────────────────────────────────
function PriceModal({ listing, user, initData, onClose, onSuccess }) {
  const [offerPrice, setOfferPrice] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [done, setDone]             = useState(false)

  const percent = offerPrice ? Math.round((1 - offerPrice / listing.coinPrice) * 100) : 0
  const isValid = offerPrice > 0 && offerPrice < listing.coinPrice

  const handleOffer = async () => {
    setLoading(true); setError(null)
    try {
      const r = await fetch(`${API_URL}/api/price-offer`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ initData, itemId: listing.id, offerPrice: parseInt(offerPrice) })
      })
      const d = await r.json()
      if (d.success) { setDone(true); setTimeout(onSuccess, 1500) }
      else setError(d.error)
    } catch { setError('Server bilan ulanishda xato') }
    finally { setLoading(false) }
  }

  return (
    <ModalWrap onClose={onClose}>
      <ModalHeader title="🏷️ Narx Taklif Qilish" onClose={onClose} />

      <div style={{ background:'#F8FAFB', borderRadius:12, padding:'14px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <p style={{ margin:0, fontSize:11, color:'#9AA5B4' }}>Joriy narx</p>
          <p style={{ margin:0, fontSize:18, fontWeight:800, color:'#E8833A' }}>{listing.coinPrice?.toLocaleString()} koin</p>
        </div>
        <div style={{ fontSize:24 }}>→</div>
        <div style={{ textAlign:'right' }}>
          <p style={{ margin:0, fontSize:11, color:'#9AA5B4' }}>Sizning taklifingiz</p>
          <p style={{ margin:0, fontSize:18, fontWeight:800, color:'#007A6B' }}>
            {offerPrice ? parseInt(offerPrice).toLocaleString() : '—'} koin
          </p>
        </div>
      </div>

      <div style={{ marginBottom:14 }}>
        <p style={{ fontSize:12, fontWeight:700, color:'#9AA5B4', letterSpacing:'0.5px', margin:'0 0 8px' }}>TAKLIF NARXI</p>
        <input type="number" value={offerPrice} min={1} max={listing.coinPrice - 1}
          onChange={e => setOfferPrice(e.target.value)}
          placeholder={`0 — ${(listing.coinPrice - 1).toLocaleString()} oralig'ida`}
          style={{ width:'100%', padding:'13px 14px', border: `2px solid ${isValid ? '#007A6B' : '#EAEEF2'}`, borderRadius:12, fontSize:15, fontWeight:600, boxSizing:'border-box', outline:'none' }}
        />
        {isValid && (
          <p style={{ margin:'6px 0 0', fontSize:12, color:'#007A6B', fontWeight:600 }}>
            💚 {percent}% chegirma taklif qilyapsiz
          </p>
        )}
      </div>

      {error && <div style={{ background:'#FEF2F2', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#EF4444' }}>{error}</div>}

      {done && (
        <div style={{ background:'#F0FAF5', borderRadius:10, padding:'12px 14px', marginBottom:14, textAlign:'center', fontSize:14, color:'#007A6B', fontWeight:600 }}>
          ✅ Taklifingiz yuborildi!
        </div>
      )}

      <div style={{ display:'flex', gap:10 }}>
        <button onClick={onClose} style={{ flex:1, padding:'13px', background:'#F4F6F8', border:'none', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' }}>Bekor</button>
        <button onClick={handleOffer} disabled={!isValid || loading} style={{
          flex:2, padding:'13px', background: isValid ? '#007A6B' : '#ccc',
          color:'white', border:'none', borderRadius:12, fontSize:14, fontWeight:700,
          cursor: isValid ? 'pointer' : 'not-allowed',
        }}>
          {loading ? '⏳ Yuborilmoqda...' : '🏷️ Taklif Yuborish'}
        </button>
      </div>
    </ModalWrap>
  )
}
