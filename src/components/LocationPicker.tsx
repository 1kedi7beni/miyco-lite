'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapPinIcon, CrosshairIcon, XIcon, SearchIcon, Loader2Icon } from 'lucide-react'

const pinIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
    <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 28 16 28s16-16 16-28C32 7.2 24.8 0 16 0z" fill="#4f46e5" stroke="white" stroke-width="2"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
  </svg>`,
  className: 'picker-pin',
  iconSize: [32, 44],
  iconAnchor: [16, 44],
})

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, 14, { duration: 0.6 })
  }, [center, map])
  return null
}

export type LocationValue = {
  latitude: number
  longitude: number
  locationName?: string
  address?: string
}

export default function LocationPicker({
  value,
  onChange,
  onClose,
}: {
  value: LocationValue | null
  onChange: (v: LocationValue) => void
  onClose: () => void
}) {
  const initialCenter: [number, number] = value
    ? [value.latitude, value.longitude]
    : [40.99, 29.02]
  const [marker, setMarker] = useState<[number, number] | null>(
    value ? [value.latitude, value.longitude] : null,
  )
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handlePick = (lat: number, lng: number) => {
    setMarker([lat, lng])
    setError(null)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) return
    setSearching(true)
    setError(null)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(search)}`,
      )
      const data = await res.json()
      if (!Array.isArray(data) || data.length === 0) {
        setError('Location not found')
        return
      }
      const lat = parseFloat(data[0].lat)
      const lng = parseFloat(data[0].lon)
      setMarker([lat, lng])
      onChange({
        latitude: lat,
        longitude: lng,
        locationName: search,
        address: data[0].display_name,
      })
    } catch {
      setError('Search failed - check your connection')
    } finally {
      setSearching(false)
    }
  }

  const handleConfirm = () => {
    if (!marker) {
      setError('Click on the map to pick a location first')
      return
    }
    onChange({
      latitude: marker[0],
      longitude: marker[1],
      locationName: value?.locationName ?? '',
      address: value?.address ?? '',
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[80vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <MapPinIcon className="text-indigo-600" size={20} />
              Pick Location on Map
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Search for a place or click anywhere on the map
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <XIcon size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSearch}
          className="p-3 border-b border-slate-100 flex gap-2"
        >
          <div className="relative flex-1">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search address, city, landmark..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {searching ? (
              <Loader2Icon size={14} className="animate-spin" />
            ) : (
              <SearchIcon size={14} />
            )}
            Search
          </button>
        </form>

        <div className="flex-1 relative">
          <MapContainer
            center={initialCenter}
            zoom={marker ? 14 : 12}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <ClickHandler onPick={handlePick} />
            {marker && <RecenterMap center={marker} />}
            {marker && (
              <Marker position={marker} icon={pinIcon} />
            )}
          </MapContainer>

          {marker && (
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-xl border border-slate-200 shadow-lg p-3 pointer-events-none">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Selected Coordinates
              </p>
              <p className="text-sm font-mono text-slate-800">
                {marker[0].toFixed(5)}, {marker[1].toFixed(5)}
              </p>
              {value?.locationName && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <CrosshairIcon size={11} />
                  {value.locationName}
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="px-4 py-2 bg-rose-50 border-t border-rose-100 text-rose-700 text-sm">
            {error}
          </div>
        )}

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <p className="text-xs text-slate-500">
            {marker
              ? 'Location selected - ready to confirm'
              : 'Click on the map to select a point'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!marker}
              className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              <MapPinIcon size={14} />
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}