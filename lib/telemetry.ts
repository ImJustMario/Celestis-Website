import type { RowDataPacket } from 'mysql2'
import { getMysqlPool } from '@/lib/mysql'

export const DEFAULT_LIMIT = 200
export const MAX_LIMIT = 1000

export interface TelemetryRecord {
  id: number
  timestamp: number
  temperature: number
  co2ppm: number
  altitude: number
  pressure: number
  humidity: number
  gpsAltitude: number | null
  gpsLatitude: number | null
  gpsLongitude: number | null
  gpsConnected: boolean
}

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

export function normalizeLimit(rawValue?: string | null) {
  const parsed = Number(rawValue ?? DEFAULT_LIMIT)
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT
  return Math.min(Math.max(Math.floor(parsed), 1), MAX_LIMIT)
}

export async function getTelemetryRecords(limit: number): Promise<TelemetryRecord[]> {
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

  return rows
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
}
