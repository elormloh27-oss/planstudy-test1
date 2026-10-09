export interface FocusBlock {
  len: number
  breakAfter: number
}

// Turns task minutes into focus blocks with breaks attached.
// Under 30: one block. 30-100: 25s. Over 100: 50s.
// Break: 5 after short blocks, 10 after long ones, 20 after every 4th.
export function planBlocks(totalMin: number): FocusBlock[] {
  const m = Math.max(1, Math.round(Number(totalMin) || 25))
  let sizes: number[]
  if (m <= 30) {
    sizes = [m]
  } else if (m <= 100) {
    const n = Math.max(1, Math.round(m / 25))
    const base = Math.floor(m / n)
    sizes = Array.from({ length: n }, (_, i) => base + (i < m - base * n ? 1 : 0))
  } else {
    const n = Math.max(2, Math.round(m / 50))
    const base = Math.floor(m / n)
    sizes = Array.from({ length: n }, (_, i) => base + (i < m - base * n ? 1 : 0))
  }
  return sizes.map((len, i) => ({
    len,
    breakAfter: i === sizes.length - 1 ? 0 : (i + 1) % 4 === 0 ? 20 : len >= 50 ? 10 : 5
  }))
}

export function formatClock(totalSec: number): string {
  const s = Math.max(0, totalSec)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
} 
