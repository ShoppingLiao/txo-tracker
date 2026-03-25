import './StatCard.css'

export default function StatCard({ title, value, unit = '', type = 'default' }) {
  return (
    <div className={`stat-card stat-card--${type}`}>
      <div className="stat-title">{title}</div>
      <div className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
    </div>
  )
}
