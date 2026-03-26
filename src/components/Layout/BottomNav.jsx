import { NavLink } from 'react-router-dom'
import './BottomNav.css'

const navItems = [
  { path: '/',        label: '生涯',   icon: '🏆' },
  { path: '/records', label: '紀錄',   icon: '📋' },
  { path: '/monthly', label: '月結算', icon: '📅' },
  { path: '/yearly',  label: '年結算', icon: '📊' },
  { path: '/calendar', label: '行事曆', icon: '🗓️' },
  { path: '/guide',   label: '說明',   icon: '📖' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`}
        >
          <span className="bnav-icon">{item.icon}</span>
          <span className="bnav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
