'use client'
import Sidebar from './Sidebar'
import { useTema } from '@/lib/theme/ThemeContext'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { p } = useTema()
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: p.bgApp }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', background: p.bgPage }}>
        {children}
      </main>
    </div>
  )
}
