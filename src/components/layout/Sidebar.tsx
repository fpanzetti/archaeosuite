'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ width:'220px', minWidth:'220px', borderRight:'0.5px solid #e0dfd8', padding:'12px 8px', background:'#fff', display:'flex', flexDirection:'column', height:'100vh', position:'sticky', top:0 }}>
      <div style={{ padding:'8px 10px 20px', borderBottom:'0.5px solid #e0dfd8', marginBottom:'8px' }}>
        <div style={{ fontSize:'15px', fontWeight:'500', color:'#1a6b4a' }}>ArchaeoSuite</div>
        <div style={{ fontSize:'10px', color:'#8a8a84', marginTop:'2px' }}>v0.1 beta</div>
      </div>
      <Link href="/dashboard" style={{ textDecoration:'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'7px 10px', borderRadius:'6px', fontSize:'12px', marginBottom:'2px', background: pathname === '/dashboard' ? '#e8f4ef' : 'transparent', color: pathname === '/dashboard' ? '#1a6b4a' : '#555550' }}>
          ◈ Dashboard
        </div>
      </Link>
      <div style={{ fontSize:'10px', color:'#8a8a84', padding:'8px 10px 4px', fontWeight:'500', textTransform:'uppercase', letterSpacing:'0.5px' }}>Moduli</div>
      {modules.map(m => m.active ? (
        <Link key={m.href} href={m.href} style={{ textDecoration:'none' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'7px 10px', borderRadius:'6px', fontSize:'12px', marginBottom:'2px', background: pathname.startsWith(m.href) ? '#e8f4ef' : 'transparent', color: pathname.startsWith(m.href) ? '#1a6b4a' : '#555550' }}>
            <span style={{ fontSize:'14px' }}>{m.icon}</span>{m.label}
          </div>
        </Link>
      ) : (
        <div key={m.href} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'7px 10px', borderRadius:'6px', fontSize:'12px', marginBottom:'2px', color:'#8a8a84', opacity:0.5 }}>
          <span style={{ fontSize:'14px' }}>{m.icon}</span>{m.label}
          <span style={{ marginLeft:'auto', fontSize:'9px', background:'#f0efe9', padding:'1px 5px', borderRadius:'10px' }}>presto</span>
        </div>
      ))}
      <div style={{ flex:1 }} />
      <div style={{ borderTop:'0.5px solid #e0dfd8', paddingTop:'8px' }}>
        <button onClick={handleLogout} style={{ width:'100%', display:'flex', alignItems:'center', gap:'8px', padding:'7px 10px', borderRadius:'6px', fontSize:'12px', color:'#8a8a84', background:'none', border:'none', cursor:'pointer' }}>
          ⎋ Esci
        </button>
      </div>
    </div>
  )
}
