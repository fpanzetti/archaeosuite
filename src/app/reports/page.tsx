import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: scavi } = await supabase
    .from('scavo')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding:'24px' }}>
      <div style={{ marginBottom:'24px', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:'11px', color:'#8a8a84', marginBottom:'6px' }}>ArchaeoReports</div>
          <h1 style={{ fontSize:'20px', fontWeight:'500' }}>I tuoi scavi</h1>
          <p style={{ fontSize:'12px', color:'#8a8a84', marginTop:'4px' }}>Gestisci la documentazione dei tuoi scavi</p>
        </div>
        <Link href="/reports/scavi/nuovo">
          <button style={{ padding:'8px 16px', background:'#1a4a7a', color:'#fff', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:'pointer' }}>
            + Nuovo scavo
          </button>
        </Link>
      </div>

      {!scavi || scavi.length === 0 ? (
        <div style={{ background:'#fff', border:'0.5px solid #e0dfd8', borderRadius:'10px', padding:'48px 24px', textAlign:'center' }}>
          <div style={{ fontSize:'32px', marginBottom:'12px' }}>⛏️</div>
          <p style={{ fontSize:'14px', color:'#555550', marginBottom:'8px' }}>Nessuno scavo ancora</p>
          <p style={{ fontSize:'12px', color:'#8a8a84', marginBottom:'20px' }}>Crea il tuo primo scavo per iniziare a documentare</p>
          <Link href="/reports/scavi/nuovo">
            <button style={{ padding:'8px 16px', background:'#1a4a7a', color:'#fff', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:'pointer' }}>
              Crea il primo scavo
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {scavi.map(s => (
            <Link key={s.id} href={`/reports/scavi/${s.id}`} style={{ textDecoration:'none' }}>
              <div style={{ background:'#fff', border:'0.5px solid #e0dfd8', borderLeft:'3px solid #1a4a7a', borderRadius:'10px', padding:'14px', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:'14px', fontWeight:'500', color:'#1a1a1a' }}>{s.denominazione}</div>
                    <div style={{ fontSize:'12px', color:'#8a8a84', marginTop:'2px' }}>
                      {s.comune}{s.provincia ? ` (${s.provincia})` : ''}{s.tipo_contesto ? ` · ${s.tipo_contesto}` : ''}
                    </div>
                  </div>
                  <span style={{ fontSize:'11px', background: s.stato === 'in_corso' ? '#e8f0f8' : '#f0efe9', color: s.stato === 'in_corso' ? '#1a4a7a' : '#8a8a84', padding:'2px 8px', borderRadius:'10px', whiteSpace:'nowrap' }}>
                    {s.stato === 'in_corso' ? 'In corso' : s.stato === 'in_elaborazione' ? 'In elaborazione' : 'Archiviato'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
