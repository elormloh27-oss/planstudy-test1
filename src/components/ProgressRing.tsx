export default function ProgressRing({ done, total, size = 44 }: { done: number; total: number; size?: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  const r = 18
  const circ = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% complete`}>
      <svg width={size} height={size} viewBox="0 0 44 44" className="-rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#E2E8F0" strokeWidth="6" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="#4F46E5"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * pct) / 100}
          style={{ transition: 'stroke-dashoffset 0.4s cubic-bezier(0.32,0.72,0,1)' }}
        />
      </svg>
      <span className="text-sm font-bold tabular-nums">{pct}%</span>
    </div>
  )
}

export function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-indigo-600 transition-all duration-500 ease-spring" style={{ width: `${pct}%` }} />
    </div>
  )
} 
