import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTrades } from '../../hooks/useTrades'
import './TopBar.css'

export default function TopBar() {
  const { user, signOut }                       = useAuth()
  const { exportJSON, importJSON, replaceJSON } = useTrades()
  const [menuOpen, setMenuOpen]                 = useState(false)
  const menuRef                                 = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="topbar-icon">🎯</span>
        <span className="topbar-title">台指選擇權損益紀錄</span>
      </div>

      <div className="topbar-user" ref={menuRef}>
        <button className="topbar-avatar-btn" onClick={() => setMenuOpen((v) => !v)}>
          {user?.photoURL
            ? <img src={user.photoURL} className="topbar-avatar" alt="avatar" referrerPolicy="no-referrer" />
            : <span className="topbar-avatar-placeholder">👤</span>
          }
        </button>

        {menuOpen && (
          <div className="topbar-menu">
            <div className="topbar-menu-name">{user?.displayName}</div>
            <hr className="topbar-menu-divider" />
            <button className="topbar-menu-item" onClick={() => { exportJSON(); setMenuOpen(false) }}>匯出 JSON</button>
            <button className="topbar-menu-item" onClick={() => { importJSON(); setMenuOpen(false) }}>合併匯入</button>
            <button className="topbar-menu-item" onClick={() => { replaceJSON(); setMenuOpen(false) }}>覆蓋匯入</button>
            <hr className="topbar-menu-divider" />
            <button className="topbar-menu-item danger" onClick={signOut}>登出</button>
          </div>
        )}
      </div>
    </header>
  )
}
