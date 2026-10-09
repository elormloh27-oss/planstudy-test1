import { digestHash } from '@/lib/week'

export interface BriefSubject {
  subject: string
  topics: string[]
  minutesTotal: number
}

export interface BriefConcept {
  name: string
  why: string
}

export interface SubjectBrief {
  subject: string
  concepts: BriefConcept[]
}

export type BriefSource = 'ai' | 'offline'

const LS_PREFIX = 'ps1:brief:'

function cacheKey(weekStart: string, subjects: BriefSubject[]): string {
  const items = subjects.flatMap((s) => s.topics.map((title) => ({ subject: s.subject, title })))
  return `${LS_PREFIX}${weekStart}:${digestHash(weekStart, items)}`
}

function readCache(key: string): SubjectBrief[] | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { brief: SubjectBrief[] }
    if (parsed && Array.isArray(parsed.brief)) return parsed.brief
    return null
  } catch {
    return null
  }
}

function writeCache(key: string, brief: SubjectBrief[]): void {
  try {
    localStorage.setItem(key, JSON.stringify({ brief }))
  } catch {
    /* storage full or blocked: caching is best-effort */
  }
}

function cleanBrief(raw: unknown): SubjectBrief[] {
  if (!Array.isArray(raw)) return []
  return raw.slice(0, 10).map((entry) => {
    const subject = String((entry as { subject?: unknown })?.subject || '').slice(0, 100)
    const concepts = Array.isArray((entry as { concepts?: unknown })?.concepts)
      ? (entry as { concepts: unknown[] }).concepts.slice(0, 3).map((c) => ({
          name: String((c as { name?: unknown })?.name || '').slice(0, 120),
          why: String((c as { why?: unknown })?.why || '').slice(0, 200)
        })).filter((c) => c.name.length > 0)
      : []
    return { subject, concepts }
  }).filter((e) => e.subject.length > 0)
}

// One AI call per week at most: cached by content hash, skipped entirely
// for empty weeks. Offline or failure returns an empty brief so the caller
// renders the deterministic skeleton instead. No background calls.
export async function generateWeeklyBrief(input: {
  weekStart: string
  subjects: BriefSubject[]
}): Promise<{ brief: SubjectBrief[]; source: BriefSource }> {
  if (input.subjects.length === 0) return { brief: [], source: 'offline' }
  const key = cacheKey(input.weekStart, input.subjects)
  const cached = readCache(key)
  if (cached) return { brief: cached, source: 'ai' }

  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 20000)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'brief', weekStart: input.weekStart, subjects: input.subjects }),
        signal: ctrl.signal
      })
      if (!res.ok) throw new Error(`proxy ${res.status}`)
      const data = await res.json()
      const brief = cleanBrief(data.brief)
      writeCache(key, brief)
      return { brief, source: 'ai' }
    } finally {
      clearTimeout(timer)
    }
  } catch {
    return { brief: [], source: 'offline' }
  }
} 
