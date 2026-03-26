import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTrades } from '../../hooks/useTrades'
import './Sidebar.css'

const navItems = [
  { path: '/',        label: '生涯總覽', icon: '🏆' },
  { path: '/records', label: '操作紀錄', icon: '📋' },
  { path: '/monthly', label: '月結算',   icon: '📅' },
  { path: '/yearly',  label: '年結算',   icon: '📊' },
  { path: '/calendar', label: '結算行事曆', icon: '🗓️' },
  { path: '/market',  label: '大盤行情',  icon: '📈' },
  { path: '/guide',   label: '匯入說明',  icon: '📖' },
]

export default function Sidebar() {
  const { user, signOut }          = useAuth()
  const { exportJSON, importJSON, replaceJSON } = useTrades()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">🎯</span>
        <span className="brand-name">台指損益紀錄</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* 資料備份區 */}
      <div className="storage-section">
        <div className="storage-title">資料備份</div>
        <div className="storage-row">
          <button className="storage-btn" onClick={exportJSON}>匯出 JSON</button>
          <button className="storage-btn primary" onClick={importJSON}>合併匯入</button>
        </div>
        <div className="storage-row">
          <button className="storage-btn" onClick={replaceJSON}>覆蓋匯入</button>
        </div>
      </div>

      {/* 用戶資訊 */}
      <div className="user-section">
        {user?.photoURL && (
          <img src={user.photoURL} className="user-avatar" alt="avatar" referrerPolicy="no-referrer" />
        )}
        <div className="user-info">
          <div className="user-name">{user?.displayName}</div>
          <button className="btn-signout" onClick={signOut}>登出</button>
        </div>
      </div>
    </aside>
  )
}
