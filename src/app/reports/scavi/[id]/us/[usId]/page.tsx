'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import SearchableSelect from '@/components/ui/SearchableSelect'
import UploadFoto from '@/components/ui/UploadFoto'
import GalleriaFoto from '@/components/ui/GalleriaFoto'

type Opt = { value: string; label: string }
type USBase = { id: string; numero_us: number; tipo: string | null; descrizione: string | null }
type US = USBase & {
  stato: string
  completata: boolean
  // Generale (eredita da scavo)
  natura: string | null
  polarita: string | null
  // Step 0 — Generale
  data_rilevamento: string | null
  data_rielaborazione: string | null
  responsabile_scientifico: string | null
  responsabile_campo: string | null
  responsabile_rielaborazione: string | null
  // Step 1 — Identificazione
  anno: number | null
  identificativo_saggio: string | null
  area_edificio: string | null
  ambiente: string | null
  posizione: string | null
  settore: string | null
  quadrati: string | null
  area_scavo: string | null
  saggio: string | null
  quota_min: number | null
  quota_max: number | null
  data_apertura: string | null
  data_chiusura: string | null
  descrizione: string | null
  // Step 2 — Descrizione fisica
  colore: string | null
  consistenza: string | null
  umidita: string | null
  inclusi_organici: string | null
  inclusi_inorganici: string | null
  definizione: string | null
  criteri_distinzione: string | null
  modo_formazione: string | null
  descrizione_estesa: string | null
  stato_conservazione: string | null
  elementi_datanti: string | null
  dati_quantitativi: string | null
  campionature: string | null
  flottazione: string | null
  setacciatura: string | null
  affidabilita_stratigrafica: string | null
  // Step 4 — Documentazione
  osservazioni: string | null
  lunghezza: number | null
  larghezza: number | null
  spessore: number | null
  // Step 5 — Interpretazione
  interpretazione: string | null
  tipo_formazione: string | null
  cronologia_iniziale: string | null
  cronologia_finale: string | null
  metodo_datazione: string | null
  periodo: string | null
  fase: string | null
  attivita: string | null
}

type Scavo = {
  comune: string | null
  provincia: string | null
  localita: string | null
  committente: string | null
  soprintendenza: string | null
}

const STEP_LABELS = ['Generale', 'Identificazione', 'Descrizione', 'Rapporti strat.', 'Documentazione', 'Interpretazione']

const COLONNE = [
  { key: 'copre_taglia', post: 'copre', post_label: 'Copre', ant: 'coperto_da', ant_label: 'Coperta da', cont: null, cont_label: null },
  { key: 'taglia_tagliato', post: 'taglia', post_label: 'Taglia', ant: 'tagliato_da', ant_label: 'Tagliata da', cont: null, cont_label: null },
  { key: 'appoggia', post: 'si_appoggia_a', post_label: 'Si appoggia a', ant: 'appoggiato_da', ant_label: 'Appoggiata da', cont: null, cont_label: null },
  { key: 'riempie', post: 'riempie', post_label: 'Riempie', ant: 'riempito_da', ant_label: 'Riempita da', cont: null, cont_label: null },
  { key: 'lega', post: null, post_label: null, ant: null, ant_label: null, cont: 'si_lega_a', cont_label: 'Si lega a' },
  { key: 'uguale', post: null, post_label: null, ant: null, ant_label: null, cont: 'uguale_a', cont_label: 'Uguale a' },
]

const INVERSO: Record<string, string> = {
  copre: 'coperto_da', coperto_da: 'copre',
  taglia: 'tagliato_da', tagliato_da: 'taglia',
  si_appoggia_a: 'appoggiato_da', appoggiato_da: 'si_appoggia_a',
  riempie: 'riempito_da', riempito_da: 'riempie',
  si_lega_a: 'si_lega_a', uguale_a: 'uguale_a',
}

const FLOTTAZIONE_OPT: Opt[] = [{ value: 'sì', label: 'Sì' }, { value: 'no', label: 'No' }, { value: 'parziale', label: 'Parziale' }]
const AFFIDABILITA_OPT: Opt[] = [{ value: 'alta', label: 'Alta' }, { value: 'media', label: 'Media' }, { value: 'bassa', label: 'Bassa' }]
const TIPO_ALLEGATO = ['foto', 'pianta', 'prospetto', 'sezione'] as const
type TipoAllegato = typeof TIPO_ALLEGATO[number]

export default function SchedaUSPage() {
  const params = useParams()
  const scavoId = params.id as string
  const usId = params.usId as string
  const [step, setStep] = useState(0)
  const [us, setUs] = useState<US | null>(null)
  const [scavo, setScavo] = useState<Scavo | null>(null)
  const [nomeScavo, setNomeScavo] = useState('')
  const [form, setForm] = useState<Partial<US>>({})
  const [completata, setCompletata] = useState(false)
  const [tipiUS, setTipiUS] = useState<Opt[]>([])
  const [consistenze, setConsistenze] = useState<Opt[]>([])
  const [umidita, setUmidita] = useState<Opt[]>([])
  const [tipiFormazione, setTipiFormazione] = useState<Opt[]>([])
  const [metodiDatazione, setMetodiDatazione] = useState<Opt[]>([])
  const [munsell, setMunsell] = useState<Opt[]>([])
  const [allUS, setAllUS] = useState<USBase[]>([])
  const [rapporti, setRapporti] = useState<Record<string, number[]>>({
    copre: [], coperto_da: [], taglia: [], tagliato_da: [],
    si_appoggia_a: [], appoggiato_da: [], riempie: [], riempito_da: [],
    si_lega_a: [], uguale_a: [],
  })
  const [inputAttivo, setInputAttivo] = useState<string | null>(null)
  const [inputValore, setInputValore] = useState('')
  const [usCreate, setUsCreate] = useState<Set<number>>(new Set())
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [ultimoSalvataggio, setUltimoSalvataggio] = useState<Date | null>(null)
  const [aggFoto, setAggFoto] = useState(0)
  const [tabAllegati, setTabAllegati] = useState<TipoAllegato>('foto')
  const svgRef = useRef<SVGSVGElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const reloadUS = useCallback(async () => {
    const { data } = await supabase.from('us').select('id, numero_us, tipo, descrizione')
      .eq('scavo_id', scavoId).order('numero_us')
    if (data) setAllUS(data.filter((u: USBase) => u.id !== usId))
  }, [scavoId, usId])

  useEffect(() => {
    async function loadAll() {
      const [{ data: usData }, { data: th }, { data: mn }, { data: rapData }, { data: scavoData }] = await Promise.all([
        supabase.from('us').select('*').eq('id', usId).single(),
        supabase.from('thesaurus').select('*').order('ordine'),
        supabase.from('munsell').select('*').order('nome_italiano'),
        supabase.from('rapporto_stratigrafico').select('*').eq('us_id', usId),
        supabase.from('scavo').select('comune, provincia, localita, committente, soprintendenza').eq('id', scavoId).single(),
      ])
      if (scavoData) {
        setScavo(scavoData)
        setNomeScavo([scavoData.comune, scavoData.provincia ? `(${scavoData.provincia})` : '', scavoData.localita].filter(Boolean).join(' '))
      }
      if (usData) {
        setUs(usData)
        setForm(usData)
        setCompletata(usData.completata ?? false)
        if (usData.updated_at) setUltimoSalvataggio(new Date(usData.updated_at))
      }
      if (th) {
        setTipiUS(th.filter((t: {tipo: string; valore: string}) => t.tipo === 'tipo_us').map((t: {tipo: string; valore: string}) => ({ value: t.valore, label: t.valore })))
        setConsistenze(th.filter((t: {tipo: string; valore: string}) => t.tipo === 'consistenza').map((t: {tipo: string; valore: string}) => ({ value: t.valore, label: t.valore })))
        setUmidita(th.filter((t: {tipo: string; valore: string}) => t.tipo === 'umidita').map((t: {tipo: string; valore: string}) => ({ value: t.valore, label: t.valore })))
        setTipiFormazione(th.filter((t: {tipo: string; valore: string}) => t.tipo === 'tipo_formazione').map((t: {tipo: string; valore: string}) => ({ value: t.valore, label: t.valore })))
        setMetodiDatazione(th.filter((t: {tipo: string; valore: string}) => t.tipo === 'metodo_datazione').map((t: {tipo: string; valore: string}) => ({ value: t.valore, label: t.valore })))
      }
      if (mn) setMunsell(mn.map((m: {codice: string; nome_italiano: string}) => ({ value: m.codice, label: m.nome_italiano })))
      if (rapData) {
        const grouped: Record<string, number[]> = {
          copre: [], coperto_da: [], taglia: [], tagliato_da: [],
          si_appoggia_a: [], appoggiato_da: [], riempie: [], riempito_da: [],
          si_lega_a: [], uguale_a: [],
        }
        rapData.forEach((r: {tipo: string; numero_us_correlata: number}) => {
          if (grouped[r.tipo]) grouped[r.tipo].push(r.numero_us_correlata)
        })
        setRapporti(grouped)
      }
      await reloadUS()
    }
    loadAll()
  }, [usId, scavoId, reloadUS])

  useEffect(() => {
    if (step !== 3) return
    const timer = setTimeout(() => {
      const svg = svgRef.current
      if (!svg) return
      const container = svg.parentElement
      if (!container) return
      const w = container.offsetWidth
      const h = container.offsetHeight
      svg.setAttribute('width', String(w))
      svg.setAttribute('height', String(h))
      svg.innerHTML = ''
      const usEl = document.getElementById('us-corrente-center')
      if (!usEl) return
      const cRect = container.getBoundingClientRect()
      const usR = usEl.getBoundingClientRect()
      const usX = usR.left - cRect.left + usR.width / 2
      const usY = usR.top - cRect.top + usR.height / 2
      const categorie = [
        { chiavi: COLONNE.filter(c => c.post).map(c => c.post!), colore: '#185FA5' },
        { chiavi: COLONNE.filter(c => c.cont).map(c => c.cont!), colore: '#1a6b4a' },
        { chiavi: COLONNE.filter(c => c.ant).map(c => c.ant!), colore: '#8a5c0a' },
      ]
      categorie.forEach(({ chiavi, colore }) => {
        const attive = chiavi.filter(k => (rapporti[k] ?? []).length > 0)
        if (attive.length === 0) return
        let sumX = 0, sumY = 0, count = 0
        attive.forEach(k => {
          const el = document.getElementById('cella-' + k)
          if (!el) return
          const r = el.getBoundingClientRect()
          sumX += r.left - cRect.left + r.width / 2
          sumY += r.top - cRect.top + r.height / 2
          count++
        })
        if (count === 0) return
        const tx = sumX / count
        const ty = sumY / count
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('x1', String(usX)); line.setAttribute('y1', String(usY))
        line.setAttribute('x2', String(tx)); line.setAttribute('y2', String(ty))
        line.setAttribute('stroke', colore); line.setAttribute('stroke-width', '2')
        line.setAttribute('stroke-dasharray', '5 3'); line.setAttribute('opacity', '0.75')
        svg.appendChild(line)
      })
    }, 150)
    return () => clearTimeout(timer)
  }, [step, rapporti])

  async function salvaField(field: string, value: unknown) {
    const aggiornamento: Record<string, unknown> = { [field]: value }
    const { data } = await supabase.from('us').update(aggiornamento).eq('id', usId).select('updated_at').single()
    if (data?.updated_at) setUltimoSalvataggio(new Date(data.updated_at))
  }

  function set(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }))
    setDirty(true)
    setSaved(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function toggleCompletata() {
    const nuovoValore = !completata
    setCompletata(nuovoValore)
    await supabase.from('us').update({ completata: nuovoValore }).eq('id', usId)
    showToast(nuovoValore ? 'Scheda US segnata come completata' : 'Scheda US segnata come non completata')
  }

  async function aggiungiRapporto(tipoKey: string) {
    const numero = parseInt(inputValore)
    if (!numero || numero < 1) return
    if (rapporti[tipoKey].includes(numero)) { setInputAttivo(null); setInputValore(''); return }
    let usCorrelataId: string | null = null
    const esistente = allUS.find(u => u.numero_us === numero)
    if (esistente) {
      usCorrelataId = esistente.id
    } else {
      const { data: nuova } = await supabase.from('us').insert({
        scavo_id: scavoId, numero_us: numero, stato: 'aperta',
      }).select().single()
      if (nuova) {
        usCorrelataId = nuova.id
        setUsCreate(prev => new Set([...prev, numero]))
        showToast(`US ${numero} creata come scheda vuota`)
        await reloadUS()
      }
    }
    if (!usCorrelataId) return
    await supabase.from('rapporto_stratigrafico').upsert({
      us_id: usId, tipo: tipoKey,
      us_correlata_id: usCorrelataId, numero_us_correlata: numero,
    })
    await supabase.from('rapporto_stratigrafico').upsert({
      us_id: usCorrelataId, tipo: INVERSO[tipoKey],
      us_correlata_id: usId, numero_us_correlata: us?.numero_us ?? 0,
    })
    setRapporti(prev => ({ ...prev, [tipoKey]: [...prev[tipoKey], numero] }))
    setInputAttivo(null); setInputValore('')
  }

  async function rimuoviRapporto(tipoKey: string, numero: number) {
    await supabase.from('rapporto_stratigrafico').delete()
      .eq('us_id', usId).eq('tipo', tipoKey).eq('numero_us_correlata', numero)
    setRapporti(prev => ({ ...prev, [tipoKey]: prev[tipoKey].filter(n => n !== numero) }))
  }

  async function salva() {
    setSaving(true)
    await supabase.from('us').update({
      // Generale
      data_rilevamento: form.data_rilevamento,
      data_rielaborazione: form.data_rielaborazione,
      responsabile_scientifico: form.responsabile_scientifico,
      responsabile_campo: form.responsabile_campo,
      responsabile_rielaborazione: form.responsabile_rielaborazione,
      // Identificazione
      tipo: form.tipo,
      natura: form.natura,
      polarita: form.polarita,
      anno: form.anno,
      identificativo_saggio: form.identificativo_saggio,
      area_edificio: form.area_edificio,
      ambiente: form.ambiente,
      posizione: form.posizione,
      settore: form.settore,
      quadrati: form.quadrati,
      area_scavo: form.area_scavo,
      saggio: form.saggio,
      data_apertura: form.data_apertura,
      data_chiusura: form.data_chiusura,
      descrizione: form.descrizione,
      // Descrizione
      colore: form.colore,
      consistenza: form.consistenza,
      umidita: form.umidita,
      inclusi_organici: form.inclusi_organici,
      inclusi_inorganici: form.inclusi_inorganici,
      definizione: form.definizione,
      criteri_distinzione: form.criteri_distinzione,
      modo_formazione: form.modo_formazione,
      descrizione_estesa: form.descrizione_estesa,
      stato_conservazione: form.stato_conservazione,
      elementi_datanti: form.elementi_datanti,
      dati_quantitativi: form.dati_quantitativi,
      campionature: form.campionature,
      flottazione: form.flottazione,
      setacciatura: form.setacciatura,
      affidabilita_stratigrafica: form.affidabilita_stratigrafica,
      // Documentazione
      osservazioni: form.osservazioni,
      quota_min: form.quota_min,
      quota_max: form.quota_max,
      lunghezza: form.lunghezza,
      larghezza: form.larghezza,
      spessore: form.spessore,
      // Interpretazione
      interpretazione: form.interpretazione,
      tipo_formazione: form.tipo_formazione,
      cronologia_iniziale: form.cronologia_iniziale,
      cronologia_finale: form.cronologia_finale,
      metodo_datazione: form.metodo_datazione,
      periodo: form.periodo,
      fase: form.fase,
      attivita: form.attivita,
    }).eq('id', usId)
    setSaving(false); setSaved(true); setDirty(false)
  }

  // Stili
  const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '0.5px solid #c8c7be', borderRadius: '6px', background: '#f8f7f4', color: '#1a1a1a', fontSize: '12px', fontFamily: 'inherit' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', color: '#8a8a84', marginBottom: '4px', fontWeight: '500' }
  const lblBlue: React.CSSProperties = { ...lbl, color: '#1a4a7a' }
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }
  const grid3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }
  const card: React.CSSProperties = { background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px', padding: '20px', marginBottom: '12px' }
  const sectionTitle: React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: '#8a8a84', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', paddingBottom: '6px', borderBottom: '0.5px solid #e0dfd8' }
  const infoRow: React.CSSProperties = { padding: '6px 10px', background: '#f8f7f4', borderRadius: '6px', fontSize: '12px', color: '#555550', marginBottom: '8px' }
  const infoLabel: React.CSSProperties = { fontSize: '10px', color: '#8a8a84', display: 'block', marginBottom: '2px' }

  function RadioGroup({ label, field, options }: { label: string; field: string; options: string[] }) {
    const val = (form as Record<string, unknown>)[field] as string | null
    return (
      <div>
        <label style={lbl}>{label}</label>
        <div style={{ display: 'flex', gap: '6px' }}>
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

  function CellaRapporto({ tipoKey, label, riga }: { tipoKey: string; label: string; riga: 'post' | 'ant' | 'cont' }) {
    const numeri = rapporti[tipoKey] ?? []
    const coloreRiga = riga === 'post' ? '#1a4a7a' : riga === 'ant' ? '#8a5c0a' : '#1a6b4a'
    const bgRiga = riga === 'post' ? '#e8f0f8' : riga === 'ant' ? '#fdf3e0' : '#e8f4ef'
    const isAttivo = inputAttivo === tipoKey
    return (
      <div id={`cella-${tipoKey}`} style={{ border: `0.5px solid ${coloreRiga}30`, borderRadius: '6px', padding: '8px', background: bgRiga, minHeight: '80px' }}>
        <div style={{ fontSize: '10px', color: coloreRiga, fontWeight: '500', marginBottom: '6px', textAlign: 'center' }}>{label}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
          {numeri.map(num => {
            const usCorr = allUS.find(u => u.numero_us === num)
            const vuota = usCreate.has(num) || (usCorr ? (!usCorr.tipo && !usCorr.descrizione) : false)
            return (
              <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '500',
                background: vuota ? '#fff3cd' : '#cfe2ff',
                border: `1px solid ${vuota ? '#f0a500' : '#185FA5'}`,
                color: vuota ? '#8a5c0a' : '#185FA5' }}>
                {num}
                {vuota && <span style={{ fontSize: '9px' }}>⚠</span>}
                <span onClick={() => rimuoviRapporto(tipoKey, num)}
                  style={{ cursor: 'pointer', color: '#aaa', marginLeft: '2px', fontSize: '13px', lineHeight: '1' }}>×</span>
              </div>
            )
          })}
        </div>
        {isAttivo ? (
          <div style={{ display: 'flex', gap: '4px' }}>
            <input autoFocus type="number" min="1" value={inputValore}
              onChange={e => setInputValore(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') aggiungiRapporto(tipoKey); if (e.key === 'Escape') { setInputAttivo(null); setInputValore('') } }}
              style={{ width: '60px', padding: '3px 6px', border: `1px solid ${coloreRiga}`, borderRadius: '4px', background: '#fff', fontSize: '11px' }}
              placeholder="US n." />
            <button onClick={() => aggiungiRapporto(tipoKey)}
              style={{ padding: '3px 7px', background: coloreRiga, color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✓</button>
            <button onClick={() => { setInputAttivo(null); setInputValore('') }}
              style={{ padding: '3px 6px', background: '#f0efe9', color: '#888', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✗</button>
          </div>
        ) : (
          <button onClick={() => { setInputAttivo(tipoKey); setInputValore('') }}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: '#fff', border: `1px dashed ${coloreRiga}80`, borderRadius: '4px', fontSize: '11px', color: coloreRiga, cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
            <span style={{ fontSize: '14px', lineHeight: '1' }}>+</span> aggiungi US
          </button>
        )}
      </div>
    )
  }

  if (!us) return <div style={{ padding: '24px', color: '#8a8a84', fontSize: '12px' }}>Caricamento...</div>

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '12px', zIndex: 1000 }}>
          {toast}
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ fontSize: '11px', color: '#8a8a84', marginBottom: '16px' }}>
        <span style={{ color: '#1a4a7a', cursor: 'pointer' }} onClick={() => router.push('/reports')}>Scavi</span>
        {' / '}
        <span style={{ color: '#1a4a7a', cursor: 'pointer' }} onClick={() => router.push(`/reports/scavi/${scavoId}`)}>{nomeScavo || 'Scavo'}</span>
        {' / '}US {us.numero_us}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '500', margin: 0 }}>US {us.numero_us}</h1>
            {us.tipo && <p style={{ fontSize: '12px', color: '#555550', marginTop: '2px', marginBottom: 0 }}>{us.tipo}</p>}
          </div>
          {/* Natura e Polarità */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(['naturale', 'artificiale'] as const).map(opt => (
              <button key={opt} type="button" onClick={() => set('natura', form.natura === opt ? null : opt)}
                style={{ padding: '4px 10px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer',
                  background: form.natura === opt ? '#e8f0f8' : '#f8f7f4',
                  color: form.natura === opt ? '#1a4a7a' : '#8a8a84',
                  border: form.natura === opt ? '0.5px solid #1a4a7a' : '0.5px solid #c8c7be',
                  fontWeight: form.natura === opt ? '500' : '400' }}>
                {opt}
              </button>
            ))}
            <div style={{ width: '1px', background: '#e0dfd8', margin: '0 2px' }} />
            {(['positiva', 'negativa'] as const).map(opt => (
              <button key={opt} type="button" onClick={() => set('polarita', form.polarita === opt ? null : opt)}
                style={{ padding: '4px 10px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer',
                  background: form.polarita === opt ? '#e8f4ef' : '#f8f7f4',
                  color: form.polarita === opt ? '#1a6b4a' : '#8a8a84',
                  border: form.polarita === opt ? '0.5px solid #1a6b4a' : '0.5px solid #c8c7be',
                  fontWeight: form.polarita === opt ? '500' : '400' }}>
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={toggleCompletata}
            style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer',
              background: completata ? '#e8f4ef' : '#f8f7f4',
              color: completata ? '#1a6b4a' : '#8a8a84',
              border: completata ? '1.5px solid #1a6b4a' : '0.5px solid #c8c7be' }}>
            {completata ? '✓ Completata' : 'Segna come completata'}
          </button>
          <button onClick={salva} disabled={saving || (!dirty && !saved)}
            style={{ padding: '7px 16px',
              background: saving ? '#8a8a84' : saved ? '#1a6b4a' : dirty ? '#1a4a7a' : '#c8c7be',
              color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500',
              cursor: (saving || (!dirty && !saved)) ? 'default' : 'pointer',
              transition: 'background 0.2s' }}>
            {saving ? 'Salvataggio...' : saved ? '✓ Salvato' : dirty ? 'Salva' : 'Salvato'}
          </button>
        </div>
        {ultimoSalvataggio && (
          <div style={{ fontSize: '10px', color: '#8a8a84', textAlign: 'right' }}>
            {'Ultimo salvataggio il ' + ultimoSalvataggio.toLocaleDateString('it-IT', {day:'2-digit',month:'2-digit',year:'numeric'}) + ' alle ore ' + ultimoSalvataggio.toLocaleTimeString('it-IT')}
          </div>
        )}
      </div>

      {/* Tab step */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', background: '#f0efe9', borderRadius: '8px', padding: '4px' }}>
        {STEP_LABELS.map((label, i) => (
          <button key={i} onClick={() => setStep(i)}
            style={{ flex: 1, padding: '7px 4px', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer',
              fontWeight: step === i ? '500' : '400',
              background: step === i ? '#fff' : 'transparent',
              color: step === i ? '#1a4a7a' : '#8a8a84',
              boxShadow: step === i ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── STEP 0: GENERALE ── */}
      {step === 0 && (
        <div>
          {/* Dati ereditati dallo scavo */}
          <div style={card}>
            <div style={sectionTitle}>Dati ereditati dallo scavo</div>
            <div style={grid2}>
              <div>
                <span style={infoLabel}>Ente responsabile</span>
                <div style={infoRow}>{scavo?.committente || <span style={{ color: '#c8c7be' }}>—</span>}</div>
              </div>
              <div>
                <span style={infoLabel}>Ufficio MiC competente per tutela</span>
                <div style={infoRow}>{scavo?.soprintendenza || <span style={{ color: '#c8c7be' }}>—</span>}</div>
              </div>
            </div>
          </div>
          {/* Date e responsabili */}
          <div style={card}>
            <div style={sectionTitle}>Date e responsabili</div>
            <div style={grid2}>
              <div><label style={lbl}>Data rilevamento sul campo</label>
                <input style={inp} type="date" value={form.data_rilevamento ?? ''} onChange={e => set('data_rilevamento', e.target.value)} /></div>
              <div><label style={lbl}>Data rielaborazione</label>
                <input style={inp} type="date" value={form.data_rielaborazione ?? ''} onChange={e => set('data_rielaborazione', e.target.value)} /></div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Responsabile scientifico delle indagini</label>
              <input style={inp} value={form.responsabile_scientifico ?? ''} onChange={e => set('responsabile_scientifico', e.target.value)} placeholder="Nome e cognome" />
            </div>
            <div style={grid2}>
              <div><label style={lbl}>Responsabile compilazione sul campo</label>
                <input style={inp} value={form.responsabile_campo ?? ''} onChange={e => set('responsabile_campo', e.target.value)} placeholder="Nome e cognome" /></div>
              <div><label style={lbl}>Responsabile rielaborazione</label>
                <input style={inp} value={form.responsabile_rielaborazione ?? ''} onChange={e => set('responsabile_rielaborazione', e.target.value)} placeholder="Nome e cognome" /></div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 1: IDENTIFICAZIONE ── */}
      {step === 1 && (
        <div>
          <div style={card}>
            <div style={sectionTitle}>Tipo e anno</div>
            <div style={grid2}>
              <div><label style={lblBlue}>Tipo US *</label>
                <SearchableSelect options={tipiUS} value={form.tipo ?? ''} onChange={v => set('tipo', v)} placeholder="Seleziona tipo..." /></div>
              <div><label style={lbl}>Anno</label>
                <input style={inp} type="number" value={form.anno ?? ''} onChange={e => set('anno', e.target.value ? parseInt(e.target.value) : null)} placeholder={new Date().getFullYear().toString()} /></div>
            </div>
            <div style={grid2}>
              <div><label style={lbl}>Data apertura</label>
                <input style={inp} type="date" value={form.data_apertura ?? ''} onChange={e => set('data_apertura', e.target.value)} /></div>
              <div><label style={lbl}>Data chiusura</label>
                <input style={inp} type="date" value={form.data_chiusura ?? ''} onChange={e => set('data_chiusura', e.target.value)} /></div>
            </div>
          </div>
          <div style={card}>
            <div style={sectionTitle}>Dati topografici</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Identificativo del saggio / edificio / struttura / deposizione</label>
              <input style={inp} value={form.identificativo_saggio ?? ''} onChange={e => set('identificativo_saggio', e.target.value)} placeholder="Es. Saggio 3, Edificio B, Tomba 12..." />
            </div>
            <div style={grid2}>
              <div><label style={lbl}>Area / Edificio / Struttura</label>
                <input style={inp} value={form.area_edificio ?? ''} onChange={e => set('area_edificio', e.target.value)} placeholder="Es. Area A, Edificio 1..." /></div>
              <div><label style={lbl}>Ambiente / Unità funzionale</label>
                <input style={inp} value={form.ambiente ?? ''} onChange={e => set('ambiente', e.target.value)} placeholder="Es. Ambiente 3, Vano B..." /></div>
            </div>
            <div style={grid2}>
              <div><label style={lbl}>Posizione</label>
                <input style={inp} value={form.posizione ?? ''} onChange={e => set('posizione', e.target.value)} placeholder="Es. NE, parete ovest..." /></div>
              <div><label style={lbl}>Settore/i</label>
                <input style={inp} value={form.settore ?? ''} onChange={e => set('settore', e.target.value)} placeholder="Es. Nord, A-B..." /></div>
            </div>
            <div style={grid2}>
              <div><label style={lbl}>Quadrato/i</label>
                <input style={inp} value={form.quadrati ?? ''} onChange={e => set('quadrati', e.target.value)} placeholder="Es. B3, C4-D4..." /></div>
            </div>
            <p style={{ fontSize: '10px', color: '#8a8a84', marginTop: '-4px', marginBottom: '12px' }}>
              Se lo scavo non è suddiviso in aree o settori usa valori convenzionali (es. A / 1 / —)
            </p>
            <div style={grid3}>
              <div><label style={lbl}>Quota min (m)</label>
                <input style={inp} type="number" step="0.01" value={form.quota_min ?? ''} onChange={e => set('quota_min', e.target.value ? parseFloat(e.target.value) : null)} placeholder="Es. -1.48" /></div>
              <div><label style={lbl}>Quota max (m)</label>
                <input style={inp} type="number" step="0.01" value={form.quota_max ?? ''} onChange={e => set('quota_max', e.target.value ? parseFloat(e.target.value) : null)} placeholder="Es. -0.92" /></div>
            </div>
          </div>
          <div style={card}>
            <div style={sectionTitle}>Descrizione sintetica</div>
            <textarea style={{ ...inp, height: '72px', resize: 'none' } as React.CSSProperties}
              value={form.descrizione ?? ''} onChange={e => set('descrizione', e.target.value)}
              placeholder="Descrizione breve per la lista US" />
          </div>
        </div>
      )}

      {/* ── STEP 2: DESCRIZIONE FISICA ── */}
      {step === 2 && (
        <div>
          <div style={card}>
            <div style={sectionTitle}>Caratteristiche fisiche</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Colore</label>
              <SearchableSelect options={munsell} value={form.colore ?? ''} onChange={v => set('colore', v)} placeholder="Cerca colore Munsell..." allowFreeText={true} />
            </div>
            <div style={grid2}>
              <div><label style={lbl}>Consistenza</label>
                <SearchableSelect options={consistenze} value={form.consistenza ?? ''} onChange={v => set('consistenza', v)} placeholder="Seleziona..." /></div>
              <div><label style={lbl}>Umidità</label>
                <SearchableSelect options={umidita} value={form.umidita ?? ''} onChange={v => set('umidita', v)} placeholder="Seleziona..." /></div>
            </div>
            <div style={grid2}>
              <div><label style={lbl}>Inclusi organici</label>
                <SearchableSelect options={[]} value={form.inclusi_organici ?? ''} onChange={v => set('inclusi_organici', v)} placeholder="Thesaurus da definire" allowFreeText={true} /></div>
              <div><label style={lbl}>Inclusi inorganici</label>
                <SearchableSelect options={[]} value={form.inclusi_inorganici ?? ''} onChange={v => set('inclusi_inorganici', v)} placeholder="Thesaurus da definire" allowFreeText={true} /></div>
            </div>
          </div>
          <div style={card}>
            <div style={sectionTitle}>Descrizione</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Definizione</label>
              <input style={inp} value={form.definizione ?? ''} onChange={e => set('definizione', e.target.value)} placeholder="Definizione sintetica della US" />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Criteri di distinzione</label>
              <textarea style={{ ...inp, height: '60px', resize: 'none' } as React.CSSProperties}
                value={form.criteri_distinzione ?? ''} onChange={e => set('criteri_distinzione', e.target.value)}
                placeholder="Elementi che distinguono questa US dalle adiacenti" />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Modo di formazione</label>
              <textarea style={{ ...inp, height: '60px', resize: 'none' } as React.CSSProperties}
                value={form.modo_formazione ?? ''} onChange={e => set('modo_formazione', e.target.value)}
                placeholder="Processo di formazione" />
            </div>
            <div><label style={lbl}>Descrizione estesa</label>
              <textarea style={{ ...inp, height: '100px', resize: 'none' } as React.CSSProperties}
                value={form.descrizione_estesa ?? ''} onChange={e => set('descrizione_estesa', e.target.value)}
                placeholder="Descrizione completa della US" /></div>
          </div>
          <div style={card}>
            <div style={sectionTitle}>Dati quantitativi e conservazione</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Stato di conservazione</label>
              <input style={inp} value={form.stato_conservazione ?? ''} onChange={e => set('stato_conservazione', e.target.value)} placeholder="Es. buono, frammentario..." />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Elementi datanti</label>
              <textarea style={{ ...inp, height: '60px', resize: 'none' } as React.CSSProperties}
                value={form.elementi_datanti ?? ''} onChange={e => set('elementi_datanti', e.target.value)}
                placeholder="Materiali o caratteristiche utili alla datazione" />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Dati quantitativi dei reperti</label>
              <textarea style={{ ...inp, height: '60px', resize: 'none' } as React.CSSProperties}
                value={form.dati_quantitativi ?? ''} onChange={e => set('dati_quantitativi', e.target.value)}
                placeholder="Quantità e tipologia dei materiali recuperati" />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Campionature</label>
              <textarea style={{ ...inp, height: '60px', resize: 'none' } as React.CSSProperties}
                value={form.campionature ?? ''} onChange={e => set('campionature', e.target.value)}
                placeholder="Campioni prelevati (tipo, quantità, posizione)" />
            </div>
            <div style={grid3}>
              <RadioGroup label="Flottazione" field="flottazione" options={['sì', 'no', 'parziale']} />
              <RadioGroup label="Setacciatura" field="setacciatura" options={['sì', 'no', 'parziale']} />
              <RadioGroup label="Affidabilità stratigrafica" field="affidabilita_stratigrafica" options={['alta', 'media', 'bassa']} />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: RAPPORTI STRATIGRAFICI ── */}
      {step === 3 && (
        <div style={card}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', padding: '8px 12px', background: '#f8f7f4', borderRadius: '6px', flexWrap: 'wrap' }}>
            {[
              { bg: '#e8f0f8', border: '#185FA5', label: 'posteriorità' },
              { bg: '#e8f4ef', border: '#1a6b4a', label: 'contemporaneità' },
              { bg: '#fdf3e0', border: '#8a5c0a', label: 'anteriorità' },
              { bg: '#cfe2ff', border: '#185FA5', label: 'US documentata' },
              { bg: '#fff3cd', border: '#f0a500', label: 'US vuota ⚠' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#555550' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: l.bg, border: `1px solid ${l.border}` }} />
                {l.label}
              </div>
            ))}
          </div>
          <div style={{ overflowX: 'auto', position: 'relative' }}>
            <svg ref={svgRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 10 }} />
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '4px' }}>
              <thead>
                <tr>
                  <th style={{ width: '80px', fontSize: '10px', color: '#8a8a84', fontWeight: '500', textAlign: 'left', padding: '4px 8px' }}>Categoria</th>
                  {COLONNE.map(col => (
                    <th key={col.key} style={{ fontSize: '10px', color: '#8a8a84', fontWeight: '500', textAlign: 'center', padding: '4px 4px' }}>
                      {col.post_label ?? col.cont_label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontSize: '10px', fontWeight: '500', color: '#1a4a7a', padding: '4px 8px', verticalAlign: 'middle' }}>
                    <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '10px' }}>Posteriorità ↑</div>
                  </td>
                  {COLONNE.map(col => (
                    <td key={col.key} style={{ padding: '2px', verticalAlign: 'top' }}>
                      {col.post ? <CellaRapporto tipoKey={col.post} label={col.post_label!} riga="post" />
                        : <div style={{ height: '80px', background: '#f8f7f4', borderRadius: '6px', border: '0.5px solid #e0dfd8' }} />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '4px 8px' }} />
                  <td colSpan={COLONNE.length} style={{ padding: '6px 2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div id="us-corrente-center" style={{ padding: '8px 32px', background: '#fef9e7', border: '2px solid #f0a500', borderRadius: '8px', fontSize: '13px', fontWeight: '500', color: '#8a5c0a', textAlign: 'center' }}>
                        US {us.numero_us}{us.tipo ? ` — ${us.tipo}` : ''}
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontSize: '10px', fontWeight: '500', color: '#1a6b4a', padding: '4px 8px', verticalAlign: 'middle' }}>
                    <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '10px' }}>Contemporan. →</div>
                  </td>
                  {COLONNE.map(col => (
                    <td key={col.key} style={{ padding: '2px', verticalAlign: 'top' }}>
                      {col.cont ? <CellaRapporto tipoKey={col.cont} label={col.cont_label!} riga="cont" />
                        : <div style={{ height: '80px', background: '#f8f7f4', borderRadius: '6px', border: '0.5px solid #e0dfd8' }} />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontSize: '10px', fontWeight: '500', color: '#8a5c0a', padding: '4px 8px', verticalAlign: 'middle' }}>
                    <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '10px' }}>Anteriorità ↓</div>
                  </td>
                  {COLONNE.map(col => (
                    <td key={col.key} style={{ padding: '2px', verticalAlign: 'top' }}>
                      {col.ant ? <CellaRapporto tipoKey={col.ant} label={col.ant_label!} riga="ant" />
                        : <div style={{ height: '80px', background: '#f8f7f4', borderRadius: '6px', border: '0.5px solid #e0dfd8' }} />}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── STEP 4: DOCUMENTAZIONE ── */}
      {step === 4 && (
        <div>
          <div style={card}>
            <div style={sectionTitle}>Osservazioni e misure</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Osservazioni di scavo</label>
              <textarea style={{ ...inp, height: '100px', resize: 'none' } as React.CSSProperties}
                value={form.osservazioni ?? ''} onChange={e => set('osservazioni', e.target.value)}
                placeholder="Note prese durante lo scavo..." />
            </div>
            <div style={grid3}>
              <div><label style={lbl}>Lunghezza (cm)</label>
                <input style={inp} type="number" value={form.lunghezza ?? ''} onChange={e => set('lunghezza', e.target.value ? parseFloat(e.target.value) : null)} /></div>
              <div><label style={lbl}>Larghezza (cm)</label>
                <input style={inp} type="number" value={form.larghezza ?? ''} onChange={e => set('larghezza', e.target.value ? parseFloat(e.target.value) : null)} /></div>
              <div><label style={lbl}>Spessore (cm)</label>
                <input style={inp} type="number" value={form.spessore ?? ''} onChange={e => set('spessore', e.target.value ? parseFloat(e.target.value) : null)} /></div>
            </div>
          </div>

          {/* Allegati grafici */}
          <div style={card}>
            <div style={sectionTitle}>Allegati grafici</div>
            {/* Tab tipo allegato */}
            <div style={{ display: 'flex', gap: '2px', marginBottom: '16px', background: '#f0efe9', borderRadius: '6px', padding: '3px' }}>
              {TIPO_ALLEGATO.map(t => (
                <button key={t} onClick={() => setTabAllegati(t)}
                  style={{ flex: 1, padding: '6px 4px', border: 'none', borderRadius: '5px', fontSize: '11px', cursor: 'pointer', textTransform: 'capitalize',
                    fontWeight: tabAllegati === t ? '500' : '400',
                    background: tabAllegati === t ? '#fff' : 'transparent',
                    color: tabAllegati === t ? '#1a4a7a' : '#8a8a84',
                    boxShadow: tabAllegati === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                  {t === 'foto' ? '📷 Foto' : t === 'pianta' ? '📐 Piante' : t === 'prospetto' ? '🏛 Prospetti' : '✂️ Sezioni'}
                </button>
              ))}
            </div>
            <GalleriaFoto scavoId={scavoId} usId={usId} aggiornamento={aggFoto} tipo={tabAllegati} />
            <div style={{ marginTop: '10px' }}>
              <UploadFoto scavoId={scavoId} usId={usId} tipo={tabAllegati} onFotoAggiunta={() => setAggFoto(n => n + 1)} />
            </div>
          </div>

          {/* Pulsante tabella materiali */}
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a1a' }}>Tabella materiali</div>
              <div style={{ fontSize: '11px', color: '#8a8a84', marginTop: '2px' }}>
                Reperti associati a US {us.numero_us}
              </div>
            </div>
            <button
              disabled
              style={{ padding: '7px 16px', background: '#f0efe9', color: '#8a8a84', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: 'not-allowed' }}
              title="Modulo in sviluppo">
              Apri tabella →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 5: INTERPRETAZIONE ── */}
      {step === 5 && (
        <div>
          <div style={card}>
            <div style={sectionTitle}>Interpretazione</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Interpretazione</label>
              <textarea style={{ ...inp, height: '100px', resize: 'none' } as React.CSSProperties}
                value={form.interpretazione ?? ''} onChange={e => set('interpretazione', e.target.value)}
                placeholder="Interpretazione della US..." />
            </div>
            <div><label style={lbl}>Tipo di formazione</label>
              <SearchableSelect options={tipiFormazione} value={form.tipo_formazione ?? ''} onChange={v => set('tipo_formazione', v)} placeholder="Seleziona..." /></div>
          </div>
          <div style={card}>
            <div style={sectionTitle}>Cronologia</div>
            <div style={grid2}>
              <div><label style={lbl}>Datazione iniziale</label>
                <input style={inp} value={form.cronologia_iniziale ?? ''} onChange={e => set('cronologia_iniziale', e.target.value)} placeholder="Es. IV sec. a.C." /></div>
              <div><label style={lbl}>Datazione finale</label>
                <input style={inp} value={form.cronologia_finale ?? ''} onChange={e => set('cronologia_finale', e.target.value)} placeholder="Es. III sec. a.C." /></div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Metodo di datazione</label>
              <SearchableSelect options={metodiDatazione} value={form.metodo_datazione ?? ''} onChange={v => set('metodo_datazione', v)} placeholder="Seleziona..." allowFreeText={true} />
            </div>
          </div>
          <div style={card}>
            <div style={sectionTitle}>Contestualizzazione</div>
            <div style={grid2}>
              <div><label style={lbl}>Periodo</label>
                <input style={inp} value={form.periodo ?? ''} onChange={e => set('periodo', e.target.value)} placeholder="Es. Età del Bronzo, medievale..." /></div>
              <div><label style={lbl}>Fase</label>
                <input style={inp} value={form.fase ?? ''} onChange={e => set('fase', e.target.value)} placeholder="Es. Fase I, II..." /></div>
            </div>
            <div><label style={lbl}>Attività</label>
              <input style={inp} value={form.attivita ?? ''} onChange={e => set('attivita', e.target.value)} placeholder="Es. abbandono, crollo, riporto..." /></div>
          </div>
        </div>
      )}

      {/* Navigazione step */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            style={{ flex: 1, padding: '10px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
            ← {STEP_LABELS[step - 1]}
          </button>
        )}
        {step < 5 ? (
          <button onClick={() => { salva(); setStep(s => s + 1) }}
            style={{ flex: 2, padding: '10px', background: '#1a4a7a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
            {STEP_LABELS[step + 1]} →
          </button>
        ) : (
          <button onClick={() => { salva(); router.push(`/reports/scavi/${scavoId}`) }}
            style={{ flex: 2, padding: '10px', background: '#1a6b4a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
            ✓ Chiudi scheda
          </button>
        )}
      </div>
    </div>
  )
}
