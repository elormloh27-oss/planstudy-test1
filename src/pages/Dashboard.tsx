import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenCheck, CalendarDays, Copy, Flame, Plus, Search, Trash2 } from 'lucide-react'
import { usePlans } from '@/hooks/usePlans'
import { store } from '@/lib/store'
import { computeStreak, isOverdue, todayISO } from '@/lib/dates'
import { ProgressBar } from '@/components/ProgressRing'
import Loading from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import WeeklySummary from '@/components/WeeklySummary'
import { useToast } from '@/components/Toast'

type Filter = 'all' | 'active' | 'done' | 'overdue'
type Sort = 'deadline' | 'progress' | 'recent'

export default function Dashboard() {
  const { plans, setPlans, loading, remove } = usePlans()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('deadline')
  const { push } = useToast()

  const streak = useMemo(() => {
    const dates = plans.flatMap((p) => (p.plan_json || []).filter((t) => t.done).map((t) => t.date))
    return computeStreak([...new Set(dates)])
  }, [plans])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = plans.filter((p) => !q || p.subject.toLowerCase().includes(q))
    if (filter === 'active') list = list.filter((p) => (p.plan_json || []).some((t) => !t.done))
    if (filter === 'done') list = list.filter((p) => (p.plan_json || []).length > 0 && (p.plan_json || []).every((t) => t.done))
    if (filter === 'overdue') list = list.filter((p) => (p.plan_json || []).some((t) => !t.done && isOverdue(t.date)))
    const pct = (p: (typeof plans)[number]) => {
      const tasks = p.plan_json || []
      return tasks.length === 0 ? 0 : tasks.filter((t) => t.done).length / tasks.length
    }
    return [...list].sort((a, b) => {
      if (sort === 'deadline') return a.deadline.localeCompare(b.deadline)
      if (sort === 'progress') return pct(b) - pct(a)
      return String(b.created_at || '').localeCompare(String(a.created_at || ''))
    })
  }, [plans, query, filter, sort])

  async function onRemove(id: string) {
    if (!confirm('Delete this plan?')) return
    try {
      await remove(id)
    } catch {
      push('Delete failed. Your plan was restored.')
    }
  }

  async function onDuplicate(id: string) {
    try {
      const copy = await store.duplicatePlan(id)
      if (copy) {
        setPlans((ps) => [copy, ...ps])
        push('Plan duplicated')
      }
    } catch {
      push('Duplicate failed')
    }
  }

  if (loading) return <Loading message="Loading your plans..." />

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-indigo-600">Overview</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Your study plans</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <Flame size={14} className={streak > 0 ? 'text-orange-500' : ''} />
            {streak > 0 ? `${streak}-day streak · ${todayISO()}` : 'No streak yet. Finish a task today to start one.'}
            {store.mode === 'demo' && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Demo</span>}
          </p>
        </div>
        <Link to="/new" className="btn-lively flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-sm">
          <Plus size={18} /> New plan
        </Link>
      </div>

      <WeeklySummary plans={plans} />

      {plans.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input aria-label="Search plans" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search subjects..." className="w-40 bg-transparent text-sm outline-none sm:w-56" />
          </div>
          {(['all', 'active', 'done', 'overdue'] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${filter === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
          <select aria-label="Sort plans" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="ml-auto rounded-xl border bg-white px-3 py-2 text-sm font-medium">
            <option value="deadline">By deadline</option>
            <option value="progress">By progress</option>
            <option value="recent">Recently added</option>
          </select>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<BookOpenCheck size={40} className="mx-auto text-indigo-600" />}
            title="No plans yet"
            body="Make your first one in under a minute."
            action={<Link to="/new" className="btn-lively inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white"><Plus size={18} /> Create a plan</Link>}
          />
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-8 rounded-2xl border bg-white p-8 text-center text-slate-500">No plans match this filter.</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {visible.map((plan, i) => {
            const tasks = plan.plan_json || []
            const done = tasks.filter((t) => t.done).length
            const overdue = tasks.some((t) => !t.done && isOverdue(t.date))
            return (
              <div key={plan.id} className="anim-fade-up rounded-2xl border bg-white p-5 shadow-sm" style={{ animationDelay: `${Math.min(i, 6) * 0.06}s` }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-lg font-semibold">{plan.subject}</p>
                  {overdue && <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">Overdue</span>}
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                  <CalendarDays size={14} /> Due {plan.deadline} · {done} of {tasks.length} done
                </p>
                <div className="mt-3">
                  <ProgressBar done={done} total={tasks.length} />
                </div>
                <div className="mt-4 flex justify-end gap-2 text-sm">
                  <button onClick={() => onDuplicate(plan.id)} aria-label={`Duplicate ${plan.subject}`} className="btn-lively flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100">
                    <Copy size={16} /> Copy
                  </button>
                  <button onClick={() => onRemove(plan.id)} className="btn-lively flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium text-red-600 hover:bg-red-50">
                    <Trash2 size={16} /> Delete
                  </button>
                  <Link to={`/plan/${plan.id}`} className="btn-lively flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white">
                    Open <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
} 
