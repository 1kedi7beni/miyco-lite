'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  BriefcaseIcon,
  CheckCircle2Icon,
  ListChecksIcon,
  Loader2Icon,
  MapPinIcon,
  PlusIcon,
  XIcon,
  ZapIcon,
} from 'lucide-react'
import MapWrapper from '@/components/MapWrapper'
import {
  assignWorkOrder,
  suggestTechnician,
  type TechnicianSuggestion,
} from '../actions'

type Worker = {
  id: number
  name: string
  email: string
  role: string
  isActive: boolean
  workOrders: { id: number; status: string }[]
}

type WorkOrder = {
  id: number
  woNumber: string
  title: string
  status: string
  priority: string
  locationName: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  assignedToId: number | null
}

export default function MapClient({
  initialWorkers,
  initialWorkOrders,
}: {
  initialWorkers: Worker[]
  initialWorkOrders: WorkOrder[]
}) {
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null)
  const [smartModalWo, setSmartModalWo] = useState<WorkOrder | null>(null)
  const [suggestions, setSuggestions] = useState<TechnicianSuggestion[]>([])
  const [loadingSuggest, setLoadingSuggest] = useState(false)
  const [pending, startTransition] = useTransition()
  const [busyWoId, setBusyWoId] = useState<number | null>(null)
  const [view, setView] = useState<'PENDING' | 'ALL'>('PENDING')

  const pendingWos = useMemo(
    () => initialWorkOrders.filter((w) => w.status === 'PENDING'),
    [initialWorkOrders],
  )

  const displayWos = useMemo(
    () =>
      view === 'PENDING'
        ? pendingWos
        : initialWorkOrders.filter((w) => w.status !== 'PENDING'),
    [initialWorkOrders, pendingWos, view],
  )

  const stats = useMemo(() => {
    return {
      total: initialWorkOrders.length,
      pending: pendingWos.length,
      assigned: initialWorkOrders.filter((w) => w.status === 'ASSIGNED').length,
      inProgress: initialWorkOrders.filter((w) => w.status === 'IN_PROGRESS').length,
      completed: initialWorkOrders.filter((w) => w.status === 'COMPLETED').length,
    }
  }, [initialWorkOrders, pendingWos])

  const handleSmartAssign = async (wo: WorkOrder) => {
    setSmartModalWo(wo)
    setLoadingSuggest(true)
    try {
      const suggs = await suggestTechnician(wo.id)
      setSuggestions(suggs)
    } finally {
      setLoadingSuggest(false)
    }
  }

  const handleAssign = (woId: number, workerId: number) => {
    setBusyWoId(woId)
    setSmartModalWo(null)
    startTransition(async () => {
      try {
        await assignWorkOrder(woId, workerId)
      } finally {
        setBusyWoId(null)
      }
    })
  }

  const closeModal = () => {
    setSmartModalWo(null)
    setSuggestions([])
  }

  return (
    <div className="flex h-full bg-slate-50">
      {/* Left: Workers */}
      <div className="w-80 flex flex-col bg-white border-r border-slate-200">
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-sm">Technicians</h2>
            <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px]">
              {initialWorkers.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Pick a technician, then assign a pending job
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {initialWorkers.map((w) => {
            const isSelected = selectedWorkerId === w.id
            const active = w.workOrders.length
            return (
              <button
                key={w.id}
                onClick={() => setSelectedWorkerId(isSelected ? null : w.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50/50'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                      w.role === 'EXPERT'
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                        : 'bg-gradient-to-br from-slate-400 to-slate-600'
                    }`}
                  >
                    {w.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-bold text-slate-800 text-sm truncate">
                      {w.name}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <BriefcaseIcon size={10} />
                      {active} active task{active === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Middle: Map */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="grid grid-cols-5 gap-2 p-3 bg-white border-b border-slate-200">
          <MiniStat label="Total" value={stats.total} color="slate" />
          <MiniStat label="Pending" value={stats.pending} color="amber" />
          <MiniStat label="Assigned" value={stats.assigned} color="blue" />
          <MiniStat label="Active" value={stats.inProgress} color="indigo" />
          <MiniStat label="Done" value={stats.completed} color="emerald" />
        </div>
        <div className="flex-1 relative bg-slate-100">
          <MapWrapper workOrders={initialWorkOrders} />
        </div>
      </div>

      {/* Right: Job queue */}
      <div className="w-96 flex flex-col bg-white border-l border-slate-200">
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900 text-sm">Job Queue</h2>
            <span className="bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded text-[10px]">
              {pendingWos.length} pending
            </span>
          </div>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setView('PENDING')}
              className={`flex-1 text-[11px] font-semibold py-1.5 rounded-md transition-all ${
                view === 'PENDING'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Pending ({pendingWos.length})
            </button>
            <button
              onClick={() => setView('ALL')}
              className={`flex-1 text-[11px] font-semibold py-1.5 rounded-md transition-all ${
                view === 'ALL'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Assigned ({initialWorkOrders.length - pendingWos.length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {displayWos.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2Icon
                size={32}
                className="text-emerald-400 mx-auto mb-2"
              />
              <p className="text-xs text-slate-500">
                {view === 'PENDING'
                  ? 'All jobs assigned!'
                  : 'No assigned jobs'}
              </p>
            </div>
          ) : (
            displayWos.map((wo) => {
              const isBusy = busyWoId === wo.id
              const isPending = wo.status === 'PENDING'
              return (
                <div
                  key={wo.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isPending
                      ? 'border-slate-200 bg-white hover:border-indigo-300'
                      : 'border-slate-100 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-[10px] font-black text-indigo-600">
                          #{wo.woNumber}
                        </span>
                        <PriorityBadge priority={wo.priority} />
                      </div>
                      <p className="font-semibold text-slate-800 text-sm truncate">
                        {wo.title}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPinIcon size={10} />
                        <span className="truncate">
                          {wo.locationName || 'No location'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {isPending ? (
                    selectedWorkerId ? (
                      <button
                        onClick={() => handleAssign(wo.id, selectedWorkerId)}
                        disabled={isBusy}
                        className="w-full py-1.5 bg-indigo-600 text-white rounded-md text-[11px] font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isBusy ? (
                          <Loader2Icon size={12} className="animate-spin" />
                        ) : (
                          <PlusIcon size={12} />
                        )}
                        Assign to Selected
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSmartAssign(wo)}
                        disabled={isBusy}
                        className="w-full py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-semibold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isBusy ? (
                          <Loader2Icon size={12} className="animate-spin" />
                        ) : (
                          <ZapIcon size={12} />
                        )}
                        Smart Assignment
                      </button>
                    )
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        wo.status === 'IN_PROGRESS'
                          ? 'bg-indigo-100 text-indigo-700'
                          : wo.status === 'ASSIGNED'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {wo.status === 'COMPLETED' && <CheckCircle2Icon size={9} />}
                      {wo.status === 'IN_PROGRESS' && <ListChecksIcon size={9} />}
                      {wo.status === 'ASSIGNED'
                        ? 'Assigned'
                        : wo.status === 'IN_PROGRESS'
                        ? 'In Progress'
                        : 'Completed'}
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Smart assign modal */}
      {smartModalWo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-teal-50">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <ZapIcon className="text-emerald-500" size={16} />
                  Best Match
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  #{smartModalWo.woNumber} · {smartModalWo.title}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-700"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="p-4 space-y-2">
              {loadingSuggest ? (
                <div className="text-center py-6 text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2Icon size={14} className="animate-spin" />
                  Analyzing...
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No active technicians
                </div>
              ) : (
                suggestions.map((tech, i) => (
                  <div
                    key={tech.id}
                    className="flex items-center justify-between p-2.5 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                          i === 0
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                            : i === 1
                            ? 'bg-gradient-to-br from-slate-400 to-slate-500'
                            : 'bg-gradient-to-br from-orange-400 to-orange-600'
                        }`}
                      >
                        #{i + 1}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-xs">
                          {tech.name}
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                          <span>{tech.activeTasks} active</span>
                          {tech.distanceKm != null && (
                            <span>· {tech.distanceKm} km</span>
                          )}
                          <span
                            className={`font-bold ${
                              tech.score >= 70
                                ? 'text-emerald-600'
                                : tech.score >= 40
                                ? 'text-amber-600'
                                : 'text-slate-500'
                            }`}
                          >
                            {tech.score} pts
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssign(smartModalWo.id, tech.id)}
                      className="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded hover:bg-indigo-700"
                    >
                      Assign
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {pending && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg flex items-center gap-2 z-50">
          <Loader2Icon size={12} className="animate-spin" /> Processing...
        </div>
      )}
    </div>
  )
}

function MiniStat({
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
    <div className={`p-2 rounded-lg border ${colorMap[color]}`}>
      <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">
        {label}
      </p>
      <p className="text-base font-black">{value}</p>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    CRITICAL: 'bg-rose-100 text-rose-700',
    URGENT: 'bg-orange-100 text-orange-700',
    HIGH: 'bg-amber-100 text-amber-700',
    MEDIUM: 'bg-slate-100 text-slate-700',
    LOW: 'bg-slate-100 text-slate-500',
  }
  return (
    <span
      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
        styles[priority] ?? 'bg-slate-100 text-slate-700'
      }`}
    >
      {priority}
    </span>
  )
}