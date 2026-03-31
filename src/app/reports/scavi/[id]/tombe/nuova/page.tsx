'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { creaTomba, getProssimoNumeroTomba } from './actions'

export default function NuovaTombaPage() {
  const params = useParams()
  const scavoId = params.id as string
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    numero_tomba: '',
    emergenza_n: '',
    vertici: '',
    settore: '',
    data_inizio_scavo: '',
    data_recupero: '',
    tipologia_elementi_strutturali: '',
    archeologo: '',
    antropologo: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nomeScavo, setNomeScavo] = useState('')

  useEffect(() => {
    async function init() {
      const [{ data: scavo }, prossimo] = await Promise.all([
        supabase.from('scavo').select('denominazione, responsabile_campo').eq('id', scavoId).single(),
        getProssimoNumeroTomba(scavoId),
      ])
      if (scavo) {
        setNomeScavo(scavo.denominazione ?? '')
        setForm(prev => ({
          ...prev,
          numero_tomba: String(prossimo),
          archeologo: scavo.responsabile_campo ?? '',
        }))
      }
    }
    init()
  }, [scavoId])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.numero_tomba) { setError('Il numero tomba è obbligatorio'); return }
    setLoading(true)
    setError('')
    const result = await creaTomba(scavoId, form)
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
      <div style={{ fontSize: '11px', color: '#8a8a84', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <a href={`/reports/scavi/${scavoId}`}
          style={{ color: '#1a4a7a', textDecoration: 'none', padding: '4px 10px', border: '0.5px solid #c8c7be', borderRadius: '6px' }}>
          ← {nomeScavo || 'Scavo'}
        </a>
        <span style={{ color: '#c8c7be' }}>/</span>
        <span>Nuovo contesto funerario</span>
      </div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '500' }}>⚱️ Nuovo contesto funerario</h1>
        <p style={{ fontSize: '12px', color: '#8a8a84', marginTop: '4px' }}>
          I campi in <span style={{ color: '#1a4a7a', fontWeight: '500' }}>blu</span> sono obbligatori
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={card}>
          <div style={sect}>Dati generali</div>
          <div style={grid2}>
            <div>
              <label style={req}>Numero tomba *</label>
              <input style={inp} type="number" value={form.numero_tomba} onChange={e => set('numero_tomba', e.target.value)} min="1" required />
            </div>
            <div>
              <label style={lbl}>Emergenza n°</label>
              <input style={inp} type="number" value={form.emergenza_n} onChange={e => set('emergenza_n', e.target.value)} />
            </div>
          </div>
          <div style={grid2}>
            <div>
              <label style={lbl}>Vertici</label>
              <input style={inp} value={form.vertici} onChange={e => set('vertici', e.target.value)} placeholder="Es. 56-57" />
            </div>
            <div>
              <label style={lbl}>Settore</label>
              <input style={inp} value={form.settore} onChange={e => set('settore', e.target.value)} placeholder="Es. Centrale" />
            </div>
          </div>
          <div style={grid2}>
            <div>
              <label style={lbl}>Data inizio scavo</label>
              <input style={inp} type="date" value={form.data_inizio_scavo} onChange={e => set('data_inizio_scavo', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Data recupero</label>
              <input style={inp} type="date" value={form.data_recupero} onChange={e => set('data_recupero', e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={lbl}>Tipologia / Elementi strutturali</label>
            <textarea style={{ ...inp, height: '64px', resize: 'none' } as React.CSSProperties}
              value={form.tipologia_elementi_strutturali}
              onChange={e => set('tipologia_elementi_strutturali', e.target.value)}
              placeholder="Es. Tomba a fossa, profonda, con riempimento di pietrame superiore e segnacolo." />
          </div>
          <div style={grid2}>
            <div>
              <label style={lbl}>Archeologo</label>
              <input style={inp} value={form.archeologo} onChange={e => set('archeologo', e.target.value)} placeholder="Nome e cognome" />
            </div>
            <div>
              <label style={lbl}>Antropologo</label>
              <input style={inp} value={form.antropologo} onChange={e => set('antropologo', e.target.value)} placeholder="Nome e cognome" />
            </div>
          </div>
        </div>

        {error && <p style={{ fontSize: '12px', color: '#c00', marginBottom: '12px' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={() => router.push(`/reports/scavi/${scavoId}`)}
            style={{ flex: 1, padding: '10px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
            Annulla
          </button>
          <button type="submit" disabled={loading}
            style={{ flex: 2, padding: '10px', background: '#1a4a7a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
            {loading ? 'Creazione...' : 'Crea contesto funerario'}
          </button>
        </div>
      </form>
    </div>
  )
}
