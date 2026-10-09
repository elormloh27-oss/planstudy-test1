import type { ReactNode } from 'react'

export default function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
      {icon}
      <p className="mt-3 text-lg font-semibold">{title}</p>
      <p className="mt-1 text-slate-600">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
} 
