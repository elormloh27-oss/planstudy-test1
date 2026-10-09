import type { StudyPlan, StudyTask } from '@/types'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'

const LS_KEY = 'ps1:plans'

function readLocal(): StudyPlan[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]') as StudyPlan[]
  } catch {
    return []
  }
}

function writeLocal(plans: StudyPlan[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(plans))
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export interface CreatePlanInput {
  subject: string
  topics: string
  deadline: string
  hours_per_day: number
  plan_json: StudyTask[]
}

export const demoStore = {
  async listPlans(): Promise<StudyPlan[]> {
    return readLocal().sort((a, b) =>
      String(b.created_at || '').localeCompare(String(a.created_at || ''))
    )
  },
  async createPlan(input: CreatePlanInput): Promise<StudyPlan> {
    const plan: StudyPlan = {
      id: uid(),
      subject: input.subject,
      topics: input.topics,
      deadline: input.deadline,
      hours_per_day: input.hours_per_day,
      plan_json: input.plan_json,
      created_at: new Date().toISOString()
    }
    writeLocal([plan, ...readLocal()])
    return plan
  },
  async getPlan(id: string): Promise<StudyPlan | null> {
    return readLocal().find((p) => p.id === id) || null
  },
  async updateTasks(id: string, tasks: StudyTask[]): Promise<void> {
    writeLocal(readLocal().map((p) => (p.id === id ? { ...p, plan_json: tasks } : p)))
  },
  async deletePlan(id: string): Promise<void> {
    writeLocal(readLocal().filter((p) => p.id !== id))
  },
  async duplicatePlan(id: string): Promise<StudyPlan | null> {
    const src = readLocal().find((p) => p.id === id)
    if (!src) return null
    const copy: StudyPlan = { ...src, id: uid(), subject: `${src.subject} (copy)`, created_at: new Date().toISOString() }
    writeLocal([copy, ...readLocal()])
    return copy
  }
}

function isNetworkFailure(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String((err as { message?: unknown })?.message ?? err ?? '')
  return /failed to fetch|network|load failed|fetch failed|offline|ERR_/i.test(msg)
}

export const store = {
  get mode(): 'supabase' | 'demo' {
    return isSupabaseConfigured ? 'supabase' : 'demo'
  },
  async listPlans(): Promise<StudyPlan[]> {
    if (!isSupabaseConfigured) return demoStore.listPlans()
    try {
      const { data, error } = await supabase.from('study_plans').select('*').order('created_at', { ascending: false }).limit(20)
      if (error) {
        if (isNetworkFailure(error)) return demoStore.listPlans()
        throw error
      }
      return (data || []) as StudyPlan[]
    } catch (e) {
      if (isNetworkFailure(e)) return demoStore.listPlans()
      throw e
    }
  },
  async createPlan(input: CreatePlanInput): Promise<StudyPlan | null> {
    if (!isSupabaseConfigured) return demoStore.createPlan(input)
    const { data: session } = await supabase.auth.getSession()
    const user = session.session?.user
    const { data, error } = await supabase
      .from('study_plans')
      .insert({ user_id: user?.id || null, ...input })
      .select()
      .single()
    if (error) throw error
    return data as StudyPlan
  },
  async getPlan(id: string): Promise<StudyPlan | null> {
    if (!isSupabaseConfigured) return demoStore.getPlan(id)
    try {
      const { data, error } = await supabase.from('study_plans').select('*').eq('id', id).single()
      if (error) {
        if (isNetworkFailure(error)) return demoStore.getPlan(id)
        throw error
      }
      return (data as StudyPlan) || null
    } catch (e) {
      if (isNetworkFailure(e)) return demoStore.getPlan(id)
      throw e
    }
  },
  async updateTasks(id: string, tasks: StudyTask[]): Promise<void> {
    if (!isSupabaseConfigured) return demoStore.updateTasks(id, tasks)
    const { error } = await supabase.from('study_plans').update({ plan_json: tasks }).eq('id', id)
    if (error) throw error
  },
  async deletePlan(id: string): Promise<void> {
    if (!isSupabaseConfigured) return demoStore.deletePlan(id)
    const { error } = await supabase.from('study_plans').delete().eq('id', id)
    if (error) throw error
  },
  async duplicatePlan(id: string): Promise<StudyPlan | null> {
    const src = await this.getPlan(id)
    if (!src) return null
    return this.createPlan({
      subject: `${src.subject} (copy)`,
      topics: src.topics,
      deadline: src.deadline,
      hours_per_day: src.hours_per_day,
      plan_json: src.plan_json
    })
  }
} 
