// 2026 台指期選擇權結算日（來源：台指期選擇權拷貝.numbers）
export const SETTLEMENTS_2026 = {
  1:  [2, 7, 9, 14, 16, 21, 23, 28, 30],
  2:  [4, 6, 11, 23, 25],
  3:  [2, 4, 6, 11, 13, 18, 20, 25, 27],
  4:  [1, 7, 8, 10, 15, 17, 22, 24, 29],
  5:  [4, 6, 8, 13, 15, 20, 22, 27, 29],
  6:  [3, 5, 10, 12, 17, 22, 24, 26],
  7:  [1, 3, 8, 10, 15, 17, 22, 24, 29, 31],
  8:  [5, 7, 12, 14, 19, 21, 26, 28],
  9:  [2, 4, 9, 11, 16, 18, 23, 29, 30],
  10: [2, 7, 12, 14, 16, 21, 23, 28, 30],
  11: [4, 6, 11, 13, 18, 20, 25, 27],
  12: [2, 4, 9, 11, 16, 18, 23, 28, 30],
}

/** 判斷某日期字串（YYYY-MM-DD）是否為 2026 年結算日 */
export function isSettlementDay(dateStr) {
  if (!dateStr || !dateStr.startsWith('2026')) return false
  const d = new Date(dateStr)
  const month = d.getMonth() + 1
  const day   = d.getDate()
  return (SETTLEMENTS_2026[month] || []).includes(day)
}
