import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const TABS = [
  { key: 'exchange', label: 'Almashinuv', icon: '🔄' },
  { key: 'sale',     label: 'Sotish',     icon: '🛍️' },
  { key: 'price',    label: 'Narx',       icon: '🏷️' },
]

const STATUS = {
  pending:  { label: 'Kutilmoqda', color: '#F59E0B', bg: '#FFFBEB' },
  accepted: { label: 'Qabul',      color: '#007A6B', bg: '#E8F5F3' },
  rejected: { label: 'Rad etildi', color: '#EF4444', bg: '#FEF2F2' },
  completed:{ label: 'Yakunlandi', color: '#3B82F6', bg: '#EFF6FF' },
}

// ── SWAP uchun kichik rasm + narx bloki ─────────────────────────
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

// ── Bitta taklif kartochkasi ─────────────────────────────────────
function OfferCard({ item, type }) {
  const navigate = useNavigate()
  const st = STATUS[item.status] || STATUS.pending
  const date = item.createdAt?.seconds
    ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('uz-UZ')
    : ''

  // ALMASHINUV
  if (type === 'exchange') {
    const isSender  = item._myRole === 'sender'
    const myItem    = isSender
      ? { title: item.fromItemTitle, image: item.fromItemImages?.[0], price: item.fromItemCoinValue }
      : { title: item.toItemTitle,   image: item.toItemImages?.[0],   price: item.toItemCoinValue }
    const theirItem = isSender
      ? { title: item.toItemTitle,   image: item.toItemImages?.[0],   price: item.toItemCoinValue }
      : { title: item.fromItemTitle, image: item.fromItemImages?.[0], price: item.fromItemCoinValue }
    const otherName = isSender ? item.toUserName : item.fromUserName

    return (
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #EAEEF2', padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>
            {isSender ? `${otherName} ga yuborgan` : `${otherName} dan taklif`}
          </span>
          <span style={{ background: st.bg, color: st.color, fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 20 }}>
            {st.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ItemThumb {...myItem} label="Meniki" />
          <div style={{ fontSize: 20, color: '#9AA5B4', flexShrink: 0 }}>🔄</div>
          <ItemThumb {...theirItem} label="Ularnikiː" />
        </div>

        {item.coinDifference > 0 && (
          <div style={{ marginTop: 8, padding: '6px 10px', background: '#FFFBEB', borderRadius: 8, fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>
            💰 Farq: {item.coinDifference.toLocaleString()} koin
          </div>
        )}
        {date && <p style={{ margin: '8px 0 0', fontSize: 10, color: '#C8D0D8' }}>{date}</p>}
      </div>
    )
  }

  // SOTISH / NARX
  const title     = item.itemTitle || item.title || 'Mahsulot'
  const image     = item.itemImages?.[0] || item.images?.[0] || null
  const fromName  = item.buyerName || item.fromUserName || 'Noma\'lum'
  const price     = item.offerPrice || item.itemCoinPrice || item.coinPrice || 0
  const origPrice = item.originalPrice || null

  return (
    <div onClick={() => navigate(`/listing/${item.itemId || item.id}`)}
      style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #EAEEF2', cursor: 'pointer', display: 'flex', alignItems: 'stretch' }}
    >
      <div style={{ width: 80, flexShrink: 0 }}>
        {image
          ? <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: '#F4F6F8', minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#ccc' }}>📷</div>
        }
      </div>
      <div style={{ flex: 1, padding: 12, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1E2730', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{title}</p>
          <span style={{ background: st.bg, color: st.color, fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0 }}>{st.label}</span>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9AA5B4' }}>
          {type === 'sale' ? '🛍️' : '🏷️'} {fromName}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#E8833A' }}>{price.toLocaleString()} koin</span>
          {origPrice && origPrice !== price && (
            <span style={{ fontSize: 11, color: '#9AA5B4', textDecoration: 'line-through' }}>{origPrice.toLocaleString()}</span>
          )}
        </div>
        {date && <p style={{ margin: '4px 0 0', fontSize: 10, color: '#C8D0D8' }}>{date}</p>}
      </div>
    </div>
  )
}

// ── Asosiy sahifa ────────────────────────────────────────────────
export default function Offers({ user, initData, onRead }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [tab, setTab]         = useState('exchange')
  const [data, setData]       = useState({ priceOffers: [], saleOrders: [], exchanges: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const seg = location.pathname.split('/').pop()
    if (TABS.find(t => t.key === seg)) setTab(seg)
  }, [location.pathname])

  useEffect(() => {
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
  }, [initData])

  const items = tab === 'exchange' ? data.exchanges
    : tab === 'sale' ? data.saleOrders
    : data.priceOffers

  const counts = {
    exchange: data.exchanges?.length  || 0,
    sale:     data.saleOrders?.length || 0,
    price:    data.priceOffers?.length || 0,
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

        {/* TABS */}
        <div style={{ display: 'flex', padding: '0 16px 10px', gap: 8 }}>
          {TABS.map(t => {
            const active = tab === t.key
            return (
              <button key={t.key}
                onClick={() => { setTab(t.key); navigate(`/offers/${t.key}`) }}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: active ? '#007A6B' : '#F4F6F8',
                  color: active ? 'white' : '#555',
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
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
            <p style={{ fontSize: 44, margin: '0 0 12px' }}>{tab === 'exchange' ? '🔄' : tab === 'sale' ? '🛍️' : '🏷️'}</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#333', margin: 0 }}>Hozircha taklif yo'q</p>
            <p style={{ fontSize: 13, marginTop: 6, color: '#aaa' }}>
              {tab === 'exchange' ? 'Almashinuv takliflari bu yerda ko\'rinadi'
                : tab === 'sale'  ? 'Yangi buyurtmalar bu yerda ko\'rinadi'
                : 'Narx takliflari bu yerda ko\'rinadi'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(item => <OfferCard key={item.id} item={item} type={tab} />)}
          </div>
        )}
      </div>
    </div>
  )
}
