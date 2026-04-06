import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/lib/theme/ThemeContext'

export const metadata: Metadata = {
  title: 'ArchaeoSuite',
  description: 'Piattaforma per la documentazione archeologica',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
