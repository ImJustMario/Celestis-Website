import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 200
const MAX_LIMIT = 1000

function toNumber(value: number | string | null) {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toBoolean(value: number | boolean | null) {
  if (value === null || value === undefined) return false
  if (typeof value === 'boolean') return value
  return value === 1
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limitParam = Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT)
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(Math.floor(limitParam), 1), MAX_LIMIT)
      : DEFAULT_LIMIT

    const supabase = getSupabaseClient()
    
    const { data: rows, error } = await supabase
      .from('data')
      .select('id, timestamp, temperature, co2ppm, altitude, pressure, humidity, gpsAltitude, gpsLatitude, gpsLongitude, gpsConnected')
      .order('id', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    const records = (rows || [])
      .map((row: any) => ({
        id: row.id,
        timestamp: row.timestamp,
        temperature: toNumber(row.temperature) ?? 0,
        co2ppm: toNumber(row.co2ppm) ?? 0,
        altitude: toNumber(row.altitude) ?? 0,
        pressure: toNumber(row.pressure) ?? 0,
        humidity: toNumber(row.humidity) ?? 0,
        gpsAltitude: toNumber(row.gpsAltitude),
        gpsLatitude: toNumber(row.gpsLatitude),
        gpsLongitude: toNumber(row.gpsLongitude),
        gpsConnected: toBoolean(row.gpsConnected),
      }))
      .reverse()

    return NextResponse.json({
      records,
      count: records.length,
      latest: records.length > 0 ? records[records.length - 1] : null,
      fetchedAt: Date.now(),
    })
  } catch (err: any) {
    console.error('Supabase error:', err)
    return NextResponse.json(
      {
        records: [],
        count: 0,
        latest: null,
        error: 'Could not load telemetry data',
      },
      { status: 500 }
    )
  }
}
