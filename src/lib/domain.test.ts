import { describe, it, expect } from 'vitest'
import { generateFallbackPlan, generateFallbackBreakdown } from '@/lib/fallbackGenerator'
import { planBlocks } from '@/lib/timer'
import { computeStreak, isOverdue, todayISO } from '@/lib/dates'

describe('domain', () => {
  it('spreads 3 topics over 1 day with per-topic minutes', () => {
    const today = new Date().toISOString().slice(0, 10)
    const t = generateFallbackPlan({ subject: 'Bio', topics: 'A\nB\nC', deadline: today, hoursPerDay: 2 })
    expect(t.length).toBe(3)
    expect(t[0].duration_min).toBeGreaterThanOrEqual(15)
  })
  it('past deadline yields single-day plan without crashing', () => {
    const t = generateFallbackPlan({ subject: 'X', topics: 'A', deadline: '2000-01-01', hoursPerDay: 2 })
    expect(t.length).toBeGreaterThanOrEqual(1)
    expect(t[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('offline breakdown totals match requested minutes', () => {
    const parts = generateFallbackBreakdown({ topicTitle: 'Photosynthesis', minutes: 60 })
    const sum = parts.reduce((a, p) => a + p.minutes, 0)
    expect(sum).toBe(60)
    expect(parts[parts.length - 1].kind).toBe('retrieve')
  })
  it('planBlocks 60min gives ~25s with 5-min breaks', () => {
    const b = planBlocks(60)
    expect(b[0].len).toBeLessThanOrEqual(30)
    expect(b[0].breakAfter).toBe(5)
  })
  it('planBlocks over-100 uses long blocks with 10-min breaks', () => {
    const b = planBlocks(120)
    expect(b[0].len).toBeGreaterThanOrEqual(40)
    expect(b[0].breakAfter).toBe(10)
  })
  it('streak counts consecutive days ending today', () => {
    const t = todayISO()
    const d = new Date()
    d.setDate(d.getDate() - 1)
    const y = todayISO(d)
    expect(computeStreak([y, t])).toBe(2)
    expect(computeStreak([])).toBe(0)
  })
  it('detects overdue dates', () => {
    expect(isOverdue('2000-01-01')).toBe(true)
    expect(isOverdue('2999-01-01')).toBe(false)
  })
}) 
