import { NavLink, useLocation } from 'react-router-dom'
import './BottomNav.css'

const PNL_PATHS = new Set(['/', '/records', '/monthly', '/yearly', '/pnl'])

export default function BottomNav() {
  const { pathname } = useLocation()
  const pnlActive = PNL_PATHS.has(pathname)

  return (
    <nav className="bottom-nav">
      <NavLink
        to="/pnl"
        className={`bnav-item ${pnlActive ? 'active' : ''}`}
      >
        <span className="bnav-icon">💹</span>
        <span className="bnav-label">損益</span>
      </NavLink>

      <NavLink to="/calendar" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`}>
        <span className="bnav-icon">🗓️</span>
        <span className="bnav-label">行事曆</span>
      </NavLink>

      <NavLink to="/market" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`}>
        <span className="bnav-icon">📈</span>
        <span className="bnav-label">大盤</span>
      </NavLink>

      <NavLink to="/predictor" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`}>
        <span className="bnav-icon">🎯</span>
        <span className="bnav-label">預測</span>
      </NavLink>

      <NavLink to="/guide" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`}>
        <span className="bnav-icon">📖</span>
        <span className="bnav-label">說明</span>
      </NavLink>
    </nav>
  )
}
