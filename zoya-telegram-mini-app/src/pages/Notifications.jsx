import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'https://miniapp-production-6b94.up.railway.app'

const ICONS = {
  '🛍️': '#FFF3E0', '✅': '#E8F5F3', '❌': '#FEF2F2',
  '📦': '#EFF6FF', '🔄': '#F3E8FF', '🏷️': '#FFFBEB',
  '🎉': '#E8F5F3',
}

function getIcon(text) {
  const icons = ['🎉','✅','❌','📦','🔄','🏷️','🛍️']
  return icons.find(i => text.includes(i)) || '🔔'
}

function timeAgo(seconds) {
  if (!seconds) return ''
  const diff = Math.floor(Date.now() / 1000) - seconds
  if (diff < 60)   return 'Hozirgina'
  if (diff < 3600) return `${Math.floor(diff/60)} daqiqa oldin`
  if (diff < 86400) return `${Math.floor(diff/3600)} soat oldin`
  return `${Math.floor(diff/86400)} kun oldin`
}

export default function Notifications({ initData }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [unreadCount, setUnreadCount]     = useState(0)

  const fetchNotifications = () => {
    if (!initData) return
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
      .finally(() => setLoading(false))
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

  return (
    <div style={{ minHeight: '100vh', background: '#F2F4F7', paddingBottom: 90, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* HEADER */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white', borderBottom: '1px solid #EAEEF2' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1E2730' }}>Bildirishnomalar</h2>
            {unreadCount > 0 && (
              <span style={{ background: '#EF4444', color: 'white', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px' }}>
                {unreadCount} yangi
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{
              background: 'none', border: 'none', color: '#007A6B',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '4px 8px'
            }}>
              Hammasini o'qildi
            </button>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: 14 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div style={{ width: 32, height: 32, border: '3px solid #f3f3f3', borderTop: '3px solid #007A6B', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: 48, margin: '0 0 12px' }}>🔔</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#333', margin: 0 }}>Bildirishnoma yo'q</p>
            <p style={{ fontSize: 13, color: '#aaa', marginTop: 6 }}>Yangi takliflar va buyurtmalar haqida xabar olasiz</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.map(n => {
              const icon    = getIcon(n.message || '')
              const bgColor = ICONS[icon] || '#F4F6F8'
              const date    = timeAgo(n.createdAt?.seconds)
              return (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markOneRead(n.id)}
                  style={{
                    background: 'white',
                    borderRadius: 14,
                    padding: '12px 14px',
                    border: `1px solid ${n.isRead ? '#EAEEF2' : '#007A6B33'}`,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    cursor: n.isRead ? 'default' : 'pointer',
                    opacity: n.isRead ? 0.85 : 1,
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: bgColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                  }}>
                    {icon}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0, fontSize: 13, lineHeight: 1.5,
                      color: n.isRead ? '#555' : '#1E2730',
                      fontWeight: n.isRead ? 400 : 500,
                    }}>
                      {n.message}
                    </p>
                    {date && (
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#C8D0D8' }}>{date}</p>
                    )}
                  </div>

                  {/* O'qilmagan nuqta */}
                  {!n.isRead && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#007A6B', flexShrink: 0, marginTop: 4,
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
