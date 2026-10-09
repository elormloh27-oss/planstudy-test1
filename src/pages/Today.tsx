import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { usePlans } from '@/hooks/usePlans'
import { store } from '@/lib/store'
import { isOverdue, todayISO } from '@/lib/dates'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'

export default function Today() {
  const { plans, loading, saveTasks } = usePlans()
  const today = todayISO()

  const items = useMemo(() => {
    const out: { planId: string; subject: string; index: number; title: string; duration_min: number; overdue: boolean; date: string }[] = []
    plans.forEach((p) => {
      ;(p.plan_json || []).forEach((t, index) => {
        if (t.done) return
        if (t.date === today || isOverdue(t.date)) {
          out.push({ planId: p.id, subject: p.subject, index, title: t.title, duration_min: t.duration_min, overdue: isOverdue(t.date) && t.date !== today, date: t.date })
        }
      })
    })
    return out.sort((a, b) => Number(a.overdue) - Number(b.overdue))
  }, [plans, today])

  async function toggle(planId: string, index: number) {
    const plan = plans.find((p) => p.id === planId)
    if (!plan) return
    const tasks = (plan.plan_json || []).map((t, i) => (i === index ? { ...t, done: !t.done } : t))
    try {
      await saveTasks(planId, tasks)
    } catch {
      /* toast handled by caller boundary */
    }
  }

  if (loading) return <Loading message="Loading today..." />

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-sm font-medium uppercase tracking-widest text-indigo-600">Focus</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Today · {today}</h1>
      <p className="mt-1 text-sm text-slate-500">{store.mode === 'demo' ? 'Demo mode' : 'Synced'} · {items.length} task{items.length === 1 ? '' : 's'} due</p>
      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<CalendarDays size={36} className="mx-auto text-indigo-600" />} title="All clear" body="Nothing due today. Enjoy it or get ahead." action={<Link to="/dashboard" className="font-semibold text-indigo-600">Back to plans</Link>} />
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {items.map((it) => (
            <li key={`${it.planId}-${it.index}`} className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm">
              <input type="checkbox" aria-label={`Done: ${it.title}`} onChange={() => toggle(it.planId, it.index)} className="h-5 w-5 accent-indigo-600" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{it.title}</span>
                <span className="block text-xs text-slate-500">{it.subject} · {it.date} · {it.duration_min}m {it.overdue ? '· overdue' : ''}</span>
              </span>
              <Link to={`/plan/${it.planId}`} className="shrink-0 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">Open</Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
} 
