'use client'

import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState, useEffect, useRef, useMemo, useCallback, type ReactNode } from 'react'
import {
  ThermometerIcon,
  WindIcon,
  DropletIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../components/Icons'

type MetricId = 'temperature' | 'pressure' | 'humidity' | 'co2ppm' | 'altitude' | 'velocity'

interface Metric {
  id: MetricId
  name: string
  unit: string
  icon?: ReactNode
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
  img: string | null
}

interface ChartPoint {
  timeFormatted: string
  altitude: number
  value: number
  secondaryValue: number
  velocity: number
}

interface GpsPoint {
  gpsLatitude: number
  gpsLongitude: number
  timestamp: number
}

const POLL_INTERVAL_MS = 2000
const HISTORY_LIMIT = 2000
const TelemetryMap = dynamic(() => import('../components/TelemetryMap'), { ssr: false })

const TIME_RANGES = {
  '5m': 5 * 60,
  '15m': 15 * 60,
  '30m': 30 * 60,
  '1h': 60 * 60,
  'all': 0
}

const AXIS_STEPS: Record<MetricId, number> = {
  temperature: 5,
  pressure: 10,
  humidity: 5,
  co2ppm: 50,
  altitude: 10,
  velocity: 1,
}

function getAxisBounds(values: number[], metricId: MetricId) {
  const step = AXIS_STEPS[metricId]

  if (values.length === 0) {
    return {
      min: 0,
      max: step * 4,
      step,
    }
  }

  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const span = Math.max(maxValue - minValue, step * 2)
  const padding = Math.max(step, span * 0.15)

  return {
    min: Math.floor((minValue - padding) / step) * step,
    max: Math.ceil((maxValue + padding) / step) * step,
    step,
  }
}

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
    unit: 'hPa',
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
    color: 'text-violet-400',
    chartColor: '#a78bfa',
    chartFill: 'rgba(167,139,250,0.12)',
  },
  {
    id: 'altitude',
    name: 'Altitude',
    unit: 'm',
    color: 'text-gray-400',
    chartColor: '#888888',
    chartFill: 'rgba(136,136,136,0.12)',
  },
  {
    id: 'velocity',
    name: 'Vertical Velocity',
    unit: 'm/s',
    color: 'text-rose-400',
    chartColor: '#f43f5e',
    chartFill: 'rgba(244,63,94,0.12)',
  },
]

function useChartInstance(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  metric: Metric,
  secondaryMetric: Metric,
  points: ChartPoint[]
) {
  const chartRef = useRef<any>(null)
  const metricRef = useRef(metric)
  const secondaryMetricRef = useRef(secondaryMetric)

  useEffect(() => {
    metricRef.current = metric
    secondaryMetricRef.current = secondaryMetric
  }, [metric, secondaryMetric])

  useEffect(() => {
    if (typeof window === 'undefined' || !canvasRef.current) return

    let cancelled = false
    let chartInstance: any = null

    const init = async () => {
      const { Chart, registerables } = await import('chart.js')
      Chart.register(...registerables)
      if (cancelled || !canvasRef.current || chartRef.current) return

      chartInstance = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: metricRef.current.name,
              data: [],
              borderColor: metricRef.current.chartColor,
              backgroundColor: metricRef.current.chartFill,
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: metricRef.current.chartColor,
              pointHoverRadius: 6,
              fill: true,
              yAxisID: 'y',
              tension: 0.4,
            },
            {
              label: secondaryMetricRef.current.name,
              data: [],
              borderColor: secondaryMetricRef.current.chartColor,
              backgroundColor: secondaryMetricRef.current.chartFill,
              borderWidth: 2,
              pointRadius: 0,
              yAxisID: 'y1',
              tension: 0.4,
            },
          ],
        },
        options: {
          animation: false,
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                title: (items: Array<{ label: string }>) => `Time: ${items[0].label}`,
                label: (item: any) => {
                  if (item.datasetIndex === 0) {
                    return ` ${metricRef.current.name}: ${Number(item.raw).toFixed(1)} ${metricRef.current.unit}`
                  }
                  return ` ${secondaryMetricRef.current.name}: ${Number(item.raw).toFixed(1)} ${secondaryMetricRef.current.unit}`
                },
              },
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Time',
                color: '#94a3b8',
                font: { size: 12 },
              },
              ticks: { color: '#94a3b8', maxTicksLimit: 8 },
              grid: { color: 'rgba(148,163,184,0.1)' },
            },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: `${metricRef.current.name} (${metricRef.current.unit})`,
                color: '#94a3b8',
                font: { size: 12 },
              },
              ticks: { color: '#94a3b8' },
              grid: { color: 'rgba(148,163,184,0.1)' },
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: `${secondaryMetricRef.current.name} (${secondaryMetricRef.current.unit})`,
                color: secondaryMetricRef.current.chartColor,
                font: { size: 12 },
              },
              ticks: { color: secondaryMetricRef.current.chartColor },
              grid: { drawOnChartArea: false },
            },
          },
        },
      })
      
      chartRef.current = chartInstance
      
      // Initial render with current points if they exist
      if (points.length > 0) {
        updateChartData(metric, secondaryMetric, points)
      }
    }

    init()

    return () => {
      cancelled = true
      if (chartInstance || chartRef.current) {
        (chartInstance || chartRef.current).destroy()
        chartRef.current = null
      }
    }
  }, [canvasRef]) // Run exactly once per canvas

  // Helper to apply updates
  const updateChartData = (currentMetric: Metric, currentSecondary: Metric, currentPoints: ChartPoint[]) => {
    const chart = chartRef.current
    if (!chart) return

    chart.data.labels = currentPoints.map((d) => d.timeFormatted)
    
    // Dataset 0
    chart.data.datasets[0].data = currentPoints.map((d) => d.value)
    chart.data.datasets[0].label = currentMetric.name
    chart.data.datasets[0].borderColor = currentMetric.chartColor
    chart.data.datasets[0].backgroundColor = currentMetric.chartFill
    chart.data.datasets[0].pointBackgroundColor = currentMetric.chartColor
    chart.options.scales.y.title.text = `${currentMetric.name} (${currentMetric.unit})`
    const primaryAxis = getAxisBounds(currentPoints.map((point) => point.value), currentMetric.id)
    chart.options.scales.y.min = primaryAxis.min
    chart.options.scales.y.max = primaryAxis.max
    chart.options.scales.y.ticks.stepSize = primaryAxis.step
    
    // Dataset 1
    chart.data.datasets[1].data = currentPoints.map((d) => d.secondaryValue)
    chart.data.datasets[1].label = currentSecondary.name
    chart.data.datasets[1].borderColor = currentSecondary.chartColor
    chart.data.datasets[1].backgroundColor = currentSecondary.chartFill
    chart.options.scales.y1.title.text = `${currentSecondary.name} (${currentSecondary.unit})`
    chart.options.scales.y1.title.color = currentSecondary.chartColor
    chart.options.scales.y1.ticks.color = currentSecondary.chartColor
    const secondaryAxis = getAxisBounds(currentPoints.map((point) => point.secondaryValue), currentSecondary.id)
    chart.options.scales.y1.min = secondaryAxis.min
    chart.options.scales.y1.max = secondaryAxis.max
    chart.options.scales.y1.ticks.stepSize = secondaryAxis.step
    
    chart.update('none')
  }

  // Effect to update data without destroying chart
  useEffect(() => {
    if (chartRef.current) {
      updateChartData(metric, secondaryMetric, points)
    }
  }, [metric, secondaryMetric, points])
}

function MetricChart({ metric, secondaryMetric, points }: { metric: Metric; secondaryMetric: Metric; points: ChartPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  useChartInstance(canvasRef, metric, secondaryMetric, points)

  return (
    <div style={{ position: 'relative', width: '100%', height: 280 }}>
      <div 
        className="flex h-70 items-center justify-center text-sm text-ink-muted"
        style={{ display: points.length === 0 ? 'flex' : 'none', position: 'absolute', inset: 0 }}
      >
        Waiting for telemetry data...
      </div>
      <canvas 
        ref={canvasRef} 
        style={{ display: points.length > 0 ? 'block' : 'none' }} 
      />
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
  const [secondaryMetric, setSecondaryMetric] = useState<MetricId>('altitude')
  const [timeRange, setTimeRange] = useState<keyof typeof TIME_RANGES>('5m')
  const [records, setRecords] = useState<TelemetryRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 8

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/data?limit=${HISTORY_LIMIT}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Could not load telemetry data')
      }

      const payload = (await response.json()) as { records?: TelemetryRecord[] }
      setRecords(Array.isArray(payload.records) ? payload.records : [])
      setError(null)
    } catch {
      setError('Could not connect to telemetry API')
    } finally {
      setIsLoading(false)
    }
  }, [])

  /*const fetchData = async () => {
    try {
      const response = await fetch(`/api/data?limit=${HISTORY_LIMIT}`);
      const data = await response.json();
      setRecords(data.records || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Could not connect to telemetry API');
    } finally {
      setIsLoading(false);
    }
  };*/

  useEffect(() => {
    fetchData()
    const interval = window.setInterval(fetchData, POLL_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [fetchData])

  const activeMetric = metrics.find((m) => m.id === selectedMetric)!
  const activeSecondaryMetric = metrics.find((m) => m.id === secondaryMetric)!

  const metricData = useMemo<ChartPoint[]>(() => {
    let sortedRecords = [...records].sort((a, b) => a.timestamp - b.timestamp)
    if (sortedRecords.length > 0 && TIME_RANGES[timeRange] !== 0) {
      const latestTimestamp = sortedRecords[sortedRecords.length - 1].timestamp
      const minTimestamp = latestTimestamp - TIME_RANGES[timeRange]
      sortedRecords = sortedRecords.filter(item => item.timestamp >= minTimestamp)
    }

    return sortedRecords
      .map((record, index, arr) => {
        const date = new Date(record.timestamp * 1000)
        const timeFormatted = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
        
        let velocity = 0
        if (index > 0) {
          const prevData = arr[index - 1]
          const timeDiff = record.timestamp - prevData.timestamp
          if (timeDiff > 0) {
            velocity = (record.altitude - prevData.altitude) / timeDiff
            if (velocity > 50) velocity = 50
            if (velocity < -50) velocity = -50
          }
        }
        
        return {
          timeFormatted,
          altitude: record.altitude,
          velocity,
          value: selectedMetric === 'velocity' ? velocity : record[selectedMetric],
          secondaryValue: secondaryMetric === 'velocity' ? velocity : record[secondaryMetric],
        }
      })
      .filter((point) => Number.isFinite(point.value) && Number.isFinite(point.secondaryValue))
  }, [records, selectedMetric, secondaryMetric, timeRange])

  const totalPages = Math.max(1, Math.ceil(metricData.length / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const visibleData = metricData.slice(startIndex, startIndex + rowsPerPage)
  const visibleRecords = records.slice(startIndex, startIndex + rowsPerPage)

  const values = metricData.map((d) => d.value)
  const max = values.length > 0 ? Math.max(...values) : 0
  const min = values.length > 0 ? Math.min(...values) : 0
  const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '0.0'

  const latestRecord = records.length > 0 ? records[records.length - 1] : undefined
  const gpsHistory = useMemo<GpsPoint[]>(
    () =>
      records
        .filter(
          (record) =>
            record.gpsLatitude !== null &&
            record.gpsLongitude !== null &&
            Number.isFinite(record.gpsLatitude) &&
            Number.isFinite(record.gpsLongitude)
        )
        .map((record) => ({
          gpsLatitude: record.gpsLatitude as number,
          gpsLongitude: record.gpsLongitude as number,
          timestamp: record.timestamp,
        })),
    [records]
  )
  const latestGpsPoint = gpsHistory.length > 0 ? gpsHistory[gpsHistory.length - 1] : null

  const latestImage = useMemo<string | null>(
    () => {
      const img = [...records].reverse().find((r) => r.img)?.img
      if (!img) return null
      // Normalize path separators for Supabase storage URLs
      return img.replace(/\\/g, '/')
    },
    [records]
  )

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
          className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex flex-wrap gap-3">
            {metrics.map((metric) => (
              <button
                key={metric.id}
                onClick={() => setSelectedMetric(metric.id as MetricId)}
                className={`flex cursor-pointer shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-300 ${
                  selectedMetric === metric.id
                    ? 'border-accent bg-gray-800 text-white shadow-soft'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 hover:shadow-soft'
                }`}
              >
                {metric.icon && <span className="flex items-center">{metric.icon}</span>}
                {metric.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-ink-muted">Time Filter:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as keyof typeof TIME_RANGES)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-soft focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="5m">Last 5 min</option>
              <option value="15m">Last 15 min</option>
              <option value="30m">Last 30 min</option>
              <option value="1h">Last 1 hour</option>
              <option value="all">All data</option>
            </select>
          </div>
        </motion.div>

        <motion.div
          key={selectedMetric + '-chart'}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 rounded-2xl border border-line bg-surface-card p-6 shadow-soft md:p-8"
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-ink">{activeMetric.name} vs Time</h2>
              <p className="text-sm text-ink-muted">
                Auto-refresh every {Math.floor(POLL_INTERVAL_MS / 1000)}s · {metricData.length} data points
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ink-muted">Compare against:</span>
              <select
                value={secondaryMetric}
                onChange={(e) => setSecondaryMetric(e.target.value as MetricId)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-soft focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {metrics.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <MetricChart metric={activeMetric} secondaryMetric={activeSecondaryMetric} points={metricData} />
        </motion.div>

        <motion.div
          key={selectedMetric + '-stats'}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 grid grid-cols-3 gap-4"
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

        {latestImage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8 rounded-2xl border border-line bg-surface-card p-6 shadow-soft md:p-8"
          >
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-ink">Last Image</h2>
              <p className="text-sm text-ink-muted">
                Most recent photo captured by the CanSat
              </p>
            </div>
            <div className="flex justify-center">
              <img
                src={latestImage}
                alt="Latest CanSat capture"
                className="max-h-96 w-auto rounded-xl object-contain shadow-md"
                loading="lazy"
              />
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-8 rounded-2xl border border-line bg-surface-card p-6 shadow-soft md:p-8"
        >
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-ink">Trayectoria GPS</h2>
            <p className="text-sm text-ink-muted">
              Ruta historica y ultima posicion recibida por telemetria
            </p>
          </div>

          <TelemetryMap
            lat={latestGpsPoint?.gpsLatitude ?? null}
            lng={latestGpsPoint?.gpsLongitude ?? null}
            history={gpsHistory}
          />
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
