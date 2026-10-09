import type { StudyPlan, StudyTask } from '@/types'

export interface WeekTask {
  planId: string
  subject: string
  task: StudyTask
}

export interface WeekSubject {
  subject: string
  topics: string[]
  minutesTotal: number
  done: number
  total: number
}

export interface WeekDigest {
  weekStart: string
  weekEnd: string
  subjects: WeekSubject[]
  overdue: { planId: string; subject: string; title: string; date: string }[]
}

function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Monday-to-Sunday range containing `date`, in local time.
export function weekRange(date = new Date()): { start: string; end: string } {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const dow = (d.getDay() + 6) % 7 // Monday = 0 ... Sunday = 6
  const monday = new Date(d)
  monday.setDate(d.getDate() - dow)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { start: toISO(monday), end: toISO(sunday) }
}

export function weekStartISO(date = new Date()): string {
  return weekRange(date).start
}

function cleanTopic(title: string): string {
  return String(title || 'Study').replace(/^Study\s+/i, '').trim() || 'Study'
}

export function tasksThisWeek(plans: StudyPlan[], now = new Date()): WeekTask[] {
  const { start, end } = weekRange(now)
  const out: WeekTask[] = []
  for (const p of plans) {
    for (const task of p.plan_json || []) {
      if (task.date >= start && task.date <= end) {
        out.push({ planId: p.id, subject: p.subject, task })
      }
    }
  }
  return out.sort((a, b) => a.task.date.localeCompare(b.task.date))
}

export function digestForWeek(plans: StudyPlan[], now = new Date()): WeekDigest {
  const { start, end } = weekRange(now)
  const bySubject = new Map<string, WeekSubject>()
  const overdue: WeekDigest['overdue'] = []

  for (const p of plans) {
    for (const task of p.plan_json || []) {
      if (!task.done && task.date < start) {
        overdue.push({ planId: p.id, subject: p.subject, title: task.title, date: task.date })
        continue
      }
      if (task.date < start || task.date > end) continue
      let agg = bySubject.get(p.subject)
      if (!agg) {
        agg = { subject: p.subject, topics: [], minutesTotal: 0, done: 0, total: 0 }
        bySubject.set(p.subject, agg)
      }
      const topic = cleanTopic(task.title)
      if (!agg.topics.includes(topic)) agg.topics.push(topic)
      agg.minutesTotal += task.duration_min
      agg.total += 1
      if (task.done) agg.done += 1
    }
  }

  return { weekStart: start, weekEnd: end, subjects: [...bySubject.values()], overdue }
}

// Stable hash of the week's content. The AI brief regenerates only when
// this changes, so identical weeks cost zero tokens.
export function digestHash(weekStart: string, items: { subject: string; title: string }[]): string {
  const key = [weekStart, ...items.map((i) => `${i.subject}::${i.title}`).sort()].join('\n')
  let h = 5381
  for (let i = 0; i < key.length; i++) {
    h = ((h << 5) + h + key.charCodeAt(i)) | 0
  }
  return (h >>> 0).toString(36)
}

export interface ReadinessInput {
  taskCount: number
  weekStart: string
  lastSeenWeek: string | null
  hash: string
  lastHash: string | null
}

export function isSummaryReady(input: ReadinessInput): boolean {
  if (input.taskCount === 0) return false
  if (input.lastSeenWeek !== input.weekStart) return true
  return input.hash !== input.lastHash
} 
