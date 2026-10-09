import { useCallback, useEffect, useState } from 'react'
import type { StudyPlan, StudyTask } from '@/types'
import { store } from '@/lib/store'

export function usePlans() {
  const [plans, setPlans] = useState<StudyPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    store
      .listPlans()
      .then(setPlans)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  const remove = useCallback(async (id: string) => {
    const prev = plans
    setPlans((p) => p.filter((x) => x.id !== id))
    try {
      await store.deletePlan(id)
    } catch (e) {
      setPlans(prev)
      throw e
    }
  }, [plans])

  const saveTasks = useCallback(async (id: string, tasks: StudyTask[]) => {
    const prev = plans
    setPlans((p) => p.map((x) => (x.id === id ? { ...x, plan_json: tasks } : x)))
    try {
      await store.updateTasks(id, tasks)
    } catch (e) {
      setPlans(prev)
      throw e
    }
  }, [plans])

  return { plans, setPlans, loading, error, remove, saveTasks, mode: store.mode }
} 
