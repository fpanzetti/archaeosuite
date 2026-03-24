'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NuovoScavoPage() {
  const [form, setForm] = useState({
    denominazione: '',
    comune: '',
    localita: '',
    provincia: '',
    tipo_contesto: '',
    data_inizio: '',
    note: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: scavo, error: errScavo } = await supabase
      .from('scavo')
      .insert({
        denominazione: form.denominazione,
        comune: form.comune,
        localita: form.localita || null,
        provincia: form.provincia || null,
        tipo_contesto: form.tipo_contesto || null,
        data_inizio: form.data_inizio || null,
        note: form.note || null,
        responsabile_id: user.id,
      })
      .select()
      .single()

    if (errScavo) { setError(errScavo.message); setLoading(false); return }

    await supabase.from('accesso_scavo').insert({
      account_id: user.id,
      scavo_id: scavo.id,
      ruolo: 'editor',
    })

    router.push('/reports')
  }

  const inp = { width:'100%', padding:'7px 10px', border:'0.5px solid #c8c7be', borderRadius:'6px', background:'#f8f7f4', color:'#1a1a1a', fontSize:'12px' }
  const lbl = { display:'block', fontSize:'11px', color:'#8a8a84', marginBottom:'4px', fontWeight:'500' as const }

  return (
    <div style={{ padding:'24px', maxWidth:'640px' }}>
      <div style={{ marginBottom:'24px' }}>
        <div style={{ fontSize:'11px', color:'#8a8a84', marginBottom:'6px' }}>ArchaeoReports / Scavi</div>
        <h1 style={{ fontSize:'20px', fontWeight:'500' }}>Nuovo scavo</h1>
        <p style={{ fontSize:'12px', color:'#8a8a84', marginTop:'4px' }}>Inserisci i dati anagrafici dello scavo</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ background:'#fff', border:'0.5px solid #e0dfd8', borderRadius:'10px', padding:'20px', marginBottom:'12px' }}>
          <div style={{ fontSize:'12px', fontWeight:'500', color:'#1a4a7a', marginBottom:'14px' }}>Dati principali</div>
          <div style={{ marginBottom:'12px' }}>
            <label style={lbl}>Denominazione *</label>
            <input style={inp} value={form.denominazione} onChange={e => set('denominazione', e.target.value)} placeholder="Es. Larino – Metanodotto SGI" required />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
            <div>
              <label style={lbl}>Comune *</label>
              <input style={inp} value={form.comune} onChange={e => set('comune', e.target.value)} placeholder="Es. Larino" required />
            </div>
            <div>
              <label style={lbl}>Provincia</label>
              <input style={inp} value={form.provincia} onChange={e => set('provincia', e.target.value)} placeholder="Es. CB" maxLength={2} />
            </div>
          </div>
          <div style={{ marginBottom:'12px' }}>
            <label style={lbl}>Località / Contrada</label>
            <input style={inp} value={form.localita} onChange={e => set('localita', e.target.value)} placeholder="Es. Colle Scipione" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
            <div>
              <label style={lbl}>Tipo contesto</label>
              <select style={inp} value={form.tipo_contesto} onChange={e => set('tipo_contesto', e.target.value)}>
                <option value="">— seleziona —</option>
                <option>Necropoli</option>
                <option>Abitato</option>
                <option>Villa rustica</option>
                <option>Area sacra</option>
                <option>Infrastruttura</option>
                <option>Altro</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Data inizio</label>
              <input style={inp} type="date" value={form.data_inizio} onChange={e => set('data_inizio', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={lbl}>Note</label>
            <textarea style={{ ...inp, height:'72px', resize:'none' }} value={form.note} onChange={e => set('note', e.target.value)} placeholder="Note aggiuntive..." />
          </div>
        </div>
        {error && <p style={{ fontSize:'12px', color:'#c00', marginBottom:'12px' }}>{error}</p>}
        <div style={{ display:'flex', gap:'8px' }}>
          <button type="button" onClick={() => router.push('/reports')} style={{ flex:1, padding:'10px', background:'#f8f7f4', color:'#555550', border:'0.5px solid #c8c7be', borderRadius:'6px', fontSize:'12px', cursor:'pointer' }}>
            Annulla
          </button>
          <button type="submit" disabled={loading} style={{ flex:2, padding:'10px', background:'#1a4a7a', color:'#fff', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:'pointer' }}>
            {loading ? 'Salvataggio...' : 'Crea scavo'}
          </button>
        </div>
      </form>
    </div>
  )
}
