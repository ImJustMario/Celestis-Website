import { NextResponse } from 'next/server'
import { getTelemetryRecords, normalizeLimit } from '@/lib/telemetry'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = normalizeLimit(url.searchParams.get('limit'))
    const records = await getTelemetryRecords(limit)

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
