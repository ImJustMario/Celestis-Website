import { NextResponse } from 'next/server'
import type { RowDataPacket } from 'mysql2'
import { getMysqlPool } from '@/lib/mysql'

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 200
const MAX_LIMIT = 1000

type DbTelemetryRow = RowDataPacket & {
  id: number
  timestamp: number
  temperature: number | string
  co2ppm: number | string
  altitude: number | string
  pressure: number | string
  humidity: number | string
  gpsAltitude: number | string | null
  gpsLatitude: number | string | null
  gpsLongitude: number | string | null
  gpsConnected: number | boolean
}

function toNumber(value: number | string | null) {
  if (value === null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toBoolean(value: number | boolean) {
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

    const pool = getMysqlPool()
    const [rows] = await pool.query<DbTelemetryRow[]>(
      `
        SELECT
          id,
          timestamp,
          temperature,
          co2ppm,
          altitude,
          pressure,
          humidity,
          gpsAltitude,
          gpsLatitude,
          gpsLongitude,
          gpsConnected
        FROM data
        ORDER BY id DESC
        LIMIT ?
      `,
      [limit]
    )

    const records = rows
      .map((row) => ({
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
  } catch {
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
