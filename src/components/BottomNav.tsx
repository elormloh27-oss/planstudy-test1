import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, PlusCircle, BarChart3 } from 'lucide-react'
import { useSession } from '@/hooks/useSession'

export default function BottomNav() {
  const { email, demo } = useSession()
  if (!email && !demo) return null
  const tabs = [
    { to: '/dashboard', label: 'Plans', icon: LayoutDashboard },
    { to: '/today', label: 'Today', icon: CalendarDays },
    { to: '/new', label: 'New', icon: PlusCircle },
    { to: '/stats', label: 'Stats', icon: BarChart3 }
  ]
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur-xl sm:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-4">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${isActive ? 'text-indigo-600' : 'text-slate-500'}`
            }
          >
            <t.icon size={20} />
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
} 
