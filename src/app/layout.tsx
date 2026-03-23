import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ArchaeoSuite',
  description: 'Piattaforma per la documentazione archeologica',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
