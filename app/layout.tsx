import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Omni Node - AI Orchestration Platform',
  description: 'Neural Cockpit for Autonomous AI Agent Synthesis and Orchestration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}