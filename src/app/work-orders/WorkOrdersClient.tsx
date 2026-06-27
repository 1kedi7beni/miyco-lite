'use client';

import { useMemo, useState, useTransition } from 'react'
import {
  PlusIcon,
  FileTextIcon,
  SearchIcon,
  FilterIcon,
  CheckCircle2Icon,
  PlayIcon,
  XIcon,
  Loader2Icon,
  MapPinIcon,
  ClipboardListIcon,
} from 'lucide-react'
import {
  assignWorkOrder,
  unassignWorkOrder,
  startWorkOrder,
  completeWorkOrder,
  createWorkOrder,
  moveStage,
} from '../actions'
import LocationPicker from '@/components/LocationPicker'
import NewWorkOrderWizard from './NewWorkOrderWizard'

type WorkOrderStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'

type Stage = {
  id: number
  name: string
  slug: string
  color: string
  order: number
  isInitial: boolean
  isFinal: boolean
}

type Worker = { id: number; name: string; role: string }
type WorkOrder = {
  id: number
  woNumber: string
  title: string
  description: string | null
  priority: string
  status: string
  locationName: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  assignedToId: number | null
  assignedTo: Worker | null
  currentStageId: number | null
  scheduledDate: string | null
  completedAt: string | null
  createdAt: string
}

const STATUS_STYLES: Record<WorkOrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-200 text-slate-700',
}

const PRIORITY_STYLES: Record<WorkOrderPriority, string> = {
  CRITICAL: 'bg-rose-100 text-rose-700',
  URGENT: 'bg-orange-100 text-orange-700',
  HIGH: 'bg-amber-100 text-amber-700',
  MEDIUM: 'bg-slate-100 text-slate-700',
  LOW: 'bg-slate-100 text-slate-500',
}

const PRIORITY_LABELS: Record<WorkOrderPriority, string> = {
  CRITICAL: 'Critical',
  URGENT: 'Urgent',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
}

export default function WorkOrdersClient({
  initialWorkOrders,
  workers,
  stages,
}: {
  initialWorkOrders: any[]
  workers: any[]
  stages: any[]
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | WorkOrderStatus>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | WorkOrderPriority>('ALL')
  const [stageFilter, setStageFilter] = useState<'ALL' | number>('ALL')
  const [showNew, setShowNew] = useState(false)
  const [, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<number | null>(null)
  const [globalPending, setGlobalPending] = useState(false)

  const filtered = useMemo(() => {
    return initialWorkOrders.filter((wo) => {
      if (statusFilter !== 'ALL' && wo.status !== statusFilter) return false
      if (priorityFilter !== 'ALL' && wo.priority !== priorityFilter) return false
      if (stageFilter !== 'ALL' && wo.currentStageId !== stageFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (
          !wo.title.toLowerCase().includes(q) &&
          !wo.woNumber.toLowerCase().includes(q) &&
          !(wo.locationName?.toLowerCase().includes(q) ?? false)
        )
          return false
      }
      return true
    })
  }, [initialWorkOrders, search, statusFilter, priorityFilter, stageFilter])

  const counts = useMemo(() => {
    return {
      total: initialWorkOrders.length,
      pending: initialWorkOrders.filter((o) => o.status === 'PENDING').length,
      assigned: initialWorkOrders.filter((o) => o.status === 'ASSIGNED').length,
      inProgress: initialWorkOrders.filter((o) => o.status === 'IN_PROGRESS').length,
      completed: initialWorkOrders.filter((o) => o.status === 'COMPLETED').length,
    }
  }, [initialWorkOrders])

  const stageById = useMemo(() => {
    const map: Record<number, Stage> = {}
    stages.forEach((s) => (map[s.id] = s))
    return map
  }, [stages])

  const withBusy = (id: number, fn: () => Promise<unknown>) => {
    setBusyId(id)
    setGlobalPending(true)
    startTransition(async () => {
      try {
        await fn()
      } finally {
        setBusyId(null)
        setGlobalPending(false)
      }
    })
  }

  const stagesForWo = (wo: WorkOrder): Stage[] => {
    const currentOrder = stageById[wo.currentStageId ?? -1]?.order ?? 1
    return stages.filter((s) => s.order >= currentOrder)
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total" value={counts.total} color="slate" />
        <StatCard label="Pending" value={counts.pending} color="amber" />
        <StatCard label="Assigned" value={counts.assigned} color="blue" />
        <StatCard label="In Progress" value={counts.inProgress} color="indigo" />
        <StatCard label="Completed" value={counts.completed} color="emerald" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Work Orders</h1>
          <p className="text-slate-500 text-sm mt-1">
            Track all tasks in the system and their current workflow stage.
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm shadow-indigo-600/20"
        >
          <PlusIcon size={18} /> New Work Order
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <SearchIcon
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search by title, number or location..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <FilterIcon size={16} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'ALL' | WorkOrderStatus)
              }
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as 'ALL' | WorkOrderPriority)
              }
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={stageFilter === 'ALL' ? 'ALL' : String(stageFilter)}
              onChange={(e) =>
                setStageFilter(
                  e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value, 10),
                )
              }
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Stages</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                <th className="px-6 py-4 font-semibold">Number</th>
                <th className="px-6 py-4 font-semibold">Title & Location</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Priority</th>
                <th className="px-6 py-4 font-semibold">Stage</th>
                <th className="px-6 py-4 font-semibold">Assigned To</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((wo) => {
                const isBusy = busyId === wo.id
                const stage = wo.currentStageId ? stageById[wo.currentStageId] : null
                return (
                  <tr key={wo.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-indigo-600 text-sm">
                      #{wo.woNumber}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 text-sm">
                        {wo.title}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPinIcon size={11} />
                        {wo.locationName || 'No location'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          STATUS_STYLES[wo.status as WorkOrderStatus] ??
                          'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {wo.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          PRIORITY_STYLES[wo.priority as WorkOrderPriority] ??
                          'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {PRIORITY_LABELS[wo.priority as WorkOrderPriority] ??
                          wo.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {stage ? (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-${stage.color}-100 text-${stage.color}-700`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full bg-${stage.color}-500`}
                          />
                          {stage.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {wo.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                            {wo.assignedTo.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-slate-700">
                            {wo.assignedTo.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 italic">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isBusy && (
                          <Loader2Icon
                            size={14}
                            className="animate-spin text-indigo-600 mr-1"
                          />
                        )}

                        {wo.status === 'PENDING' && (
                          <AssignSelect
                            workers={workers}
                            disabled={isBusy}
                            onAssign={(wid) =>
                              withBusy(wo.id, () => assignWorkOrder(wo.id, wid))
                            }
                          />
                        )}

                        {wo.status === 'ASSIGNED' && (
                          <>
                            <ActionButton
                              onClick={() =>
                                withBusy(wo.id, () => startWorkOrder(wo.id))
                              }
                              disabled={isBusy}
                              icon={<PlayIcon size={14} />}
                              label="Start"
                              color="indigo"
                            />
                            <ActionButton
                              onClick={() =>
                                withBusy(wo.id, () => unassignWorkOrder(wo.id))
                              }
                              disabled={isBusy}
                              icon={<XIcon size={14} />}
                              label="Unassign"
                              color="slate"
                            />
                          </>
                        )}

                        {wo.status === 'IN_PROGRESS' && (
                          <ActionButton
                            onClick={() =>
                              withBusy(wo.id, () => completeWorkOrder(wo.id))
                            }
                            disabled={isBusy}
                            icon={<CheckCircle2Icon size={14} />}
                            label="Complete"
                            color="emerald"
                          />
                        )}

                        {wo.status === 'COMPLETED' && (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}

                        {/* Stage mover */}
                        {stagesForWo(wo).length > 1 &&
                          wo.status !== 'COMPLETED' && (
                            <select
                              disabled={isBusy}
                              defaultValue=""
                              onChange={(e) => {
                                const id = parseInt(e.target.value, 10)
                                if (id) {
                                  withBusy(wo.id, () => moveStage(wo.id, id))
                                }
                                e.currentTarget.value = ''
                              }}
                              className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ml-1"
                              title="Move to stage"
                            >
                              <option value="" disabled>
                                Move...
                              </option>
                              {stagesForWo(wo)
                                .filter((s) => s.id !== wo.currentStageId)
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    → {s.name}
                                  </option>
                                ))}
                            </select>
                          )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            {initialWorkOrders.length === 0
              ? 'No work orders found.'
              : 'No work orders match the filters.'}
          </div>
        )}
      </div>

      {showNew && (
        <NewWorkOrderWizard onClose={() => setShowNew(false)} onCreated={(n) => { setShowNew(false); setGlobalPending(true); setTimeout(() => setGlobalPending(false), 600); }} />
      )}

      {globalPending && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm shadow-lg flex items-center gap-2 z-50">
          <Loader2Icon size={16} className="animate-spin" /> Processing...
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: 'slate' | 'amber' | 'blue' | 'indigo' | 'emerald'
}) {
  const colorMap: Record<string, string> = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  return (
    <div className={`p-4 rounded-2xl border ${colorMap[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
        {label}
      </p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  )
}

function ActionButton({
  onClick,
  disabled,
  icon,
  label,
  color,
}: {
  onClick: () => void
  disabled?: boolean
  icon: React.ReactNode
  label: string
  color: 'indigo' | 'slate' | 'emerald'
}) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
    slate: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${colors[color]} disabled:opacity-50`}
    >
      {icon} {label}
    </button>
  )
}

function AssignSelect({
  workers,
  onAssign,
  disabled,
}: {
  workers: any[]
  onAssign: (workerId: number) => void
  disabled?: boolean
}) {
  return (
    <select
      disabled={disabled}
      defaultValue=""
      onChange={(e) => {
        if (e.target.value) onAssign(parseInt(e.target.value, 10))
        e.currentTarget.value = ''
      }}
      className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
    >
      <option value="" disabled>
        Assign...
      </option>
      {workers.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name}
        </option>
      ))}
    </select>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}
