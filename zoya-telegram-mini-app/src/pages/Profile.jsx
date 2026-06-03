import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const LANGS = [
  { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский',   flag: '🇷🇺' },
  { code: 'en', label: 'English',   flag: '🇬🇧' },
]

export default function Profile({ user, initData }) {
  const navigate = useNavigate()
  const [lang, setLang] = useState(user?.preferences?.language || 'uz')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [copied, setCopied] = useState(false)
  const [offerCounts, setOfferCounts] = useState({ exchange: 0, sale: 0, price: 0 })

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

      <div style={{textAlign:'center',padding:'16px 0 4px',color:'#C8D0D8',fontSize:10}}>
        @Zoya_app_bot · v1.0
      </div>
    </div>
  )
}
