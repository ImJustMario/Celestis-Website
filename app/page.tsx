'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen text-white">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center z-10"
        >
          {/* Logo Placeholder */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 relative inline-block"
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-celestis-blue-light to-celestis-blue-dark flex items-center justify-center shadow-2xl shadow-celestis-blue/50">
              <span className="text-6xl font-bold text-white">C</span>
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 360]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-2 -right-2 text-4xl"
              >
                ⭐
              </motion.div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-6xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-celestis-blue-light via-white to-celestis-blue-light bg-clip-text text-transparent"
          >
            CELESTIS
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl md:text-2xl text-blue-200 mb-12"
          >
            Exploring the Atmosphere Through Innovation
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Link href="/data">
              <button className="bg-gradient-to-r from-celestis-blue-light to-celestis-blue-dark hover:from-celestis-blue to-celestis-blue-dark text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg shadow-celestis-blue/50 hover:shadow-celestis-blue/70 transition-all duration-300 transform hover:scale-105">
                View Collected Data
              </button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full"
              initial={{ 
                x: (i * 100) % 1920,
                y: (i * 150) % 1080,
                opacity: 0
              }}
              animate={{
                y: [null, ((i * 150) % 1080 + 500) % 1080],
                x: [null, ((i * 100) % 1920 + 300) % 1920],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                delay: Math.random() * 5
              }}
            />
          ))}
        </div>
      </section>

      {/* Project Description Section */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold mb-8 text-center bg-gradient-to-r from-celestis-blue-light to-white bg-clip-text text-transparent">
              Project Description
            </h2>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
              <p className="text-lg text-blue-100 leading-relaxed mb-4">
                Celestis is an innovative CanSat project designed to explore and analyze atmospheric conditions. 
                Our satellite system is engineered to collect critical environmental data during its descent through 
                various atmospheric layers.
              </p>
              <p className="text-lg text-blue-100 leading-relaxed mb-4">
                The CanSat (Can Satellite) is a simulation of a real satellite, integrated within the volume and 
                shape of a soft drink can. The challenge involves designing, building, and launching a CanSat that 
                performs specific mission objectives.
              </p>
              <p className="text-lg text-blue-100 leading-relaxed">
                Through this project, we aim to push the boundaries of student-led aerospace engineering and 
                contribute valuable atmospheric research data while gaining hands-on experience with satellite 
                technology and data analysis.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Goals Section */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-6xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold mb-12 text-center bg-gradient-to-r from-white to-celestis-blue-light bg-clip-text text-transparent">
              Mission Goals
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
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
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 hover:border-celestis-blue-light/50 transition-all duration-300"
                >
                  <div className="text-4xl mb-4">{goal.icon}</div>
                  <h3 className="text-2xl font-bold mb-3 text-celestis-blue-light">
                    {goal.title}
                  </h3>
                  <p className="text-blue-100">
                    {goal.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-6xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold mb-12 text-center bg-gradient-to-r from-celestis-blue-light to-white bg-clip-text text-transparent">
              Our Team
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
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
                  className="bg-gradient-to-br from-white/10 to-celestis-blue/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/20 text-center hover:border-celestis-blue-light/50 transition-all duration-300"
                >
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-celestis-blue-light to-celestis-blue-dark flex items-center justify-center text-3xl shadow-lg">
                    👤
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">
                    {member.name}
                  </h3>
                  <p className="text-blue-200 text-sm">
                    {member.role}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-white/10">
        <p className="text-blue-200">
          © 2024 Celestis CanSat Project. All rights reserved.
        </p>
      </footer>
    </main>
  )
}
