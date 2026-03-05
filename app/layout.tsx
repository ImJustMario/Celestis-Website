import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from './components/Navbar'

export const metadata: Metadata = {
  title: 'Celestis - CanSat Project',
  description: 'Modern CanSat project website for Celestis mission',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-sans text-ink bg-surface">
        <Navbar />
        {children}
      </body>
    </html>
  )
}