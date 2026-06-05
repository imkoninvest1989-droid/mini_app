import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home({ user }) {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    console.log('🔄 Home.jsx mounted - fetching listings...')
    
    const fetchListings = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/listings')
        
        console.log('📡 Response status:', response.status)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        console.log('✅ Data received:', data)

        if (data.success && data.listings) {
          console.log('📊 Setting listings:', data.listings.length)
          setListings(data.listings)
          setError(null)
        } else {
          console.error('❌ Invalid response structure')
          setError('Data structure xatosi')
        }
      } catch (err) {
        console.error('❌ Fetch error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [])

  console.log('🎨 Render - loading:', loading, 'listings:', listings.length, 'error:', error)

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', marginTop: '40px' }}>
        ⏳ Elonlar yuklanmoqda...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#d32f2f', marginTop: '40px' }}>
        ❌ Xato: {error}
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', marginBottom: '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <img
          src="/logo.jpg"
          alt="ZOYA"
          style={{ height: 42, objectFit: 'contain' }}
        />
        <p style={{ fontSize: 13, color: '#555', margin: 0, fontWeight: 500 }}>
          Salom, {user.fullName}! 👋
        </p>
      </div>

      {listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
          <p style={{ fontSize: '48px', margin: 0 }}>📭</p>
          <p>Hech qanday elon yo'q</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {listings.map(item => (
            <div
              key={item.id}
              onClick={() => navigate(`/listing/${item.id}`)}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: '#fff'
              }}
            >
              {item.images && item.images[0] ? (
                <img
                  src={item.images[0]}
                  alt={item.title}
                  style={{
                    width: '100%',
                    height: '140px',
                    objectFit: 'cover',
                    backgroundColor: '#f5f5f5'
                  }}
                  onError={(e) => {
                    console.error('Image error:', e)
                    e.target.src = 'https://via.placeholder.com/140'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '140px',
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999'
                }}>
                  📷
                </div>
              )}

              <div style={{ padding: '10px' }}>
                <h3 style={{
                  fontSize: '13px',
                  margin: '0 0 6px',
                  color: '#333',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: '#FF8C00',
                  margin: '5px 0'
                }}>
                  💰 {item.coinPrice} koin
                </p>
                <p style={{
                  fontSize: '11px',
                  color: '#999',
                  margin: 0
                }}>
                  {item.size} • {item.condition}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}