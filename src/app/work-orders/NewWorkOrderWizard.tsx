'use client'

import { useState } from 'react'
import {
  XIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  MapPinIcon,
  FlagIcon,
  SparklesIcon,
  Loader2Icon,
  AlertCircleIcon,
  CalendarIcon,
  FileTextIcon,
  SearchIcon,
} from 'lucide-react'
import { createWorkOrder } from '../actions'
import LocationPicker from '@/components/LocationPicker'

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'

const PRIORITY_OPTIONS: {
  value: Priority
  label: string
  description: string
  color: string
  bg: string
  text: string
  ring: string
}[] = [
  {
    value: 'LOW',
    label: 'Low',
    description: 'No rush, schedule when convenient',
    color: 'bg-slate-500',
    bg: 'bg-slate-50 hover:bg-slate-100',
    text: 'text-slate-700',
    ring: 'ring-slate-300',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
    description: 'Standard SLA, handle this week',
    color: 'bg-blue-500',
    bg: 'bg-blue-50 hover:bg-blue-100',
    text: 'text-blue-700',
    ring: 'ring-blue-300',
  },
  {
    value: 'HIGH',
    label: 'High',
    description: 'Same-day or next-day response',
    color: 'bg-amber-500',
    bg: 'bg-amber-50 hover:bg-amber-100',
    text: 'text-amber-700',
    ring: 'ring-amber-300',
  },
  {
    value: 'URGENT',
    label: 'Urgent',
    description: 'Within a few hours',
    color: 'bg-orange-500',
    bg: 'bg-orange-50 hover:bg-orange-100',
    text: 'text-orange-700',
    ring: 'ring-orange-300',
  },
  {
    value: 'CRITICAL',
    label: 'Critical',
    description: 'Immediate dispatch required',
    color: 'bg-rose-500',
    bg: 'bg-rose-50 hover:bg-rose-100',
    text: 'text-rose-700',
    ring: 'ring-rose-300',
  },
]

const STEPS = [
  { id: 1, name: 'Details', icon: ClipboardListIcon },
  { id: 2, name: 'Location', icon: MapPinIcon },
  { id: 3, name: 'Priority', icon: FlagIcon },
  { id: 4, name: 'Review', icon: SparklesIcon },
]

export default function NewWorkOrderWizard({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated?: (woNumber: string) => void
}) {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPicker, setShowPicker] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [locationName, setLocationName] = useState('')
  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState<{ lat: string; lng: string }>({
    lat: '',
    lng: '',
  })
  const [priority, setPriority] = useState<Priority>('MEDIUM')

  const titleCount = title.length
  const descCount = description.length

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {}
    if (s === 1) {
      if (!title.trim()) e.title = 'Title is required'
      else if (title.trim().length < 3) e.title = 'Title must be at least 3 characters'
    }
    if (s === 2) {
      if (!locationName.trim() && !address.trim()) {
        e.location = 'Provide a location name or address (or pick on map)'
      }
      if (coords.lat && coords.lng) {
        const lat = parseFloat(coords.lat)
        const lng = parseFloat(coords.lng)
        if (isNaN(lat) || lat < -90 || lat > 90) e.coords = 'Invalid latitude (-90 to 90)'
        if (isNaN(lng) || lng < -180 || lng > 180) e.coords = 'Invalid longitude (-180 to 180)'
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (validateStep(step)) setStep((s) => Math.min(STEPS.length, s + 1))
  }
  const back = () => setStep((s) => Math.max(1, s - 1))

  const submit = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      setStep(1)
      return
    }
    setSubmitting(true)
    try {
      const res = await createWorkOrder({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        locationName: locationName.trim() || undefined,
        address: address.trim() || undefined,
        latitude: coords.lat ? parseFloat(coords.lat) : undefined,
        longitude: coords.lng ? parseFloat(coords.lng) : undefined,
        scheduledDate: scheduledDate || undefined,
      } as any)
      onCreated?.(res?.woNumber ?? 'WO')
      onClose()
    } catch (e) {
      setErrors({ submit: e instanceof Error ? e.message : 'Failed to create' })
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPriority = PRIORITY_OPTIONS.find((p) => p.value === priority)!
  const hasLocation = !!(coords.lat && coords.lng)
  const canGoNext =
    (step === 1 && title.trim().length >= 3) ||
    (step === 2 && (locationName.trim() || address.trim() || hasLocation)) ||
    step === 3

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Stepper */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-br from-white via-white to-indigo-50/40">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-sm shadow-indigo-600/30">
                  <ClipboardListIcon size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-none">
                    New Work Order
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Step {step} of {STEPS.length} · {STEPS[step - 1].name}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => {
                const isDone = step > s.id
                const isActive = step === s.id
                const Icon = s.icon
                return (
                  <div key={s.id} className="flex-1 flex items-center gap-2">
                    <div
                      className={`flex items-center gap-2 transition-all flex-1 ${
                        isActive
                          ? 'text-indigo-700'
                          : isDone
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all ${
                          isDone
                            ? 'bg-emerald-500 text-white'
                            : isActive
                            ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isDone ? <CheckIcon size={13} strokeWidth={3} /> : s.id}
                      </div>
                      <span className="text-xs font-semibold hidden sm:inline">
                        {s.name}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 rounded-full transition-all ${
                          isDone ? 'bg-emerald-400' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 min-h-[320px]">
            {step === 1 && (
              <Step1
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                scheduledDate={scheduledDate}
                setScheduledDate={setScheduledDate}
                errors={errors}
                titleCount={titleCount}
                descCount={descCount}
              />
            )}
            {step === 2 && (
              <Step2
                locationName={locationName}
                setLocationName={setLocationName}
                address={address}
                setAddress={setAddress}
                coords={coords}
                setCoords={setCoords}
                onOpenPicker={() => setShowPicker(true)}
                errors={errors}
              />
            )}
            {step === 3 && (
              <Step3
                priority={priority}
                setPriority={setPriority}
              />
            )}
            {step === 4 && (
              <Step4
                title={title}
                description={description}
                scheduledDate={scheduledDate}
                locationName={locationName}
                address={address}
                coords={coords}
                priority={selectedPriority}
              />
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  onClick={back}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 bg-white border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ChevronLeftIcon size={14} /> Back
                </button>
              )}

              {step < STEPS.length ? (
                <button
                  onClick={next}
                  disabled={!canGoNext}
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-indigo-600/20"
                >
                  Continue <ChevronRightIcon size={14} />
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm shadow-indigo-600/30"
                >
                  {submitting ? (
                    <>
                      <Loader2Icon size={14} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckIcon size={14} strokeWidth={3} />
                      Create Work Order
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPicker && (
        <LocationPicker
          value={
            coords.lat && coords.lng
              ? {
                  latitude: parseFloat(coords.lat),
                  longitude: parseFloat(coords.lng),
                  locationName,
                  address,
                }
              : null
          }
          onChange={(v) => {
            setCoords({
              lat: v.latitude.toFixed(6),
              lng: v.longitude.toFixed(6),
            })
            if (v.locationName) setLocationName(v.locationName)
            if (v.address) setAddress(v.address)
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  )
}

/* ---------- Step 1: Details ---------- */
function Step1({
  title,
  setTitle,
  description,
  setDescription,
  scheduledDate,
  setScheduledDate,
  errors,
  titleCount,
  descCount,
}: any) {
  return (
    <div className="space-y-5">
      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
          <FileTextIcon size={12} className="text-slate-400" />
          Title <span className="text-rose-500">*</span>
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. AC malfunction on 3rd floor"
          maxLength={120}
          autoFocus
          className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
            errors.title
              ? 'border-rose-300 focus:ring-rose-200'
              : 'border-slate-200 focus:ring-indigo-200 focus:border-indigo-400'
          }`}
        />
        <div className="flex items-center justify-between mt-1.5">
          {errors.title ? (
            <p className="text-[11px] text-rose-600 flex items-center gap-1">
              <AlertCircleIcon size={11} /> {errors.title}
            </p>
          ) : (
            <p className="text-[11px] text-slate-400">
              Be concise but descriptive
            </p>
          )}
          <span
            className={`text-[10px] font-mono ${
              titleCount > 100 ? 'text-rose-500' : 'text-slate-400'
            }`}
          >
            {titleCount}/120
          </span>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
          <FileTextIcon size={12} className="text-slate-400" />
          Description
          <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Add relevant context: equipment, fault symptoms, customer notes..."
          maxLength={600}
          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all resize-none"
        />
        <div className="text-right mt-1.5">
          <span
            className={`text-[10px] font-mono ${
              descCount > 550 ? 'text-rose-500' : 'text-slate-400'
            }`}
          >
            {descCount}/600
          </span>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
          <CalendarIcon size={12} className="text-slate-400" />
          Scheduled Date
          <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
        />
      </div>
    </div>
  )
}

/* ---------- Step 2: Location ---------- */
function Step2({
  locationName,
  setLocationName,
  address,
  setAddress,
  coords,
  setCoords,
  onOpenPicker,
  errors,
}: any) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
            <MapPinIcon size={12} className="text-slate-400" />
            Location Name
          </label>
          <input
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g. Kadikoy Center"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
            <FileTextIcon size={12} className="text-slate-400" />
            Address
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, neighborhood..."
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
          <SearchIcon size={12} className="text-slate-400" />
          Coordinates
        </label>
        <div className="flex gap-2 items-start">
          <div className="flex-1 grid grid-cols-2 gap-2">
            <input
              value={coords.lat}
              onChange={(e) =>
                setCoords({ ...coords, lat: e.target.value })
              }
              placeholder="Latitude (e.g. 40.99)"
              className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
            />
            <input
              value={coords.lng}
              onChange={(e) =>
                setCoords({ ...coords, lng: e.target.value })
              }
              placeholder="Longitude (e.g. 29.02)"
              className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={onOpenPicker}
            className="px-4 py-2.5 bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-semibold hover:from-indigo-100 hover:to-indigo-200 flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
          >
            <MapPinIcon size={14} />
            Pick on Map
          </button>
        </div>
        {errors.coords && (
          <p className="text-[11px] text-rose-600 mt-1.5 flex items-center gap-1">
            <AlertCircleIcon size={11} /> {errors.coords}
          </p>
        )}
      </div>

      <div
        className={`rounded-xl border-2 border-dashed p-4 transition-all ${
          coords.lat && coords.lng
            ? 'border-emerald-300 bg-emerald-50/50'
            : 'border-slate-200 bg-slate-50/50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              coords.lat && coords.lng
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-200 text-slate-500'
            }`}
          >
            {coords.lat && coords.lng ? (
              <CheckIcon size={16} strokeWidth={3} />
            ) : (
              <MapPinIcon size={16} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              {coords.lat && coords.lng
                ? 'Location pinned on map'
                : 'No coordinates set'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {coords.lat && coords.lng
                ? `${parseFloat(coords.lat).toFixed(5)}, ${parseFloat(coords.lng).toFixed(5)}`
                : 'Coordinates help with distance-based technician assignment'}
            </p>
          </div>
        </div>
      </div>

      {errors.location && (
        <p className="text-xs text-rose-600 flex items-center gap-1">
          <AlertCircleIcon size={11} /> {errors.location}
        </p>
      )}
    </div>
  )
}

/* ---------- Step 3: Priority ---------- */
function Step3({
  priority,
  setPriority,
}: {
  priority: Priority
  setPriority: (p: Priority) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 mb-1">
        Choose how urgent this work order is. This affects who sees it first
        and the SLA.
      </p>
      {PRIORITY_OPTIONS.map((p) => {
        const selected = priority === p.value
        return (
          <button
            key={p.value}
            type="button"
            onClick={() => setPriority(p.value)}
            className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${
              selected
                ? `border-indigo-500 ${p.bg} ring-2 ring-indigo-100`
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.color}`}
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${selected ? p.text : 'text-slate-800'}`}>
                {p.label}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {p.description}
              </p>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                selected
                  ? 'bg-indigo-600 border-indigo-600'
                  : 'border-slate-300'
              }`}
            >
              {selected && (
                <CheckIcon size={11} className="text-white" strokeWidth={3} />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Step 4: Review ---------- */
function Step4({
  title,
  description,
  scheduledDate,
  locationName,
  address,
  coords,
  priority,
}: any) {
  const reviewItems = [
    { label: 'Title', value: title, present: !!title },
    { label: 'Description', value: description || '—', present: !!description },
    {
      label: 'Scheduled Date',
      value: scheduledDate
        ? new Date(scheduledDate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'Not scheduled',
      present: !!scheduledDate,
    },
    {
      label: 'Location',
      value: locationName || address || '—',
      present: !!locationName || !!address,
    },
    {
      label: 'Coordinates',
      value:
        coords.lat && coords.lng
          ? `${parseFloat(coords.lat).toFixed(5)}, ${parseFloat(coords.lng).toFixed(5)}`
          : 'Not set',
      present: !!(coords.lat && coords.lng),
    },
  ]

  return (
    <div className="space-y-5">
      <div
        className={`p-4 rounded-xl border-2 ${priority.bg} ${priority.ring}`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-3 h-3 rounded-full ${priority.color} shrink-0`}
          />
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${priority.text}`}>
              Priority
            </p>
            <p className={`text-base font-black ${priority.text}`}>
              {priority.label}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {priority.description}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Summary
        </p>
        {reviewItems.map((item) => (
          <div
            key={item.label}
            className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0"
          >
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
              {item.label}
            </span>
            <span
              className={`text-sm text-right break-words ${
                item.present ? 'text-slate-800 font-medium' : 'text-slate-400 italic'
              }`}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-3 flex gap-2.5">
        <SparklesIcon size={14} className="text-indigo-600 mt-0.5 shrink-0" />
        <p className="text-[11px] text-indigo-900 leading-relaxed">
          After creation the work order will be assigned to the{' '}
          <strong>Intake</strong> workflow stage. You can dispatch it from the
          Live Map once a technician is available.
        </p>
      </div>
    </div>
  )
}