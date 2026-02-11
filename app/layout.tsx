import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Celestis - CanSat Project',
  description: 'Modern CanSat project website for Celestis mission',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}
