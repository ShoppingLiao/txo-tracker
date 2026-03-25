export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function fmtMoney(val) {
  if (val === 0) return '0'
  const n = Math.round(val)
  return (n >= 0 ? '+' : '') + n.toLocaleString()
}

export function fmtPct(val) {
  if (val == null || isNaN(val)) return '—'
  return (val >= 0 ? '+' : '') + (val * 100).toFixed(2) + '%'
}

export function profitClass(val) {
  if (val > 0) return 'profit'
  if (val < 0) return 'loss'
  return ''
}
