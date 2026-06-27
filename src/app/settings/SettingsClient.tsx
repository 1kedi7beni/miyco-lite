'use client'

import { useState, useTransition } from 'react'
import {
  PlusIcon,
  TrashIcon,
  SaveIcon,
  XIcon,
  Loader2Icon,
  CheckCircle2Icon,
  FlagIcon,
  StarIcon,
  UsersIcon,
  SettingsIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from 'lucide-react'
import {
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
  createWorker,
  toggleWorkerActive,
} from '../actions'

type Stage = {
  id: number
  name: string
  slug: string
  description: string | null
  color: string
  order: number
  isActive: boolean
  isInitial: boolean
  isFinal: boolean
  requiresAssignee: boolean
}

type Worker = {
  id: number
  name: string
  email: string
  role: string
  isActive: boolean
}

const COLORS = [
  { name: 'slate', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' },
  { name: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  { name: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  { name: 'amber', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  { name: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  { name: 'rose', bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500' },
  { name: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
]

function getColorClasses(name: string) {
  return (
    COLORS.find((c) => c.name === name) ?? {
      name,
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      dot: 'bg-slate-500',
    }
  )
}

export default function SettingsClient({
  initialStages,
  initialWorkers,
}: {
  initialStages: any[]
  initialWorkers: any[]
}) {
  const [tab, setTab] = useState<'workflow' | 'workers'>('workflow')
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers)
  const [showNewStage, setShowNewStage] = useState(false)
  const [showNewWorker, setShowNewWorker] = useState(false)
  const [busy, setBusy] = useState(false)
  const [, startTransition] = useTransition()

  const handleMoveStage = (id: number, dir: -1 | 1) => {
    const idx = stages.findIndex((s) => s.id === id)
    if (idx < 0) return
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= stages.length) return
    const newArr = [...stages]
    const [item] = newArr.splice(idx, 1)
    newArr.splice(newIdx, 0, item)
    setStages(newArr)
    startTransition(async () => {
      await reorderStages(newArr.map((s) => s.id))
    })
  }

  const handleToggleActive = (s: Stage) => {
    setStages((prev) =>
      prev.map((x) => (x.id === s.id ? { ...x, isActive: !x.isActive } : x)),
    )
    startTransition(async () => {
      await updateStage(s.id, { isActive: !s.isActive })
    })
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this stage? Work orders in this stage will be moved to the initial stage.')) return
    setBusy(true)
    try {
      await deleteStage(id)
      setStages((prev) => prev.filter((s) => s.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete stage')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Configure the dispatch workflow stages and manage your team.
        </p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <TabButton
          active={tab === 'workflow'}
          onClick={() => setTab('workflow')}
          icon={<FlagIcon size={16} />}
          label="Workflow Stages"
        />
        <TabButton
          active={tab === 'workers'}
          onClick={() => setTab('workers')}
          icon={<UsersIcon size={16} />}
          label="Workers"
        />
      </div>

      {tab === 'workflow' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-800">Workflow Stages</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Define the steps each work order moves through, from intake to completion.
              </p>
            </div>
            <button
              onClick={() => setShowNewStage(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              <PlusIcon size={16} /> Add Stage
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stages.map((s, idx) => {
              const color = getColorClasses(s.color)
              return (
                <div
                  key={s.id}
                  className={`p-4 flex items-center gap-4 ${
                    s.isActive ? 'bg-white' : 'bg-slate-50/50'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveStage(s.id, -1)}
                      disabled={idx === 0 || busy}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <ArrowUpIcon size={14} />
                    </button>
                    <button
                      onClick={() => handleMoveStage(s.id, 1)}
                      disabled={idx === stages.length - 1 || busy}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <ArrowDownIcon size={14} />
                    </button>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-slate-500 text-sm">
                    {s.order}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${color.bg} ${color.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                        {s.name}
                      </span>
                      {s.isInitial && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase">
                          Initial
                        </span>
                      )}
                      {s.isFinal && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 uppercase">
                          Final
                        </span>
                      )}
                      {s.requiresAssignee && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 uppercase">
                          Needs Assignee
                        </span>
                      )}
                      {!s.isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600 uppercase">
                          Disabled
                        </span>
                      )}
                    </div>
                    {s.description && (
                      <p className="text-xs text-slate-500 truncate">{s.description}</p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      slug: {s.slug}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleActive(s)}
                    disabled={busy}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      s.isActive
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.isActive ? 'Active' : 'Inactive'}
                  </button>

                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={busy || s.isInitial}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                    title={s.isInitial ? 'Cannot delete initial stage' : 'Delete stage'}
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'workers' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-800">Team Members</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add technicians and experts who can be assigned work orders.
              </p>
            </div>
            <button
              onClick={() => setShowNewWorker(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              <PlusIcon size={16} /> Add Worker
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {workers.map((w) => (
              <div key={w.id} className="p-4 flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    w.role === 'EXPERT'
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                      : 'bg-gradient-to-br from-slate-400 to-slate-600'
                  }`}
                >
                  {w.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800 text-sm">
                      {w.name}
                    </h3>
                    {w.role === 'EXPERT' && (
                      <StarIcon size={12} className="text-amber-500 fill-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{w.email}</p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {w.role}
                </span>
                <button
                  onClick={() => {
                    setWorkers((prev) =>
                      prev.map((x) =>
                        x.id === w.id ? { ...x, isActive: !x.isActive } : x,
                      ),
                    )
                    startTransition(async () => {
                      await toggleWorkerActive(w.id, !w.isActive)
                    })
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    w.isActive
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {w.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showNewStage && (
        <NewStageModal
          nextOrder={stages.length + 1}
          onClose={() => setShowNewStage(false)}
          onCreate={async (input) => {
            setBusy(true)
            try {
              await createStage(input)
              setShowNewStage(false)
            } finally {
              setBusy(false)
            }
          }}
        />
      )}

      {showNewWorker && (
        <NewWorkerModal
          onClose={() => setShowNewWorker(false)}
          onCreate={async (input) => {
            setBusy(true)
            try {
              await createWorker(input)
              setShowNewWorker(false)
            } finally {
              setBusy(false)
            }
          }}
        />
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
        active
          ? 'border-indigo-600 text-indigo-700'
          : 'border-transparent text-slate-600 hover:text-slate-800'
      }`}
    >
      {icon} {label}
    </button>
  )
}

function NewStageModal({
  nextOrder,
  onClose,
  onCreate,
}: {
  nextOrder: number
  onClose: () => void
  onCreate: (input: {
    name: string
    slug: string
    description?: string
    color?: string
    order: number
    isInitial?: boolean
    isFinal?: boolean
    requiresAssignee?: boolean
  }) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('slate')
  const [isInitial, setIsInitial] = useState(false)
  const [isFinal, setIsFinal] = useState(false)
  const [requiresAssignee, setRequiresAssignee] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleName = (v: string) => {
    setName(v)
    setSlug(
      v
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    )
  }

  const submit = async () => {
    if (!name.trim() || !slug.trim()) return
    setSubmitting(true)
    try {
      await onCreate({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        color,
        order: nextOrder,
        isInitial,
        isFinal,
        requiresAssignee,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FlagIcon className="text-indigo-500" size={20} />
            New Workflow Stage
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <XIcon size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <Field label="Name *">
            <input
              value={name}
              onChange={(e) => handleName(e.target.value)}
              placeholder="e.g. Inspection"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </Field>

          <Field label="Slug (URL-safe) *">
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="inspection"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What happens at this stage..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </Field>

          <Field label="Color">
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.name)}
                  className={`w-8 h-8 rounded-full ${c.dot} ring-2 transition-all ${
                    color === c.name
                      ? 'ring-slate-900 scale-110'
                      : 'ring-transparent hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </Field>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Checkbox
              checked={isInitial}
              onChange={setIsInitial}
              label="Initial stage"
              hint="Where new work orders start (only one allowed)"
            />
            <Checkbox
              checked={isFinal}
              onChange={setIsFinal}
              label="Final stage"
              hint="Marks work as completed"
            />
            <Checkbox
              checked={requiresAssignee}
              onChange={setRequiresAssignee}
              label="Requires assigned technician"
              hint="Cannot enter this stage without an assigned worker"
            />
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim() || !slug.trim() || submitting}
            className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2Icon size={14} className="animate-spin" />}
            Create Stage
          </button>
        </div>
      </div>
    </div>
  )
}

function NewWorkerModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (input: {
    name: string
    email: string
    role: 'TECHNICIAN' | 'EXPERT'
  }) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'TECHNICIAN' | 'EXPERT'>('TECHNICIAN')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!name.trim() || !email.trim()) return
    setSubmitting(true)
    try {
      await onCreate({ name: name.trim(), email: email.trim(), role })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <UsersIcon className="text-indigo-500" size={20} />
            New Worker
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <XIcon size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <Field label="Full Name *">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Smith"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </Field>
          <Field label="Email *">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@miyco.io"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </Field>
          <Field label="Role">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'TECHNICIAN' | 'EXPERT')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="TECHNICIAN">Technician</option>
              <option value="EXPERT">Expert</option>
            </select>
          </Field>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim() || !email.trim() || submitting}
            className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2Icon size={14} className="animate-spin" />}
            Create Worker
          </button>
        </div>
      </div>
    </div>
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

function Checkbox({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <label className="flex items-start gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 rounded text-indigo-600 focus:ring-2 focus:ring-indigo-500"
      />
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    </label>
  )
}