'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { creaProgetto } from './actions'

type Opt = { value: string; label: string }

export default function NuovoProgettoPage() {
  const [form, setForm] = useState({
    committente: '', operatore: '', direttore_scientifico: '',
    tipologia_intervento: '', tipo_contesto: '',
    datazione_contesto: '', data_inizio: '', note: '',
  })
  const [tipiContesto, setTipiContesto] = useState<Opt[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: th } = await supabase.from('thesaurus').select('*').order('ordine')
      if (th) setTipiContesto(th.filter((t: {tipo: string; valore: string}) => t.tipo === 'tipo_contesto').map((t: {tipo: string; valore: string}) => ({ value: t.valore, label: t.valore })))
    }
    loadData()
  }, [])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await creaProgetto(form)
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '0.5px solid #c8c7be', borderRadius: '6px', background: '#f8f7f4', color: '#1a1a1a', fontSize: '12px', fontFamily: 'inherit' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', color: '#8a8a84', marginBottom: '4px', fontWeight: '500' }
  const req: React.CSSProperties = { display: 'block', fontSize: '11px', color: '#1a4a7a', marginBottom: '4px', fontWeight: '500' }
  const card: React.CSSProperties = { background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px', padding: '20px', marginBottom: '12px' }
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }
  const sect: React.CSSProperties = { fontSize: '11px', fontWeight: '500', color: '#1a4a7a', marginBottom: '14px', paddingBottom: '8px', borderBottom: '0.5px solid #e8f0f8' }

  return (
    <div style={{ padding: '24px', maxWidth: '760px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', color: '#8a8a84', marginBottom: '6px' }}>
          <span style={{ color: '#1a4a7a', cursor: 'pointer' }} onClick={() => router.push('/reports')}>Scavi</span>
          {' / '}Nuovo progetto
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: '500' }}>Nuovo progetto</h1>
        <p style={{ fontSize: '12px', color: '#8a8a84', marginTop: '4px' }}>
          I campi in <span style={{ color: '#1a4a7a', fontWeight: '500' }}>blu</span> sono obbligatori
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={card}>
          <div style={sect}>Identificativi</div>
          <div style={grid2}>
            <div>
              <label style={req}>Ente responsabile *</label>
              <input style={inp} value={form.committente} onChange={e => set('committente', e.target.value)} placeholder="Es. ENI S.p.A." required />
            </div>
            <div>
              <label style={req}>Operatore *</label>
              <input style={inp} value={form.operatore} onChange={e => set('operatore', e.target.value)} placeholder="Es. Studio Archeo s.r.l." required />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={lbl}>Direttore scientifico</label>
            <input style={inp} value={form.direttore_scientifico} onChange={e => set('direttore_scientifico', e.target.value)} placeholder="Nome e cognome" />
          </div>
          <div style={grid2}>
            <div>
              <label style={req}>Tipologia di intervento *</label>
              <SearchableSelect options={[]} value={form.tipologia_intervento} onChange={v => set('tipologia_intervento', v)} placeholder="Digita tipologia..." allowFreeText={true} />
            </div>
            <div>
              <label style={lbl}>Tipo di contesto</label>
              <SearchableSelect options={[]} value={form.tipo_contesto} onChange={v => set('tipo_contesto', v)} placeholder="Scrivi tipo di contesto..." allowFreeText={true} />
            </div>
          </div>
        </div>
        <div style={card}>
          <div style={sect}>Altri dati</div>
          <div style={grid2}>
            <div>
              <label style={req}>Data inizio *</label>
              <input style={inp} type="date" value={form.data_inizio} onChange={e => set('data_inizio', e.target.value)} required />
            </div>
            <div>
              <label style={lbl}>Datazione del contesto</label>
              <input style={inp} value={form.datazione_contesto} onChange={e => set('datazione_contesto', e.target.value)} placeholder="Es. Necropoli sannitica, sec. VI-IV a.C." />
            </div>
          </div>
          <div>
            <label style={lbl}>Note</label>
            <textarea style={{ ...inp, height: '72px', resize: 'none' } as React.CSSProperties} value={form.note} onChange={e => set('note', e.target.value)} placeholder="Note aggiuntive..." />
          </div>
        </div>
        {error && <p style={{ fontSize: '12px', color: '#c00', marginBottom: '12px' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={() => router.push('/reports')}
            style={{ flex: 1, padding: '10px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
            Annulla
          </button>
          <button type="submit" disabled={loading}
            style={{ flex: 2, padding: '10px', background: '#1a4a7a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
            {loading ? 'Salvataggio...' : 'Crea progetto'}
          </button>
        </div>
      </form>
    </div>
  )
}
