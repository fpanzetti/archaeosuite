import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div style={{ padding:'24px' }}>
      <div style={{ marginBottom:'24px', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:'11px', color:'#8a8a84', marginBottom:'6px' }}>ArchaeoReports</div>
          <h1 style={{ fontSize:'20px', fontWeight:'500' }}>I tuoi scavi</h1>
          <p style={{ fontSize:'12px', color:'#8a8a84', marginTop:'4px' }}>Gestisci la documentazione dei tuoi scavi</p>
        </div>
        <button style={{ padding:'8px 16px', background:'#1a4a7a', color:'#fff', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:'pointer' }}>
          + Nuovo scavo
        </button>
      </div>
      <div style={{ background:'#fff', border:'0.5px solid #e0dfd8', borderRadius:'10px', padding:'48px 24px', textAlign:'center' }}>
        <div style={{ fontSize:'32px', marginBottom:'12px' }}>⛏️</div>
        <p style={{ fontSize:'14px', color:'#555550', marginBottom:'8px' }}>Nessuno scavo ancora</p>
        <p style={{ fontSize:'12px', color:'#8a8a84', marginBottom:'20px' }}>Crea il tuo primo scavo per iniziare a documentare</p>
        <button style={{ padding:'8px 16px', background:'#1a4a7a', color:'#fff', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:'pointer' }}>
          Crea il primo scavo
        </button>
      </div>
    </div>
  )
}
