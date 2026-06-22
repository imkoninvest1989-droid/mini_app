import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'https://miniapp-production-6b94.up.railway.app'

const TABS = [
  { key: 'exchange', label: 'Almashinuv', icon: '🔄' },
  { key: 'sale',     label: 'Sotish',     icon: '🛍️' },
  { key: 'price',    label: 'Narx',       icon: '🏷️' },
]

const STATUS_MAP = {
  pending:       { label: 'Kutilmoqda',    color: '#F59E0B', bg: '#FFFBEB' },
  accepted:      { label: 'Qabul qilindi', color: '#007A6B', bg: '#E8F5F3' },
  pending_seller:{ label: 'Tasdiq kerak',  color: '#F59E0B', bg: '#FFFBEB' },
  in_delivery:   { label: 'Yetkazilmoqda', color: '#3B82F6', bg: '#EFF6FF' },
  completed:     { label: 'Yakunlandi ✅', color: '#007A6B', bg: '#E8F5F3' },
  declined:      { label: 'Rad etildi',    color: '#EF4444', bg: '#FEF2F2' },
  cancelled:     { label: 'Bekor qilindi', color: '#9AA5B4', bg: '#F4F6F8' },
  expired:       { label: 'Muddati o\'tdi',color: '#9AA5B4', bg: '#F4F6F8' },
  purchased:     { label: 'Sotib olindi ✅',color: '#007A6B', bg: '#E8F5F3' },
}

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, color: '#9AA5B4', bg: '#F4F6F8' }
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0 }}>
      {s.label}
    </span>
  )
}

function ActionBtn({ label, color, bg, onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      flex: 1, padding: '9px 8px', borderRadius: 10, border: 'none',
      background: loading ? '#E5E7EB' : bg, color: loading ? '#9AA5B4' : color,
      fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
    }}>
      {loading ? '⏳' : label}
    </button>
  )
}

function SectionHeader({ title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0 8px' }}>
      <div style={{ flex: 1, height: 1, background: '#EAEEF2' }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: '#9AA5B4', whiteSpace: 'nowrap' }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: '#EAEEF2' }} />
    </div>
  )
}

function ItemThumb({ image, title, price, label }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: '#9AA5B4', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {image
        ? <img src={image} alt={title} style={{ width: '100%', height: 70, objectFit: 'cover', borderRadius: 10, display: 'block' }} />
        : <div style={{ width: '100%', height: 70, background: '#F4F6F8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#ccc' }}>📷</div>
      }
      <p style={{ margin: '4px 0 2px', fontSize: 11, fontWeight: 600, color: '#1E2730', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
      <p style={{ margin: 0, fontSize: 10, color: '#E8833A', fontWeight: 700 }}>{price?.toLocaleString()} koin</p>
    </div>
  )
}

// ── ALMASHINUV kartochkasi ────────────────────────────────────────────
function ExchangeCard({ item, initData, onRefresh, isHistory }) {
  const [loading, setLoading] = useState(false)
  const isSender  = item._myRole === 'sender'
  const myItem    = isSender
    ? { title: item.fromItemTitle, image: item.fromItemImages?.[0], price: item.fromItemCoinValue }
    : { title: item.toItemTitle,   image: item.toItemImages?.[0],   price: item.toItemCoinValue }
  const theirItem = isSender
    ? { title: item.toItemTitle,   image: item.toItemImages?.[0],   price: item.toItemCoinValue }
    : { title: item.fromItemTitle, image: item.fromItemImages?.[0], price: item.fromItemCoinValue }
  const otherName = isSender ? item.toUserName : item.fromUserName
  const date = item.createdAt?.seconds
    ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('uz-UZ') : ''

  const doAction = async (action) => {
    setLoading(true)
    try {
      const r = await fetch(`${API_URL}/api/swaps/${item.id}/${action}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      })
      const d = await r.json()
      if (d.success) onRefresh()
      else alert(d.error || 'Xato yuz berdi')
    } catch { alert('Server bilan ulanishda xato') }
    finally { setLoading(false) }
  }

  const borderColor = isHistory ? '#F4F6F8'
    : item.status === 'pending' ? '#007A6B33' : '#EAEEF2'

  return (
    <div style={{ background: 'white', borderRadius: 14, border: `1px solid ${borderColor}`, padding: 12, opacity: isHistory ? 0.85 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>
          {isSender ? `📤 ${otherName} ga yuborgan` : `📩 ${otherName} dan taklif`}
        </span>
        <StatusBadge status={item.status} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ItemThumb {...myItem} label="Meniki" />
        <div style={{ fontSize: 20, color: '#9AA5B4', flexShrink: 0 }}>🔄</div>
        <ItemThumb {...theirItem} label="Ularnikiː" />
      </div>

      {item.coinDifference > 0 && (
        <div style={{ marginTop: 8, padding: '6px 10px', background: '#FFFBEB', borderRadius: 8, fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>
          💰 Farq: {item.coinDifference.toLocaleString()} koin — foizsiz almashinuv
        </div>
      )}

      {/* Yakunlangan almashinuv uchun info */}
      {item.status === 'accepted' && (
        <div style={{ marginTop: 8, padding: '6px 10px', background: '#E8F5F3', borderRadius: 8, fontSize: 11, color: '#007A6B', fontWeight: 600 }}>
          ✅ Almashinuv yakunlandi — komissiyasiz
        </div>
      )}

      {date && <p style={{ margin: '8px 0 0', fontSize: 10, color: '#C8D0D8' }}>{date}</p>}

      {/* Faol tugmalar */}
      {!isHistory && item.status === 'pending' && !isSender && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <ActionBtn label="❌ Rad" color="#EF4444" bg="#FEF2F2" onClick={() => doAction('decline')} loading={loading} />
          <ActionBtn label="✅ Qabul" color="white" bg="#007A6B" onClick={() => doAction('accept')} loading={loading} />
        </div>
      )}
      {!isHistory && item.status === 'pending' && isSender && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <ActionBtn label="🗑 Bekor qilish" color="#EF4444" bg="#FEF2F2" onClick={() => doAction('cancel')} loading={loading} />
        </div>
      )}
    </div>
  )
}

// ── NARX TAKLIFI kartochkasi ─────────────────────────────────────────
function PriceOfferCard({ item, initData, onRefresh, isHistory }) {
  const [loading, setLoading] = useState(false)
  const isSeller   = item._myRole === 'seller'
  const title      = item.itemTitle || 'Mahsulot'
  const image      = item.itemImages?.[0] || null
  const buyerName  = item.buyerName || 'Xaridor'
  const offerPrice    = item.offerPrice || 0
  const originalPrice = item.originalPrice || 0
  const discount   = originalPrice > 0 ? Math.round((originalPrice - offerPrice) / originalPrice * 100) : 0
  const date = item.createdAt?.seconds
    ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('uz-UZ') : ''

  const deadline = item.purchaseDeadline?.seconds
    ? (() => {
        const diff = item.purchaseDeadline.seconds * 1000 - Date.now()
        if (diff <= 0) return 'Muddati o\'tdi'
        const h = Math.floor(diff / 3600000)
        const d = Math.floor(h / 24)
        return d > 0 ? `${d} kun qoldi` : `${h} soat qoldi`
      })() : null

  const doAction = async (action) => {
    setLoading(true)
    try {
      const r = await fetch(`${API_URL}/api/offers/${item.id}/${action}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      })
      const d = await r.json()
      if (d.success) onRefresh()
      else alert(d.error || 'Xato yuz berdi')
    } catch { alert('Server bilan ulanishda xato') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #EAEEF2', opacity: isHistory ? 0.85 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{ width: 80, flexShrink: 0 }}>
          {image
            ? <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 90 }} />
            : <div style={{ width: '100%', minHeight: 90, background: '#F4F6F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#ccc' }}>📷</div>
          }
        </div>
        <div style={{ flex: 1, padding: 12, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1E2730', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{title}</p>
            <StatusBadge status={item.status} />
          </div>
          {isSeller
            ? <p style={{ margin: '3px 0 0', fontSize: 11, color: '#9AA5B4' }}>👤 {buyerName}</p>
            : <p style={{ margin: '3px 0 0', fontSize: 11, color: '#9AA5B4' }}>🏷️ Siz yuborgan taklif</p>
          }
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#E8833A' }}>{offerPrice.toLocaleString()} 🪙</span>
            {originalPrice > 0 && (
              <span style={{ fontSize: 11, color: '#9AA5B4', textDecoration: 'line-through' }}>{originalPrice.toLocaleString()}</span>
            )}
            {discount > 0 && (
              <span style={{ background: '#FEF2F2', color: '#EF4444', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 8 }}>-{discount}%</span>
            )}
          </div>
          {date && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#C8D0D8' }}>{date}</p>}
        </div>
      </div>

      {/* Yakunlangan — komissiya info */}
      {item.status === 'purchased' && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid #F4F6F8', background: '#E8F5F3', fontSize: 11, color: '#007A6B', fontWeight: 600 }}>
          ✅ Sotib olindi — Sotuvchi {Math.floor(offerPrice * 0.98).toLocaleString()} 🪙 oldi (2% komissiya: {Math.floor(offerPrice * 0.02).toLocaleString()} 🪙)
        </div>
      )}

      {/* Faol tugmalar */}
      {!isHistory && isSeller && item.status === 'pending' && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderTop: '1px solid #F4F6F8' }}>
          <ActionBtn label="❌ Rad etish" color="#EF4444" bg="#FEF2F2" onClick={() => doAction('decline')} loading={loading} />
          <ActionBtn label="✅ Qabul qilish" color="white" bg="#007A6B" onClick={() => doAction('accept')} loading={loading} />
        </div>
      )}
      {!isHistory && isSeller && item.status === 'accepted' && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid #F4F6F8', background: '#F0FAF9', fontSize: 12, color: '#007A6B', fontWeight: 600 }}>
          ⏳ Xaridor sotib olishini kutmoqda...
        </div>
      )}
      {!isHistory && !isSeller && item.status === 'accepted' && (
        <div style={{ padding: '10px 12px', borderTop: '1px solid #F4F6F8' }}>
          {deadline && (
            <div style={{ marginBottom: 8, padding: '5px 10px', background: '#FFFBEB', borderRadius: 8, fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>
              ⏱ Sotib olish muddati: {deadline}
            </div>
          )}
          <ActionBtn label="🛍️ Sotib olish" color="white" bg="#E8833A" onClick={() => doAction('buy')} loading={loading} />
        </div>
      )}
    </div>
  )
}

// ── SOTISH BUYURTMASI kartochkasi ─────────────────────────────────────
function SaleOrderCard({ item, initData, onRefresh, isHistory }) {
  const [loading, setLoading] = useState(false)
  const isSeller   = item._myRole === 'seller'
  const title      = item.itemTitle || 'Mahsulot'
  const image      = item.itemImages?.[0] || null
  const price      = item.escrowCoins || item.itemCoinPrice || 0
  const commission = Math.floor(price * 0.02)
  const sellerGets = price - commission
  const personName = isSeller ? (item.buyerName || 'Xaridor') : (item.sellerName || 'Sotuvchi')
  const date = item.createdAt?.seconds
    ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('uz-UZ') : ''

  const doAction = async (action) => {
    setLoading(true)
    try {
      const r = await fetch(`${API_URL}/api/orders/${item.id}/${action}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      })
      const d = await r.json()
      if (d.success) onRefresh()
      else alert(d.error || 'Xato yuz berdi')
    } catch { alert('Server bilan ulanishda xato') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #EAEEF2', opacity: isHistory ? 0.85 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{ width: 80, flexShrink: 0 }}>
          {image
            ? <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 90 }} />
            : <div style={{ width: '100%', minHeight: 90, background: '#F4F6F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#ccc' }}>📷</div>
          }
        </div>
        <div style={{ flex: 1, padding: 12, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1E2730', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{title}</p>
            <StatusBadge status={item.status} />
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: '#9AA5B4' }}>
            {isSeller ? `🛍️ Xaridor: ${personName}` : `🏪 Sotuvchi: ${personName}`}
          </p>
          <div style={{ marginTop: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#007A6B' }}>{price.toLocaleString()} 🪙</span>
            {item.isOfferOrder && item.itemCoinPrice && item.itemCoinPrice !== price && (
              <span style={{ marginLeft: 6, fontSize: 10, color: '#9AA5B4' }}>(asl: {item.itemCoinPrice.toLocaleString()})</span>
            )}
          </div>
          {date && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#C8D0D8' }}>{date}</p>}
        </div>
      </div>

      {/* Yakunlangan — komissiya info */}
      {item.status === 'completed' && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid #F4F6F8', background: '#E8F5F3', fontSize: 11, color: '#007A6B', fontWeight: 600 }}>
          {isSeller
            ? `✅ Sotildi — Siz ${sellerGets.toLocaleString()} 🪙 oldingiz (2% komissiya: ${commission.toLocaleString()} 🪙)`
            : `✅ Sotib olindi — ${price.toLocaleString()} 🪙 to'landi`
          }
        </div>
      )}

      {/* Faol tugmalar — sotuvchi */}
      {!isHistory && isSeller && (item.status === 'pending_seller' || item.status === 'pending') && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderTop: '1px solid #F4F6F8' }}>
          <ActionBtn label="❌ Bekor" color="#EF4444" bg="#FEF2F2" onClick={() => doAction('cancel')} loading={loading} />
          <ActionBtn label="✅ Tasdiqlash — Yuboring!" color="white" bg="#007A6B" onClick={() => doAction('confirm')} loading={loading} />
        </div>
      )}

      {/* Faol tugmalar — xaridor pending */}
      {!isHistory && !isSeller && (item.status === 'pending_seller' || item.status === 'pending') && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderTop: '1px solid #F4F6F8' }}>
          <div style={{ flex: 1, padding: '8px 10px', background: '#F0FAF9', borderRadius: 10, fontSize: 12, color: '#007A6B', fontWeight: 600 }}>
            ⏳ Sotuvchi tasdiqlashini kutmoqda...
          </div>
          <ActionBtn label="❌ Bekor" color="#EF4444" bg="#FEF2F2" onClick={() => doAction('cancel')} loading={loading} />
        </div>
      )}

      {/* Faol tugmalar — xaridor in_delivery */}
      {!isHistory && !isSeller && item.status === 'in_delivery' && (
        <div style={{ padding: '10px 12px', borderTop: '1px solid #F4F6F8' }}>
          <div style={{ marginBottom: 8, padding: '6px 10px', background: '#EFF6FF', borderRadius: 8, fontSize: 11, color: '#3B82F6', fontWeight: 600 }}>
            📦 Sotuvchi mahsulotni yo'lladi. Qabul qilganingizdan so'ng sotuvchi {sellerGets.toLocaleString()} 🪙 oladi (2% komissiya ushlanadi).
          </div>
          <ActionBtn label="✅ Qabul qildim — Coinlarni chiqar" color="white" bg="#007A6B" onClick={() => doAction('received')} loading={loading} />
        </div>
      )}
    </div>
  )
}

// ── Asosiy sahifa ─────────────────────────────────────────────────────
export default function Offers({ user, isGuest, initData, onRead }) {
  if (isGuest) {
    const { showRegister } = window.__zoyaAuth || {}
    return (
      <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', height:'80vh', textAlign:'center', padding:32, gap:16, fontFamily:"'DM Sans',sans-serif" }}>
        <p style={{ fontSize:48, margin:0 }}>🛍️</p>
        <p style={{ fontSize:17, fontWeight:700, color:'#1E2730', margin:0 }}>Takliflar</p>
        <p style={{ fontSize:14, color:'#9AA5B4', margin:0 }}>Taklif yuborish va qabul qilish uchun akkaunt kerak</p>
        <button onClick={() => showRegister?.()} style={{ padding:'13px 28px', background:'#007A6B', color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer', width:'100%' }}>
          📱 Ro'yxatdan o'tish
        </button>
      </div>
    )
  }
  const navigate  = useNavigate()
  const location  = useLocation()
  const [tab, setTab]         = useState('exchange')
  const [data, setData]       = useState({ priceOffers: [], saleOrders: [], exchanges: [], history: { priceOffers: [], saleOrders: [], exchanges: [] } })
  const [loading, setLoading] = useState(true)

  const fetchOffers = () => {
    if (!initData) return
    setLoading(true)
    fetch(`${API_URL}/api/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData })
    })
      .then(r => r.json())
      .then(d => { if (d.success) { setData(d.data); onRead?.() } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const seg = location.pathname.split('/').pop()
    if (TABS.find(t => t.key === seg)) setTab(seg)
  }, [location.pathname])

  useEffect(() => { fetchOffers() }, [initData])

  const activeItems = tab === 'exchange' ? data.exchanges
    : tab === 'sale' ? data.saleOrders
    : data.priceOffers

  const historyItems = tab === 'exchange' ? (data.history?.exchanges || [])
    : tab === 'sale' ? (data.history?.saleOrders || [])
    : (data.history?.priceOffers || [])

  const counts = {
    exchange: data.exchanges?.length  || 0,
    sale:     data.saleOrders?.length || 0,
    price:    data.priceOffers?.length || 0,
  }

  const renderCard = (item, isHistory) => {
    if (tab === 'exchange') return <ExchangeCard  key={item.id} item={item} initData={initData} onRefresh={fetchOffers} isHistory={isHistory} />
    if (tab === 'price')    return <PriceOfferCard key={item.id} item={item} initData={initData} onRefresh={fetchOffers} isHistory={isHistory} />
    if (tab === 'sale')     return <SaleOrderCard  key={item.id} item={item} initData={initData} onRefresh={fetchOffers} isHistory={isHistory} />
  }

  const emptyText = {
    exchange: 'Almashinuv takliflari bu yerda ko\'rinadi',
    sale:     'Yangi buyurtmalar bu yerda ko\'rinadi',
    price:    'Narx takliflari bu yerda ko\'rinadi',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F2F4F7', paddingBottom: 90, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* HEADER */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white', borderBottom: '1px solid #EAEEF2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 8px' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1E2730' }}>Takliflar</h2>
          {(counts.exchange + counts.sale + counts.price) > 0 && (
            <span style={{ background: '#EF4444', color: 'white', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px' }}>
              {counts.exchange + counts.sale + counts.price} yangi
            </span>
          )}
        </div>
        <div style={{ display: 'flex', padding: '0 16px 10px', gap: 8 }}>
          {TABS.map(t => {
            const active = tab === t.key
            return (
              <button key={t.key}
                onClick={() => { setTab(t.key); navigate(`/offers/${t.key}`) }}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: active ? '#007A6B' : '#F4F6F8', color: active ? 'white' : '#555',
                  fontSize: 12, fontWeight: 600,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                }}
              >
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                <span>{t.label}</span>
                {counts[t.key] > 0 && (
                  <span style={{ background: active ? 'rgba(255,255,255,0.3)' : '#EF4444', color: 'white', borderRadius: 10, fontSize: 9, fontWeight: 700, padding: '1px 5px' }}>
                    {counts[t.key]}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: 14 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div style={{ width: 32, height: 32, border: '3px solid #f3f3f3', borderTop: '3px solid #007A6B', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* FAOL */}
            {activeItems.length > 0
              ? activeItems.map(item => renderCard(item, false))
              : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                  <p style={{ fontSize: 40, margin: '0 0 10px' }}>{tab === 'exchange' ? '🔄' : tab === 'sale' ? '🛍️' : '🏷️'}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#333', margin: 0 }}>Faol taklif yo'q</p>
                  <p style={{ fontSize: 12, marginTop: 4, color: '#aaa' }}>{emptyText[tab]}</p>
                </div>
              )
            }

            {/* TARIX */}
            {historyItems.length > 0 && (
              <>
                <SectionHeader title="— Tarix —" />
                {historyItems.map(item => renderCard(item, true))}
              </>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
