'use client'

import { useEffect, useState } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet'
import type { Map as LeafletMap } from 'leaflet'
import 'leaflet-defaulticon-compatibility'

interface HistoryPoint {
  gpsLatitude: number
  gpsLongitude: number
  timestamp?: number
}

interface TelemetryMapProps {
  lat: number | null
  lng: number | null
  history?: HistoryPoint[]
}

function formatTime(ts?: number): string {
  if (!ts) return 'Desconocida'

  const date = new Date(ts * 1000)
  const pad = (n: number) => n.toString().padStart(2, '0')

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function TelemetryMap({ lat, lng, history = [] }: TelemetryMapProps) {
  const [map, setMap] = useState<LeafletMap | null>(null)

  useEffect(() => {
    if (map && lat !== null && lng !== null) {
      map.setView([lat, lng], map.getZoom())
    }
  }, [lat, lng, map])

  if (lat === null || lng === null) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-xl border border-dashed border-line bg-surface text-sm text-ink-muted">
        Esperando datos GPS...
      </div>
    )
  }

  return (
    <div className="h-[360px] overflow-hidden rounded-xl border border-line">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        ref={setMap}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {history.length > 1 ? (
          <Polyline
            positions={history.map((point) => [point.gpsLatitude, point.gpsLongitude])}
            color="#2563eb"
            weight={4}
          />
        ) : null}

        <Marker position={[lat, lng]}>
          <Popup>
            Ultima posicion
            <br />
            Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}
            <br />
            Fecha: {history.length > 0 ? formatTime(history[history.length - 1].timestamp) : 'Desconocida'}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}