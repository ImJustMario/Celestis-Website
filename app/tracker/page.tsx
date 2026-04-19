'use client'

import React, { useEffect, useState } from 'react'
import { NavigationArrowIcon } from '@/app/components/Icons'

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

// Calculate distance between two coordinates in km (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Calculate initial bearing from point A to point B
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const y = Math.sin((lon2 - lon1) * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos((lon2 - lon1) * Math.PI / 180)
  const bearing = Math.atan2(y, x) * 180 / Math.PI
  return (bearing + 360) % 360
}

export default function TrackerPage() {
  const [deviceCoords, setDeviceCoords] = useState<{lat: number, lon: number} | null>(null)
  const [targetCoords, setTargetCoords] = useState<{lat: number, lon: number} | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [bearing, setBearing] = useState<number | null>(null)
  const [deviceHeading, setDeviceHeading] = useState<number>(0)
  const [error, setError] = useState<string>('')
  const [fetchDebug, setFetchDebug] = useState<string>('Esperando primer fetch...')
  const [lastFetchAt, setLastFetchAt] = useState<string>('')

  // Watch device location
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada por el navegador')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setDeviceCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        })
      },
      (err) => {
        setError('Error obteniendo tu ubicación: ' + err.message)
      },
      { enableHighAccuracy: true }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // Device orientation to get compass heading
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEventWithIOS) => {
      let heading = 0
      if (typeof event.webkitCompassHeading === 'number') {
        // iOS
        heading = event.webkitCompassHeading
      } else if (event.alpha !== null) {
        // Android
        // alpha goes from 0 to 360 counterclock-wise. We need clockwise heading (North = 0).
        // It heavily depends on the OS, but standard is 360 - alpha.
        heading = 360 - event.alpha
      }
      setDeviceHeading(heading)
    }

    // Attempt to request permission for iOS 13+ devices
    const requestAccess = () => {
      const orientationEvent = window.DeviceOrientationEvent as DeviceOrientationPermissionEvent | undefined

      if (!orientationEvent) {
        setFetchDebug((prev) => `${prev} | Brújula no disponible en este navegador`)
        return
      }

      if (typeof orientationEvent.requestPermission === 'function') {
        orientationEvent.requestPermission()
          .then((permissionState: string) => {
            if (permissionState === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation, true)
            }
          })
          .catch(console.error)
      } else {
        window.addEventListener('deviceorientation', handleOrientation, true)
      }
    }

    // Call requestAccess immediately if supported, but typically requires user interaction.
    // So we might need a button if it doesn't work out of the box on mobile.
    requestAccess()

    return () => window.removeEventListener('deviceorientation', handleOrientation, true)
  }, [])

  // Poll database for target GPS coordinates
  useEffect(() => {
    const fetchTargetLocation = async () => {
      try {
        const res = await fetch('/api/data?limit=1')
        if (!res.ok) {
          setFetchDebug(`Fetch fallo con status ${res.status}`)
          return
        }

        const payload = await res.json()
        const records: TelemetryRecord[] = Array.isArray(payload?.records) ? payload.records : []
        const latest: TelemetryRecord | null = payload?.latest ?? (records.length > 0 ? records[records.length - 1] : null)

        setLastFetchAt(new Date().toLocaleTimeString())
        setFetchDebug(`OK: records=${records.length} latest=${latest ? 'si' : 'no'}`)

        if (!latest) return

        const lat = typeof latest.gpsLatitude === 'number' ? latest.gpsLatitude : Number(latest.gpsLatitude)
        const lon = typeof latest.gpsLongitude === 'number' ? latest.gpsLongitude : Number(latest.gpsLongitude)

        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          setTargetCoords({ lat, lon })
          setFetchDebug((prev) => `${prev} lat=${lat.toFixed(5)} lon=${lon.toFixed(5)} gpsConnected=${String(latest.gpsConnected)}`)
        } else {
          setFetchDebug((prev) => `${prev} pero sin coordenadas validas`)
        }
      } catch (err) {
        console.error('Error fetching target location:', err)
        setFetchDebug('Excepcion al hacer fetch de /api/data')
      }
    }

    fetchTargetLocation()
    const intervalId = setInterval(fetchTargetLocation, 5000)
    return () => clearInterval(intervalId)
  }, [])

  // Calculate distance and bearing
  useEffect(() => {
    if (deviceCoords && targetCoords) {
      const dist = calculateDistance(deviceCoords.lat, deviceCoords.lon, targetCoords.lat, targetCoords.lon)
      const brng = calculateBearing(deviceCoords.lat, deviceCoords.lon, targetCoords.lat, targetCoords.lon)
      setDistance(dist)
      setBearing(brng)
    }
  }, [deviceCoords, targetCoords])

  // Final orientation of the arrow:
  // bearing is absolute angle to target (North = 0)
  // heading is absolute angle device is pointing (North = 0)
  // arrow points to: bearing - heading.
  const arrowRotation = bearing !== null ? bearing - deviceHeading : 0

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white p-6 relative">
      <div className="absolute top-4 left-4">
        {distance !== null ? (
          <h1 className="text-4xl md:text-5xl font-mono text-cyan-400 font-bold drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            {distance.toFixed(3)} km
          </h1>
        ) : (
          <h1 className="text-xl md:text-3xl text-gray-400 animate-pulse font-mono">
            Esperando GPS...
          </h1>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center w-full max-w-md">
        <div 
          className="relative flex items-center justify-center transition-transform duration-500 ease-out"
          style={{ transform: `rotate(${arrowRotation}deg)` }}
        >
          {/* Compass ring just for visual reference (optional) */}
          <div className="absolute inset-0 w-64 h-64 md:w-80 md:h-80 border-4 border-neutral-800 rounded-full flex items-center justify-center -z-10 shadow-[0_0_50px_rgba(34,211,238,0.1)]"></div>
          
          <NavigationArrowIcon className="w-48 h-48 md:w-64 md:h-64 text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 text-sm text-neutral-400 font-mono">
        <p>
          Ubicación del dispositivo: 
          {deviceCoords
            ? ` ${deviceCoords.lat.toFixed(5)}, ${deviceCoords.lon.toFixed(5)}`
            : ' Buscando...'}
        </p>
        <p>
          Ubicación del Tracker: 
          {targetCoords
            ? ` ${targetCoords.lat.toFixed(5)}, ${targetCoords.lon.toFixed(5)}`
            : ' Buscando...'}
        </p>
        <p>
          Debug fetch: {fetchDebug}
          {lastFetchAt ? ` (ultimo intento ${lastFetchAt})` : ''}
        </p>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        {/* iOS requires button click for compass permissions on https... */}
        <button 
          onClick={() => {
            const orientationEvent = window.DeviceOrientationEvent as DeviceOrientationPermissionEvent | undefined

            if (!orientationEvent) {
              setFetchDebug((prev) => `${prev} | Brújula no disponible en este navegador`)
              return
            }

            if (typeof orientationEvent.requestPermission === 'function') {
              orientationEvent.requestPermission()
                .then((state: string) => {
                  if(state === 'granted') {
                     window.location.reload()
                  }
                })
            }
          }}
          className="mt-2 text-xs bg-neutral-800 p-2 rounded hover:bg-neutral-700 w-fit"
        >
          Solicitar permisos de brújula (iOS)
        </button>
      </div>
    </div>
  )
}
