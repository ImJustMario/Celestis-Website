'use client'

import React, { useEffect, useState } from 'react'

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-emerald-800 p-4">
      {/* Card container — stacks vertically on mobile, side-by-side on md+ */}
      <div className="w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col md:flex-row" style={{ background: '#1a9e5f' }}>

        {/* ── LEFT / TOP PANEL ── */}
        <div className="flex-1 flex flex-col justify-between p-6 gap-6">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Buscando
              </p>
              <h1 className="text-2xl font-medium text-white mt-1">Celestis' Cansat</h1>
            </div>
            {/* Status dot */}
            <div
              className="w-3 h-3 rounded-full mt-1"
              style={{
                background: targetCoords ? '#a8ffcb' : 'rgba(255,255,255,0.35)',
                boxShadow: targetCoords ? '0 0 0 4px rgba(168,255,203,0.2)' : 'none'
              }}
              title={targetCoords ? 'Conectado' : 'Sin señal'}
            />
          </div>

          {/* Distance */}
          <div>
            <p className="font-medium text-white leading-none" style={{ fontSize: 56, letterSpacing: -1 }}>
              {distanceLabel}
            </p>
            <p className="text-lg mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {distanceSub}
            </p>
          </div>

          {/* Bottom info card */}
          <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: 'rgba(0,0,0,0.15)', border: '0.5px solid rgba(255,255,255,0.15)' }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Tu posición
                </p>
                <p className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {deviceCoords ? `${deviceCoords.lat.toFixed(4)}, ${deviceCoords.lon.toFixed(4)}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Tracker
                </p>
                <p className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {targetCoords ? `${targetCoords.lat.toFixed(4)}, ${targetCoords.lon.toFixed(4)}` : '—'}
                </p>
              </div>
            </div>

            {/* Debug */}
            <div
              className="text-xs font-mono leading-relaxed pt-3"
              style={{ color: 'rgba(255,255,255,0.35)', borderTop: '0.5px solid rgba(255,255,255,0.12)' }}
            >
              {fetchDebug}{lastFetchAt ? ` · ${lastFetchAt}` : ''}
            </div>

            {error && (
              <p className="text-xs" style={{ color: '#ffb3b3' }}>{error}</p>
            )}

            {/* iOS compass button */}
            <button
              onClick={requestCompassIOS}
              className="flex items-center gap-2 text-xs w-fit px-3 py-2 rounded-xl transition-colors"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '0.5px solid rgba(255,255,255,0.25)',
                color: 'rgba(255,255,255,0.8)'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
              </svg>
              Activar brújula (iOS)
            </button>
          </div>
        </div>

        {/* ── RIGHT / BOTTOM ARROW PANEL ── */}
        <div
          className="flex items-center justify-center p-10 md:w-72"
          style={{ background: 'rgba(0,0,0,0.1)', borderLeft: '0.5px solid rgba(255,255,255,0.08)' }}
        >
          <div
            style={{
              transform: `rotate(${arrowRotation}deg)`,
              transition: 'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)'
            }}
          >
            <svg width="160" height="160" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon
                points="90,16 155,148 90,112 25,148"
                fill="white"
                opacity="0.95"
              />
            </svg>
          </div>
        </div>

      </div>
    </div>
  )
}