import { describe, it, expect, vi } from 'vitest'
import { generatePlan, generateBreakdown } from '@/lib/generatePlan'

describe('generatePlan', () => {
  it('falls back offline when fetch fails', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('down') })
    const r = await generatePlan({ subject: 'Bio', topics: 'A\nB', deadline: '2026-12-01', hoursPerDay: 2 })
    expect(r.source).toBe('offline')
    expect(r.tasks.length).toBeGreaterThan(0)
    vi.unstubAllGlobals()
  })
  it('falls back offline for breakdown', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('down') })
    const r = await generateBreakdown({ subject: 'Bio', topicTitle: 'Cells', minutes: 60 })
    expect(r.source).toBe('offline')
    expect(r.parts.reduce((a, p) => a + p.minutes, 0)).toBe(60)
    vi.unstubAllGlobals()
  })
}) 
