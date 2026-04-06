'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react'
import {
  ThermometerIcon,
  WindIcon,
  DropletIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../components/Icons'

type MetricId = 'temperature' | 'pressure' | 'humidity' | 'co2ppm'

interface Metric {
  id: MetricId
  name: string
  unit: string
  icon: ReactNode
  color: string
  chartColor: string
  chartFill: string
}

interface TelemetryRecord {
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

interface ChartPoint {
  altitude: number
  value: number
}

const WS_RECONNECT_MS = 2000
const HISTORY_LIMIT = 200

type TelemetryWsMessage =
  | { type: 'snapshot'; records: TelemetryRecord[] }
  | { type: 'append'; record: TelemetryRecord }
  | { type: 'error'; message: string }

const metrics: Metric[] = [
  {
    id: 'temperature',
    name: 'Temperature',
    unit: '°C',
    icon: <ThermometerIcon className="h-5 w-5" />,
    color: 'text-orange-400',
    chartColor: '#fb923c',
    chartFill: 'rgba(251,146,60,0.12)',
  },
  {
    id: 'pressure',
    name: 'Pressure',
    unit: 'kPa',
    icon: <WindIcon className="h-5 w-5" />,
    color: 'text-sky-400',
    chartColor: '#38bdf8',
    chartFill: 'rgba(56,189,248,0.12)',
  },
  {
    id: 'humidity',
    name: 'Humidity',
    unit: '%',
    icon: <DropletIcon className="h-5 w-5" />,
    color: 'text-teal-400',
    chartColor: '#2dd4bf',
    chartFill: 'rgba(45,212,191,0.12)',
  },
  {
    id: 'co2ppm',
    name: 'CO2',
    unit: 'ppm',
    icon: <WindIcon className="h-5 w-5" />,
    color: 'text-violet-400',
    chartColor: '#a78bfa',
    chartFill: 'rgba(167,139,250,0.12)',
  },
]

function useChartInstance(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  metric: Metric,
  points: ChartPoint[]
) {
  const chartRef = useRef<{
    destroy: () => void
    data: {
      labels: Array<string | number>
      datasets: Array<{ data: number[] }>
    }
    update: (mode?: 'none' | 'hide' | 'show' | 'default' | 'active' | 'resize' | 'reset') => void
  } | null>(null)
  const previousPointsRef = useRef<ChartPoint[]>([])
  const latestPointsRef = useRef<ChartPoint[]>(points)

  useEffect(() => {
    latestPointsRef.current = points
  }, [points])

  useEffect(() => {
    if (typeof window === 'undefined') return

    let cancelled = false

    const init = async () => {
      const { Chart, registerables } = await import('chart.js')
      Chart.register(...registerables)
      if (cancelled || !canvasRef.current) return

      if (chartRef.current) {
        chartRef.current.destroy()
      }

      const initialPoints = latestPointsRef.current
      chartRef.current = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels: initialPoints.map((d) => d.altitude),
          datasets: [
            {
              label: metric.name,
              data: initialPoints.map((d) => d.value),
              borderColor: metric.chartColor,
              backgroundColor: metric.chartFill,
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: metric.chartColor,
              pointHoverRadius: 6,
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: (items: Array<{ label: string }>) => `Altitude: ${items[0].label} m`,
                label: (item: { raw: number }) =>
                  ` ${metric.name}: ${Number(item.raw).toFixed(1)} ${metric.unit}`,
              },
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Altitude (m)',
                color: '#94a3b8',
                font: { size: 12 },
              },
              ticks: { color: '#94a3b8', maxTicksLimit: 8 },
              grid: { color: 'rgba(148,163,184,0.1)' },
            },
            y: {
              title: {
                display: true,
                text: `${metric.name} (${metric.unit})`,
                color: '#94a3b8',
                font: { size: 12 },
              },
              ticks: { color: '#94a3b8' },
              grid: { color: 'rgba(148,163,184,0.1)' },
            },
          },
        },
      })

      previousPointsRef.current = initialPoints
    }

    init()

    return () => {
      cancelled = true
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [metric, canvasRef])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    const previous = previousPointsRef.current
    const next = points
    const labels = chart.data.labels
    const values = chart.data.datasets[0]?.data

    if (!values) return

    const sharedLength = Math.min(previous.length, next.length)
    let samePrefix = previous.length <= next.length

    for (let index = 0; index < sharedLength; index += 1) {
      const prevPoint = previous[index]
      const nextPoint = next[index]
      if (
        prevPoint.altitude !== nextPoint.altitude ||
        prevPoint.value !== nextPoint.value
      ) {
        samePrefix = false
        break
      }
    }

    if (samePrefix && next.length > previous.length) {
      for (let index = previous.length; index < next.length; index += 1) {
        labels.push(next[index].altitude)
        values.push(next[index].value)
      }
      chart.update('none')
      previousPointsRef.current = next
      return
    }

    labels.length = 0
    values.length = 0

    for (const point of next) {
      labels.push(point.altitude)
      values.push(point.value)
    }

    chart.update('none')
    previousPointsRef.current = next
  }, [points])
}

function MetricChart({ metric, points }: { metric: Metric; points: ChartPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  useChartInstance(canvasRef, metric, points)

  return (
    <div style={{ position: 'relative', width: '100%', height: 280 }}>
      <canvas ref={canvasRef} />
      {points.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-ink-muted">
          Waiting for telemetry data...
        </div>
      ) : null}
    </div>
  )
}

function getPageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set<number>([1, totalPages])

  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page > 1 && page < totalPages) {
      pages.add(page)
    }
  }

  const orderedPages = [...pages].sort((a, b) => a - b)
  const withGaps: Array<number | '...'> = []

  orderedPages.forEach((page, index) => {
    const previousPage = orderedPages[index - 1]
    if (index > 0 && previousPage !== undefined && page - previousPage > 1) {
      withGaps.push('...')
    }
    withGaps.push(page)
  })

  return withGaps
}

function formatLastUpdate(timestamp?: number) {
  if (!timestamp) return 'No data yet'
  return new Date(timestamp * 1000).toLocaleString()
}

export default function DataPage() {
  const [selectedMetric, setSelectedMetric] = useState<MetricId>('temperature')
  const [records, setRecords] = useState<TelemetryRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const rowsPerPage = 8

  useEffect(() => {
    let stopped = false
    let reconnectTimer: number | null = null
    let socket: WebSocket | null = null

    const connect = () => {
      if (stopped) return

      setConnectionState('connecting')
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      socket = new WebSocket(`${protocol}//${window.location.host}/api/ws?limit=${HISTORY_LIMIT}`)

      socket.onopen = () => {
        setConnectionState('connected')
        setError(null)
      }

      socket.onmessage = (event) => {
        let payload: TelemetryWsMessage | null = null
        try {
          payload = JSON.parse(event.data as string) as TelemetryWsMessage
        } catch {
          return
        }

        if (!payload) return

        if (payload.type === 'snapshot') {
          setRecords(payload.records)
          setIsLoading(false)
          return
        }

        if (payload.type === 'append') {
          setRecords((previous) => {
            if (previous.length > 0 && previous[previous.length - 1].id >= payload.record.id) {
              return previous
            }

            const next = [...previous, payload.record]
            if (next.length > HISTORY_LIMIT) {
              return next.slice(next.length - HISTORY_LIMIT)
            }

            return next
          })
          setIsLoading(false)
          return
        }

        if (payload.type === 'error') {
          setError(payload.message)
          setIsLoading(false)
        }
      }

      socket.onclose = () => {
        setConnectionState('disconnected')
        if (stopped) return
        reconnectTimer = window.setTimeout(connect, WS_RECONNECT_MS)
      }

      socket.onerror = () => {
        setError('Could not connect to telemetry WebSocket')
      }
    }

    void fetch('/api/ws').catch(() => {
      setError('Could not initialize telemetry WebSocket endpoint')
    })
    connect()

    return () => {
      stopped = true
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer)
      }
      if (socket) {
        socket.close()
      }
    }
  }, [])

  const activeMetric = metrics.find((m) => m.id === selectedMetric)!

  const metricData = useMemo<ChartPoint[]>(() => {
    return records
      .map((record) => ({
        altitude: record.altitude,
        value: record[selectedMetric],
      }))
      .filter((point) => Number.isFinite(point.altitude) && Number.isFinite(point.value))
  }, [records, selectedMetric])

  const totalPages = Math.max(1, Math.ceil(metricData.length / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const visibleData = metricData.slice(startIndex, startIndex + rowsPerPage)
  const visibleRecords = records.slice(startIndex, startIndex + rowsPerPage)

  const values = metricData.map((d) => d.value)
  const max = values.length > 0 ? Math.max(...values) : 0
  const min = values.length > 0 ? Math.min(...values) : 0
  const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '0.0'

  const latestRecord = records.length > 0 ? records[records.length - 1] : undefined

  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedMetric])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-14"
        >
          <Link href="/">
            <button className="mb-6 flex cursor-pointer items-center gap-2 text-sm font-medium text-accent transition-colors duration-300 hover:text-accent-hover">
              &larr; Back to Home
            </button>
          </Link>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-ink md:text-6xl">Collected Data</h1>
          <p className="text-lg text-ink-secondary">
            Atmospheric data recorded by the Celestis CanSat during descent
          </p>
          {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-3">
            {metrics.map((metric) => (
              <button
                key={metric.id}
                onClick={() => setSelectedMetric(metric.id)}
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-300 ${
                  selectedMetric === metric.id
                    ? 'border-accent bg-gray-800 text-white shadow-soft'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 hover:shadow-soft'
                }`}
              >
                <span className="flex items-center">{metric.icon}</span>
                {metric.name}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          key={selectedMetric + '-stats'}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 grid grid-cols-3 gap-4"
        >
          {[
            { label: 'Max', value: `${max.toFixed(1)} ${activeMetric.unit}` },
            { label: 'Min', value: `${min.toFixed(1)} ${activeMetric.unit}` },
            { label: 'Avg', value: `${avg} ${activeMetric.unit}` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-line bg-surface-card p-5 text-center shadow-soft"
            >
              <p className="mb-1 text-xs uppercase tracking-wide text-ink-muted">{stat.label}</p>
              <p className={`text-xl font-semibold ${activeMetric.color}`}>{stat.value}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          key={selectedMetric + '-chart'}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 rounded-2xl border border-line bg-surface-card p-6 shadow-soft md:p-8"
        >
          <h2 className="mb-1 text-xl font-semibold text-ink">{activeMetric.name} vs Altitude</h2>
          <p className="mb-6 text-sm text-ink-muted">
            Live via WebSocket ({connectionState}) · {metricData.length} data points
          </p>
          <MetricChart metric={activeMetric} points={metricData} />
        </motion.div>

        <motion.div
          key={selectedMetric + '-table'}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 rounded-2xl border border-line bg-surface-card p-6 shadow-soft md:p-8"
        >
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-ink">Raw readings</h2>
              <p className="text-sm text-ink-muted">
                Showing {metricData.length === 0 ? 0 : startIndex + 1}-
                {Math.min(startIndex + rowsPerPage, metricData.length)} of {metricData.length} records
              </p>
            </div>
            <p className="text-sm text-ink-muted">
              Page {currentPage} of {totalPages}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-4 py-3 text-left font-medium text-ink-muted">Timestamp</th>
                  <th className="px-4 py-3 text-left font-medium text-ink-muted">Altitude (m)</th>
                  <th className="px-4 py-3 text-left font-medium text-ink-muted">
                    {activeMetric.name} ({activeMetric.unit})
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-ink-muted sm:table-cell">
                    Δ from first sample
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleData.map((point, index) => {
                  const absoluteIndex = startIndex + index
                  const delta = (point.value - metricData[0].value).toFixed(1)
                  const deltaNum = Number(delta)
                  const sourceRecord = visibleRecords[index]

                  return (
                    <motion.tr
                      key={`${point.altitude}-${point.value}-${absoluteIndex}`}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: absoluteIndex * 0.03 }}
                      className="border-b border-line/50 transition-colors hover:bg-surface"
                    >
                      <td className="px-4 py-3 text-ink-secondary">
                        {sourceRecord ? new Date(sourceRecord.timestamp * 1000).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-ink-secondary">{point.altitude.toFixed(1)}</td>
                      <td className={`px-4 py-3 font-semibold ${activeMetric.color}`}>
                        {point.value.toFixed(1)}
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        {absoluteIndex === 0 ? (
                          <span className="text-ink-muted">-</span>
                        ) : (
                          <span className={deltaNum < 0 ? 'text-sky-400' : 'text-orange-400'}>
                            {deltaNum > 0 ? '+' : ''}
                            {delta}
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
                {visibleData.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-ink-muted" colSpan={4}>
                      {isLoading ? 'Loading telemetry...' : 'No telemetry records found'}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 hover:shadow-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            {pageNumbers.map((page, index) =>
              page === '...' ? (
                <span key={`gap-${index}`} className="select-none px-3 py-2 text-ink-muted">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-10 rounded-full border px-4 py-2 font-medium shadow-sm transition-all duration-200 ${
                    currentPage === page
                      ? 'border-accent bg-gray-800 text-white shadow-soft'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 hover:shadow-soft'
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 hover:shadow-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="rounded-2xl border border-line bg-surface-card p-6 shadow-soft md:p-8"
        >
          <h2 className="mb-6 text-xl font-semibold text-ink">Mission status</h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {[
              {
                label: 'Last update',
                value: formatLastUpdate(latestRecord?.timestamp),
                valueClass: 'text-ink',
              },
              {
                label: 'Data points',
                value: `${records.length}`,
                valueClass: 'text-ink',
              },
              {
                label: 'Status',
                value: records.length > 0 ? 'Active' : 'Waiting data',
                valueClass: records.length > 0 ? 'text-emerald-500' : 'text-amber-500',
              },
              {
                label: 'GPS link',
                value: latestRecord?.gpsConnected ? 'Connected' : 'No lock',
                valueClass: latestRecord?.gpsConnected ? 'text-emerald-500' : 'text-amber-500',
              },
            ].map((item) => (
              <div key={item.label}>
                <p className="mb-1 text-xs uppercase tracking-wide text-ink-muted">{item.label}</p>
                <p className={`text-lg font-semibold ${item.valueClass}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  )
}
