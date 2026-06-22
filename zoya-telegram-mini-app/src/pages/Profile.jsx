import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// ── COIN PAKETLARI ─────────────────────────────────────────────────
const PACKAGES = [
  { coins: 10000,  bonus: 0,    price: 10000,  label: '10 000'  },
  { coins: 25000,  bonus: 1000, price: 25000,  label: '25 000'  },
  { coins: 50000,  bonus: 3000, price: 50000,  label: '50 000'  },
  { coins: 100000, bonus: 8000, price: 100000, label: '100 000' },
]
const CARD_NUMBER   = '5614681004895458'
const TG_USERNAME   = 'zoya_coin_tulov'

function BuyCoinsModal({ user, initData, onClose }) {
  const [selected, setSelected]   = useState(1)
  const [loading, setLoading]     = useState(false)
  const [copied, setCopied]       = useState(false)
  const [success, setSuccess]     = useState(false)
  const pkg = PACKAGES[selected]
  const totalCoins = pkg.coins + pkg.bonus

  const copyCard = () => {
    navigator.clipboard?.writeText(CARD_NUMBER)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const sendReceipt = async () => {
    setLoading(true)
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'https://miniapp-production-6b94.up.railway.app'}/api/coin-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, coins: pkg.coins, bonus: pkg.bonus, price: pkg.price }),
      })
      const msg = encodeURIComponent(
        `💳 Coin so'rov\n\n👤 ${user.fullName} (${user.zoyaId || ''})\n🪙 Coin: ${pkg.coins}${pkg.bonus ? ` +${pkg.bonus} bonus` : ''}\n💰 Summa: ${pkg.price.toLocaleString()} so'm\n\n✅ To'lov cheki:`
      )
      window.Telegram?.WebApp?.openTelegramLink(`https://t.me/${TG_USERNAME}?text=${msg}`)
      setSuccess(true)
    } catch (e) {
      alert('Xato: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const fmt = n => n.toLocaleString()

  if (success) return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 20px' }}>
      <div style={{ background:'white',borderRadius:20,padding:28,textAlign:'center',maxWidth:320,width:'100%' }}>
        <div style={{ fontSize:52,marginBottom:12 }}>🪙</div>
        <p style={{ fontSize:18,fontWeight:800,color:'#1E2730',margin:'0 0 8px' }}>So'rov yuborildi!</p>
        <p style={{ fontSize:13,color:'#9AA5B4',lineHeight:1.5,margin:'0 0 20px' }}>
          To'lov chekini Telegramga yuboring. Adminlar 24 soat ichida coinlarni qo'shadi.
        </p>
        <div style={{ background:'#E8F5F3',borderRadius:12,padding:'10px 14px',marginBottom:20,fontSize:12,color:'#007A6B',fontWeight:600 }}>
          ⏰ 24 soat ichida {fmt(totalCoins)} 🪙 balansingizga o'tkaziladi
        </div>
        <button onClick={onClose} style={{ width:'100%',padding:'13px',background:'#007A6B',color:'white',border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer' }}>
          Yaxshi
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'flex-end' }}>
      <div style={{ background:'white',borderRadius:'20px 20px 0 0',width:'100%',maxHeight:'92vh',overflowY:'auto',paddingBottom:24 }}>
        {/* Header */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px 12px',borderBottom:'1px solid #F1F4F6',position:'sticky',top:0,background:'white',zIndex:1 }}>
          <p style={{ margin:0,fontSize:16,fontWeight:700,color:'#1E2730' }}>🪙 Coin sotib olish</p>
          <button onClick={onClose} style={{ background:'#F4F6F8',border:'none',borderRadius:50,width:30,height:30,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
        </div>

        <div style={{ padding:'14px 16px' }}>

          {/* Tushuntirish */}
          <div style={{ background:'#F0FAF5',borderRadius:12,padding:'10px 14px',marginBottom:16,fontSize:12,color:'#007A6B',display:'flex',gap:8 }}>
            <span>💡</span>
            <span>Coinlar platformada kiyim sotib olish va almashinuv uchun ishlatiladi. 1 koin = 1 so'm.</span>
          </div>

          {/* Paketlar */}
          <p style={{ fontSize:11,fontWeight:700,color:'#9AA5B4',letterSpacing:'0.5px',margin:'0 0 10px' }}>PAKETNI TANLANG</p>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16 }}>
            {PACKAGES.map((p, i) => {
              const active = selected === i
              return (
                <div key={i} onClick={() => setSelected(i)} style={{
                  border: active ? '2px solid #007A6B' : '1.5px solid #EAEEF2',
                  borderRadius:14, padding:'12px 10px', cursor:'pointer',
                  background: active ? '#F0FAF5' : 'white', position:'relative', textAlign:'center',
                }}>
                  {p.bonus > 0 && (
                    <div style={{ position:'absolute',top:6,right:6,background:'#EF4444',color:'white',fontSize:9,fontWeight:700,borderRadius:20,padding:'2px 6px' }}>
                      +{p.bonus.toLocaleString()}
                    </div>
                  )}
                  <div style={{ fontSize:24,marginBottom:4 }}>🪙</div>
                  <div style={{ fontSize:15,fontWeight:900,color: active ? '#007A6B' : '#1E2730' }}>{p.label}</div>
                  <div style={{ fontSize:11,color: active ? '#007A6B' : '#9AA5B4',marginTop:2 }}>{fmt(p.price)} so'm</div>
                </div>
              )
            })}
          </div>

          {/* Jami */}
          <div style={{ background:'linear-gradient(135deg,#FFF8E1,#FFF3CD)',borderRadius:14,padding:'14px 16px',marginBottom:16 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom: pkg.bonus ? 8 : 0 }}>
              <span style={{ fontSize:13,color:'#9AA5B4' }}>Coin miqdori</span>
              <span style={{ fontSize:18,fontWeight:900,color:'#FFB300' }}>{fmt(totalCoins)} 🪙</span>
            </div>
            {pkg.bonus > 0 && (
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
                <span style={{ fontSize:12,color:'#4CAF50' }}>Bonus:</span>
                <span style={{ fontSize:12,fontWeight:700,color:'#4CAF50' }}>+{fmt(pkg.bonus)} 🪙</span>
              </div>
            )}
            <div style={{ height:1,background:'#E0E0E0',margin:'8px 0' }} />
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <span style={{ fontSize:13,fontWeight:700,color:'#1E2730' }}>To'lov summasi</span>
              <span style={{ fontSize:17,fontWeight:900,color:'#1E2730' }}>{fmt(pkg.price)} so'm</span>
            </div>
          </div>

          {/* Karta */}
          <p style={{ fontSize:11,fontWeight:700,color:'#9AA5B4',letterSpacing:'0.5px',margin:'0 0 10px' }}>TO'LOV KARTASI</p>
          <div style={{ background:'white',borderRadius:14,border:'1px solid #EAEEF2',overflow:'hidden',marginBottom:16 }}>
            <div style={{ background:'linear-gradient(135deg,#1B5E20,#2E7D32,#43A047)',padding:'18px 20px' }}>
              <div style={{ fontSize:26,marginBottom:10 }}>💳</div>
              <div style={{ fontSize:20,fontWeight:800,color:'white',letterSpacing:2 }}>{CARD_NUMBER}</div>
              <div style={{ fontSize:11,color:'rgba(255,255,255,0.7)',marginTop:6,letterSpacing:1 }}>ZOYA Pay</div>
            </div>
            <button onClick={copyCard} style={{
              width:'100%',padding:'12px',background:'white',border:'none',
              color:'#007A6B',fontSize:13,fontWeight:700,cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:6,
            }}>
              {copied ? '✓ Nusxalandi!' : '⎘ Karta raqamini nusxalash'}
            </button>
          </div>

          {/* Qadamlar */}
          <div style={{ background:'white',borderRadius:14,border:'1px solid #EAEEF2',padding:'14px 16px',marginBottom:16 }}>
            {[
              `Yuqoridagi kartaga ${fmt(pkg.price)} so'm o'tkazing`,
              "To'lov chekini (screenshot) saqlang",
              'Quyidagi tugmani bosib chekni Telegramga yuboring',
            ].map((text, i) => (
              <div key={i} style={{ display:'flex',gap:10,marginBottom: i < 2 ? 12 : 0 }}>
                <div style={{ width:24,height:24,borderRadius:'50%',background:'#007A6B',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:11,fontWeight:800,flexShrink:0 }}>{i+1}</div>
                <p style={{ margin:0,fontSize:12,color:'#555',lineHeight:1.5 }}>{text}</p>
              </div>
            ))}
          </div>

          {/* Tugma */}
          <button onClick={sendReceipt} disabled={loading} style={{
            width:'100%',padding:'15px',background: loading ? '#ccc' : '#007A6B',
            color:'white',border:'none',borderRadius:14,
            fontSize:15,fontWeight:700,cursor: loading ? 'not-allowed' : 'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',gap:8,
          }}>
            {loading ? '⏳ Yuborilmoqda...' : '✈️ Chekni Telegramga yuborish'}
          </button>
        </div>
      </div>
    </div>
  )
}

const API_URL = import.meta.env.VITE_API_URL || 'https://miniapp-production-6b94.up.railway.app'

const LANGS = [
  { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский',   flag: '🇷🇺' },
  { code: 'en', label: 'English',   flag: '🇬🇧' },
]

export default function Profile({ user, isGuest, initData }) {
  if (isGuest) {
    const { showRegister } = window.__zoyaAuth || {}
    return (
      <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', height:'80vh', textAlign:'center', padding:32, gap:16, fontFamily:"'DM Sans',sans-serif" }}>
        <p style={{ fontSize:48, margin:0 }}>👤</p>
        <p style={{ fontSize:17, fontWeight:700, color:'#1E2730', margin:0 }}>Profil</p>
        <p style={{ fontSize:14, color:'#9AA5B4', margin:0 }}>Profilni ko'rish uchun akkaunt kerak</p>
        <button onClick={() => showRegister?.()} style={{ padding:'13px 28px', background:'#007A6B', color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer', width:'100%' }}>
          📱 Ro'yxatdan o'tish
        </button>
      </div>
    )
  }
  const navigate = useNavigate()
  const [lang, setLang] = useState(user?.preferences?.language || 'uz')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [copied, setCopied] = useState(false)
  const [offerCounts, setOfferCounts] = useState({ exchange: 0, sale: 0, price: 0 })
  const [showBuyCoins, setShowBuyCoins]       = useState(false)
  const [notifications, setNotifications]     = useState([])
  const [notifLoading, setNotifLoading]       = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount]         = useState(0)

  // ── Bildirishnomalarni yuklash ──────────────────────────────────
  const fetchNotifications = () => {
    if (!initData) return
    setNotifLoading(true)
    fetch(`${API_URL}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData })
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setNotifications(d.notifications || [])
          setUnreadCount(d.unreadCount || 0)
        }
      })
      .catch(() => {})
      .finally(() => setNotifLoading(false))
  }

  const markAllRead = async () => {
    await fetch(`${API_URL}/api/notifications/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData })
    }).catch(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const markOneRead = async (id) => {
    await fetch(`${API_URL}/api/notifications/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, notificationId: id })
    }).catch(() => {})
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  useEffect(() => { fetchNotifications() }, [initData])

  // ── Takliflarni yuklash ──────────────────────────────────────
  useEffect(() => {
    if (!initData) return
    fetch(`${API_URL}/api/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData })
    })
      .then(r => r.json())
      .then(data => { if (data.success) setOfferCounts(data.counts) })
      .catch(() => {})
  }, [initData])

  if (!user) return null

  const coins     = user.balance?.coins        ?? 0
  const exchanges = user.stats?.totalExchanges  ?? 0
  const sales     = user.stats?.totalSales      ?? 0
  const purchases = user.stats?.totalPurchases  ?? 0
  const rating    = user.stats?.rating          ?? 0
  const reviews   = user.stats?.totalReviews    ?? 0
  const zoyaId    = user.zoyaId || 'Z-00000'
  const initials  = (user.fullName || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const currentLang = LANGS.find(l => l.code === lang) || LANGS[0]

  const copyZoyaId = () => {
    navigator.clipboard?.writeText(zoyaId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const changeLang = async (code) => {
    setLang(code)
    setShowLangPicker(false)
    try {
      await fetch(`${API_URL}/api/user-profile/language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, language: code })
      })
    } catch { }
  }

  const S = {
    page: {
      minHeight: '100vh', background: '#F2F4F7',
      paddingBottom: 90, fontFamily: "'DM Sans','Segoe UI',sans-serif",
    },
    // ── HERO ──────────────────────────────────────────────────────
    hero: {
      background: 'linear-gradient(150deg,#0A3D2E 0%,#1A7A58 100%)',
      padding: '20px 20px 18px', position: 'relative', overflow: 'hidden',
    },
    heroDeco1: {
      position:'absolute',top:-30,right:-30,width:110,height:110,
      borderRadius:'50%',background:'rgba(255,255,255,0.04)',pointerEvents:'none'
    },
    heroDeco2: {
      position:'absolute',bottom:-15,left:-15,width:70,height:70,
      borderRadius:'50%',background:'rgba(255,255,255,0.03)',pointerEvents:'none'
    },
    heroInner: { display:'flex', alignItems:'center', gap:14 },
    avatar: {
      width:56, height:56, borderRadius:'50%', flexShrink:0,
      background:'linear-gradient(135deg,#F4A942,#E8833A)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:20, fontWeight:700, color:'white',
      boxShadow:'0 3px 12px rgba(0,0,0,0.25)',
      border:'2.5px solid rgba(255,255,255,0.18)',
      overflow:'hidden',
    },
    heroRight: { flex:1, minWidth:0 },
    heroName: { margin:0, color:'white', fontSize:17, fontWeight:700, lineHeight:1.2 },
    zoyaBtn: {
      display:'inline-flex', alignItems:'center', gap:5,
      background:'rgba(255,255,255,0.12)', border:'none', borderRadius:20,
      padding:'3px 10px', marginTop:5,
      color:'rgba(255,255,255,0.75)', fontSize:11, fontWeight:600,
      cursor:'pointer', letterSpacing:'0.4px',
    },
    balanceRow: { marginTop:12, display:'flex', gap:8 },
    balanceCard: {
      flex:1, background:'rgba(255,255,255,0.1)',
      borderRadius:12, padding:'10px 12px',
      border:'1px solid rgba(255,255,255,0.1)',
    },
    balanceLabel: { fontSize:10, color:'rgba(255,255,255,0.55)', fontWeight:600, letterSpacing:'0.5px' },
    balanceVal: { fontSize:20, fontWeight:800, color:'white', lineHeight:1.1, marginTop:2 },
    balanceSub: { fontSize:9, color:'#F4A942', marginTop:2 },
    // ── CARD ──────────────────────────────────────────────────────
    card: {
      background:'white', borderRadius:16, margin:'12px 14px 0',
      padding:'14px 16px', boxShadow:'0 1px 8px rgba(0,0,0,0.06)',
    },
    sectionTitle: {
      fontSize:10, fontWeight:700, color:'#9AA5B4',
      letterSpacing:'0.8px', marginBottom:12,
    },
    // ── STAT GRID ─────────────────────────────────────────────────
    statGrid: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 },
    statBox: {
      background:'#F8FAFB', borderRadius:10,
      padding:'10px 6px', textAlign:'center',
    },
    statIcon: { fontSize:18 },
    statVal: { fontSize:18, fontWeight:800, lineHeight:1.1, marginTop:3 },
    statLabel: { fontSize:9, color:'#9AA5B4', fontWeight:600, marginTop:2 },
    ratingRow: {
      marginTop:10, padding:'8px 12px', background:'#FFFBF0',
      borderRadius:10, display:'flex', alignItems:'center',
      justifyContent:'space-between', border:'1px solid #FFE9A0',
    },
    // ── OFFER ROW ─────────────────────────────────────────────────
    offerRow: {
      width:'100%', background:'none', border:'none',
      padding:'10px 0', cursor:'pointer', textAlign:'left',
      display:'flex', alignItems:'center', gap:10,
      borderBottom:'1px solid #F1F4F6',
    },
    offerIcon: {
      width:36, height:36, borderRadius:10,
      display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0,
    },
    badge: {
      background:'#EF4444', color:'white', borderRadius:20,
      minWidth:20, height:20, display:'flex', alignItems:'center',
      justifyContent:'center', fontSize:10, fontWeight:700, padding:'0 5px',
    },
    // ── APP BANNER ────────────────────────────────────────────────
    appBanner: {
      background:'linear-gradient(135deg,#1A7A58,#0F5C42)',
      borderRadius:14, margin:'12px 14px 0',
      padding:'12px 16px', display:'flex',
      alignItems:'center', justifyContent:'space-between',
      boxShadow:'0 3px 12px rgba(10,61,46,0.15)',
    },
    appBtn: {
      background:'white', color:'#0A3D2E',
      padding:'7px 14px', borderRadius:9,
      fontSize:12, fontWeight:700, textDecoration:'none',
      whiteSpace:'nowrap',
    },
  }

  return (
    <div style={S.page}>
      {showBuyCoins && <BuyCoinsModal user={user} initData={initData} onClose={() => setShowBuyCoins(false)} />}

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div style={S.hero}>
        <div style={S.heroDeco1} /><div style={S.heroDeco2} />
        <div style={S.heroInner}>
          <div style={S.avatar}>
            {user.avatar
              ? <img src={user.avatar} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" />
              : initials}
          </div>
          <div style={S.heroRight}>
            <p style={S.heroName}>{user.fullName}</p>
            <button onClick={copyZoyaId} style={S.zoyaBtn}>
              {zoyaId} {copied ? '✓' : '⎘'}
            </button>
          </div>
        </div>
        <div style={S.balanceRow}>
          <div style={S.balanceCard}>
            <div style={S.balanceLabel}>KOIN</div>
            <div style={S.balanceVal}>{coins.toLocaleString()}</div>
            <div style={S.balanceSub}>🪙 Asosiy balans</div>
            <button onClick={() => setShowBuyCoins(true)} style={{
              marginTop:8, background:'rgba(255,255,255,0.18)', border:'none',
              borderRadius:8, padding:'5px 10px', color:'white',
              fontSize:10, fontWeight:700, cursor:'pointer', width:'100%',
            }}>+ Coin sotib olish</button>
          </div>
          <div style={{...S.balanceCard, flex:'none', minWidth:120}}>
            <div style={S.balanceLabel}>REYTING</div>
            <div style={S.balanceVal}>{rating}<span style={{fontSize:13,fontWeight:500,color:'rgba(255,255,255,0.5)'}}>/5</span></div>
            <div style={{...S.balanceSub, color:'#FFD700'}}>⭐ {reviews} sharh</div>
          </div>
        </div>
      </div>

      {/* ── ILOVANI YUKLAB OLISH ────────────────────────────────── */}
      <div style={S.appBanner}>
        <div>
          <div style={{color:'white',fontWeight:700,fontSize:13}}>📱 ZOYA Ilovasi</div>
          <div style={{color:'rgba(255,255,255,0.6)',fontSize:11,marginTop:2}}>To'liq imkoniyatlar uchun</div>
        </div>
        <a href="https://play.google.com/store" target="_blank" rel="noreferrer" style={S.appBtn}>
          Yuklab olish ↗
        </a>
      </div>

      {/* ── STATISTIKA ──────────────────────────────────────────── */}
      <div style={S.card}>
        <div style={S.sectionTitle}>STATISTIKA</div>
        <div style={S.statGrid}>
          {[
            { icon:'🔄', label:'Almashinuv', value:exchanges, color:'#0F5C42' },
            { icon:'🛍️', label:'Sotish',     value:sales,     color:'#E8833A' },
            { icon:'🛒', label:'Xarid',      value:purchases, color:'#3B82F6' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} style={S.statBox}>
              <div style={S.statIcon}>{icon}</div>
              <div style={{...S.statVal, color}}>{value}</div>
              <div style={S.statLabel}>{label}</div>
            </div>
          ))}
        </div>
        <div style={S.ratingRow}>
          <span style={{fontSize:13,fontWeight:600,color:'#555'}}>⭐ Reyting</span>
          <span style={{fontSize:15,fontWeight:800,color:'#E8833A'}}>
            {rating} <span style={{fontSize:11,color:'#9AA5B4',fontWeight:500}}>/ 5 · {reviews} sharh</span>
          </span>
        </div>
      </div>

      {/* ── TAKLIFLAR ───────────────────────────────────────────── */}
      <div style={S.card}>
        <div style={S.sectionTitle}>TAKLIFLAR</div>
        {[
          { icon:'🔄', title:'Almashinuv takliflari', sub:'Kiyim almashmoqchi',      count:offerCounts.exchange, accent:'#0F5C42', path:'/offers/exchange' },
          { icon:'💰', title:'Sotish takliflari',      sub:'Narx takliflari kelgan', count:offerCounts.sale,     accent:'#E8833A', path:'/offers/sale'     },
          { icon:'🏷️', title:'Yangi narx takliflari', sub:'Chegirma so\'ragan',      count:offerCounts.price,    accent:'#3B82F6', path:'/offers/price'    },
        ].map(({ icon, title, sub, count, accent, path }, i, arr) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{...S.offerRow, borderBottom: i === arr.length-1 ? 'none' : '1px solid #F1F4F6'}}
          >
            <div style={{...S.offerIcon, background: accent + '18'}}>
              {icon}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:'#1E2730'}}>{title}</div>
              <div style={{fontSize:11,color:'#9AA5B4',marginTop:2}}>{sub}</div>
            </div>
            {count > 0
              ? <div style={S.badge}>{count}</div>
              : <span style={{color:'#D1D9E0',fontSize:16}}>›</span>
            }
          </button>
        ))}
      </div>

      {/* ── E'LONLARIM ──────────────────────────────────────────── */}
      <div style={{...S.card, padding:'0'}}>
        <button
          onClick={() => navigate('/my-listings')}
          style={{
            width:'100%', background:'none', border:'none',
            padding:'14px 16px', cursor:'pointer', borderRadius:16,
            display:'flex', alignItems:'center', gap:12,
          }}
        >
          <div style={{
            width:36,height:36,borderRadius:10,
            background:'#F0FAF5',display:'flex',
            alignItems:'center',justifyContent:'center',fontSize:18,
          }}>📋</div>
          <span style={{fontSize:13,fontWeight:600,color:'#1E2730',flex:1,textAlign:'left'}}>
            Mening e'lonlarim
          </span>
          <span style={{color:'#D1D9E0',fontSize:18}}>›</span>
        </button>
      </div>

      {/* ── TIL ─────────────────────────────────────────────────── */}
      <div style={S.card}>
        <button
          onClick={() => setShowLangPicker(p => !p)}
          style={{
            width:'100%', background:'none', border:'none', padding:0,
            cursor:'pointer', display:'flex', alignItems:'center', gap:12,
          }}
        >
          <div style={{
            width:36,height:36,borderRadius:10,
            background:'#F4F6F8',display:'flex',
            alignItems:'center',justifyContent:'center',fontSize:18,
          }}>🌐</div>
          <div style={{flex:1,textAlign:'left'}}>
            <div style={{fontSize:13,fontWeight:600,color:'#1E2730'}}>Til</div>
            <div style={{fontSize:11,color:'#9AA5B4',marginTop:1}}>
              {currentLang.flag} {currentLang.label}
            </div>
          </div>
          <span style={{
            color:'#C8D0D8', fontSize:16,
            display:'inline-block',
            transform: showLangPicker ? 'rotate(90deg)' : 'none',
            transition:'transform 0.2s',
          }}>›</span>
        </button>

        {showLangPicker && (
          <div style={{borderTop:'1px solid #F1F4F6', marginTop:10, paddingTop:6}}>
            {LANGS.map(l => (
              <button key={l.code} onClick={() => changeLang(l.code)} style={{
                width:'100%', background: lang===l.code ? '#F0FAF5' : 'none',
                border:'none', padding:'9px 10px', cursor:'pointer',
                borderRadius:10, display:'flex', alignItems:'center', gap:10, marginBottom:2,
              }}>
                <span style={{fontSize:18}}>{l.flag}</span>
                <span style={{fontSize:13,fontWeight:lang===l.code?700:500,color:lang===l.code?'#0F5C42':'#333'}}>
                  {l.label}
                </span>
                {lang===l.code && <span style={{marginLeft:'auto',color:'#0F5C42'}}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── BILDIRISHNOMALAR ── */}
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) fetchNotifications() }}
          style={{
            width: '100%', padding: '12px 16px', background: 'white',
            border: '1px solid #EAEEF2', borderRadius: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔔</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1E2730' }}>Bildirishnomalar</span>
            {unreadCount > 0 && (
              <span style={{ background: '#EF4444', color: 'white', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px' }}>
                {unreadCount} yangi
              </span>
            )}
          </div>
          <span style={{ color: '#9AA5B4', fontSize: 16 }}>{showNotifications ? '▲' : '▼'}</span>
        </button>

        {showNotifications && (
          <div style={{ background: 'white', borderRadius: '0 0 14px 14px', border: '1px solid #EAEEF2', borderTop: 'none', overflow: 'hidden' }}>
            {unreadCount > 0 && (
              <div style={{ padding: '8px 14px', borderBottom: '1px solid #F4F6F8', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#007A6B', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Hammasini o'qildi ✓
                </button>
              </div>
            )}
            {notifLoading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#9AA5B4', fontSize: 13 }}>Yuklanmoqda...</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <p style={{ fontSize: 28, margin: '0 0 8px' }}>🔔</p>
                <p style={{ fontSize: 13, color: '#9AA5B4', margin: 0 }}>Bildirishnoma yo'q</p>
              </div>
            ) : (
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {notifications.map(n => {
                  const icons = ['🎉','✅','❌','📦','🔄','🏷️','🛍️']
                  const icon  = icons.find(i => (n.message||'').includes(i)) || '🔔'
                  const secs  = n.createdAt?.seconds
                  const diff  = secs ? Math.floor(Date.now()/1000) - secs : 0
                  const ago   = diff < 60 ? 'Hozirgina'
                    : diff < 3600 ? `${Math.floor(diff/60)} daq oldin`
                    : diff < 86400 ? `${Math.floor(diff/3600)} soat oldin`
                    : `${Math.floor(diff/86400)} kun oldin`
                  return (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && markOneRead(n.id)}
                      style={{
                        padding: '11px 14px',
                        borderBottom: '1px solid #F4F6F8',
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                        background: n.isRead ? 'white' : '#F0FAF9',
                        cursor: n.isRead ? 'default' : 'pointer',
                      }}
                    >
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: n.isRead ? '#666' : '#1E2730', fontWeight: n.isRead ? 400 : 500 }}>
                          {n.message}
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: 10, color: '#C8D0D8' }}>{ago}</p>
                      </div>
                      {!n.isRead && (
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#007A6B', flexShrink: 0, marginTop: 4 }} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{textAlign:'center',padding:'16px 0 4px',color:'#C8D0D8',fontSize:10}}>
        @Zoya_app_bot · v1.0
      </div>
    </div>
  )
}
