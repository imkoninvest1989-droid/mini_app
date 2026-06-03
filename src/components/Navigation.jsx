import { Link, useLocation } from 'react-router-dom'

export default function Navigation() {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Bosh', icon: '🏠' },
    { path: '/my-listings', label: 'Mening', icon: '📋' },
    { path: '/post', label: 'Elon', icon: '➕' },
    { path: '/profile', label: 'Profil', icon: '👤' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="flex justify-around">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center py-3 px-4 flex-1 text-center transition-colors ${
              location.pathname === item.path
                ? 'text-teal-600 border-t-2 border-teal-600'
                : 'text-gray-600 hover:text-teal-500'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}