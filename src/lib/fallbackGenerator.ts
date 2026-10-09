import type { BreakdownPart, StudyTask } from '@/types'

export interface PlanInput {
  subject: string
  topics: string
  deadline: string
  hoursPerDay: number
}

// Offline plan builder. Same task shape as the AI proxy returns,
// so the UI never cares which one produced the plan.
export function generateFallbackPlan({ subject, topics, deadline, hoursPerDay }: PlanInput): StudyTask[] {
  const names = String(topics)
    .split(/[\n,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
  const list = names.length > 0 ? names : [String(subject || 'Study')]

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(deadline)
  const endValid = !isNaN(end.getTime())
  const days = endValid
    ? Math.max(1, Math.round((end.getTime() - today.getTime()) / 86400000) + 1)
    : 1
  const perDayMinutes = Math.max(30, Math.round((hoursPerDay || 2) * 60))
  const slice = Math.max(1, Math.ceil(list.length / days))

  const tasks: StudyTask[] = []
  for (let d = 0; d < days; d++) {
    const date = new Date(today)
    date.setDate(date.getDate() + d)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const iso = `${y}-${m}-${dd}`
    const chunk = list.slice(d * slice, d * slice + slice)
    if (chunk.length === 0) {
      tasks.push({
        id: `${iso}-review`,
        title: `Review day ${d + 1}`,
        date: iso,
        duration_min: Math.min(30, perDayMinutes),
        done: false
      })
    } else {
      const each = Math.max(15, Math.round(perDayMinutes / chunk.length))
      chunk.forEach((name, k) => {
        tasks.push({
          id: `${iso}-${k}`,
          title: `Study ${name}`,
          date: iso,
          duration_min: each,
          done: false
        })
      })
    }
  }
  return tasks
}

// Offline session splitter. Same shape as the AI breakdown, totals enforced by caller.
export function generateFallbackBreakdown({ topicTitle, minutes }: { topicTitle: string; minutes: number }): BreakdownPart[] {
  const total = Math.max(5, Math.min(Math.round(Number(minutes) || 25), 300))
  const name = String(topicTitle || 'Study').replace(/^Study\s+/i, '') || 'Study'
  const recall = Math.max(5, Math.round(total / 5))
  const learn = total - recall
  const n = Math.max(1, Math.ceil(learn / 25))
  const base = Math.floor(learn / n)
  const out: BreakdownPart[] = []
  for (let i = 0; i < n; i++) {
    out.push({
      id: `off-bd-${i}`,
      title: `${name} (part ${i + 1})`,
      minutes: base + (i < learn - base * n ? 1 : 0),
      kind: 'learn'
    })
  }
  out.push({ id: 'off-bd-r', title: `Recall everything from ${name}`, minutes: recall, kind: 'retrieve' })
  return out
}

export function normalizeParts(parts: BreakdownPart[], total: number): BreakdownPart[] {
  const clean = (Array.isArray(parts) ? parts : [])
    .map((p, i) => ({
      id: String(p.id || `bd-${i}`),
      title: String(p.title || 'Study part'),
      minutes: Math.max(1, Math.round(Number(p.minutes) || 10)),
      kind: (['learn', 'retrieve', 'review'].includes(String(p.kind || '').toLowerCase())
        ? String(p.kind).toLowerCase()
        : 'learn') as BreakdownPart['kind']
    }))
    .slice(0, 8)
  if (clean.length === 0) return clean
  const sum = clean.reduce((a, p) => a + p.minutes, 0)
  if (sum === total) return clean
  const scaled = clean.map((p) => Math.max(1, Math.round((p.minutes / sum) * total)))
  scaled[scaled.length - 1] += total - scaled.reduce((a, m) => a + m, 0)
  return clean.map((p, i) => ({ ...p, minutes: Math.max(1, scaled[i]) }))
} 
