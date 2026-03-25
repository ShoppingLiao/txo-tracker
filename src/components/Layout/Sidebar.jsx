import { NavLink } from 'react-router-dom'
import { useFileStorage } from '../../hooks/useFileStorage'
import './Sidebar.css'

const navItems = [
  { path: '/', label: '生涯總覽', icon: '🏆' },
  { path: '/records', label: '操作紀錄', icon: '📋' },
  { path: '/monthly', label: '月結算', icon: '📅' },
  { path: '/yearly', label: '年結算', icon: '📊' },
]

const STATUS_LABEL = {
  disconnected: { text: '未連結', cls: 'status-off' },
  saving:       { text: '儲存中…', cls: 'status-saving' },
  saved:        { text: '已自動儲存', cls: 'status-ok' },
  error:        { text: '儲存失敗', cls: 'status-err' },
}

export default function Sidebar() {
  const { fileName, status, isSupported, connect, createNew, disconnect, exportJSON, importJSON, replaceJSON } =
    useFileStorage()

  const st = STATUS_LABEL[status]

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">🎯</span>
        <span className="brand-name">TXO Tracker</span>
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

      {/* 資料儲存區 */}
      <div className="storage-section">
        <div className="storage-title">資料儲存</div>

        {/* 連結狀態 */}
        <div className="storage-status">
          <span className={`status-dot ${st.cls}`} />
          <span className="status-text">{fileName ?? st.text}</span>
          {fileName && (
            <button className="btn-disconnect" onClick={disconnect} title="中斷連結">✕</button>
          )}
        </div>

        {/* File System Access API（Chrome / Edge） */}
        {isSupported && (
          <div className="storage-row">
            {fileName ? (
              <div className="status-hint">{st.text}</div>
            ) : (
              <>
                <button className="storage-btn primary" onClick={connect}>
                  開啟檔案
                </button>
                <button className="storage-btn" onClick={createNew}>
                  新建檔案
                </button>
              </>
            )}
          </div>
        )}

        {/* 匯出 / 匯入（所有瀏覽器） */}
        <div className="storage-row">
          <button className="storage-btn" onClick={exportJSON}>匯出</button>
          <button className="storage-btn primary" onClick={importJSON}>合併匯入</button>
        </div>
        <div className="storage-row">
          <button className="storage-btn" onClick={replaceJSON}>覆蓋匯入</button>
        </div>

        {!isSupported && (
          <div className="storage-hint">
            自動儲存需 Chrome / Edge，<br />請使用匯出備份資料
          </div>
        )}
      </div>

      <div className="sidebar-footer">台指選擇權操作紀錄</div>
    </aside>
  )
}
