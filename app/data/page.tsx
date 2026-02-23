'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { ThermometerIcon, WindIcon, DropletIcon } from '../components/Icons'

export default function DataPage() {
  const [selectedMetric, setSelectedMetric] = useState('temperature')

  const sampleData = {
    temperature: [
      { altitude: 0, value: 25 },
      { altitude: 500, value: 22 },
      { altitude: 1000, value: 18 },
      { altitude: 1500, value: 14 },
      { altitude: 2000, value: 10 },
      { altitude: 2500, value: 6 },
    ],
    pressure: [
      { altitude: 0, value: 101.3 },
      { altitude: 500, value: 95.5 },
      { altitude: 1000, value: 89.9 },
      { altitude: 1500, value: 84.6 },
      { altitude: 2000, value: 79.5 },
      { altitude: 2500, value: 74.7 },
    ],
    humidity: [
      { altitude: 0, value: 65 },
      { altitude: 500, value: 60 },
      { altitude: 1000, value: 55 },
      { altitude: 1500, value: 50 },
      { altitude: 2000, value: 45 },
      { altitude: 2500, value: 40 },
    ],
  }

  const metrics = [
    { id: 'temperature', name: 'Temperature', unit: '\u00b0C', icon: <ThermometerIcon className="w-5 h-5" /> as ReactNode },
    { id: 'pressure', name: 'Pressure', unit: 'kPa', icon: <WindIcon className="w-5 h-5" /> as ReactNode },
    { id: 'humidity', name: 'Humidity', unit: '%', icon: <DropletIcon className="w-5 h-5" /> as ReactNode },
  ]

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
            Real-time atmospheric data from the Celestis CanSat mission
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
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300 cursor-pointer ${
                  selectedMetric === metric.id
                    ? 'bg-accent text-white shadow-soft'
                    : 'bg-surface-card text-ink-secondary hover:text-ink border border-line hover:shadow-soft'
                }`}
              >
                <span className="flex items-center">{metric.icon}</span>
                {metric.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Data Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-surface-card rounded-2xl p-6 md:p-8 shadow-soft border border-line mb-8"
        >
          <h2 className="text-2xl font-semibold mb-6 text-ink">
            {metrics.find(m => m.id === selectedMetric)?.name} vs Altitude
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left py-3 px-4 text-ink-secondary text-sm font-medium">Altitude (m)</th>
                  <th className="text-left py-3 px-4 text-ink-secondary text-sm font-medium">
                    {metrics.find(m => m.id === selectedMetric)?.name} ({metrics.find(m => m.id === selectedMetric)?.unit})
                  </th>
                </tr>
              </thead>
              <tbody>
                {sampleData[selectedMetric as keyof typeof sampleData].map((point, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.06 }}
                    className="border-b border-line/50 hover:bg-surface transition-colors"
                  >
                    <td className="py-3 px-4 text-ink-secondary">{point.altitude}</td>
                    <td className="py-3 px-4 font-semibold text-ink">{point.value}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {metrics.map((metric, index) => {
            const data = sampleData[metric.id as keyof typeof sampleData]
            const values = data.map(d => d.value)
            const max = Math.max(...values)
            const min = Math.min(...values)
            const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)

            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.08 }}
                whileHover={{ y: -3 }}
                className="bg-surface-card rounded-2xl p-6 shadow-soft hover:shadow-card border border-line transition-all duration-300"
              >
                <div className="w-10 h-10 mb-4 rounded-xl bg-accent-light flex items-center justify-center text-accent">{metric.icon}</div>
                <h3 className="text-lg font-semibold mb-3 text-ink">{metric.name}</h3>
                <div className="space-y-2 text-ink-secondary text-sm">
                  <p>Max: <span className="font-semibold text-ink">{max} {metric.unit}</span></p>
                  <p>Min: <span className="font-semibold text-ink">{min} {metric.unit}</span></p>
                  <p>Avg: <span className="font-semibold text-ink">{avg} {metric.unit}</span></p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Mission Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="bg-surface-card rounded-2xl p-6 md:p-8 shadow-soft border border-line"
        >
          <h2 className="text-2xl font-semibold mb-6 text-ink">Mission Status</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-ink-muted text-sm mb-1">Last Update</p>
              <p className="text-lg font-semibold text-ink">Just now</p>
            </div>
            <div>
              <p className="text-ink-muted text-sm mb-1">Data Points Collected</p>
              <p className="text-lg font-semibold text-ink">18</p>
            </div>
            <div>
              <p className="text-ink-muted text-sm mb-1">Status</p>
              <p className="text-lg font-semibold text-emerald-600">Active</p>
            </div>
            <div>
              <p className="text-ink-muted text-sm mb-1">Signal Strength</p>
              <p className="text-lg font-semibold text-ink">Excellent</p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
