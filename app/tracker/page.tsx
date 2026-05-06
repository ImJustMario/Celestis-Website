'use client'

import React, { useEffect, useState, useRef } from 'react'

interface DeviceOrientationEventWithIOS extends DeviceOrientationEvent {
  webkitCompassHeading?: number
}

type DeviceOrientationPermissionEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

type TelemetryRecord = {
  gpsLatitude: number | null
  gpsLongitude: number | null
  gpsConnected?: boolean
  timestamp?: string
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const y = Math.sin((lon2 - lon1) * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos((lon2 - lon1) * Math.PI / 180)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

export default function TrackerPage() {
  const [deviceCoords, setDeviceCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [targetCoords, setTargetCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [bearing, setBearing] = useState<number | null>(null)
  const [deviceHeading, setDeviceHeading] = useState<number>(0)
  const [error, setError] = useState<string>('')
  const [fetchDebug, setFetchDebug] = useState<string>('Esperando primer fetch...')
  const [lastFetchAt, setLastFetchAt] = useState<string>('')
  const [showMap, setShowMap] = useState(false)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<any>(null)

  // Watch device location
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada')
      return
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setDeviceCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => setError('Error GPS: ' + err.message),
      { enableHighAccuracy: true }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // Compass heading
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEventWithIOS) => {
      let heading = 0
      if (typeof event.webkitCompassHeading === 'number') {
        heading = event.webkitCompassHeading
      } else if (event.alpha !== null) {
        heading = 360 - event.alpha
      }
      setDeviceHeading(heading)
    }

    const orientationEvent = window.DeviceOrientationEvent as DeviceOrientationPermissionEvent | undefined
    if (orientationEvent && typeof orientationEvent.requestPermission !== 'function') {
      window.addEventListener('deviceorientation', handleOrientation, true)
    }
    return () => window.removeEventListener('deviceorientation', handleOrientation, true)
  }, [])

  // Poll target GPS
  useEffect(() => {
    const fetchTargetLocation = async () => {
      try {
        const res = await fetch('/api/data?limit=1')
        if (!res.ok) { setFetchDebug(`Fetch falló con status ${res.status}`); return }
        const payload = await res.json()
        const records: TelemetryRecord[] = Array.isArray(payload?.records) ? payload.records : []
        const latest: TelemetryRecord | null = payload?.latest ?? (records.length > 0 ? records[records.length - 1] : null)
        const now = new Date().toLocaleTimeString()
        setLastFetchAt(now)
        if (!latest) { setFetchDebug('Sin datos'); return }
        const lat = Number(latest.gpsLatitude)
        const lon = Number(latest.gpsLongitude)
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          setTargetCoords({ lat, lon })
          setFetchDebug(`OK · lat=${lat.toFixed(5)} lon=${lon.toFixed(5)}`)
        } else {
          setFetchDebug('Sin coordenadas válidas')
        }
      } catch {
        setFetchDebug('Error al hacer fetch de /api/data')
      }
    }
    fetchTargetLocation()
    const id = setInterval(fetchTargetLocation, 5000)
    return () => clearInterval(id)
  }, [])

  // Distance + bearing
  useEffect(() => {
    if (deviceCoords && targetCoords) {
      setDistance(calculateDistance(deviceCoords.lat, deviceCoords.lon, targetCoords.lat, targetCoords.lon))
      setBearing(calculateBearing(deviceCoords.lat, deviceCoords.lon, targetCoords.lat, targetCoords.lon))
    }
  }, [deviceCoords, targetCoords])

  const arrowRotation = bearing !== null ? bearing - deviceHeading : 0

  const distanceLabel = distance !== null
    ? distance < 1
      ? `${Math.round(distance * 1000)} m`
      : `${distance.toFixed(1)} km`
    : '—'

  const distanceSub = distance !== null
    ? distance < 1 ? 'cerca de ti' : 'adelante'
    : 'buscando tracker...'

  const requestCompassIOS = () => {
    const orientationEvent = window.DeviceOrientationEvent as DeviceOrientationPermissionEvent | undefined
    if (orientationEvent && typeof orientationEvent.requestPermission === 'function') {
      orientationEvent.requestPermission()
        .then((state) => { if (state === 'granted') window.location.reload() })
        .catch(console.error)
    }
  }
  
  // Initialize map once when showMap becomes true
  useEffect(() => {
    let cancelled = false

    const loadLeaflet = async () => {
      if (!showMap) return
      const win = window as any
      if (!win.L) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)

        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          s.onload = () => resolve()
          s.onerror = () => reject()
          document.body.appendChild(s)
        })
      }

      if (cancelled) return
      const L = (window as any).L
      if (mapRef.current && !leafletMapRef.current) {
        const centerLat = deviceCoords?.lat ?? targetCoords?.lat ?? 0
        const centerLon = deviceCoords?.lon ?? targetCoords?.lon ?? 0
        const map = L.map(mapRef.current).setView([centerLat, centerLon], 13)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '' }).addTo(map)
        leafletMapRef.current = map
      }
    }

    loadLeaflet().catch((e) => console.error(e))

    return () => {
      cancelled = true
      if (!showMap) {
        if (leafletMapRef.current) {
          try { leafletMapRef.current.remove() } catch (e) {}
          leafletMapRef.current = null
        }
      }
    }
  }, [showMap])

  // Update markers without recreating map
  useEffect(() => {
    if (!leafletMapRef.current || !showMap) return

    const L = (window as any).L
    const map = leafletMapRef.current

    // Remove all circle markers and markers
    map.eachLayer((layer: any) => {
      if ((layer instanceof L.Marker && layer.getPopup()?.getContent() === 'Tracker') ||
          layer instanceof L.CircleMarker) {
        map.removeLayer(layer)
      }
    })

    // Add updated markers
    if (deviceCoords) {
      L.circleMarker([deviceCoords.lat, deviceCoords.lon], {
        radius: 10,
        fillColor: '#4285F4',
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9
      }).addTo(map).bindPopup('Tu ubicación')
    }

    if (targetCoords) {
      const redPinSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="#EA4335" d="M16 2C9.4 2 4 7.4 4 14c0 8 12 20 12 20s12-12 12-20c0-6.6-5.4-12-12-12z" stroke="#fff" stroke-width="1.5"/><circle cx="16" cy="14" r="4" fill="#fff"/></svg>'
      const redPinIcon = L.icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(redPinSvg),
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      })
      L.marker([targetCoords.lat, targetCoords.lon], { icon: redPinIcon }).addTo(map).bindPopup('Tracker')
    }
  }, [deviceCoords, targetCoords, showMap])

  return (
    <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center p-4">
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="flex flex-col items-center justify-center">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-semibold text-white">Celestis' Cansat</h1>
            <p className="text-sm text-white/80">{distanceLabel} — {distanceSub}</p>
          </div>

          <div style={{ transform: `rotate(${arrowRotation}deg)`, transition: 'transform 0.4s ease-out' }}>
            <svg width="140" height="140" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="90,16 155,148 90,112 25,148" fill="white" opacity="0.98"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom info box */}
      <div className="w-full max-w-2xl p-4 fixed bottom-4 left-1/2 -translate-x-1/2">
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/70">Tu posición</p>
              <p className="text-sm font-mono text-white">{deviceCoords ? `${deviceCoords.lat.toFixed(5)}, ${deviceCoords.lon.toFixed(5)}` : 'Buscando...'}</p>
            </div>
            <div>
              <p className="text-xs text-white/70">Tracker</p>
              <p className="text-sm font-mono text-white">{targetCoords ? `${targetCoords.lat.toFixed(5)}, ${targetCoords.lon.toFixed(5)}` : 'Buscando...'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMap(true)}
              className="px-4 py-2 bg-white text-green-700 rounded-lg font-medium"
            >Mostrar mapa</button>
            <button onClick={requestCompassIOS} className="px-3 py-2 bg-white/10 text-white rounded-lg">Brújula</button>
          </div>
        </div>
      </div>

      {/* Map overlay */}
      {showMap && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="w-[90%] h-[80%] bg-white rounded-lg overflow-hidden relative">
            <div ref={mapRef} className="w-full h-full" />
            <button onClick={() => setShowMap(false)} className="absolute top-4 right-4 z-[9999] bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}