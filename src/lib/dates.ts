export function todayISO(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isOverdue(dateISO: string, now = new Date()): boolean {
  const d = new Date(dateISO)
  if (isNaN(d.getTime())) return false
  const t = new Date(now)
  t.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return d.getTime() < t.getTime()
}

// Consecutive done-days ending today (or yesterday if today empty).
export function computeStreak(doneDatesISO: string[]): number {
  const set = new Set(doneDatesISO)
  if (set.size === 0) return 0
  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  if (!set.has(todayISO(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!set.has(todayISO(cursor))) return 0
  }
  let streak = 0
  while (set.has(todayISO(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
} 
