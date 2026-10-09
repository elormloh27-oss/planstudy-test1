import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateWeeklyBrief } from '@/lib/weeklyBrief'

const SUBJECTS = [{ subject: 'Bio', topics: ['Cells', 'Genes'], minutesTotal: 90 }]

function aiResponse(brief: unknown) {
  return async () =>
    ({
      ok: true,
      json: async () => ({ brief, source: 'ai' })
    }) as Response
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('generateWeeklyBrief', () => {
  it('falls back offline when fetch fails', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('down') })
    const r = await generateWeeklyBrief({ weekStart: '2026-10-05', subjects: SUBJECTS })
    expect(r.source).toBe('offline')
    expect(r.brief).toEqual([])
  })
  it('never fetches for an empty week (zero tokens)', async () => {
    const fetchSpy = vi.fn(async () => { throw new Error('must not fetch') })
    vi.stubGlobal('fetch', fetchSpy)
    const r = await generateWeeklyBrief({ weekStart: '2026-10-05', subjects: [] })
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(r.source).toBe('offline')
  })
  it('serves repeat weeks from cache without fetching', async () => {
    vi.stubGlobal('fetch', aiResponse([{ subject: 'Bio', concepts: [{ name: 'Cells', why: 'Core unit.' }] }]))
    const first = await generateWeeklyBrief({ weekStart: '2026-10-05', subjects: SUBJECTS })
    expect(first.source).toBe('ai')
    vi.stubGlobal('fetch', async () => { throw new Error('offline now') })
    const second = await generateWeeklyBrief({ weekStart: '2026-10-05', subjects: SUBJECTS })
    expect(second.source).toBe('ai')
    expect(second.brief).toEqual(first.brief)
  })
  it('refetches when the week content changes', async () => {
    const v1 = [{ subject: 'Bio', concepts: [{ name: 'Cells', why: 'Core unit.' }] }]
    const v2 = [{ subject: 'Bio', concepts: [{ name: 'Genes', why: 'New topic.' }] }]
    vi.stubGlobal('fetch', aiResponse(v1))
    await generateWeeklyBrief({ weekStart: '2026-10-05', subjects: SUBJECTS })
    vi.stubGlobal('fetch', aiResponse(v2))
    const r = await generateWeeklyBrief({
      weekStart: '2026-10-05',
      subjects: [{ subject: 'Bio', topics: ['Cells', 'Genes', 'Extra'], minutesTotal: 120 }]
    })
    expect(r.brief).toEqual(v2)
  })
}) 
