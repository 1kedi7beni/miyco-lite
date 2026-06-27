import Link from 'next/link'
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  ClockIcon,
  ListChecksIcon,
  MapIcon,
  MapPinIcon,
  PlusIcon,
  TrendingUpIcon,
  UserIcon,
  UsersIcon,
  ZapIcon,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [
    totalWorkers,
    activeWorkers,
    workOrders,
    recentLogs,
    urgentOrders,
    stageGroups,
  ] = await Promise.all([
    prisma.worker.count(),
    prisma.worker.count({ where: { isActive: true } }),
    prisma.workOrder.findMany({
      include: { assignedTo: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.stageLog.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        workOrder: { select: { woNumber: true, title: true } },
        stage: { select: { name: true, color: true } },
      },
    }),
    prisma.workOrder.findMany({
      where: { priority: { in: ['URGENT', 'CRITICAL'] } },
      include: { assignedTo: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.workflowStage.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    }),
  ])

  const counts = {
    pending: workOrders.filter((w) => w.status === 'PENDING').length,
    assigned: workOrders.filter((w) => w.status === 'ASSIGNED').length,
    inProgress: workOrders.filter((w) => w.status === 'IN_PROGRESS').length,
    completed: workOrders.filter((w) => w.status === 'COMPLETED').length,
  }

  const woByStage = new Map<number, number>()
  for (const s of stageGroups) woByStage.set(s.id, 0)
  for (const wo of workOrders) {
    if (wo.currentStageId) {
      woByStage.set(
        wo.currentStageId,
        (woByStage.get(wo.currentStageId) ?? 0) + 1,
      )
    }
  }
  const stageMax = Math.max(1, ...Array.from(woByStage.values()))

  const completionRate =
    workOrders.length > 0
      ? Math.round((counts.completed / workOrders.length) * 100)
      : 0

  const recent = workOrders.slice(0, 5)

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-8 text-white shadow-lg shadow-indigo-600/20">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-8 -bottom-8 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl" />
        <div className="relative flex items-start justify-between gap-6">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Dispatch Center
            </p>
            <h1 className="text-3xl font-black mt-1">
              {counts.pending} job{counts.pending === 1 ? '' : 's'} awaiting
              assignment
            </h1>
            <p className="text-indigo-100 mt-2 text-sm max-w-md">
              Review pending work, dispatch technicians via the live map, and
              monitor your team's progress in real time.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <Link
                href="/map"
                className="inline-flex items-center gap-2 bg-white text-indigo-700 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors shadow-sm"
              >
                <MapIcon size={16} /> Open Live Map
              </Link>
              <Link
                href="/work-orders"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors border border-white/20"
              >
                <PlusIcon size={16} /> New Work Order
              </Link>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
              Completion Rate
            </p>
            <p className="text-5xl font-black mt-1">{completionRate}%</p>
            <p className="text-xs text-indigo-200 mt-1">
              {counts.completed} of {workOrders.length} closed
            </p>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={<ClipboardListIcon size={20} />}
          label="Total Orders"
          value={workOrders.length}
          color="indigo"
          trend="All time"
        />
        <KpiCard
          icon={<ClockIcon size={20} />}
          label="Pending"
          value={counts.pending}
          color="amber"
          trend="Needs assignment"
        />
        <KpiCard
          icon={<ListChecksIcon size={20} />}
          label="Active"
          value={counts.assigned + counts.inProgress}
          color="blue"
          trend="In the field"
        />
        <KpiCard
          icon={<UsersIcon size={20} />}
          label="Active Workers"
          value={`${activeWorkers}/${totalWorkers}`}
          color="emerald"
          trend="Available now"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Workflow Pipeline</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribution of work orders across workflow stages
              </p>
            </div>
            <Link
              href="/work-orders"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              View all <ArrowRightIcon size={12} />
            </Link>
          </div>
          <div className="p-6 space-y-4">
            {stageGroups.map((s) => {
              const c = woByStage.get(s.id) ?? 0
              const pct = (c / stageMax) * 100
              const dot = COLOR_DOT[s.color] ?? 'bg-slate-500'
              const bar = COLOR_BAR[s.color] ?? 'bg-slate-500'
              return (
                <div key={s.id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dot}`} />
                      <span className="font-semibold text-slate-700">
                        {s.name}
                      </span>
                      {s.isFinal && (
                        <span className="text-[9px] font-bold uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Final
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {c}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {stageGroups.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">
                No workflow stages configured. Visit Settings to add stages.
              </p>
            )}
          </div>
        </div>

        {/* Urgent queue */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <ZapIcon size={16} className="text-rose-500" />
                Urgent Queue
              </h3>
              <span className="text-[10px] font-bold uppercase bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full">
                {urgentOrders.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Critical & urgent priority jobs
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {urgentOrders.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                <CheckCircle2Icon
                  size={32}
                  className="text-emerald-400 mx-auto mb-2"
                />
                No urgent jobs in queue
              </div>
            ) : (
              urgentOrders.map((wo) => (
                <Link
                  key={wo.id}
                  href="/work-orders"
                  className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors"
                >
                  <span
                    className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                      wo.priority === 'CRITICAL'
                        ? 'bg-rose-500'
                        : 'bg-orange-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-indigo-600">
                      #{wo.woNumber}
                    </p>
                    <p className="font-semibold text-slate-800 text-sm truncate">
                      {wo.title}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPinIcon size={10} />
                      <span className="truncate">
                        {wo.locationName || 'No location'}
                      </span>
                      {wo.assignedTo && (
                        <span className="text-slate-400">
                          · {wo.assignedTo.name}
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent work orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Recent Activity</h3>
            <Link
              href="/work-orders"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              All orders <ArrowRightIcon size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recent.map((wo) => (
              <Link
                key={wo.id}
                href="/work-orders"
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                  <ClipboardListIcon size={18} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-indigo-600">
                      #{wo.woNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        wo.priority === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700'
                          : wo.priority === 'URGENT'
                          ? 'bg-orange-100 text-orange-700'
                          : wo.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {wo.priority}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm truncate">
                    {wo.title}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      wo.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-700'
                        : wo.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {wo.status}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {wo.assignedTo ? (
                      <span className="flex items-center gap-1 justify-end">
                        <UserIcon size={10} />
                        {wo.assignedTo.name}
                      </span>
                    ) : (
                      'Unassigned'
                    )}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <TrendingUpIcon size={16} className="text-indigo-500" />
              Activity Stream
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Latest stage moves</p>
          </div>
          <div className="p-4 space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                No activity yet
              </p>
            ) : (
              recentLogs.map((log) => {
                const dot = COLOR_DOT[log.stage.color] ?? 'bg-slate-400'
                return (
                  <div key={log.id} className="flex gap-3">
                    <div className="relative shrink-0">
                      <span
                        className={`block w-2 h-2 rounded-full mt-2 ${dot}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700">
                        #{log.workOrder.woNumber} ·{' '}
                        <span className="text-slate-500 font-normal">
                          {log.workOrder.title}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        → {log.stage.name}
                        {log.movedBy && (
                          <span className="text-slate-400">
                            {' '}
                            by {log.movedBy}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {timeAgo(log.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  color,
  trend,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: 'indigo' | 'amber' | 'blue' | 'emerald'
  trend: string
}) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-xl ${colorMap[color]}`}>{icon}</div>
      </div>
      <p className="text-3xl font-black text-slate-900 mt-3">{value}</p>
      <p className="text-sm font-semibold text-slate-700 mt-1">{label}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{trend}</p>
    </div>
  )
}

const COLOR_DOT: Record<string, string> = {
  slate: 'bg-slate-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  purple: 'bg-purple-500',
}

const COLOR_BAR: Record<string, string> = {
  slate: 'bg-slate-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  purple: 'bg-purple-500',
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
