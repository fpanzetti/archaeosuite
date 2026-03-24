'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import SearchableSelect from '@/components/ui/SearchableSelect'

type Opt = { value: string; label: string }
type US = {
  id: string; numero_us: number; tipo: string | null;
  descrizione: string | null; stato: string;
  colore: string | null; consistenza: string | null;
  umidita: string | null; inclusi: string[] | null;
  descrizione_estesa: string | null; osservazioni: string | null;
  interpretazione: string | null; tipo_formazione: string | null;
  cronologia_iniziale: string | null; cronologia_finale: string | null;
  metodo_datazione: string | null; quota_min: number | null;
  quota_max: number | null; lunghezza: number | null;
  larghezza: number | null; spessore: number | null;
  anno: number | null; area_scavo: string | null;
  saggio: string | null; settore: string | null;
  data_apertura: string | null; data_chiusura: string | null;
}

const STEP_LABELS = [
  'Identificazione',
  'Descrizione fisica',
  'Rapporti strat.',
  'Documentazione',
  'Interpretazione',
]

const INCLUSI_OPTIONS = [
  'Ceramica', 'Osso', 'Carbone', 'Malta', 'Pietra',
  'Metallo', 'Laterizio', 'Vetro', 'Conchiglia', 'Altro'
]

export default function SchedaUSPage() {
  const params = useParams()
  const scavoId = params.id as string
  const usId = params.usId as string
  const [step, setStep] = useState(0)
  const [us, setUs] = useState<US | null>(null)
  const [form, setForm] = useState<Partial<US>>({})
  const [tipiUS, setTipiUS] = useState<Opt[]>([])
  const [consistenze, setConsistenze] = useState<Opt[]>([])
  const [umidita, setUmidita] = useState<Opt[]>([])
  const [tipiFormazione, setTipiFormazione] = useState<Opt[]>([])
  const [metodiDatazione, setMetodiDatazione] = useState<Opt[]>([])
  const [munsell, setMunsell] = useState<Opt[]>([])
  const [allUS, setAllUS] = useState<{ id: string; numero_us: number }[]>([])
  const [rapporti, setRapporti] = useState<{
    copre: number[]; coperto_da: number[]; si_lega_a: number[];
    uguale_a: number[]; taglia: number[]; tagliato_da: number[];
    si_appoggia_a: number[]; appoggiato_da: number[];
  }>({
    copre: [], coperto_da: [], si_lega_a: [], uguale_a: [],
    taglia: [], tagliato_da: [], si_appoggia_a: [], appoggiato_da: [],
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadAll() {
      const [{ data: usData }, { data: th }, { data: mn }, { data: usAll }] = await Promise.all([
        supabase.from('us').select('*').eq('id', usId).single(),
        supabase.from('thesaurus').select('*').order('ordine'),
        supabase.from('munsell').select('*').order('nome_italiano'),
        supabase.from('us').select('id, numero_us').eq('scavo_id', scavoId).order('numero_us'),
      ])
      if (usData) { setUs(usData); setForm(usData) }
      if (th) {
        setTipiUS(th.filter((t: {tipo: string; valore: string}) => t.tipo === 'tipo_us').map((t: {tipo: string; valore: string}) => ({ value: t.valore, label: t.valore })))
        setConsistenze(th.filter((t: {tipo: string; valore: string}) => t.tipo === 'consistenza').map((t: {tipo: string; valore: string}) => ({ value: t.valore, label: t.valore })))
        setUmidita(th.filter((t: {tipo: string; valore: string}) => t.tipo === 'umidita').map((t: {tipo: string; valore: string}) => ({ value: t.valore, label: t.valore })))
        setTipiFormazione(th.filter((t: {tipo: string; valore: string}) => t.tipo === 'tipo_formazione').map((t: {tipo: string; valore: string}) => ({ value: t.valore, label: t.valore })))
        setMetodiDatazione(th.filter((t: {tipo: string; valore: string}) => t.tipo === 'metodo_datazione').map((t: {tipo: string; valore: string}) => ({ value: t.valore, label: t.valore })))
      }
      if (mn) setMunsell(mn.map((m: {codice: string; nome_italiano: string; r: number; g: number; b: number}) => ({
        value: m.codice,
        label: `${m.nome_italiano} (${m.codice})`
      })))
      if (usAll) setAllUS(usAll.filter((u: {id: string; numero_us: number}) => u.id !== usId))
    }
    loadAll()
  }, [usId, scavoId])

  function set(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleIncluso(val: string) {
    const curr = (form.inclusi as string[]) ?? []
    const next = curr.includes(val) ? curr.filter(i => i !== val) : [...curr, val]
    set('inclusi', next)
  }

  function toggleRapporto(tipo: keyof typeof rapporti, numero: number) {
    setRapporti(prev => {
      const curr = prev[tipo]
      const next = curr.includes(numero) ? curr.filter(n => n !== numero) : [...curr, numero]
      return { ...prev, [tipo]: next }
    })
  }

  async function salva() {
    setSaving(true)
    await supabase.from('us').update({
      tipo: form.tipo,
      descrizione: form.descrizione,
      colore: form.colore,
      consistenza: form.consistenza,
      umidita: form.umidita,
      inclusi: form.inclusi,
      descrizione_estesa: form.descrizione_estesa,
      osservazioni: form.osservazioni,
      interpretazione: form.interpretazione,
      tipo_formazione: form.tipo_formazione,
      cronologia_iniziale: form.cronologia_iniziale,
      cronologia_finale: form.cronologia_finale,
      metodo_datazione: form.metodo_datazione,
      quota_min: form.quota_min,
      quota_max: form.quota_max,
      lunghezza: form.lunghezza,
      larghezza: form.larghezza,
      spessore: form.spessore,
      anno: form.anno,
      area_scavo: form.area_scavo,
      saggio: form.saggio,
      settore: form.settore,
      data_apertura: form.data_apertura,
      data_chiusura: form.data_chiusura,
    }).eq('id', usId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inp: React.CSSProperties = { width:'100%', padding:'7px 10px', border:'0.5px solid #c8c7be', borderRadius:'6px', background:'#f8f7f4', color:'#1a1a1a', fontSize:'12px', fontFamily:'inherit' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'11px', color:'#8a8a84', marginBottom:'4px', fontWeight:'500' }
  const req: React.CSSProperties = { display:'block', fontSize:'11px', color:'#1a4a7a', marginBottom:'4px', fontWeight:'500' }
  const grid2: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }
  const grid3: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'12px' }

  if (!us) return <div style={{ padding:'24px', color:'#8a8a84', fontSize:'12px' }}>Caricamento...</div>

  return (
    <div style={{ padding:'24px', maxWidth:'760px' }}>

      {/* Breadcrumb */}
      <div style={{ fontSize:'11px', color:'#8a8a84', marginBottom:'16px' }}>
        <span style={{ color:'#1a4a7a', cursor:'pointer' }} onClick={() => router.push('/reports')}>Scavi</span>
        {' / '}
        <span style={{ color:'#1a4a7a', cursor:'pointer' }} onClick={() => router.push(`/reports/scavi/${scavoId}`)}>Scavo</span>
        {' / '}US {us.numero_us}
      </div>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'500' }}>US {us.numero_us}</h1>
          {us.tipo && <p style={{ fontSize:'12px', color:'#555550', marginTop:'2px' }}>{us.tipo}</p>}
        </div>
        <button onClick={salva} disabled={saving}
          style={{ padding:'7px 16px', background: saved ? '#1a6b4a' : '#1a4a7a', color:'#fff', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:'pointer' }}>
          {saving ? 'Salvataggio...' : saved ? '✓ Salvato' : 'Salva'}
        </button>
      </div>

      {/* Step navigator */}
      <div style={{ display:'flex', gap:'2px', marginBottom:'20px', background:'#f0efe9', borderRadius:'8px', padding:'4px' }}>
        {STEP_LABELS.map((label, i) => (
          <button key={i} onClick={() => setStep(i)}
            style={{
              flex:1, padding:'7px 4px', border:'none', borderRadius:'6px',
              fontSize:'11px', cursor:'pointer', fontWeight: step === i ? '500' : '400',
              background: step === i ? '#fff' : 'transparent',
              color: step === i ? '#1a4a7a' : '#8a8a84',
              boxShadow: step === i ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* STEP 0 — IDENTIFICAZIONE */}
      {step === 0 && (
        <div style={{ background:'#fff', border:'0.5px solid #e0dfd8', borderRadius:'10px', padding:'20px' }}>
          <div style={grid2}>
            <div>
              <label style={req}>Tipo US *</label>
              <SearchableSelect options={tipiUS} value={form.tipo ?? ''} onChange={v => set('tipo', v)} placeholder="Seleziona tipo..." />
            </div>
            <div>
              <label style={lbl}>Anno</label>
              <input style={inp} type="number" value={form.anno ?? ''} onChange={e => set('anno', e.target.value ? parseInt(e.target.value) : null)} placeholder={new Date().getFullYear().toString()} />
            </div>
          </div>
          <div style={grid3}>
            <div>
              <label style={lbl}>Area</label>
              <input style={inp} value={form.area_scavo ?? ''} onChange={e => set('area_scavo', e.target.value)} placeholder="Es. A" />
            </div>
            <div>
              <label style={lbl}>Saggio</label>
              <input style={inp} value={form.saggio ?? ''} onChange={e => set('saggio', e.target.value)} placeholder="Es. S1" />
            </div>
            <div>
              <label style={lbl}>Settore</label>
              <input style={inp} value={form.settore ?? ''} onChange={e => set('settore', e.target.value)} placeholder="Es. Nord" />
            </div>
          </div>
          <div style={grid2}>
            <div>
              <label style={lbl}>Data apertura</label>
              <input style={inp} type="date" value={form.data_apertura ?? ''} onChange={e => set('data_apertura', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Data chiusura</label>
              <input style={inp} type="date" value={form.data_chiusura ?? ''} onChange={e => set('data_chiusura', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={lbl}>Descrizione sintetica</label>
            <textarea style={{ ...inp, height:'72px', resize:'none' } as React.CSSProperties}
              value={form.descrizione ?? ''} onChange={e => set('descrizione', e.target.value)}
              placeholder="Descrizione breve per la lista US" />
          </div>
        </div>
      )}

      {/* STEP 1 — DESCRIZIONE FISICA */}
      {step === 1 && (
        <div style={{ background:'#fff', border:'0.5px solid #e0dfd8', borderRadius:'10px', padding:'20px' }}>
          <div style={{ marginBottom:'12px' }}>
            <label style={lbl}>Colore (Munsell)</label>
            <SearchableSelect
              options={munsell}
              value={form.colore ?? ''}
              onChange={v => set('colore', v)}
              placeholder="Cerca colore..."
              allowFreeText={true}
            />
          </div>
          <div style={grid2}>
            <div>
              <label style={lbl}>Consistenza</label>
              <SearchableSelect options={consistenze} value={form.consistenza ?? ''} onChange={v => set('consistenza', v)} placeholder="Seleziona..." />
            </div>
            <div>
              <label style={lbl}>Umidità</label>
              <SearchableSelect options={umidita} value={form.umidita ?? ''} onChange={v => set('umidita', v)} placeholder="Seleziona..." />
            </div>
          </div>
          <div style={{ marginBottom:'12px' }}>
            <label style={lbl}>Inclusi</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
              {INCLUSI_OPTIONS.map(inc => {
                const sel = (form.inclusi as string[] ?? []).includes(inc)
                return (
                  <button key={inc} type="button" onClick={() => toggleIncluso(inc)}
                    style={{
                      padding:'5px 10px', borderRadius:'6px', fontSize:'11px', cursor:'pointer',
                      background: sel ? '#e8f0f8' : '#f8f7f4',
                      color: sel ? '#1a4a7a' : '#555550',
                      border: sel ? '0.5px solid #1a4a7a' : '0.5px solid #c8c7be',
                      fontWeight: sel ? '500' : '400',
                    }}>
                    {inc}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label style={lbl}>Descrizione estesa</label>
            <textarea style={{ ...inp, height:'100px', resize:'none' } as React.CSSProperties}
              value={form.descrizione_estesa ?? ''} onChange={e => set('descrizione_estesa', e.target.value)}
              placeholder="Descrizione completa della US" />
          </div>
        </div>
      )}

      {/* STEP 2 — RAPPORTI STRATIGRAFICI */}
      {step === 2 && (
        <div style={{ background:'#fff', border:'0.5px solid #e0dfd8', borderRadius:'10px', padding:'20px' }}>
          {allUS.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px', color:'#8a8a84', fontSize:'12px' }}>
              Nessun'altra US disponibile in questo scavo
            </div>
          ) : (
            [
              { key: 'copre', label: 'Copre' },
              { key: 'coperto_da', label: 'Coperto da' },
              { key: 'si_lega_a', label: 'Si lega a' },
              { key: 'uguale_a', label: 'Uguale a' },
              { key: 'taglia', label: 'Taglia' },
              { key: 'tagliato_da', label: 'Tagliato da' },
              { key: 'si_appoggia_a', label: 'Si appoggia a' },
              { key: 'appoggiato_da', label: 'Appoggiato da' },
            ].map(({ key, label }) => (
              <div key={key} style={{ marginBottom:'14px' }}>
                <label style={lbl}>{label}</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {allUS.map(u => {
                    const sel = rapporti[key as keyof typeof rapporti].includes(u.numero_us)
                    return (
                      <button key={u.id} type="button"
                        onClick={() => toggleRapporto(key as keyof typeof rapporti, u.numero_us)}
                        style={{
                          padding:'4px 10px', borderRadius:'6px', fontSize:'12px', cursor:'pointer',
                          background: sel ? '#e8f0f8' : '#f8f7f4',
                          color: sel ? '#1a4a7a' : '#555550',
                          border: sel ? '0.5px solid #1a4a7a' : '0.5px solid #c8c7be',
                          fontWeight: sel ? '500' : '400',
                        }}>
                        US {u.numero_us}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* STEP 3 — DOCUMENTAZIONE */}
      {step === 3 && (
        <div style={{ background:'#fff', border:'0.5px solid #e0dfd8', borderRadius:'10px', padding:'20px' }}>
          <div style={{ marginBottom:'12px' }}>
            <label style={lbl}>Osservazioni di scavo</label>
            <textarea style={{ ...inp, height:'100px', resize:'none' } as React.CSSProperties}
              value={form.osservazioni ?? ''} onChange={e => set('osservazioni', e.target.value)}
              placeholder="Note prese durante lo scavo..." />
          </div>
          <div style={grid3}>
            <div>
              <label style={lbl}>Quota min (m s.l.m.)</label>
              <input style={inp} type="number" step="0.01" value={form.quota_min ?? ''} onChange={e => set('quota_min', e.target.value ? parseFloat(e.target.value) : null)} placeholder="Es. -1.48" />
            </div>
            <div>
              <label style={lbl}>Quota max (m s.l.m.)</label>
              <input style={inp} type="number" step="0.01" value={form.quota_max ?? ''} onChange={e => set('quota_max', e.target.value ? parseFloat(e.target.value) : null)} placeholder="Es. -0.92" />
            </div>
          </div>
          <div style={grid3}>
            <div>
              <label style={lbl}>Lunghezza (cm)</label>
              <input style={inp} type="number" value={form.lunghezza ?? ''} onChange={e => set('lunghezza', e.target.value ? parseFloat(e.target.value) : null)} />
            </div>
            <div>
              <label style={lbl}>Larghezza (cm)</label>
              <input style={inp} type="number" value={form.larghezza ?? ''} onChange={e => set('larghezza', e.target.value ? parseFloat(e.target.value) : null)} />
            </div>
            <div>
              <label style={lbl}>Spessore (cm)</label>
              <input style={inp} type="number" value={form.spessore ?? ''} onChange={e => set('spessore', e.target.value ? parseFloat(e.target.value) : null)} />
            </div>
          </div>
          <div style={{ padding:'12px', background:'#f8f7f4', borderRadius:'6px', border:'0.5px dashed #c8c7be', textAlign:'center' }}>
            <p style={{ fontSize:'12px', color:'#8a8a84' }}>📷 Upload foto — disponibile nella prossima versione</p>
          </div>
        </div>
      )}

      {/* STEP 4 — INTERPRETAZIONE */}
      {step === 4 && (
        <div style={{ background:'#fff', border:'0.5px solid #e0dfd8', borderRadius:'10px', padding:'20px' }}>
          <div style={{ marginBottom:'12px' }}>
            <label style={lbl}>Interpretazione</label>
            <textarea style={{ ...inp, height:'100px', resize:'none' } as React.CSSProperties}
              value={form.interpretazione ?? ''} onChange={e => set('interpretazione', e.target.value)}
              placeholder="Interpretazione della US..." />
          </div>
          <div style={{ marginBottom:'12px' }}>
            <label style={lbl}>Tipo di formazione</label>
            <SearchableSelect options={tipiFormazione} value={form.tipo_formazione ?? ''} onChange={v => set('tipo_formazione', v)} placeholder="Seleziona..." />
          </div>
          <div style={grid2}>
            <div>
              <label style={lbl}>Cronologia iniziale</label>
              <input style={inp} value={form.cronologia_iniziale ?? ''} onChange={e => set('cronologia_iniziale', e.target.value)} placeholder="Es. IV sec. a.C." />
            </div>
            <div>
              <label style={lbl}>Cronologia finale</label>
              <input style={inp} value={form.cronologia_finale ?? ''} onChange={e => set('cronologia_finale', e.target.value)} placeholder="Es. III sec. a.C." />
            </div>
          </div>
          <div>
            <label style={lbl}>Metodo di datazione</label>
            <SearchableSelect options={metodiDatazione} value={form.metodo_datazione ?? ''} onChange={v => set('metodo_datazione', v)} placeholder="Seleziona..." allowFreeText={true} />
          </div>
        </div>
      )}

      {/* Navigazione step */}
      <div style={{ display:'flex', gap:'8px', marginTop:'16px' }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            style={{ flex:1, padding:'10px', background:'#f8f7f4', color:'#555550', border:'0.5px solid #c8c7be', borderRadius:'6px', fontSize:'12px', cursor:'pointer' }}>
            ← {STEP_LABELS[step - 1]}
          </button>
        )}
        {step < 4 ? (
          <button onClick={() => { salva(); setStep(s => s + 1) }}
            style={{ flex:2, padding:'10px', background:'#1a4a7a', color:'#fff', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:'pointer' }}>
            {STEP_LABELS[step + 1]} →
          </button>
        ) : (
          <button onClick={() => { salva(); router.push(`/reports/scavi/${scavoId}`) }}
            style={{ flex:2, padding:'10px', background:'#1a6b4a', color:'#fff', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:'pointer' }}>
            ✓ Chiudi scheda
          </button>
        )}
      </div>

    </div>
  )
}
