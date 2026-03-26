import { useState } from 'react'
import './SettlementPredictor.css'

// 歷史估算區間（暫定，後續可調整）
const RANGES = {
  taiex:   { up: [150, 250],  down: [-250, -350] },
  futures: { up: [100, 200],  down: [-200, -300] },
}

function fmt(n) {
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function RangeBlock({ label, base, range }) {
  const [upA, upB]     = range.up
  const [downA, downB] = range.down
  return (
    <div className="sp-range-card">
      <div className="sp-range-title">{label}</div>
      <div className="sp-range-row up">
        <span className="sp-tag up">多方區間</span>
        <span className="sp-pts">+{upA} ~ +{upB} 點</span>
        <span className="sp-prices">
          {fmt(base + upA)} ~ {fmt(base + upB)}
        </span>
      </div>
      <div className="sp-divider">｜</div>
      <div className="sp-range-row down">
        <span className="sp-tag down">空方區間</span>
        <span className="sp-pts">{downA} ~ {downB} 點</span>
        <span className="sp-prices">
          {fmt(base + downA)} ~ {fmt(base + downB)}
        </span>
      </div>
    </div>
  )
}

export default function SettlementPredictor() {
  const [taiex,   setTaiex]   = useState('')
  const [futures, setFutures] = useState('')
  const [result,  setResult]  = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    const t = parseFloat(taiex)
    const f = parseFloat(futures)
    if (isNaN(t) || isNaN(f)) return
    setResult({ taiex: t, futures: f })
  }

  return (
    <div className="sp-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">結算預測小助手</h1>
          <p className="page-subtitle">輸入結算日 11:00 的指數點數，粗估收盤安全區間</p>
        </div>
      </div>

      <div className="sp-card">
        <form onSubmit={handleSubmit} className="sp-form">
          <div className="sp-field">
            <label className="sp-label">
              加權指數
              <span className="sp-hint">結算日 11:00 的現貨點數</span>
            </label>
            <input
              className="sp-input"
              type="number"
              placeholder="例：33000"
              value={taiex}
              onChange={e => setTaiex(e.target.value)}
              required
            />
          </div>

          <div className="sp-field">
            <label className="sp-label">
              台指期貨
              <span className="sp-hint">結算日 11:00 的期貨點數</span>
            </label>
            <input
              className="sp-input"
              type="number"
              placeholder="例：33050"
              value={futures}
              onChange={e => setFutures(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="sp-submit">試算安全區間</button>
        </form>
      </div>

      {result && (
        <div className="sp-results">
          <div className="sp-results-title">預估收盤區間</div>
          <RangeBlock
            label="加權指數"
            base={result.taiex}
            range={RANGES.taiex}
          />
          <RangeBlock
            label="台指期貨"
            base={result.futures}
            range={RANGES.futures}
          />
          <p className="sp-note">
            ※ 以上數據為歷史粗估，僅供參考，不構成投資建議
          </p>
        </div>
      )}
    </div>
  )
}
