import { describe, it, expect } from 'vitest'
import type { StudyPlan } from '@/types'
import {
  weekRange,
  weekStartISO,
  tasksThisWeek,
  digestForWeek,
  digestHash,
  isSummaryReady
} from '@/lib/week'

function plan(over: Partial<StudyPlan> = {}): StudyPlan {
  return {
    id: 'p1',
    subject: 'Bio',
    topics: 'Cells',
    deadline: '2026-12-01',
    hours_per_day: 2,
    plan_json: [],
    ...over
  }
}

describe('weekRange (Monday to Sunday, local)', () => {
  it('starts on Monday for a Wednesday', () => {
    // 2026-10-07 is a Wednesday.
    const { start, end } = weekRange(new Date(2026, 9, 7, 12))
    expect(start).toBe('2026-10-05')
    expect(end).toBe('2026-10-11')
  })
  it('starts on Monday for a Sunday', () => {
    // 2026-10-11 is a Sunday.
    const { start, end } = weekRange(new Date(2026, 9, 11, 12))
    expect(start).toBe('2026-10-05')
    expect(end).toBe('2026-10-11')
  })
  it('starts on Monday for a Monday', () => {
    const { start, end } = weekRange(new Date(2026, 9, 5, 12))
    expect(start).toBe('2026-10-05')
    expect(end).toBe('2026-10-11')
  })
})

describe('tasksThisWeek', () => {
  it('keeps only tasks inside the week', () => {
    const plans = [
      plan({
        plan_json: [
          { id: 'a', title: 'Study Cells', date: '2026-10-06', duration_min: 30, done: false },
          { id: 'b', title: 'Study Old', date: '2026-09-01', duration_min: 30, done: false }
        ]
      })
    ]
    const got = tasksThisWeek(plans, new Date(2026, 9, 7, 12))
    expect(got).toHaveLength(1)
    expect(got[0].task.id).toBe('a')
    expect(got[0].planId).toBe('p1')
    expect(got[0].subject).toBe('Bio')
  })
})

describe('digestForWeek', () => {
  it('groups by subject with minutes and done counts', () => {
    const plans = [
      plan({
        subject: 'Bio',
        plan_json: [
          { id: 'a', title: 'Study Cells', date: '2026-10-06', duration_min: 30, done: true },
          { id: 'b', title: 'Study Genes', date: '2026-10-08', duration_min: 60, done: false }
        ]
      }),
      plan({
        id: 'p2',
        subject: 'Chem',
        plan_json: [{ id: 'c', title: 'Study Atoms', date: '2026-10-07', duration_min: 45, done: false }]
      })
    ]
    const digest = digestForWeek(plans, new Date(2026, 9, 7, 12))
    expect(digest.weekStart).toBe('2026-10-05')
    expect(digest.subjects).toHaveLength(2)
    const bio = digest.subjects.find((s) => s.subject === 'Bio')!
    expect(bio.topics).toEqual(['Cells', 'Genes'])
    expect(bio.minutesTotal).toBe(90)
    expect(bio.done).toBe(1)
    expect(bio.total).toBe(2)
  })
  it('flags overdue unfinished tasks from before the week', () => {
    const plans = [
      plan({
        plan_json: [{ id: 'a', title: 'Study Old', date: '2026-09-01', duration_min: 30, done: false }]
      })
    ]
    const digest = digestForWeek(plans, new Date(2026, 9, 7, 12))
    expect(digest.overdue).toHaveLength(1)
    expect(digest.overdue[0].title).toBe('Study Old')
  })
})

describe('digestHash', () => {
  it('is stable for identical input and changes on edit', () => {
    const a = digestHash('2026-10-05', [{ subject: 'Bio', title: 'Cells' }])
    const b = digestHash('2026-10-05', [{ subject: 'Bio', title: 'Cells' }])
    const c = digestHash('2026-10-05', [{ subject: 'Bio', title: 'Genes' }])
    expect(a).toBe(b)
    expect(a).not.toBe(c)
  })
})

describe('isSummaryReady', () => {
  it('is ready when the week has tasks and was never seen', () => {
    expect(isSummaryReady({ taskCount: 2, weekStart: '2026-10-05', lastSeenWeek: null, hash: 'x', lastHash: null })).toBe(true)
  })
  it('is not ready when the week is empty', () => {
    expect(isSummaryReady({ taskCount: 0, weekStart: '2026-10-05', lastSeenWeek: null, hash: 'x', lastHash: null })).toBe(false)
  })
  it('is not ready when seen and unchanged', () => {
    expect(isSummaryReady({ taskCount: 2, weekStart: '2026-10-05', lastSeenWeek: '2026-10-05', hash: 'x', lastHash: 'x' })).toBe(false)
  })
  it('is ready again when tasks changed after seeing', () => {
    expect(isSummaryReady({ taskCount: 2, weekStart: '2026-10-05', lastSeenWeek: '2026-10-05', hash: 'y', lastHash: 'x' })).toBe(true)
  })
  it('weekStartISO matches weekRange start', () => {
    expect(weekStartISO(new Date(2026, 9, 7, 12))).toBe('2026-10-05')
  })
}) 
