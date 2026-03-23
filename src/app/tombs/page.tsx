import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function TombsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div style={{ padding:'24px' }}>
      <div style={{ marginBottom:'24px' }}>
        <div style={{ fontSize:'11px', color:'#8a8a84', marginBottom:'6px' }}>ArchaeoTombs</div>
        <h1 style={{ fontSize:'20px', fontWeight:'500' }}>Contesti funerari</h1>
        <p style={{ fontSize:'12px', color:'#8a8a84', marginTop:'4px' }}>Schede tomba, antropologia e corredo</p>
      </div>
      <div style={{ background:'#fff', border:'0.5px solid #e0dfd8', borderRadius:'10px', padding:'48px 24px', textAlign:'center' }}>
        <div style={{ fontSize:'32px', marginBottom:'12px' }}>⚱️</div>
        <p style={{ fontSize:'14px', color:'#555550', marginBottom:'8px' }}>In sviluppo</p>
        <p style={{ fontSize:'12px', color:'#8a8a84' }}>Le schede tomba saranno disponibili a breve</p>
      </div>
    </div>
  )
}
