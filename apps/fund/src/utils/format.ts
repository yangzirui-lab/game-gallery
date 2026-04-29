export function pct(v: string | number | null | undefined): string {
  if (v === '' || v == null) return '—'
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

export function pctClass(v: string | number | null | undefined): string {
  if (v === '' || v == null) return ''
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n) || n === 0) return ''
  // A 股惯例：红涨绿跌
  return n > 0 ? 'up' : 'down'
}

export function num(v: string | number | null | undefined, digits = 2): string {
  if (v === '' || v == null) return '—'
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(digits)
}

export function isTradeMinute(d = new Date()): boolean {
  const dow = d.getDay()
  if (dow < 1 || dow > 5) return false
  const hm = d.getHours() * 60 + d.getMinutes()
  return (hm >= 9 * 60 + 30 && hm <= 11 * 60 + 30) || (hm >= 13 * 60 && hm <= 15 * 60)
}

export function formatDateTime(s: string | undefined): string {
  if (!s) return ''
  return s.length > 16 ? s.slice(0, 16).replace('T', ' ') : s
}
