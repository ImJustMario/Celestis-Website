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

const sampleData = {
  temperature: [
    { altitude: 0,    value: 25 },
    { altitude: 200,  value: 23.2 },
    { altitude: 400,  value: 21.4 },
    { altitude: 600,  value: 20.1 },
    { altitude: 800,  value: 18.8 },
    { altitude: 1000, value: 18 },
    { altitude: 1200, value: 16.5 },
    { altitude: 1400, value: 15.2 },
    { altitude: 1600, value: 14 },
    { altitude: 1800, value: 12.1 },
    { altitude: 2000, value: 10 },
    { altitude: 2200, value: 8.3 },
    { altitude: 2400, value: 7.1 },
    { altitude: 2500, value: 6 },
    { altitude: 200,  value: 23.2 },
    { altitude: 400,  value: 21.4 },
    { altitude: 600,  value: 20.1 },
    { altitude: 800,  value: 18.8 },
    { altitude: 1000, value: 18 },
    { altitude: 1200, value: 16.5 },
    { altitude: 1400, value: 15.2 },
    { altitude: 1600, value: 14 },
    { altitude: 1800, value: 12.1 },
    { altitude: 2000, value: 10 },
    { altitude: 2200, value: 8.3 },
    { altitude: 2400, value: 7.1 },
    { altitude: 2500, value: 6 },
    { altitude: 200,  value: 23.2 },
    { altitude: 400,  value: 21.4 },
    { altitude: 600,  value: 20.1 },
    { altitude: 800,  value: 18.8 },
    { altitude: 1000, value: 18 },
    { altitude: 1200, value: 16.5 },
    { altitude: 1400, value: 15.2 },
    { altitude: 1600, value: 14 },
    { altitude: 1800, value: 12.1 },
    { altitude: 2000, value: 10 },
    { altitude: 2200, value: 8.3 },
    { altitude: 2400, value: 7.1 },
    { altitude: 2500, value: 6 },
    { altitude: 200,  value: 23.2 },
    { altitude: 400,  value: 21.4 },
    { altitude: 600,  value: 20.1 },
    { altitude: 800,  value: 18.8 },
    { altitude: 1000, value: 18 },
    { altitude: 1200, value: 16.5 },
    { altitude: 1400, value: 15.2 },
    { altitude: 1600, value: 14 },
    { altitude: 1800, value: 12.1 },
    { altitude: 2000, value: 10 },
    { altitude: 2200, value: 8.3 },
    { altitude: 2400, value: 7.1 },
    { altitude: 2500, value: 6 },
    { altitude: 200,  value: 23.2 },
    { altitude: 400,  value: 21.4 },
    { altitude: 600,  value: 20.1 },
    { altitude: 800,  value: 18.8 },
    { altitude: 1000, value: 18 },
    { altitude: 1200, value: 16.5 },
    { altitude: 1400, value: 15.2 },
    { altitude: 1600, value: 14 },
    { altitude: 1800, value: 12.1 },
    { altitude: 2000, value: 10 },
    { altitude: 2200, value: 8.3 },
    { altitude: 2400, value: 7.1 },
    { altitude: 2500, value: 6 },
    
  ],
  pressure: [
    { altitude: 0,    value: 101.3 },
    { altitude: 200,  value: 98.9 },
    { altitude: 400,  value: 96.6 },
    { altitude: 600,  value: 94.3 },
    { altitude: 800,  value: 92.1 },
    { altitude: 1000, value: 89.9 },
    { altitude: 1200, value: 87.8 },
    { altitude: 1400, value: 86.2 },
    { altitude: 1600, value: 84.6 },
    { altitude: 1800, value: 82.0 },
    { altitude: 2000, value: 79.5 },
    { altitude: 2200, value: 77.1 },
    { altitude: 2400, value: 75.9 },
    { altitude: 2500, value: 74.7 },
  ],
  humidity: [
    { altitude: 0,    value: 65 },
    { altitude: 200,  value: 63 },
    { altitude: 400,  value: 61.5 },
    { altitude: 600,  value: 59.8 },
    { altitude: 800,  value: 57.4 },
    { altitude: 1000, value: 55 },
    { altitude: 1200, value: 53.1 },
    { altitude: 1400, value: 51.6 },
    { altitude: 1600, value: 50 },
    { altitude: 1800, value: 47.5 },
    { altitude: 2000, value: 45 },
    { altitude: 2200, value: 43.2 },
    { altitude: 2400, value: 41.8 },
    { altitude: 2500, value: 40 },
  ],
}

type MetricId = 'temperature' | 'pressure' | 'humidity'

interface Metric {
  id: MetricId
  name: string
  unit: string
  icon: ReactNode
  color: string
  chartColor: string
  chartFill: string
}

const metrics: Metric[] = [
  {
    id: 'temperature',
    name: 'Temperature',
    unit: '°C',
    icon: <ThermometerIcon className="w-5 h-5" />,
    color: 'text-orange-400',
    chartColor: '#fb923c',
    chartFill: 'rgba(251,146,60,0.12)',
  },
  {
    id: 'pressure',
    name: 'Pressure',
    unit: 'kPa',
    icon: <WindIcon className="w-5 h-5" />,
    color: 'text-sky-400',
    chartColor: '#38bdf8',
    chartFill: 'rgba(56,189,248,0.12)',
  },
  {
    id: 'humidity',
    name: 'Humidity',
    unit: '%',
    icon: <DropletIcon className="w-5 h-5" />,
    color: 'text-teal-400',
    chartColor: '#2dd4bf',
    chartFill: 'rgba(45,212,191,0.12)',
  },
]

function useChartInstance(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  metric: Metric
) {
  const chartRef = useRef<unknown>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let cancelled = false

    const init = async () => {
      const { Chart, registerables } = await import('chart.js')
      Chart.register(...registerables)
      if (cancelled || !canvasRef.current) return

      if (chartRef.current) {
        ;(chartRef.current as InstanceType<typeof Chart>).destroy()
      }

      const data = sampleData[metric.id]
      chartRef.current = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels: data.map(d => d.altitude),
          datasets: [
            {
              label: metric.name,
              data: data.map(d => d.value),
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
                title: (items) => `Altitude: ${items[0].label} m`,
                label: (item) =>
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
    }

    init()
    return () => {
      cancelled = true
      if (chartRef.current) {
        ;(chartRef.current as { destroy: () => void }).destroy()
      }
    }
  }, [metric, canvasRef])
}

function MetricChart({ metric }: { metric: Metric }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  useChartInstance(canvasRef, metric)

  return (
    <div style={{ position: 'relative', width: '100%', height: 280 }}>
      <canvas ref={canvasRef} />
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

export default function DataPage() {
  const [selectedMetric, setSelectedMetric] = useState<MetricId>('temperature')
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 5

  const activeMetric = metrics.find(m => m.id === selectedMetric)!
  const data = sampleData[selectedMetric]
  const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const visibleData = data.slice(startIndex, startIndex + rowsPerPage)
  const values = data.map(d => d.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)

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
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-14"
        >
          <Link href="/">
            <button className="mb-6 text-accent hover:text-accent-hover transition-colors duration-300 flex items-center gap-2 font-medium text-sm cursor-pointer">
              &larr; Back to Home
            </button>
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold mb-3 text-ink tracking-tight">
            Collected Data
          </h1>
          <p className="text-ink-secondary text-lg">
            Atmospheric data recorded by the Celestis CanSat during descent
          </p>
        </motion.div>

        {/* Metric Selector */}
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
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 cursor-pointer border shadow-sm ${
                  selectedMetric === metric.id
                    ? 'bg-gray-800 text-white border-accent shadow-soft'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-950 hover:border-slate-300 hover:shadow-soft'
                }`}
              >
                <span className="flex items-center">{metric.icon}</span>
                {metric.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          key={selectedMetric + '-stats'}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          {[
            { label: 'Max', value: `${max} ${activeMetric.unit}` },
            { label: 'Min', value: `${min} ${activeMetric.unit}` },
            { label: 'Avg', value: `${avg} ${activeMetric.unit}` },
          ].map(stat => (
            <div
              key={stat.label}
              className="bg-surface-card rounded-2xl p-5 border border-line shadow-soft text-center"
            >
              <p className="text-ink-muted text-xs mb-1 uppercase tracking-wide">{stat.label}</p>
              <p className={`text-xl font-semibold ${activeMetric.color}`}>{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Chart */}
        <motion.div
          key={selectedMetric + '-chart'}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-surface-card rounded-2xl p-6 md:p-8 shadow-soft border border-line mb-8"
        >
          <h2 className="text-xl font-semibold mb-1 text-ink">
            {activeMetric.name} vs Altitude
          </h2>
          <p className="text-ink-muted text-sm mb-6">
            Recorded every ~200 m of descent · {data.length} data points
          </p>
          <MetricChart metric={activeMetric} />
        </motion.div>

        {/* Data Table */}
        <motion.div
          key={selectedMetric + '-table'}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-surface-card rounded-2xl p-6 md:p-8 shadow-soft border border-line mb-8"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">Raw readings</h2>
              <p className="text-ink-muted text-sm">
                Showing {startIndex + 1}-{Math.min(startIndex + rowsPerPage, data.length)} of {data.length} records
              </p>
            </div>
            <p className="text-ink-muted text-sm">
              Page {currentPage} of {totalPages}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left py-3 px-4 text-ink-muted font-medium">Altitude (m)</th>
                  <th className="text-left py-3 px-4 text-ink-muted font-medium">
                    {activeMetric.name} ({activeMetric.unit})
                  </th>
                  <th className="text-left py-3 px-4 text-ink-muted font-medium hidden sm:table-cell">
                    Δ from surface
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleData.map((point, index) => {
                  const absoluteIndex = startIndex + index
                  const delta = (point.value - data[0].value).toFixed(1)
                  const deltaNum = parseFloat(delta)
                  return (
                    <motion.tr
                      key={`${point.altitude}-${point.value}`}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: absoluteIndex * 0.03 }}
                      className="border-b border-line/50 hover:bg-surface transition-colors"
                    >
                      <td className="py-3 px-4 text-ink-secondary">{point.altitude}</td>
                      <td className={`py-3 px-4 font-semibold ${activeMetric.color}`}>
                        {point.value.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        {index === 0 ? (
                          <span className="text-ink-muted">—</span>
                        ) : (
                          <span className={deltaNum < 0 ? 'text-sky-400' : 'text-orange-400'}>
                            {deltaNum > 0 ? '+' : ''}{delta}
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:text-slate-950 hover:border-slate-300 hover:shadow-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            {pageNumbers.map((page, index) =>
              page === '...' ? (
                <span key={`gap-${index}`} className="px-3 py-2 text-ink-muted select-none">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-10 px-4 py-2 rounded-full border font-medium transition-all duration-200 shadow-sm ${
                    currentPage === page
                      ? 'bg-accent text-white border-accent shadow-soft'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950 hover:border-slate-300 hover:shadow-soft'
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
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:text-slate-950 hover:border-slate-300 hover:shadow-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        {/* Mission Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="bg-surface-card rounded-2xl p-6 md:p-8 shadow-soft border border-line"
        >
          <h2 className="text-xl font-semibold mb-6 text-ink">Mission status</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Last update', value: 'Just now', valueClass: 'text-ink' },
              { label: 'Data points', value: `${data.length * metrics.length}`, valueClass: 'text-ink' },
              { label: 'Status', value: 'Active', valueClass: 'text-emerald-500' },
              { label: 'Signal strength', value: 'Excellent', valueClass: 'text-emerald-500' },
            ].map(item => (
              <div key={item.label}>
                <p className="text-ink-muted text-xs uppercase tracking-wide mb-1">{item.label}</p>
                <p className={`text-lg font-semibold ${item.valueClass}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </main>
  )
}