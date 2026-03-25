import { useState, useMemo } from 'react'
import { useTrades } from '../../hooks/useTrades'
import { fmtPct, profitClass } from '../../utils/format'
import './TradeForm.css'

const DAY_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat']
const DAY_ZH  = { Sun: '日', Mon: '一', Tue: '二', Wed: '三', Thur: '四', Fri: '五', Sat: '六' }

function autoDay(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return DAY_MAP[d.getDay()] || ''
}

const EMPTY = {
  date: '',
  dayOfWeek: '',
  contracts: '',
  commission: '',
  tax: '',
  profit: '',
  note: '',
}

export default function TradeForm({ trade, onClose }) {
  const { addTrade, updateTrade } = useTrades()

  const [form, setForm] = useState(trade ? { ...trade } : EMPTY)

  // 報酬率自動計算：profit / (contracts * 1250)
  const calcReturnRate = useMemo(() => {
    const p = Number(form.profit)
    const c = Number(form.contracts)
    if (!c || form.profit === '') return null
    return p / (c * 1250)
  }, [form.profit, form.contracts])

  function set(field, val) {
    setForm((f) => ({ ...f, [field]: val }))
  }

  function handleDateChange(dateStr) {
    setForm((f) => ({ ...f, date: dateStr, dayOfWeek: autoDay(dateStr) }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const data = {
      date:       form.date,
      dayOfWeek:  form.dayOfWeek,
      contracts:  Number(form.contracts)  || 0,
      commission: Number(form.commission) || 0,
      tax:        Number(form.tax)        || 0,
      profit:     Number(form.profit)     || 0,
      returnRate: calcReturnRate,
      note:       form.note,
    }
    if (trade) updateTrade(trade.id, data)
    else addTrade(data)
    onClose()
  }

  const dayLabel = form.dayOfWeek
    ? `${form.dayOfWeek}（${DAY_ZH[form.dayOfWeek] ?? ''}）`
    : '—'

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{trade ? '編輯紀錄' : '新增紀錄'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="trade-form">

          {/* 日期 + 星期 */}
          <div className="form-row">
            <label className="label-wide">
              <span>日期 <span className="required">*</span></span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleDateChange(e.target.value)}
                required
              />
            </label>
            <label>
              星期
              <div className="readonly-field">{dayLabel}</div>
            </label>
          </div>

          {/* 口數 / 手續費 / 期交稅 */}
          <div className="form-row">
            <label>
              <span>總口數 <span className="required">*</span></span>
              <input
                type="number" min="0"
                value={form.contracts}
                onChange={(e) => set('contracts', e.target.value)}
                required placeholder="0"
              />
            </label>
            <label>
              手續費
              <input
                type="number" min="0"
                value={form.commission}
                onChange={(e) => set('commission', e.target.value)}
                placeholder="0"
              />
            </label>
            <label>
              期交稅
              <input
                type="number" min="0"
                value={form.tax}
                onChange={(e) => set('tax', e.target.value)}
                placeholder="0"
              />
            </label>
          </div>

          {/* 實際獲利 + 報酬率（自動） */}
          <div className="form-row">
            <label>
              <span>實際獲利 <span className="required">*</span></span>
              <input
                type="number"
                value={form.profit}
                onChange={(e) => set('profit', e.target.value)}
                required placeholder="正數獲利 / 負數虧損"
              />
            </label>
            <label>
              報酬率（自動）
              <div className={`readonly-field ${calcReturnRate != null ? profitClass(calcReturnRate) : ''}`}>
                {calcReturnRate != null ? fmtPct(calcReturnRate) : '—'}
              </div>
            </label>
          </div>

          {/* 備註 */}
          <label>
            備註
            <input
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
              placeholder="選填"
            />
          </label>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>取消</button>
            <button type="submit" className="btn-submit">{trade ? '儲存' : '新增'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
