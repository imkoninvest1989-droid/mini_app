import { Link, useLocation } from 'react-router-dom'

const NAV = [
  { path: '/',         label: 'Bosh',     icon: '🏠' },
  { path: '/my-listings', label: 'Mening', icon: '📋' },
  { path: '/post',     label: 'E\'lon',   icon: '➕', center: true },
  { path: '/offers',   label: 'Takliflar', icon: '🔔' },
  { path: '/profile',  label: 'Profil',   icon: '👤' },
]

export default function Navigation({ offerCount = 0 }) {
  const location = useLocation()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'white', borderTop: '1px solid #EAEEF2',
      zIndex: 50, boxShadow: '0 -2px 12px rgba(0,0,0,0.07)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-around',
        padding: '6px 0 8px',
      }}>
        {NAV.map(item => {
          const isActive = location.pathname === item.path ||
            (item.path === '/offers' && location.pathname.startsWith('/offers'))
          const showBadge = item.path === '/offers' && offerCount > 0

          return (
            <Link key={item.path} to={item.path} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '4px 2px', textDecoration: 'none',
              color: isActive ? '#007A6B' : '#9AA5B4',
              position: 'relative',
              borderTop: `2px solid ${isActive ? '#007A6B' : 'transparent'}`,
              transition: 'color 0.2s',
            }}>
              {/* Markaziy "+" tugma alohida stil */}
              {item.center ? (
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#1A7A58,#0A3D2E)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: 'white',
                  boxShadow: '0 3px 10px rgba(10,61,46,0.3)',
                  marginTop: -16,
                }}>➕</div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  {showBadge && (
                    <span style={{
                      position: 'absolute', top: -4, right: -6,
                      background: '#EF4444', color: 'white',
                      borderRadius: 20, minWidth: 16, height: 16,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, padding: '0 3px',
                      border: '1.5px solid white',
                    }}>
                      {offerCount > 9 ? '9+' : offerCount}
                    </span>
                  )}
                </div>
              )}
              <span style={{
                fontSize: 10, fontWeight: isActive ? 600 : 500,
                marginTop: item.center ? 2 : 3, whiteSpace: 'nowrap',
              }}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
