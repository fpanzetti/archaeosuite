import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const nome = user.user_metadata?.nome ?? user.email

  return (
    <div style={{ padding:'24px' }}>
      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ fontSize:'20px', fontWeight:'500' }}>Benvenuto, {nome}</h1>
        <p style={{ fontSize:'12px', color:'#8a8a84', marginTop:'4px' }}>Seleziona un modulo per iniziare</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:'12px' }}>
        <a href="/reports" style={{ textDecoration:'none' }}>
          <div style={{ background:'#fff', border:'0.5px solid #e0dfd8', borderLeft:'3px solid #1a4a7a', borderRadius:'10px', padding:'14px', cursor:'pointer' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
              <span style={{ fontSize:'24px' }}>📋</span>
              <div>
                <div style={{ fontSize:'14px', fontWeight:'500', color:'#1a4a7a' }}>ArchaeoReports</div>
                <span style={{ fontSize:'10px', background:'#e8f0f8', color:'#1a4a7a', padding:'2px 7px', borderRadius:'10px' }}>In sviluppo</span>
              </div>
            </div>
            <p style={{ fontSize:'12px', color:'#8a8a84' }}>Diario di scavo, schede US, documentazione stratigrafica</p>
          </div>
        </a>
        <a href="/tombs" style={{ textDecoration:'none' }}>
          <div style={{ background:'#fff', border:'0.5px solid #e0dfd8', borderLeft:'3px solid #8a5c0a', borderRadius:'10px', padding:'14px', cursor:'pointer' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
              <span style={{ fontSize:'24px' }}>⚱️</span>
              <div>
                <div style={{ fontSize:'14px', fontWeight:'500', color:'#8a5c0a' }}>ArchaeoTombs</div>
                <span style={{ fontSize:'10px', background:'#fdf3e0', color:'#8a5c0a', padding:'2px 7px', borderRadius:'10px' }}>In sviluppo</span>
              </div>
            </div>
            <p style={{ fontSize:'12px', color:'#8a8a84' }}>Schede contesti funerari, antropologia, corredo</p>
          </div>
        </a>
        <div style={{ background:'#fff', border:'0.5px solid #e0dfd8', borderLeft:'3px solid #e0dfd8', borderRadius:'10px', padding:'14px', opacity:0.5 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
            <span style={{ fontSize:'24px' }}>📦</span>
            <div>
              <div style={{ fontSize:'14px', fontWeight:'500', color:'#555550' }}>ArchaeoFinds</div>
              <span style={{ fontSize:'10px', background:'#f0efe9', color:'#8a8a84', padding:'2px 7px', borderRadius:'10px' }}>Prossimamente</span>
            </div>
          </div>
          <p style={{ fontSize:'12px', color:'#8a8a84' }}>Gestione magazzino, CMD, cassette, reperti notevoli</p>
        </div>
        <div style={{ background:'#fff', border:'0.5px solid #e0dfd8', borderLeft:
cat > src/app/reports/layout.tsx << 'EOF'
import AppShell from '@/components/layout/AppShell'
export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
