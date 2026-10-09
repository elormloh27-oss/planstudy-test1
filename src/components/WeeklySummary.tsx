import { useMemo, useState } from 'react'
import { CalendarDays, ChevronDown, Sparkles, X } from 'lucide-react'
import type { StudyPlan } from '@/types'
import { digestForWeek, digestHash, isSummaryReady } from '@/lib/week'
import { generateWeeklyBrief, type SubjectBrief } from '@/lib/weeklyBrief'

const SEEN_KEY = 'ps1:weekly-seen'
const COLLAPSED_KEY = 'ps1:weekly-collapsed'

interface SeenState {
  week: string | null
  hash: string | null
}

function readSeen(): SeenState {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    if (!raw) return { week: null, hash: null }
    const parsed = JSON.parse(raw) as SeenState
    return { week: parsed.week || null, hash: parsed.hash || null }
  } catch {
    return { week: null, hash: null }
  }
}

function fmtRange(start: string, end: string): string {
  return `${start.slice(5).replace('-', '/')} - ${end.slice(5).replace('-', '/')}`
}

export default function WeeklySummary({ plans }: { plans: StudyPlan[] }) {
  const digest = useMemo(() => digestForWeek(plans), [plans])
  const hash = useMemo(() => {
    const items = digest.subjects.flatMap((s) => s.topics.map((title) => ({ subject: s.subject, title })))
    return digestHash(digest.weekStart, items)
  }, [digest])
  const [seen, setSeen] = useState<SeenState>(() => readSeen())
  const [dismissed, setDismissed] = useState(false)
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === digest.weekStart
    } catch {
      return false
    }
  })
  const [brief, setBrief] = useState<SubjectBrief[] | null>(null)
  const [briefBusy, setBriefBusy] = useState(false)
  const [briefOffline, setBriefOffline] = useState(false)

  const taskCount = digest.subjects.reduce((a, s) => a + s.total, 0)
  const ready = isSummaryReady({
    taskCount,
    weekStart: digest.weekStart,
    lastSeenWeek: seen.week,
    hash,
    lastHash: seen.hash
  })

  if (taskCount === 0) return null

  function markSeen() {
    const next = { week: digest.weekStart, hash }
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(next))
    } catch {
      /* private mode: banner simply returns next visit */
    }
    setSeen(next)
  }

  async function onExplain() {
    setBriefBusy(true)
    setBriefOffline(false)
    const res = await generateWeeklyBrief({
      weekStart: digest.weekStart,
      subjects: digest.subjects.map((s) => ({ subject: s.subject, topics: s.topics, minutesTotal: s.minutesTotal }))
    })
    setBriefBusy(false)
    if (res.source === 'offline' && res.brief.length === 0) setBriefOffline(true)
    setBrief(res.brief)
  }

  const briefBySubject = useMemo(() => {
    const map = new Map<string, SubjectBrief>()
    for (const b of brief || []) map.set(b.subject, b)
    return map
  }, [brief])

  return (
    <section aria-label="This week summary" className="mt-5">
      {ready && !dismissed && !open && (
        <div className="anim-fade-up flex flex-wrap items-center gap-3 rounded-2xl bg-indigo-600 px-5 py-4 text-white shadow-sm">
          <CalendarDays size={20} className="shrink-0" />
          <p className="min-w-0 flex-1 text-sm font-semibold">
            This week summary is ready ({fmtRange(digest.weekStart, digest.weekEnd)})
          </p>
          <button
            onClick={() => {
              setOpen(true)
              setCollapsed(false)
              markSeen()
            }}
            className="btn-lively rounded-full bg-white px-4 py-1.5 text-sm font-bold text-indigo-700"
          >
            View
          </button>
          <button
            onClick={() => {
              setDismissed(true)
              markSeen()
            }}
            aria-label="Dismiss weekly summary"
            className="btn-lively rounded-full p-1.5 text-white/80 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {(open || (!ready && taskCount > 0)) && (
        <div className="anim-fade-up rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">This week in class</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">{fmtRange(digest.weekStart, digest.weekEnd)}</span>
              <button
                onClick={() => {
                  const next = !collapsed
                  setCollapsed(next)
                  try {
                    if (next) localStorage.setItem(COLLAPSED_KEY, digest.weekStart)
                    else localStorage.removeItem(COLLAPSED_KEY)
                  } catch {
                    /* private mode: preference lasts this visit */
                  }
                }}
                aria-label={collapsed ? 'Expand summary' : 'Retract summary'}
                aria-expanded={!collapsed}
                className="btn-lively rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <ChevronDown size={16} className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />
              </button>
            </div>
          </div>

          <div className="expand open">
            <div>
              {!collapsed && (
              <div className="pt-3">
                <ul className="space-y-3">
            {digest.subjects.map((s) => (
              <li key={s.subject} className="rounded-xl bg-slate-50 px-4 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-bold">{s.subject}</p>
                  <p className="shrink-0 text-xs font-medium text-slate-500">
                    {s.done}/{s.total} done · {s.minutesTotal} min
                  </p>
                </div>
                <p className="mt-1 text-sm text-slate-600">{s.topics.join(', ')}</p>
                {briefBySubject.get(s.subject)?.concepts.map((c) => (
                  <p key={c.name} className="mt-1.5 text-sm">
                    <span className="font-semibold text-indigo-700">{c.name}.</span>{' '}
                    <span className="text-slate-600">{c.why}</span>
                  </p>
                ))}
              </li>
            ))}
          </ul>

          {digest.overdue.length > 0 && (
            <p className="mt-3 text-sm text-slate-600">
              <span className="font-semibold text-red-600">Carried over:</span>{' '}
              {digest.overdue.map((o) => o.title).join(', ')}
            </p>
          )}

          {!brief && (
            <button
              onClick={onExplain}
              disabled={briefBusy}
              className="btn-lively mt-4 flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 disabled:opacity-50"
            >
              <Sparkles size={16} />
              {briefBusy ? 'Summarizing concepts...' : 'Summarize the concepts with AI'}
            </button>
          )}
          {briefOffline && (
            <p className="mt-3 text-xs font-medium text-amber-700">
              AI concepts need a connection. Topics above are complete without it.
            </p>
          )}
              </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}  
