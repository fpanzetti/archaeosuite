'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import GalleriaFoto from '@/components/ui/GalleriaFoto'
import UploadFoto from '@/components/ui/UploadFoto'

const ORIENTAMENTI = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO']
const ARTI_OPT = ['Disteso', 'Assente', 'Dislocato']
const ARTI_OPT_F = ['Distesa', 'Assente', 'Dislocata']
const ARTIC_OPT = ['Articolato', 'Separato', 'Dislocato']
const SI_NO = ['sì', 'no']

const STEP_LABELS = [
  '1. Dati generali',
  '2. Dati stratigrafici',
  '3. Rituale funerario',
  '4. Età e sesso',
  '5. Connessioni scheletriche',
  '6. Posizione arti',
  '7. Decomposizione',
  '8. Misure',
  '9. Descrizione',
  '10. Foto',
  '11. Reperti',
]

type Tomba = Record<string, unknown>
type Reperto = { id: string; rp_n: number | null; descrizione: string | null; datazione: string | null }

export default function SchedaTombaPage() {
  const params = useParams()
  const scavoId = params.id as string
  const tombaId = params.tombaId as string
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Tomba>({})
  const [tomba, setTomba] = useState<Tomba | null>(null)
  const [nomeScavo, setNomeScavo] = useState('')
  const [reperti, setReperti] = useState<Reperto[]>([])
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(true)
  const [ultimoSalvataggio, setUltimoSalvataggio] = useState<Date | null>(null)
  const [aggFoto, setAggFoto] = useState(0)
  const [toast, setToast] = useState('')
  const supabase = createClient()
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: s }, { data: r }] = await Promise.all([
        supabase.from('contesto_funerario').select('*').eq('id', tombaId).single(),
        supabase.from('scavo').select('denominazione, responsabile_campo').eq('id', scavoId).single(),
        supabase.from('reperto_funerario').select('*').eq('contesto_funerario_id', tombaId).order('rp_n'),
      ])
      if (t) { setTomba(t); setForm(t) }
      if (s) setNomeScavo(s.denominazione ?? '')
      if (r) setReperti(r)
    }
    load()
  }, [tombaId, scavoId])

  function set(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }))
    setDirty(true)
    setSaved(false)
    if (autosaveRef.current) clearTimeout(autosaveRef.current)
    autosaveRef.current = setTimeout(() => salva(), 3000)
  }

  async function salva() {
    const { data } = await supabase.from('contesto_funerario').update(form).eq('id', tombaId).select('updated_at').single()
    if (data?.updated_at) setUltimoSalvataggio(new Date(data.updated_at))
    setDirty(false)
    setSaved(true)
    showToast('Salvato')
  }

  async function aggiungiReperto() {
    const prossimoRp = reperti.length > 0 ? Math.max(...reperti.map(r => r.rp_n ?? 0)) + 1 : 1
    const { data } = await supabase.from('reperto_funerario').insert({
      contesto_funerario_id: tombaId,
      scavo_id: scavoId,
      rp_n: prossimoRp,
    }).select().single()
    if (data) setReperti(prev => [...prev, data])
  }

  async function aggiornaReperto(id: string, field: string, value: unknown) {
    setReperti(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
    await supabase.from('reperto_funerario').update({ [field]: value }).eq('id', id)
  }

  async function eliminaReperto(id: string) {
    if (!confirm('Eliminare questo reperto?')) return
    await supabase.from('reperto_funerario').delete().eq('id', id)
    setReperti(prev => prev.filter(r => r.id !== id))
  }

  // Stili
  const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '0.5px solid #c8c7be', borderRadius: '6px', background: '#f8f7f4', color: '#1a1a1a', fontSize: '12px', fontFamily: 'inherit' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', color: '#8a8a84', marginBottom: '4px', fontWeight: '500' }
  const card: React.CSSProperties = { background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px', padding: '20px', marginBottom: '12px' }
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }
  const grid3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }
  const sectionTitle: React.CSSProperties = { fontSize: '11px', fontWeight: '500', color: '#1a4a7a', marginBottom: '12px', paddingBottom: '6px', borderBottom: '0.5px solid #e0dfd8' }

  function RadioGroup({ label, field, options }: { label: string; field: string; options: string[] }) {
    const val = form[field] as string | null
    return (
      <div style={{ marginBottom: '10px' }}>
        {label && <label style={lbl}>{label}</label>}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {options.map(opt => (
            <button key={opt} type="button" onClick={() => set(field, val === opt ? null : opt)}
              style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                background: val === opt ? '#e8f0f8' : '#f8f7f4',
                color: val === opt ? '#1a4a7a' : '#555550',
                border: val === opt ? '0.5px solid #1a4a7a' : '0.5px solid #c8c7be',
                fontWeight: val === opt ? '500' : '400' }}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  function SelectField({ label, field, options }: { label: string; field: string; options: string[] }) {
    const val = form[field] as string | null
    return (
      <div>
        <label style={lbl}>{label}</label>
        <select style={inp} value={val ?? ''} onChange={e => set(field, e.target.value || null)}>
          <option value="">—</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    )
  }

  const selStile: React.CSSProperties = { width: '100px', padding: '4px 6px', border: '0.5px solid #c8c7be', borderRadius: '6px', background: '#f8f7f4', color: '#1a1a1a', fontSize: '11px', fontFamily: 'inherit' }

  function ArticolazioneSxDx({ label, baseName, soloUna = false, primaRiga = false }: { label: string; baseName: string; soloUna?: boolean; primaRiga?: boolean }) {
    return (
      <>
        {primaRiga && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
            <div style={{ flex: 1 }} />
            <div style={{ width: '100px', fontSize: '10px', color: '#8a8a84', fontWeight: '500', textAlign: 'center' }}>SX</div>
            {!soloUna && <div style={{ width: '100px', fontSize: '10px', color: '#8a8a84', fontWeight: '500', textAlign: 'center' }}>DX</div>}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '3px', padding: '2px 0', borderBottom: '0.5px solid #f0efe9' }}>
          <div style={{ flex: 1, fontSize: '12px', color: '#555550' }}>{label}</div>
          <select style={selStile} value={(form[`${baseName}_sx`] as string) ?? ''} onChange={e => set(`${baseName}_sx`, e.target.value || null)}>
            <option value="">—</option>
            {ARTIC_OPT.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {!soloUna && (
            <select style={selStile} value={(form[`${baseName}_dx`] as string) ?? ''} onChange={e => set(`${baseName}_dx`, e.target.value || null)}>
              <option value="">—</option>
              {ARTIC_OPT.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
        </div>
      </>
    )
  }

  function ArteSxDx({ label, baseName, femminile = false }: { label: string; baseName: string; femminile?: boolean }) {
    const opts = femminile ? ARTI_OPT_F : ARTI_OPT
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '3px', padding: '2px 0', borderBottom: '0.5px solid #f0efe9' }}>
        <div style={{ flex: 1, fontSize: '12px', color: '#555550' }}>{label}</div>
        <select style={selStile} value={(form[`${baseName}_sx`] as string) ?? ''} onChange={e => set(`${baseName}_sx`, e.target.value || null)}>
          <option value="">—</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <select style={selStile} value={(form[`${baseName}_dx`] as string) ?? ''} onChange={e => set(`${baseName}_dx`, e.target.value || null)}>
          <option value="">—</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    )
  }

  if (!tomba) return <div style={{ padding: '24px', fontSize: '12px', color: '#8a8a84' }}>Caricamento...</div>

  const btnSalva: React.CSSProperties = {
    padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', border: 'none',
    background: dirty ? '#1a4a7a' : saved ? '#1a6b4a' : '#f0efe9',
    color: dirty || saved ? '#fff' : '#8a8a84',
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '12px', zIndex: 1000 }}>
          {toast}
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <a href={`/reports/scavi/${scavoId}`}
          style={{ fontSize: '11px', color: '#1a4a7a', textDecoration: 'none', padding: '4px 10px', border: '0.5px solid #c8c7be', borderRadius: '6px' }}>
          ← Elenco US
        </a>
        <span style={{ fontSize: '11px', color: '#c8c7be' }}>/</span>
        <span style={{ fontSize: '11px', color: '#8a8a84' }}>⚱️ Tomba {form.numero_tomba as number}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '500' }}>⚱️ Tomba {form.numero_tomba as number}</h1>
          <div style={{ fontSize: '11px', color: '#8a8a84', marginTop: '4px' }}>
            {nomeScavo}
            {ultimoSalvataggio && <span> · Salvato {ultimoSalvataggio.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
        </div>
        <button style={btnSalva} onClick={salva}>{dirty ? 'Salva modifiche' : saved ? '✓ Salvato' : 'Salva'}</button>
      </div>

      {/* Tab navigazione step */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {STEP_LABELS.map((label, i) => (
          <button key={i} onClick={() => setStep(i)}
            style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer',
              background: step === i ? '#1a4a7a' : '#f8f7f4',
              color: step === i ? '#fff' : '#555550',
              border: step === i ? 'none' : '0.5px solid #c8c7be',
              fontWeight: step === i ? '500' : '400' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── STEP 0: Dati generali ── */}
      {step === 0 && (
        <div>
          <div style={card}>
            <div style={sectionTitle}>Identificativi</div>
            <div style={grid3}>
              <div><label style={lbl}>Numero tomba</label>
                <input style={inp} type="number" value={form.numero_tomba as number ?? ''} onChange={e => set('numero_tomba', parseInt(e.target.value))} /></div>
              <div><label style={lbl}>Emergenza n°</label>
                <input style={inp} type="number" value={form.emergenza_n as number ?? ''} onChange={e => set('emergenza_n', parseInt(e.target.value) || null)} /></div>
              <div><label style={lbl}>Settore</label>
                <input style={inp} value={form.settore as string ?? ''} onChange={e => set('settore', e.target.value || null)} /></div>
            </div>
            <div style={grid2}>
              <div><label style={lbl}>Vertici</label>
                <input style={inp} value={form.vertici as string ?? ''} onChange={e => set('vertici', e.target.value || null)} placeholder="Es. 56-57" /></div>
              <div><label style={lbl}>Data inizio scavo</label>
                <input style={inp} type="date" value={form.data_inizio_scavo as string ?? ''} onChange={e => set('data_inizio_scavo', e.target.value || null)} /></div>
            </div>
            <div style={grid2}>
              <div><label style={lbl}>Data recupero</label>
                <input style={inp} type="date" value={form.data_recupero as string ?? ''} onChange={e => set('data_recupero', e.target.value || null)} /></div>
            </div>
          </div>
          <div style={card}>
            <div style={sectionTitle}>Personale</div>
            <div style={grid2}>
              <div><label style={lbl}>Archeologo</label>
                <input style={inp} value={form.archeologo as string ?? ''} onChange={e => set('archeologo', e.target.value || null)} /></div>
              <div><label style={lbl}>Antropologo</label>
                <input style={inp} value={form.antropologo as string ?? ''} onChange={e => set('antropologo', e.target.value || null)} /></div>
            </div>
          </div>
          <div style={card}>
            <div style={sectionTitle}>Tipologia / Elementi strutturali</div>
            <textarea style={{ ...inp, height: '80px', resize: 'none' } as React.CSSProperties}
              value={form.tipologia_elementi_strutturali as string ?? ''}
              onChange={e => set('tipologia_elementi_strutturali', e.target.value || null)}
              placeholder="Descrizione della tipologia e degli elementi strutturali..." />
          </div>
        </div>
      )}

      {/* ── STEP 1: Dati stratigrafici ── */}
      {step === 1 && (
        <div>
          <div style={card}>
            <div style={sectionTitle}>Dimensioni sepoltura (m)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div><label style={lbl}>Larghezza</label>
                <input style={inp} type="number" step="0.01" value={form.larghezza as number ?? ''} onChange={e => set('larghezza', parseFloat(e.target.value) || null)} /></div>
              <div><label style={lbl}>Lunghezza</label>
                <input style={inp} type="number" step="0.01" value={form.lunghezza as number ?? ''} onChange={e => set('lunghezza', parseFloat(e.target.value) || null)} /></div>
              <div><label style={lbl}>Profondità max</label>
                <input style={inp} type="number" step="0.01" value={form.profondita_max as number ?? ''} onChange={e => set('profondita_max', parseFloat(e.target.value) || null)} /></div>
              <SelectField label="Orientamento" field="orientamento" options={ORIENTAMENTI} />
            </div>
          </div>
          <div style={card}>
            <div style={sectionTitle}>Indicazioni stratigrafiche (US)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div><label style={lbl}>Copertura</label>
                <input style={inp} value={form.us_copertura as string ?? ''} onChange={e => set('us_copertura', e.target.value || null)} placeholder="Es. 131" /></div>
              <div><label style={lbl}>Defunto e corredo</label>
                <input style={inp} value={form.us_defunto_corredo as string ?? ''} onChange={e => set('us_defunto_corredo', e.target.value || null)} placeholder="Es. 132" /></div>
              <div><label style={lbl}>Corredo accompagno</label>
                <input style={inp} value={form.us_corredo_accompagno as string ?? ''} onChange={e => set('us_corredo_accompagno', e.target.value || null)} placeholder="Es. 133" /></div>
              <div><label style={lbl}>Taglio</label>
                <input style={inp} value={form.us_taglio as string ?? ''} onChange={e => set('us_taglio', e.target.value || null)} placeholder="Es. 134" /></div>
              <div><label style={lbl}>Altro</label>
                <input style={inp} value={form.us_altro as string ?? ''} onChange={e => set('us_altro', e.target.value || null)} /></div>
            </div>
          </div>
          <div style={card}>
            <div style={sectionTitle}>Reperti particolari (RP)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div><label style={lbl}>Corredo personale</label>
                <input style={inp} value={form.rp_corredo_personale as string ?? ''} onChange={e => set('rp_corredo_personale', e.target.value || null)} placeholder="Es. 170" /></div>
              <div><label style={lbl}>Corredo di accompagno</label>
                <input style={inp} value={form.rp_corredo_accompagno as string ?? ''} onChange={e => set('rp_corredo_accompagno', e.target.value || null)} placeholder="Es. 141-149,151" /></div>
              <div><label style={lbl}>Altro</label>
                <input style={inp} value={form.rp_altro as string ?? ''} onChange={e => set('rp_altro', e.target.value || null)} /></div>
            </div>
          </div>
          <div style={card}>
            <div style={sectionTitle}>Relazioni e datazione</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Relazioni con altri contesti stratigrafici</label>
              <input style={inp} value={form.relazioni_altri_contesti as string ?? ''} onChange={e => set('relazioni_altri_contesti', e.target.value || null)} />
            </div>
            <div style={grid2}>
              <div>
                <label style={lbl}>Nucleo sepolcrale</label>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  {['sì', 'no', 'non determinabile'].map(v => (
                    <button key={v} type="button" onClick={() => set('nucleo_sepolcrale', form.nucleo_sepolcrale === v ? null : v)}
                      style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer',
                        background: form.nucleo_sepolcrale === v ? '#e8f0f8' : '#f8f7f4',
                        color: form.nucleo_sepolcrale === v ? '#1a4a7a' : '#555550',
                        border: form.nucleo_sepolcrale === v ? '0.5px solid #1a4a7a' : '0.5px solid #c8c7be' }}>
                      {v}
                    </button>
                  ))}
                </div>
                {form.nucleo_sepolcrale === 'sì' && (
                  <input style={inp} type="number" value={form.nucleo_sepolcrale_n as number ?? ''} onChange={e => set('nucleo_sepolcrale_n', parseInt(e.target.value) || null)} placeholder="Numero" />
                )}
              </div>
              <div>
                <div><label style={lbl}>Datazione</label>
                  <input style={inp} value={form.datazione as string ?? ''} onChange={e => set('datazione', e.target.value || null)} placeholder="Es. Metà IV a.C." /></div>
                <div style={{ marginTop: '8px' }}><label style={lbl}>Criteri di datazione</label>
                  <input style={inp} value={form.criteri_datazione as string ?? ''} onChange={e => set('criteri_datazione', e.target.value || null)} placeholder="Es. Materiali" /></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Rituale funerario ── */}
      {step === 2 && (
        <div>
          <div style={card}>
            <div style={sectionTitle}>Caratteri deposizionali</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '10px' }}>
              <RadioGroup label="Tipo di sepoltura" field="tipo_sepoltura" options={['Incinerazione', 'Inumazione']} />
              <RadioGroup label="Numerosità" field="tipo_numerosita" options={['Singola', 'Bisoma', 'Multipla', 'Collettiva']} />
              <RadioGroup label="Tipo di deposizione" field="tipo_deposizione" options={['Primaria', 'Primaria rimaneggiata', 'Secondaria', 'Ridotta']} />
            </div>
            {(form.tipo_numerosita === 'Multipla' || form.tipo_numerosita === 'Collettiva') && (
              <div style={{ marginBottom: '10px' }}>
                <label style={lbl}>Numero di individui</label>
                <input style={{ ...inp, width: '120px' }} type="number" value={form.numero_individui as number ?? ''} onChange={e => set('numero_individui', parseInt(e.target.value) || null)} />
              </div>
            )}
            {form.tipo_deposizione === 'Primaria rimaneggiata' && (
              <div style={{ marginBottom: '10px' }}>
                <label style={lbl}>Natura del rimaneggiamento</label>
                <input style={inp} value={form.natura_rimaneggiamento as string ?? ''} onChange={e => set('natura_rimaneggiamento', e.target.value || null)} />
              </div>
            )}
          </div>
          <div style={card}>
            <div style={sectionTitle}>Caratteristiche strutturali</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px 16px' }}>
              <div>
                <RadioGroup label="Segnacolo" field="segnacolo" options={SI_NO} />
                <RadioGroup label="Dromos di scavo" field="dromos" options={SI_NO} />
                <RadioGroup label="Cassa" field="cassa" options={SI_NO} />
              </div>
              <div>
                <RadioGroup label="Tronco" field="tronco" options={SI_NO} />
                <RadioGroup label="Piano deposizionale" field="piano_deposizionale" options={SI_NO} />
              </div>
              <div>
                <RadioGroup label="Cassone in muratura" field="cassone_muratura" options={SI_NO} />
                <RadioGroup label="Tumulo" field="tumulo" options={SI_NO} />
                <RadioGroup label="Circolo" field="circolo" options={SI_NO} />
              </div>
              <div>
                <RadioGroup label="Cuscino" field="cuscino" options={SI_NO} />
                <RadioGroup label="Sudario" field="sudario" options={SI_NO} />
              </div>
            </div>
            <div style={{ marginTop: '8px' }}>
              <label style={lbl}>Tipologia di copertura</label>
              <textarea style={{ ...inp, height: '64px', resize: 'none' } as React.CSSProperties}
                value={form.tipologia_copertura as string ?? ''}
                onChange={e => set('tipologia_copertura', e.target.value || null)} />
            </div>
          </div>
          <div style={card}>
            <div style={sectionTitle}>Elementi rituali</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
              <RadioGroup label="Frammentazione ceramica rituale" field="frammentazione_ceramica" options={SI_NO} />
              <RadioGroup label="Oggetti rituali" field="oggetti_rituali" options={SI_NO} />
              <RadioGroup label="Organico pasto / ossa animali" field="organico_pasto" options={SI_NO} />
              <RadioGroup label="Libagione" field="libagione" options={SI_NO} />
            </div>
            <RadioGroup label="Connessione anatomica" field="connessione_anatomica" options={['sì', 'no', 'parziale']} />
          </div>
        </div>
      )}

      {/* ── STEP 3: Età e sesso ── */}
      {step === 3 && (
        <div>
          <div style={card}>
            <div style={sectionTitle}>Stima dell&apos;età della morte</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Infante (0-10 anni)', 'Sub-adulto (11-18 anni)', 'Adulto'].map(v => (
                <button key={v} type="button" onClick={() => set('eta_morte', form.eta_morte === v ? null : v)}
                  style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                    background: form.eta_morte === v ? '#e8f0f8' : '#f8f7f4',
                    color: form.eta_morte === v ? '#1a4a7a' : '#555550',
                    border: form.eta_morte === v ? '0.5px solid #1a4a7a' : '0.5px solid #c8c7be' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div style={card}>
            <div style={sectionTitle}>Sesso</div>
            <div style={grid2}>
              <div>
                <label style={lbl}>Sesso antropologico</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['M', 'F', 'Non determinabile', 'Non determinato'].map(v => (
                    <button key={v} type="button" onClick={() => set('sesso_antropologico', form.sesso_antropologico === v ? null : v)}
                      style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                        background: form.sesso_antropologico === v ? '#e8f0f8' : '#f8f7f4',
                        color: form.sesso_antropologico === v ? '#1a4a7a' : '#555550',
                        border: form.sesso_antropologico === v ? '0.5px solid #1a4a7a' : '0.5px solid #c8c7be' }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Sesso archeologico</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['M', 'F', 'Non determinabile'].map(v => (
                    <button key={v} type="button" onClick={() => set('sesso_archeologico', form.sesso_archeologico === v ? null : v)}
                      style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                        background: form.sesso_archeologico === v ? '#e8f0f8' : '#f8f7f4',
                        color: form.sesso_archeologico === v ? '#1a4a7a' : '#555550',
                        border: form.sesso_archeologico === v ? '0.5px solid #1a4a7a' : '0.5px solid #c8c7be' }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <label style={lbl}>Criteri di diagnosi per la stima del sesso e dell&apos;età della morte</label>
              <textarea style={{ ...inp, height: '72px', resize: 'none' } as React.CSSProperties}
                value={form.criteri_diagnosi as string ?? ''}
                onChange={e => set('criteri_diagnosi', e.target.value || null)} />
            </div>
          </div>
          <div style={card}>
            <div style={sectionTitle}>Posizione scheletro</div>
            <div style={grid2}>
              <SelectField label="Orientamento cranio-caudale" field="orientamento_cranio" options={ORIENTAMENTI} />
              <div>
                <label style={lbl}>Posizione dello scheletro</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['Supino', 'Su lato dx', 'Su lato sx', 'Prono', 'Altro'].map(v => (
                    <button key={v} type="button" onClick={() => set('posizione_scheletro', form.posizione_scheletro === v ? null : v)}
                      style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                        background: form.posizione_scheletro === v ? '#e8f0f8' : '#f8f7f4',
                        color: form.posizione_scheletro === v ? '#1a4a7a' : '#555550',
                        border: form.posizione_scheletro === v ? '0.5px solid #1a4a7a' : '0.5px solid #c8c7be' }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 4: Connessioni anatomo-scheletriche ── */}
      {step === 4 && (
        <div>
          <div style={card}>
            <div style={sectionTitle}>Cranio e mandibola</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Posizione del cranio</label>
              <input style={inp} value={form.posizione_cranio as string ?? ''} onChange={e => set('posizione_cranio', e.target.value || null)} placeholder="Es. ruotato a dx" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '6px', marginBottom: '4px' }}>
              <div style={{ fontSize: '11px', color: '#8a8a84', fontWeight: '500' }}>Connessione</div>
              <div style={{ fontSize: '11px', color: '#8a8a84', fontWeight: '500' }}>—</div>
              <div style={{ fontSize: '11px', color: '#8a8a84', fontWeight: '500' }}>—</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', padding: '3px 0', borderBottom: '0.5px solid #f0efe9' }}>
                  <div style={{ fontSize: '12px', color: '#555550', flex: 1 }}>Temporo-mandibolare</div>
                  <select style={{ width: '140px', padding: '5px 8px', border: '0.5px solid #c8c7be', borderRadius: '6px', background: '#f8f7f4', color: '#1a1a1a', fontSize: '11px', fontFamily: 'inherit' }}
                    value={(form.temporo_mandibolare as string) ?? ''} onChange={e => set('temporo_mandibolare', e.target.value || null)}>
                    <option value="">—</option>{ARTIC_OPT.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', padding: '3px 0', borderBottom: '0.5px solid #f0efe9' }}>
                  <div style={{ fontSize: '12px', color: '#555550', flex: 1 }}>Cranio-atlante</div>
                  <select style={{ width: '140px', padding: '5px 8px', border: '0.5px solid #c8c7be', borderRadius: '6px', background: '#f8f7f4', color: '#1a1a1a', fontSize: '11px', fontFamily: 'inherit' }}
                    value={(form.cranio_atlante as string) ?? ''} onChange={e => set('cranio_atlante', e.target.value || null)}>
                    <option value="">—</option>{ARTIC_OPT.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', padding: '3px 0', borderBottom: '0.5px solid #f0efe9' }}>
                  <div style={{ fontSize: '12px', color: '#555550', flex: 1 }}>Atlante-epistrofeo</div>
                  <select style={{ width: '140px', padding: '5px 8px', border: '0.5px solid #c8c7be', borderRadius: '6px', background: '#f8f7f4', color: '#1a1a1a', fontSize: '11px', fontFamily: 'inherit' }}
                    value={(form.atlante_epistrofeo as string) ?? ''} onChange={e => set('atlante_epistrofeo', e.target.value || null)}>
                    <option value="">—</option>{ARTIC_OPT.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', padding: '3px 0', borderBottom: '0.5px solid #f0efe9' }}>
                  <div style={{ fontSize: '12px', color: '#555550', flex: 1 }}>Epistrofeo-C3</div>
                  <select style={{ width: '140px', padding: '5px 8px', border: '0.5px solid #c8c7be', borderRadius: '6px', background: '#f8f7f4', color: '#1a1a1a', fontSize: '11px', fontFamily: 'inherit' }}
                    value={(form.epistrofeo_c3 as string) ?? ''} onChange={e => set('epistrofeo_c3', e.target.value || null)}>
                    <option value="">—</option>{ARTIC_OPT.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <RadioGroup label="Mandibola" field="mandibola" options={['Aperta', 'Chiusa']} />
          </div>
          <div style={card}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
              <div>
                <div style={sectionTitle}>Articolazioni labili</div>
                <ArticolazioneSxDx label="Vertebre cervicali" baseName="vertebre_cervicali" soloUna={true} primaRiga={true} />
                <ArticolazioneSxDx label="Vertebre toraciche" baseName="vertebre_toraciche" soloUna={true} />
                <ArticolazioneSxDx label="Scapola-clavicola" baseName="scapola_clavicola" primaRiga={true} />
                <ArticolazioneSxDx label="Scapola-omero" baseName="scapola_omero" />
                <ArticolazioneSxDx label="Polso" baseName="polso" />
                <ArticolazioneSxDx label="Metacarpo-Falange" baseName="metacarpo_falange" />
                <ArticolazioneSxDx label="Rotula" baseName="rotula" />
                <ArticolazioneSxDx label="Metatarso-Falange" baseName="metatarso_falange" />
              </div>
              <div>
                <div style={sectionTitle}>Articolazioni persistenti</div>
                <ArticolazioneSxDx label="Vertebre lombari" baseName="vertebre_lombari" soloUna={true} primaRiga={true} />
                <ArticolazioneSxDx label="Lombo-sacrale" baseName="lombo_sacrale" soloUna={true} />
                <ArticolazioneSxDx label="Sacro-iliaca" baseName="sacro_iliaca" primaRiga={true} />
                <ArticolazioneSxDx label="Coxo-femorale" baseName="coxo_femorale" />
                <ArticolazioneSxDx label="Gomito" baseName="gomito" />
                <ArticolazioneSxDx label="Ginocchio" baseName="ginocchio" />
                <ArticolazioneSxDx label="Caviglia" baseName="caviglia" />
                <ArticolazioneSxDx label="Tarso" baseName="tarso" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 5: Posizione arti ── */}
      {step === 5 && (
        <div>
          <div style={card}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
              <div>
                <div style={sectionTitle}>Arti superiori</div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
                  <div style={{ flex: 1 }} />
                  <div style={{ width: '100px', fontSize: '10px', color: '#8a8a84', fontWeight: '500', textAlign: 'center' }}>SX</div>
                  <div style={{ width: '100px', fontSize: '10px', color: '#8a8a84', fontWeight: '500', textAlign: 'center' }}>DX</div>
                </div>
                <ArteSxDx label="Omero" baseName="omero" />
                <ArteSxDx label="Avambraccio" baseName="avambraccio" />
                <ArteSxDx label="Mano" baseName="mano" />
              </div>
              <div>
                <div style={sectionTitle}>Arti inferiori</div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
                  <div style={{ flex: 1 }} />
                  <div style={{ width: '100px', fontSize: '10px', color: '#8a8a84', fontWeight: '500', textAlign: 'center' }}>SX</div>
                  <div style={{ width: '100px', fontSize: '10px', color: '#8a8a84', fontWeight: '500', textAlign: 'center' }}>DX</div>
                </div>
                <ArteSxDx label="Femore" baseName="femore" />
                <ArteSxDx label="Tibia" baseName="tibia" femminile />
                <ArteSxDx label="Piede" baseName="piede" />
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <label style={lbl}>Elementi dislocati</label>
              <textarea style={{ ...inp, height: '64px', resize: 'none' } as React.CSSProperties}
                value={form.elementi_dislocati as string ?? ''}
                onChange={e => set('elementi_dislocati', e.target.value || null)} />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 6: Decomposizione ── */}
      {step === 6 && (
        <div>
          <div style={card}>
            <div style={sectionTitle}>Effetti della decomposizione e della compressione o parete</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px 16px', marginBottom: '8px' }}>
              <RadioGroup label="Appiattimento torace" field="appiattimento_torace" options={SI_NO} />
              <RadioGroup label="Caduta sterno" field="caduta_sterno" options={SI_NO} />
              <RadioGroup label="Cinto pelvico" field="cinto_pelvico" options={['Aperto', 'Chiuso', 'Semi-chiuso']} />
              <RadioGroup label="Ginocchia" field="ginocchia" options={['Aperte', 'Unite', 'Semi-chiuse']} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px 16px', marginBottom: '8px' }}>
              <RadioGroup label="Caviglie" field="caviglie" options={['Aperte', 'Unite', 'Semi-chiuse']} />
              <RadioGroup label="Verticalizzazione clavicola" field="verticalizzazione_clavicola" options={['SX', 'DX', 'Entrambe']} />
              <RadioGroup label="Scapola obliqua" field="scapola_obliqua" options={['SX', 'DX', 'Entrambe']} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', marginBottom: '8px' }}>
              <RadioGroup label="Rotazione mediale omero" field="rotazione_mediale_omero" options={['SX', 'DX', 'Entrambe']} />
              <RadioGroup label="Rotazione laterale femore" field="rotazione_laterale_femore" options={['SX', 'DX', 'Entrambe']} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={lbl}>Parte dello scheletro soggetta alla compressione o all&apos;effetto parete</label>
              <input style={inp} value={form.parte_scheletro_compressione as string ?? ''} onChange={e => set('parte_scheletro_compressione', e.target.value || null)} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={lbl}>Compressione dovuta a</label>
              <input style={inp} value={form.compressione_dovuta_a as string ?? ''} onChange={e => set('compressione_dovuta_a', e.target.value || null)} />
            </div>
            <RadioGroup label="Decomposizione" field="decomposizione" options={['Spazio vuoto', 'Spazio pieno', 'Altro']} />
            {form.decomposizione === 'Altro' && (
              <div>
                <label style={lbl}>Specificare</label>
                <input style={inp} value={form.decomposizione_altro as string ?? ''} onChange={e => set('decomposizione_altro', e.target.value || null)} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 7: Misure ── */}
      {step === 7 && (
        <div>
          <div style={card}>
            <div style={sectionTitle}>Misure scheletro</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Lunghezza dello scheletro (apice cranico-calcagno)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {['Determinabile', 'Non determinabile'].map(v => (
                  <button key={v} type="button" onClick={() => set('lunghezza_scheletro_determinabile', form.lunghezza_scheletro_determinabile === v ? null : v)}
                    style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                      background: form.lunghezza_scheletro_determinabile === v ? '#e8f0f8' : '#f8f7f4',
                      color: form.lunghezza_scheletro_determinabile === v ? '#1a4a7a' : '#555550',
                      border: form.lunghezza_scheletro_determinabile === v ? '0.5px solid #1a4a7a' : '0.5px solid #c8c7be' }}>
                    {v}
                  </button>
                ))}
                {form.lunghezza_scheletro_determinabile === 'Determinabile' && (
                  <input style={{ ...inp, width: '100px' }} type="number" step="0.1"
                    value={form.lunghezza_scheletro_cm as number ?? ''}
                    onChange={e => set('lunghezza_scheletro_cm', parseFloat(e.target.value) || null)}
                    placeholder="cm" />
                )}
              </div>
            </div>
          </div>
          <div style={card}>
            <div style={sectionTitle}>Stato di conservazione</div>
            <SelectField label="Stato di conservazione" field="stato_conservazione" options={['Ottimo', 'Buono', 'Discreto', 'Cattivo', 'Pessimo']} />
            <div style={{ marginTop: '10px' }}>
              <label style={lbl}>Alterazioni scheletriche</label>
              <textarea style={{ ...inp, height: '72px', resize: 'none' } as React.CSSProperties}
                value={form.alterazioni_scheletriche as string ?? ''}
                onChange={e => set('alterazioni_scheletriche', e.target.value || null)} />
            </div>
            <div style={{ marginTop: '10px' }}>
              <label style={lbl}>Consolidanti e collanti usati</label>
              <input style={inp} value={form.consolidanti_collanti as string ?? ''} onChange={e => set('consolidanti_collanti', e.target.value || null)} />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 8: Descrizione ── */}
      {step === 8 && (
        <div style={card}>
          <div style={sectionTitle}>Descrizione</div>
          <textarea style={{ ...inp, height: '400px', resize: 'vertical' } as React.CSSProperties}
            value={form.descrizione as string ?? ''}
            onChange={e => set('descrizione', e.target.value || null)}
            placeholder="Descrizione estesa del contesto funerario..." />
        </div>
      )}

      {/* ── STEP 9: Foto ── */}
      {step === 9 && (
        <div>
          <div style={card}>
            <div style={sectionTitle}>Foto deposizione funeraria</div>
            <UploadFoto scavoId={scavoId} tipo="foto"
              responsabileCampo={form.archeologo as string ?? undefined}
              onFotoAggiunta={() => setAggFoto(n => n + 1)} />
            <div style={{ marginTop: '16px' }}>
              <GalleriaFoto scavoId={scavoId} aggiornamento={aggFoto} tipo="foto" />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 10: Reperti ── */}
      {step === 10 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>
              Reperti all&apos;interno della tomba ({reperti.length})
            </div>
            <button onClick={aggiungiReperto}
              style={{ padding: '7px 14px', background: '#1a4a7a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              + Aggiungi reperto
            </button>
          </div>
          {reperti.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#8a8a84', fontSize: '12px', background: '#f8f7f4', borderRadius: '10px', border: '0.5px dashed #c8c7be' }}>
              Nessun reperto ancora — aggiungi il primo
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reperti.map(r => (
                <div key={r.id} style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a4a7a' }}>RP {r.rp_n}</div>
                    <button onClick={() => eliminaReperto(r.id)}
                      style={{ padding: '3px 8px', background: 'none', border: '0.5px solid #e88', color: '#c00', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                      Elimina
                    </button>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={lbl}>Descrizione</label>
                    <textarea style={{ ...inp, height: '80px', resize: 'none' } as React.CSSProperties}
                      value={r.descrizione ?? ''}
                      onChange={e => aggiornaReperto(r.id, 'descrizione', e.target.value || null)}
                      placeholder="Descrizione del reperto..." />
                  </div>
                  <div>
                    <label style={lbl}>Datazione</label>
                    <input style={inp} value={r.datazione ?? ''}
                      onChange={e => aggiornaReperto(r.id, 'datazione', e.target.value || null)}
                      placeholder="Es. IV a.C." />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigazione step */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          style={{ padding: '8px 16px', background: '#f8f7f4', color: step === 0 ? '#c8c7be' : '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: step === 0 ? 'default' : 'pointer' }}>
          ← Precedente
        </button>
        <button onClick={() => setStep(s => Math.min(STEP_LABELS.length - 1, s + 1))} disabled={step === STEP_LABELS.length - 1}
          style={{ padding: '8px 16px', background: '#f8f7f4', color: step === STEP_LABELS.length - 1 ? '#c8c7be' : '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: step === STEP_LABELS.length - 1 ? 'default' : 'pointer' }}>
          Successivo →
        </button>
      </div>
    </div>
  )
}
