'use client'

import { useMemo, useState } from 'react'
import {
  PlusIcon,
  MailIcon,
  BriefcaseIcon,
  CheckCircle2Icon,
  ClockIcon,
  SearchIcon,
  TrendingUpIcon,
  StarIcon,
} from 'lucide-react'

type Worker = {
  id: number
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  workOrders: {
    id: number
    status: string
    priority: string
    completedAt: string | null
    scheduledDate: string | null
  }[]
}

const ROLE_LABELS: Record<string, string> = {
  TECHNICIAN: 'Technician',
  EXPERT: 'Expert',
}

export default function WorkersClient({
  initialWorkers,
}: {
  initialWorkers: any[]
}) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return initialWorkers
    const q = search.toLowerCase()
    return initialWorkers.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.email.toLowerCase().includes(q) ||
        w.role.toLowerCase().includes(q),
    )
  }, [initialWorkers, search])

  const totals = useMemo(() => {
    const all = initialWorkers
    return {
      count: all.length,
      active: all.filter((w) => w.isActive).length,
      experts: all.filter((w) => w.role === 'EXPERT').length,
      totalTasks: all.reduce((acc, w) => acc + w.workOrders.length, 0),
    }
  }, [initialWorkers])

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatTile label="Total Workers" value={totals.count} color="indigo" />
        <StatTile label="Active" value={totals.active} color="emerald" />
        <StatTile label="Experts" value={totals.experts} color="amber" />
        <StatTile label="Total Tasks" value={totals.totalTasks} color="slate" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Workers</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage field technicians and monitor their current workload.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchIcon
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search workers..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm shadow-indigo-600/20">
            <PlusIcon size={18} /> New Worker
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((worker) => {
          const active = worker.workOrders.filter((w) =>
            ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(w.status),
          )
          const completed = worker.workOrders.filter(
            (w) => w.status === 'COMPLETED',
          )
          const urgent = worker.workOrders.filter((w) =>
            ['URGENT', 'CRITICAL'].includes(w.priority),
          )
          const completionRate =
            worker.workOrders.length > 0
              ? Math.round((completed.length / worker.workOrders.length) * 100)
              : 0

          const roleColor =
            worker.role === 'EXPERT'
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-slate-100 text-slate-700'

          return (
            <div
              key={worker.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-black text-white shadow-md shadow-indigo-600/20">
                  {worker.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-lg truncate">
                      {worker.name}
                    </h3>
                    {worker.role === 'EXPERT' && (
                      <StarIcon size={14} className="text-amber-500 fill-amber-500" />
                    )}
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mt-1 ${roleColor}`}
                  >
                    {ROLE_LABELS[worker.role] ?? worker.role}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-sm text-slate-500 truncate">
                  <MailIcon size={16} className="shrink-0" />
                  <span className="truncate">{worker.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <BriefcaseIcon size={16} /> Field Staff
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                  <span>Completion Rate</span>
                  <span className="text-emerald-600">{completionRate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                <Stat
                  icon={<ClockIcon size={14} />}
                  label="Active"
                  value={active.length}
                  color="indigo"
                />
                <Stat
                  icon={<CheckCircle2Icon size={14} />}
                  label="Done"
                  value={completed.length}
                  color="emerald"
                />
                <Stat
                  icon={<TrendingUpIcon size={14} />}
                  label="Urgent"
                  value={urgent.length}
                  color="rose"
                />
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          {initialWorkers.length === 0
            ? 'No workers found.'
            : 'No workers match the search.'}
        </div>
      )}
    </div>
  )
}

function StatTile({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: 'indigo' | 'emerald' | 'amber' | 'slate'
}) {
  const map: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  }
  return (
    <div className={`p-4 rounded-2xl border ${map[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
        {label}
      </p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'indigo' | 'emerald' | 'rose'
}) {
  const colors: Record<string, string> = {
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
  }
  return (
    <div>
      <div
        className={`flex items-center gap-1 text-xs text-slate-500 font-medium mb-1 ${colors[color]}`}
      >
        {icon} {label}
      </div>
      <p className={`text-xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  )
}