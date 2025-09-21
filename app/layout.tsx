import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Micro-Commute Optimizer',
  description: 'Optimize your daily commute with AI-powered route planning',
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
