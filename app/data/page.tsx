'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'

export default function DataPage() {
  const [selectedMetric, setSelectedMetric] = useState('temperature')

  // Sample data - replace with actual data collection
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
    { id: 'temperature', name: 'Temperature', unit: '°C', icon: '🌡️' },
    { id: 'pressure', name: 'Pressure', unit: 'kPa', icon: '💨' },
    { id: 'humidity', name: 'Humidity', unit: '%', icon: '💧' },
  ]

  return (
    <main className="min-h-screen text-white px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <Link href="/">
            <button className="mb-6 text-celestis-blue-light hover:text-white transition-colors duration-300 flex items-center gap-2">
              ← Back to Home
            </button>
          </Link>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-celestis-blue-light to-white bg-clip-text text-transparent">
            Collected Data
          </h1>
          <p className="text-blue-200 text-lg">
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
          <div className="flex flex-wrap gap-4">
            {metrics.map((metric) => (
              <button
                key={metric.id}
                onClick={() => setSelectedMetric(metric.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                  selectedMetric === metric.id
                    ? 'bg-gradient-to-r from-celestis-blue-light to-celestis-blue-dark shadow-lg shadow-celestis-blue/50'
                    : 'bg-white/10 hover:bg-white/20 border border-white/20'
                }`}
              >
                <span className="text-2xl">{metric.icon}</span>
                {metric.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Data Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20 mb-8"
        >
          <h2 className="text-3xl font-bold mb-6 text-celestis-blue-light">
            {metrics.find(m => m.id === selectedMetric)?.name} vs Altitude
          </h2>
          
          {/* Simple Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-celestis-blue-light">Altitude (m)</th>
                  <th className="text-left py-3 px-4 text-celestis-blue-light">
                    {metrics.find(m => m.id === selectedMetric)?.name} ({metrics.find(m => m.id === selectedMetric)?.unit})
                  </th>
                </tr>
              </thead>
              <tbody>
                {sampleData[selectedMetric as keyof typeof sampleData].map((point, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="border-b border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4">{point.altitude}</td>
                    <td className="py-3 px-4 font-semibold">{point.value}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
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
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="bg-gradient-to-br from-white/10 to-celestis-blue/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20"
              >
                <div className="text-3xl mb-3">{metric.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-celestis-blue-light">{metric.name}</h3>
                <div className="space-y-2 text-blue-100">
                  <p>Max: <span className="font-semibold text-white">{max} {metric.unit}</span></p>
                  <p>Min: <span className="font-semibold text-white">{min} {metric.unit}</span></p>
                  <p>Avg: <span className="font-semibold text-white">{avg} {metric.unit}</span></p>
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
          className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20"
        >
          <h2 className="text-3xl font-bold mb-6 text-celestis-blue-light">Mission Status</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-blue-200 mb-2">Last Update:</p>
              <p className="text-xl font-semibold">Just now</p>
            </div>
            <div>
              <p className="text-blue-200 mb-2">Data Points Collected:</p>
              <p className="text-xl font-semibold">18</p>
            </div>
            <div>
              <p className="text-blue-200 mb-2">Status:</p>
              <p className="text-xl font-semibold text-green-400">● Active</p>
            </div>
            <div>
              <p className="text-blue-200 mb-2">Signal Strength:</p>
              <p className="text-xl font-semibold">Excellent</p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
