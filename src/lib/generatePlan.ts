import type { BreakdownPart, ParsedOutline, StudyTask } from '@/types'
import { generateFallbackBreakdown, generateFallbackPlan, normalizeParts } from '@/lib/fallbackGenerator'

export interface PlanRequest {
  subject: string
  topics: string
  deadline: string
  hoursPerDay: number
}

async function postJSON(path: string, body: unknown, timeoutMs = 20000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal
    })
    if (!res.ok) throw new Error(`proxy ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

// Tries the server AI proxy first, falls back to offline builder.
// Both return the same task array shape.
export async function generatePlan(input: PlanRequest): Promise<{ tasks: StudyTask[]; source: 'ai' | 'offline' }> {
  try {
    const data = await postJSON('/api/generate', input)
    if (Array.isArray(data.tasks) && data.tasks.length > 0) {
      return { tasks: data.tasks as StudyTask[], source: 'ai' }
    }
    throw new Error('bad ai shape')
  } catch {
    return { tasks: generateFallbackPlan(input), source: 'offline' }
  }
}

// Sends outline text or page images for header extraction. No offline fallback:
// without AI there is nothing to extract from, so failures return null.
export async function parseOutline(input: { text?: string; images?: string[] }): Promise<ParsedOutline | null> {
  try {
    const data = await postJSON('/api/generate', { action: 'parse', ...input })
    if (data.parsed && Array.isArray(data.parsed.topics)) return data.parsed as ParsedOutline
    throw new Error('bad ai shape')
  } catch {
    return null
  }
}

// Splits one task into timed subtopics. AI first, offline splitter on failure.
export async function generateBreakdown(input: { subject: string; topicTitle: string; minutes: number }): Promise<{ parts: BreakdownPart[]; source: 'ai' | 'offline' }> {
  const total = Math.max(5, Math.min(Math.round(Number(input.minutes) || 25), 300))
  try {
    const data = await postJSON('/api/generate', { action: 'breakdown', ...input, minutes: total })
    if (Array.isArray(data.parts) && data.parts.length > 0) {
      return { parts: normalizeParts(data.parts as BreakdownPart[], total), source: 'ai' }
    }
    throw new Error('bad ai shape')
  } catch {
    return { parts: normalizeParts(generateFallbackBreakdown({ ...input, minutes: total }), total), source: 'offline' }
  }
} 
