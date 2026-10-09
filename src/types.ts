export type BreakdownKind = 'learn' | 'retrieve' | 'review'

export interface BreakdownPart {
  id: string
  title: string
  minutes: number
  kind: BreakdownKind
}

export interface StudyTask {
  id: string
  title: string
  date: string // YYYY-MM-DD
  duration_min: number
  done: boolean
  breakdown?: BreakdownPart[]
  breakdownSource?: 'ai' | 'offline'
  blocks_done?: number
}

export interface StudyPlan {
  id: string
  user_id?: string | null
  subject: string
  topics: string
  deadline: string
  hours_per_day: number
  plan_json: StudyTask[]
  created_at?: string
}

export interface ParsedOutline {
  subject: string
  topics: string[]
  deadline: string
  hours: number | null
} 
