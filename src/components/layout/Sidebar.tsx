'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const modules = [
  { href: '/reports', label: 'ArchaeoReports', icon: '📋', active: true },
  { href: '/tombs', label: 'ArchaeoTombs', icon: '⚱️', active: true },
  { href: '/finds', label: 'ArchaeoFinds', icon: '📦', active: false },
  { href: '/survey', label: 'ArchaeoSurvey', icon: '🗺️', active: false },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [utente, setUtente] = useState<{ nome: string; cognome: string; email: string; professione: string } | null>(null)

  useEffect(() => {
    async function loadUtente() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: account } = await supabase
        .from('account')
        .select('nome, cognome, professione')
        .eq('id', user.id)
        .single()
      setUtente({
        nome: account?.nome ?? '',
        cognome: account?.cognome ?? '',
        email: user.email ?? '',
        professione: account?.professione ?? '',
      })
    }
    loadUtente()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const nomeDisplay = utente
    ? [utente.nome, utente.cognome].filter(Boolean).join(' ') || utente.email
    : ''

  const iniziali = utente
    ? [utente.nome?.[0], utente.cognome?.[0]].filter(Boolean).join('').toUpperCase() || utente.email?.[0]?.toUpperCase()
    : ''

  return (
    <div style={{ width: '220px', minWidth: '220px', borderRight: '0.5px solid #e0dfd8', padding: '12px 8px', background: '#fff', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
      <div style={{ padding: '8px 10px 20px', borderBottom: '0.5px solid #e0dfd8', marginBottom: '8px' }}>
        <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a6b4a' }}>ArchaeoSuite</div>
        <div style={{ fontSize: '10px', color: '#8a8a84', marginTop: '2px' }}>v0.1 beta</div>
      </div>
      <Link href="/dashboard" style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '6px', fontSize: '12px', marginBottom: '2px', background: pathname === '/dashboard' ? '#e8f4ef' : 'transparent', color: pathname === '/dashboard' ? '#1a6b4a' : '#555550' }}>
          ◈ Dashboard
        </div>
      </Link>
      <div style={{ fontSize: '10px', color: '#8a8a84', padding: '8px 10px 4px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Moduli</div>
      {modules.map(m => m.active ? (
        <Link key={m.href} href={m.href} style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '6px', fontSize: '12px', marginBottom: '2px', background: pathname.startsWith(m.href) ? '#e8f4ef' : 'transparent', color: pathname.startsWith(m.href) ? '#1a6b4a' : '#555550' }}>
            <span style={{ fontSize: '14px' }}>{m.icon}</span>{m.label}
          </div>
        </Link>
      ) : (
        <div key={m.href} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '6px', fontSize: '12px', marginBottom: '2px', color: '#8a8a84', opacity: 0.5 }}>
          <span style={{ fontSize: '14px' }}>{m.icon}</span>{m.label}
          <span style={{ marginLeft: 'auto', fontSize: '9px', background: '#f0efe9', padding: '1px 5px', borderRadius: '10px' }}>presto</span>
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ borderTop: '0.5px solid #e0dfd8', paddingTop: '8px' }}>
        {utente && (
          <Link href="/profilo" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', marginBottom: '4px', borderRadius: '6px', background: pathname === '/profilo' ? '#e8f0f8' : 'transparent' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#e8f0f8', color: '#1a4a7a', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {iniziali}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {nomeDisplay}
                </div>
                <div style={{ fontSize: '10px', color: '#8a8a84', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {utente.professione || utente.email}
                </div>
              </div>
            </div>
          </Link>
        )}
        <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '6px', fontSize: '12px', color: '#8a8a84', background: 'none', border: 'none', cursor: 'pointer' }}>
          ⎋ Esci
        </button>
      </div>
    </div>
  )
}
