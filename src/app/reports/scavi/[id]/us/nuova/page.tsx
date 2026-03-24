'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import SearchableSelect from '@/components/ui/SearchableSelect'

type Opt = { value: string; label: string }

export default function NuovaUSPage() {
  const params = useParams()
  const scavoId = params.id as string
  const [form, setForm] = useState({
    numero_us: '',
    tipo: '',
    descrizione: '',
  })
  const [tipiUS, setTipiUS] = useState<Opt[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from('thesaurus')
        .select('*')
        .eq('tipo', 'tipo_us')
        .order('ordine')
      if (data) setTipiUS(data.map(t => ({ value: t.valore, label: t.valore })))
    }
    loadData()
  }, [])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.numero_us) { setError('Il numero US è obbligatorio'); return }
    setLoading(true)
    setError('')

    const { error: errUS } = await supabase
      .from('us')
      .insert({
        scavo_id: scavoId,
        numero_us: parseInt(form.numero_us),
        tipo: form.tipo || null,
        descrizione: form.descrizione || null,
        stato: 'aperta',
      })

    if (errUS) { setError(errUS.message); setLoading(false); return }
    router.push(`/reports/scavi/${scavoId}`)
  }

  const inp: React.CSSProperties = { width:'100%', padding:'7px 10px', border:'0.5px solid #c8c7be', borderRadius:'6px', background:'#f8f7f4', color:'#1a1a1a', fontSize:'12px', fontFamily:'inherit' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'11px', color:'#8a8a84', marginBottom:'4px', fontWeight:'500' }
  const req: React.CSSProperties = { display:'block', fontSize:'11px', color:'#1a4a7a', marginBottom:'4px', fontWeight:'500' }

  return (
    <div style={{ padding:'24px', maxWidth:'560px' }}>
      <div style={{ marginBottom:'24px' }}>
        <div style={{ fontSize:'11px', color:'#8a8a84', marginBottom:'6px' }}>
          ArchaeoReports / Scavi / <span
            style={{ color:'#1a4a7a', cursor:'pointer' }}
            onClick={() => router.push(`/reports/scavi/${scavoId}`)}>
            Scavo
          </span>
        </div>
        <h1 style={{ fontSize:'20px', fontWeight:'500' }}>Nuova Unità Stratigrafica</h1>
        <p style={{ fontSize:'12px', color:'#8a8a84', marginTop:'4px' }}>
          I campi in <span style={{ color:'#1a4a7a', fontWeight:'500' }}>blu</span> sono obbligatori
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background:'#fff', border:'0.5px solid #e0dfd8', borderRadius:'10px', padding:'20px', marginBottom:'12px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'10px', marginBottom:'12px' }}>
            <div>
              <label style={req}>Numero US *</label>
              <input
                style={inp}
                type="number"
                min="1"
                value={form.numero_us}
                onChange={e => set('numero_us', e.target.value)}
                placeholder="Es. 12"
                required
              />
            </div>
            <div>
              <label style={lbl}>Tipo US</label>
              <SearchableSelect
                options={tipiUS}
                value={form.tipo}
                onChange={v => set('tipo', v)}
                placeholder="Seleziona tipo..."
                allowFreeText={false}
              />
            </div>
          </div>
          <div>
            <label style={lbl}>Descrizione sintetica</label>
            <textarea
              style={{ ...inp, height:'80px', resize:'none' } as React.CSSProperties}
              value={form.descrizione}
              onChange={e => set('descrizione', e.target.value)}
              placeholder="Es. Strato di riempimento della fossa sepolcrale"
            />
          </div>
        </div>

        {error && <p style={{ fontSize:'12px', color:'#c00', marginBottom:'12px' }}>{error}</p>}

        <div style={{ display:'flex', gap:'8px' }}>
          <button type="button"
            onClick={() => router.push(`/reports/scavi/${scavoId}`)}
            style={{ flex:1, padding:'10px', background:'#f8f7f4', color:'#555550', border:'0.5px solid #c8c7be', borderRadius:'6px', fontSize:'12px', cursor:'pointer' }}>
            Annulla
          </button>
          <button type="submit" disabled={loading}
            style={{ flex:2, padding:'10px', background:'#1a4a7a', color:'#fff', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:'pointer' }}>
            {loading ? 'Salvataggio...' : 'Crea US'}
          </button>
        </div>
      </form>
    </div>
  )
}
