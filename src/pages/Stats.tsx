import { useMemo } from 'react'
import { usePlans } from '@/hooks/usePlans'
import { todayISO } from '@/lib/dates'
import Loading from '@/components/Loading'

export default function Stats() {
  const { plans, loading } = usePlans()

  const { week, subjects, total, done } = useMemo(() => {
    const days: { iso: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const iso = todayISO(d)
      days.push({ iso, count: 0 })
    }
    const byIso = new Map(days.map((d) => [d.iso, d]))
    const bySubject = new Map<string, { total: number; done: number }>()
    let total = 0
    let done = 0
    plans.forEach((p) => {
      const agg = bySubject.get(p.subject) || { total: 0, done: 0 }
      ;(p.plan_json || []).forEach((t) => {
        total++
        agg.total++
        if (t.done) {
          done++
          agg.done++
          const cell = byIso.get(t.date)
          if (cell) cell.count++
        }
      })
      bySubject.set(p.subject, agg)
    })
    return { week: days, subjects: [...bySubject.entries()], total, done }
  }, [plans])

  if (loading) return <Loading message="Loading stats..." />
  const max = Math.max(1, ...week.map((d) => d.count))

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-sm font-medium uppercase tracking-widest text-indigo-600">Progress</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Stats</h1>
      <p className="mt-1 text-sm text-slate-500">{done} of {total} tasks done</p>
      <div className="bezel mt-6">
        <div className="bezel-inner p-5">
          <p className="font-bold">Last 7 days</p>
          <div className="mt-4 flex items-end gap-2" role="img" aria-label="Tasks completed per day, last 7 days">
            {week.map((d) => (
              <div key={d.iso} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-28 w-full items-end rounded-lg bg-slate-50 p-1">
                  <div className="w-full rounded-md bg-indigo-600" style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }} title={`${d.iso}: ${d.count}`} />
                </div>
                <span className="text-[10px] font-medium text-slate-500">{d.iso.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border bg-white p-5 shadow-sm">
        <p className="font-bold">By subject</p>
        <ul className="mt-3 space-y-2">
          {subjects.length === 0 && <li className="text-sm text-slate-500">No plans yet.</li>}
          {subjects.map(([s, v]) => (
            <li key={s} className="flex items-center gap-3 text-sm">
              <span className="min-w-0 flex-1 truncate font-medium">{s}</span>
              <span className="text-slate-500 tabular-nums">{v.done}/{v.total}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
} 
