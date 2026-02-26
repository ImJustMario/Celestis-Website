'use client'

import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRef } from 'react'
import { GlobeIcon, SignalIcon, AdjustmentsIcon, ChartBarIcon, UserIcon } from './components/Icons'
import Gallery from './components/Gallery'
import Particles from './components/Particles'

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

  const nextScreenY = useTransform(progress, [0, 1], ['40%', '0%'])
  const nextScreenOpacity = useTransform(progress, [0.08, 0.42, 0.85], [0, 0.68, 1])
  const nextScreenBlur = useTransform(progress, [0, 1], ['14px', '0px'])
  const nextScreenScale = useTransform(progress, [0, 1], [0.97, 1])

  const depthOverlayOpacity = useTransform(progress, [0, 1], [0, 0.18])

  return (
    <main className="min-h-screen">
      {/* ── Hero + scroll transition ── */}
      <section id="hero" ref={transitionRef} className="relative h-[240svh] md:h-[210svh]">
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <motion.div
            style={{ opacity: depthOverlayOpacity }}
            className="absolute inset-0 bg-black pointer-events-none"
          />

          {/* First screen — dark editorial hero */}
          <motion.div
            style={{
              y: firstScreenY,
              filter: firstScreenBlur,
              opacity: firstScreenOpacity,
              scale: firstScreenScale,
              willChange: 'transform, filter, opacity'
            }}
            className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gradient-to-br from-[#AFD5F0] via-[#A3C6E0] to-[#7C9FB9]"
          >
            <Particles />
            <div className="text-center max-w-3xl px-4">
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
                className="text-4xl sm:text-5xl md:text-8xl font-extrabold mb-4 tracking-tight text-white"
              >
                CELESTIS
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="text-base sm:text-lg md:text-xl text-white/50 mb-8 md:mb-10 font-light tracking-wide"
              >
                Exploring the Atmosphere Through Innovation
              </motion.p>
            </div>

            {/* Particles — muted for editorial feel */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-[2px] h-[2px] bg-white/30 rounded-full"
                  initial={{
                    x: (i * 137) % 1600,
                    y: (i * 197) % 900,
                    opacity: 0
                  }}
                  animate={{
                    y: [null, ((i * 197) % 900 + 380) % 900],
                    x: [null, ((i * 137) % 1600 + 260) % 1600],
                    opacity: [0, 0.6, 0]
                  }}
                  transition={{
                    duration: 12 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.25
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Second screen — project description (light) */}
          <motion.div
            style={{
              y: nextScreenY,
              filter: nextScreenBlur,
              opacity: nextScreenOpacity,
              scale: nextScreenScale,
              willChange: 'transform, filter, opacity'
            }}
            className="absolute inset-0 z-20 flex items-center justify-center px-4"
          >
            <div className="w-full max-w-3xl min-h-[56svh] md:min-h-[58vh] max-h-[86svh] md:max-h-none overflow-hidden p-6 sm:p-8 md:p-12 flex flex-col justify-center">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-5 md:mb-6 text-ink tracking-tight">
                Project Description
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-ink-secondary leading-relaxed mb-4 md:mb-5">
                Celestis is an innovative CanSat mission designed to collect atmospheric data during descent with stable telemetry and high-quality sensing.
              </p>
              <p className="text-sm sm:text-base md:text-lg text-ink-secondary leading-relaxed mb-6 md:mb-8">
                Scroll-driven transitions create a natural depth effect: the initial screen softly moves and blurs while this panel rises from below in sync with your gesture.
              </p>
              <Link href="/data" className="inline-block">
                <button className="bg-black hover:bg-black/90 text-white font-semibold py-3 px-7 md:py-3.5 md:px-8 rounded-full text-sm sm:text-base transition-all duration-300 shadow-soft hover:shadow-lift transform hover:scale-[1.02] cursor-pointer">
                  View Collected Data
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Mission Goals ── */}
      <section id="mission" className="py-20 md:py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-center text-ink tracking-tight">
              Mission Goals
            </h2>
            <p className="text-center text-ink-secondary mb-12 md:mb-16 max-w-xl mx-auto">
              Four core objectives driving Celestis from concept to descent.
            </p>
            <div className="grid md:grid-cols-2 gap-5 md:gap-6">
              {[
                {
                  title: "Atmospheric Data Collection",
                  description: "Gather comprehensive data on temperature, pressure, humidity, and altitude throughout the descent.",
                  icon: <GlobeIcon className="w-6 h-6 text-accent" />
                },
                {
                  title: "Real-time Telemetry",
                  description: "Establish reliable communication systems for real-time data transmission to ground stations.",
                  icon: <SignalIcon className="w-6 h-6 text-accent" />
                },
                {
                  title: "Stable Descent Control",
                  description: "Implement effective stabilization and descent control mechanisms for accurate data collection.",
                  icon: <AdjustmentsIcon className="w-6 h-6 text-accent" />
                },
                {
                  title: "Data Analysis & Visualization",
                  description: "Process and visualize collected data to derive meaningful insights about atmospheric conditions.",
                  icon: <ChartBarIcon className="w-6 h-6 text-accent" />
                }
              ].map((goal, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                  className="bg-surface-card rounded-2xl p-6 md:p-8 shadow-soft hover:shadow-card border border-line transition-all duration-300"
                >
                  <div className="w-11 h-11 mb-5 rounded-xl bg-accent-light flex items-center justify-center">
                    {goal.icon}
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold mb-3 text-ink">
                    {goal.title}
                  </h3>
                  <p className="text-sm md:text-base text-ink-secondary leading-relaxed">
                    {goal.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Gallery ── */}
      <section id="gallery" className="py-20 md:py-32 px-4 bg-surface-card">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-center text-ink tracking-tight">
              Gallery
            </h2>
            <p className="text-center text-ink-secondary mb-12 md:mb-16 max-w-xl mx-auto">
              Behind the scenes of our mission development.
            </p>
            <Gallery />
          </motion.div>
        </div>
      </section>

      {/* ── Team ── */}
      <section id="team" className="py-20 md:py-32 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-center text-ink tracking-tight">
              Our Team
            </h2>
            <p className="text-center text-ink-secondary mb-12 md:mb-16 max-w-xl mx-auto">
              Four minds, one mission.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {[
                { name: "Project Lead", role: "Management & Systems Integration" },
                { name: "Hardware Engineer", role: "Electronics & Sensor Design" },
                { name: "Software Developer", role: "Data Processing & Visualization" },
                { name: "Comms Lead", role: "Telemetry & Ground Station" }
              ].map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                  className="bg-surface-card rounded-2xl p-6 md:p-8 shadow-soft hover:shadow-card border border-line text-center transition-all duration-300"
                >
                  <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-5 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                    <UserIcon className="w-9 h-9 md:w-11 md:h-11 text-white/70" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold mb-1 text-ink">
                    {member.name}
                  </h3>
                  <p className="text-ink-muted text-xs md:text-sm">
                    {member.role}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 text-center border-t border-line">
        <p className="text-ink-muted text-sm">
          Celestis CanSat Project. All rights reserved.
        </p>
      </footer>
    </main>
  )
}
