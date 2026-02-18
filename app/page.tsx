'use client'

import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRef } from 'react'

export default function Home() {
  const transitionRef = useRef<HTMLDivElement | null>(null)

  const { scrollYProgress } = useScroll({
    target: transitionRef,
    offset: ['start start', 'end end']
  })

  const progress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 26,
    mass: 0.25
  })

  const firstScreenY = useTransform(progress, [0, 1], ['0%', '-32%'])
  const firstScreenBlur = useTransform(progress, [0, 1], ['0px', '16px'])
  const firstScreenOpacity = useTransform(progress, [0, 0.7], [1, 0])
  const firstScreenScale = useTransform(progress, [0, 1], [1, 0.96])

  const nextScreenY = useTransform(progress, [0, 1], ['24%', '0%'])
  const nextScreenOpacity = useTransform(progress, [0.08, 0.42, 0.85], [0, 0.68, 1])
  const nextScreenBlur = useTransform(progress, [0, 1], ['14px', '0px'])
  const nextScreenScale = useTransform(progress, [0, 1], [0.97, 1])

  const depthOverlayOpacity = useTransform(progress, [0, 1], [0, 0.26])

  return (
    <main className="min-h-screen text-white">
      <section ref={transitionRef} className="relative h-[240svh] md:h-[210svh]">
        <div className="sticky top-0 h-[100svh] overflow-hidden px-4">
          <motion.div
            style={{ opacity: depthOverlayOpacity }}
            className="absolute inset-0 bg-slate-950 pointer-events-none"
          />

          <motion.div
            style={{
              y: firstScreenY,
              filter: firstScreenBlur,
              opacity: firstScreenOpacity,
              scale: firstScreenScale,
              willChange: 'transform, filter, opacity'
            }}
            className="absolute inset-0 flex flex-col items-center justify-center z-10 px-2"
          >
            <div className="text-center max-w-3xl">
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="mb-8 relative inline-block"
              >
                <Image src="/logo_transparent.png" width={140} height={140} alt="Logo" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl sm:text-5xl md:text-8xl font-bold mb-3 bg-gradient-to-r from-celestis-blue-light via-white to-celestis-blue-light bg-clip-text text-transparent"
              >
                CELESTIS
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="text-base sm:text-lg md:text-2xl text-blue-200 mb-8 md:mb-10 px-2"
              >
                Exploring the Atmosphere Through Innovation
              </motion.p>
            </div>

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(18)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-blue-300 rounded-full"
                  initial={{
                    x: (i * 137) % 1600,
                    y: (i * 197) % 900,
                    opacity: 0
                  }}
                  animate={{
                    y: [null, ((i * 197) % 900 + 380) % 900],
                    x: [null, ((i * 137) % 1600 + 260) % 1600],
                    opacity: [0, 0.9, 0]
                  }}
                  transition={{
                    duration: 10 + i * 0.35,
                    repeat: Infinity,
                    delay: i * 0.18
                  }}
                />
              ))}
            </div>
          </motion.div>

          <motion.div
  style={{
    y: nextScreenY,
    filter: nextScreenBlur,
    opacity: nextScreenOpacity,
    scale: nextScreenScale,
    willChange: 'transform, filter, opacity'
  }}
  className="absolute inset-0 z-20 flex items-center justify-center px-1"
>
          <div className="w-full max-w-4xl min-h-[56svh] md:min-h-[58vh] max-h-[86svh] md:max-h-none overflow-hidden p-5 sm:p-6 md:p-10 flex flex-col justify-center">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 md:mb-5 bg-gradient-to-r from-white to-white bg-clip-text text-transparent">
                Project Description
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-blue-100 leading-relaxed mb-4 md:mb-5">
                Celestis is an innovative CanSat mission designed to collect atmospheric data during descent with stable telemetry and high-quality sensing.
              </p>
              <p className="text-sm sm:text-base md:text-lg text-blue-100 leading-relaxed mb-6 md:mb-7">
                Scroll-driven transitions create a natural depth effect: the initial screen softly moves and blurs while this panel rises from below in sync with your gesture.
              </p>
              <Link href="/data" className="inline-block">
                <button className="bg-blue-400 hover:from-celestis-blue hover:to-celestis-blue-dark text-white font-bold py-3 px-6 md:py-3.5 md:px-7 rounded-full text-sm sm:text-base md:text-lg shadow-lg shadow-celestis-blue/50 hover:shadow-celestis-blue/70 transition-all duration-300 transform hover:scale-105">
                  View Collected Data
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="min-h-[90svh] md:min-h-screen flex items-center justify-center px-4 py-14 md:py-20">
        <div className="max-w-6xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 md:mb-12 text-center bg-gradient-to-r from-white to-celestis-blue-light bg-clip-text text-transparent">
              Mission Goals
            </h2>
            <div className="grid md:grid-cols-2 gap-5 md:gap-6">
              {[
                {
                  title: "Atmospheric Data Collection",
                  description: "Gather comprehensive data on temperature, pressure, humidity, and altitude throughout the descent.",
                  icon: "🌡️"
                },
                {
                  title: "Real-time Telemetry",
                  description: "Establish reliable communication systems for real-time data transmission to ground stations.",
                  icon: "📡"
                },
                {
                  title: "Stable Descent Control",
                  description: "Implement effective stabilization and descent control mechanisms for accurate data collection.",
                  icon: "🎯"
                },
                {
                  title: "Data Analysis & Visualization",
                  description: "Process and visualize collected data to derive meaningful insights about atmospheric conditions.",
                  icon: "📊"
                }
              ].map((goal, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                  className="h-full bg-white/10 backdrop-blur-md rounded-2xl p-5 md:p-6 shadow-xl border border-white/20 hover:border-celestis-blue-light/50 transition-all duration-300"
                >
                  <div className="text-4xl mb-4">{goal.icon}</div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 text-celestis-blue-light">
                    {goal.title}
                  </h3>
                  <p className="text-sm md:text-base text-blue-100">
                    {goal.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="min-h-[90svh] md:min-h-screen flex items-center justify-center px-4 py-14 md:py-20">
        <div className="max-w-6xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 md:mb-12 text-center bg-gradient-to-r from-celestis-blue-light to-white bg-clip-text text-transparent">
              Our Team
            </h2>
            <div className="grid md:grid-cols-3 gap-5 md:gap-8">
              {[
                { name: "Team Lead", role: "Project Management & Systems Integration" },
                { name: "Electronics Engineer", role: "Hardware Design & Sensors" },
                { name: "Software Developer", role: "Data Processing & Visualization" },
                { name: "Communications Specialist", role: "Telemetry & Ground Station" },
                { name: "Mechanical Engineer", role: "Structure & Deployment Systems" },
                { name: "Data Analyst", role: "Research & Analysis" }
              ].map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  className="h-full bg-gradient-to-br from-white/10 to-celestis-blue/10 backdrop-blur-md rounded-xl p-5 md:p-6 shadow-xl border border-white/20 text-center hover:border-celestis-blue-light/50 transition-all duration-300"
                >
                  <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-celestis-blue-light to-celestis-blue-dark flex items-center justify-center text-2xl md:text-3xl shadow-lg">
                    👤
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2 text-white">
                    {member.name}
                  </h3>
                  <p className="text-blue-200 text-xs md:text-sm">
                    {member.role}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-8 text-center border-t border-white/10">
        <p className="text-blue-200">
          © 2024 Celestis CanSat Project. All rights reserved.
        </p>
      </footer>
    </main>
  )
}
