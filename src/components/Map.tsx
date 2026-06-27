'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Leaflet'in default marker ikonlarını Next.js (webpack) için düzeltiyoruz
// CDN'e bağımlılığı kaldırıyoruz - lokal asset'lerden yüklüyoruz
function createDefaultIcon() {
  // SVG tabanlı hafif marker - extra HTTP isteği yok
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 28 16 28s16-16 16-28C32 7.2 24.8 0 16 0z" fill="#4f46e5" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>
  `
  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker',
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -36],
  })
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  ASSIGNED: '#3b82f6',
  IN_PROGRESS: '#6366f1',
  COMPLETED: '#10b981',
}

function createStatusIcon(status: string) {
  const color = STATUS_COLORS[status] ?? '#4f46e5'
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 28 16 28s16-16 16-28C32 7.2 24.8 0 16 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>
  `
  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker',
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -36],
  })
}

type WorkOrder = {
  id: number
  woNumber: string
  title: string
  status: string
  locationName: string | null
  address: string | null
  priority: string
  assignedToId: number | null
  latitude: number | null
  longitude: number | null
}

export default function Map({ workOrders }: { workOrders: WorkOrder[] }) {
  // Marker olan ilk work order'ı merkez al, yoksa İstanbul
  const withCoords = workOrders.filter(
    (w) => w.latitude != null && w.longitude != null,
  )

  let center: [number, number] = [40.99, 29.02] // İstanbul Kadıköy default
  let zoom = 12

  if (withCoords.length > 0) {
    const lats = withCoords.map((w) => w.latitude as number)
    const lngs = withCoords.map((w) => w.longitude as number)
    center = [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
    ]
    const latSpread = Math.max(...lats) - Math.min(...lats)
    const lngSpread = Math.max(...lngs) - Math.min(...lngs)
    const spread = Math.max(latSpread, lngSpread)
    if (spread < 0.01) zoom = 14
    else if (spread < 0.05) zoom = 12
    else if (spread < 0.2) zoom = 10
    else zoom = 9
  }

  const defaultIcon = createDefaultIcon()

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-sm border border-slate-200">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {withCoords.map((wo) => {
          const icon =
            wo.status && STATUS_COLORS[wo.status]
              ? createStatusIcon(wo.status)
              : defaultIcon
          return (
            <Marker
              key={wo.id}
              position={[wo.latitude as number, wo.longitude as number]}
              icon={icon}
            >
              <Popup>
                <div className="font-sans min-w-[180px]">
                  <p className="text-xs font-bold text-indigo-600 mb-1">
                    #{wo.woNumber}
                  </p>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">
                    {wo.title}
                  </h3>
                  {wo.locationName && (
                    <p className="text-xs text-slate-500 mb-2">
                      📍 {wo.locationName}
                    </p>
                  )}
                  <div className="flex gap-1 mt-2">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        backgroundColor: (STATUS_COLORS[wo.status] ?? '#4f46e5') + '20',
                        color: STATUS_COLORS[wo.status] ?? '#4f46e5',
                      }}
                    >
                      {wo.status}
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                      {wo.priority}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
