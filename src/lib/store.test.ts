import { describe, it, expect, beforeEach } from 'vitest'
import { demoStore } from '@/lib/store'

beforeEach(() => {
  localStorage.clear()
})

describe('store', () => {
  it('creates then lists a plan offline', async () => {
    const p = await demoStore.createPlan({ subject: 'Bio', topics: 'A', deadline: '2026-12-01', hours_per_day: 2, plan_json: [] })
    expect((await demoStore.listPlans()).some((x) => x.id === p.id)).toBe(true)
  })
  it('updates tasks and deletes', async () => {
    const p = await demoStore.createPlan({ subject: 'X', topics: 'A', deadline: '2026-12-01', hours_per_day: 2, plan_json: [] })
    await demoStore.updateTasks(p.id, [{ id: 'a', title: 'T', date: '2026-10-08', duration_min: 30, done: true }])
    const found = (await demoStore.listPlans()).find((x) => x.id === p.id)
    expect(found?.plan_json[0]?.done).toBe(true)
    await demoStore.deletePlan(p.id)
    expect((await demoStore.listPlans()).some((x) => x.id === p.id)).toBe(false)
  })
}) 
