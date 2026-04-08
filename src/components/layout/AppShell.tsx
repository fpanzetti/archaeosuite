'use client'
import Sidebar from './Sidebar'
import { useTema } from '@/lib/theme/ThemeContext'
import { UserProvider } from '@/lib/user/UserContext'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { p } = useTema()
  return (
    <UserProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: p.bgApp }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: 'auto', background: p.bgPage }}>
          {children}
        </main>
      </div>
    </UserProvider>
  )
}
