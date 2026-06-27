'use client'

import { usePathname } from 'next/navigation'
import { BellIcon, ActivityIcon } from 'lucide-react'

const TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Operations Overview',
    subtitle: 'Real-time snapshot of dispatch activity',
  },
  '/map': {
    title: 'Live Map',
    subtitle: 'Geographic view of all active work orders',
  },
  '/work-orders': {
    title: 'Work Orders',
    subtitle: 'Track and manage every job end-to-end',
  },
  '/workers': {
    title: 'Workforce',
    subtitle: 'Technicians, workload and performance',
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'Configure your workflow and team',
  },
}

export default function Header() {
  const pathname = usePathname()
  const meta = TITLES[pathname] ?? TITLES['/']
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
      <div>
        <h2 className="text-base font-bold text-slate-900 leading-none">
          {meta.title}
        </h2>
        <p className="text-xs text-slate-500 mt-1">{meta.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden md:inline text-xs text-slate-500 font-medium">
          {today}
        </span>

        <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-emerald-700">Live</span>
        </div>

        <button
          aria-label="Activity"
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ActivityIcon size={18} />
        </button>

        <button
          aria-label="Notifications"
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative"
        >
          <BellIcon size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}
