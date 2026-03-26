import { useNavigate } from 'react-router-dom'
import './PnLHub.css'

const items = [
  { path: '/',        icon: '🏆', label: '生涯總覽', desc: '歷年累計損益與勝率' },
  { path: '/records', icon: '📋', label: '操作紀錄', desc: '每筆交易明細' },
  { path: '/monthly', icon: '📅', label: '月結算',   desc: '各月損益統計' },
  { path: '/yearly',  icon: '📊', label: '年結算',   desc: '全年度彙整報表' },
]

export default function PnLHub() {
  const navigate = useNavigate()

  return (
    <div className="hub-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">損益紀錄</h1>
          <p className="page-subtitle">選擇要查看的報表</p>
        </div>
      </div>

      <div className="hub-grid">
        {items.map((item) => (
          <button key={item.path} className="hub-card" onClick={() => navigate(item.path)}>
            <span className="hub-icon">{item.icon}</span>
            <span className="hub-label">{item.label}</span>
            <span className="hub-desc">{item.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
