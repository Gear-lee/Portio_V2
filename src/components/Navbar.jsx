import { Link, useLocation } from 'react-router-dom'

const navItems = [
  {
    label: 'Explore',
    path: '/explore',
    icon: (
      <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7" />
    ),
  },
  {
    label: 'Project',
    path: '/dashboard',
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  {
    label: 'Create',
    path: '/create',
    icon: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  },
]

function Navbar() {
  const location = useLocation()

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#0b071e]/95 backdrop-blur-xl border-t border-white/[0.06] px-4 pt-2 pb-3 flex justify-around items-center z-50">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
              isActive ? '' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span
              className={`flex items-center justify-center w-12 h-8 rounded-full transition-all duration-200 ${
                isActive ? 'bg-pink-500/15 text-pink-400' : ''
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {item.icon}
              </svg>
            </span>
            <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-pink-400' : ''}`}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

export default Navbar
