'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import SearchableSelect from '@/components/ui/SearchableSelect'

type Opt = { value: string; label: string }
type Sabap = { id: string; nome: string; regione: string }
type Provincia = { sigla: string; nome: string; regione: string }

export default function ModificaScavoPage() {
  const params = useParams()
  const id = params.id as string
  const [form, setForm] = useState({
    nazione: 'Italia', regione: '', soprintendenza: '',
    provincia: '', comune: '', localita: '', indirizzo: '',
    lat: '', lon: '', riferimento_cartografico: '',
    foglio_catastale: '', particella: '', subparticella: '',
    committente: '', direttore_scientifico: '', operatore: '',
    tipologia_intervento: '', tipo_contesto: '',
    datazione_contesto: '', data_inizio: '', note: '',
    stato: 'in_corso',
  })
  const [regioni, setRegioni] = useState<Opt[]>([])
  const [province, setProvince] = useState<Provincia[]>([])
  const [provinceFiltrate, setProvinceFiltrate] = useState<Opt[]>([])
  const [sabapList, setSabapList] = useState<Sabap[]>([])
  const [sabapFiltrate, setSabapFiltrate] = useState<Opt[]>([])
  const [tipiContesto, setTipiContesto] = useState<Opt[]>([])
  const [loading, setLoading] = useState(false)
  const [caricamento, setCaricamento] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadAll() {
      const [{ data: scavo }, { data: th }, { data: sb }, { data: pv }] = await Promise.all([
        supabase.from('scavo').select('*').eq('id', id).single(),
        supabase.from('thesaurus').select('*').order('ordine'),
        supabase.from('sabap').select('*').order('nome'),
        supabase.from('provincia').select('*').order('nome'),
      ])
      if (scavo) {
        setForm({
          nazione: scavo.nazione ?? 'Italia',
          regione: scavo.regione ?? '',
          soprintendenza: scavo.soprintendenza ?? '',
          provincia: scavo.provincia ?? '',
          comune: scavo.comune ?? '',
          localita: scavo.localita ?? '',
          indirizzo: scavo.indirizzo ?? '',
          lat: scavo.lat ? String(scavo.lat) : '',
          lon: scavo.lon ? String(scavo.lon) : '',
          riferimento_cartografico: scavo.riferimento_cartografico ?? '',
          foglio_catastale: scavo.foglio_catastale ?? '',
          particella: scavo.particella ?? '',
          subparticella: scavo.subparticella ?? '',
          committente: scavo.committente ?? '',
          direttore_scientifico: scavo.direttore_scientifico ?? '',
          operatore: scavo.operatore ?? '',
          tipologia_intervento: scavo.tipologia_intervento ?? '',
          tipo_contesto: scavo.tipo_contesto ?? '',
          datazione_contesto: scavo.datazione_contesto ?? '',
          data_inizio: scavo.data_inizio ?? '',
          note: scavo.note ?? '',
          stato: scavo.stato ?? 'in_corso',
        })
      }
      if (th) {
        setRegioni(th.filter((t: {tipo: string; valore: string}) => t.tipo === 'regione').map((t: {tipo: string; valore: string}) => ({ value: t.valore, label: t.valore })))
        setTipiContesto(th.filter((t: {tipo: string; valore: string}) => t.tipo === 'tipo_contesto').map((t: {tipo: string; valore: string}) => ({ value: t.valore, label: t.valore })))
      }
      if (sb) setSabapList(sb)
      if (pv) setProvince(pv)
      setCaricamento(false)
    }
    loadAll()
  }, [id])

  useEffect(() => {
    if (form.regione) {
      setProvinceFiltrate(province.filter(p => p.regione === form.regione).map(p => ({ value: p.sigla, label: `${p.nome} (${p.sigla})` })))
      setSabapFiltrate(sabapList.filter(s => s.regione === form.regione).map(s => ({ value: s.nome, label: s.nome })))
    } else {
      setProvinceFiltrate(province.map(p => ({ value: p.sigla, label: `${p.nome} (${p.sigla})` })))
      setSabapFiltrate(sabapList.map(s => ({ value: s.nome, label: s.nome })))
    }
  }, [form.regione, sabapList, province])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const denominazione = [form.comune, form.provincia ? `(${form.provincia})` : '', form.localita]
      .filter(Boolean).join(' ')
    const { error: err } = await supabase.from('scavo').update({
      denominazione, nazione: form.nazione,
      regione: form.regione || null, soprintendenza: form.soprintendenza || null,
      provincia: form.provincia || null, comune: form.comune,
      localita: form.localita || null, indirizzo: form.indirizzo || null,
      lat: form.lat ? parseFloat(form.lat) : null,
      lon: form.lon ? parseFloat(form.lon) : null,
      riferimento_cartografico: form.riferimento_cartografico || null,
      foglio_catastale: form.foglio_catastale || null,
      particella: form.particella || null, subparticella: form.subparticella || null,
      committente: form.committente || null, direttore_scientifico: form.direttore_scientifico || null,
      operatore: form.operatore || null, tipologia_intervento: form.tipologia_intervento || null,
      tipo_contesto: form.tipo_contesto || null, datazione_contesto: form.datazione_contesto || null,
      data_inizio: form.data_inizio || null, note: form.note || null, stato: form.stato,
    }).eq('id', id)
    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/reports/scavi/${id}`)
  }

  const inp: React.CSSProperties = { width:'100%', padding:'7px 10px', border:'0.5px solid #c8c7be', borderRadius:'6px', background:'#f8f7f4', color:'#1a1a1a', fontSize:'12px', fontFamily:'inherit' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'11px', color:'#8a8a84', marginBottom:'4px', fontWeight:'500' }
  const req: React.CSSProperties = { display:'block', fontSize:'11px', color:'#1a4a7a', marginBottom:'4px', fontWeight:'500' }
  const card: React.CSSProperties = { background:'#fff', border:'0.5px solid #e0dfd8', borderRadius:'10px', padding:'20px', marginBottom:'12px' }
  const grid2: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }
  const grid3: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'12px' }
  const sect: React.CSSProperties = { fontSize:'11px', fontWeight:'500', color:'#1a4a7a', marginBottom:'14px', paddingBottom:'8px', borderBottom:'0.5px solid #e8f0f8' }

  if (caricamento) return <div style={{ padding:'24px', color:'#8a8a84', fontSize:'12px' }}>Caricamento...</div>

  return (
    <div style={{ padding:'24px', maxWidth:'760px' }}>
      <div style={{ marginBottom:'24px' }}>
        <div style={{ fontSize:'11px', color:'#8a8a84', marginBottom:'6px' }}>
          <span style={{ color:'#1a4a7a', cursor:'pointer' }} onClick={() => router.push('/reports')}>Scavi</span>
          {' / '}
          <span style={{ color:'#1a4a7a', cursor:'pointer' }} onClick={() => router.push(`/reports/scavi/${id}`)}>Scavo</span>
          {' / '}Modifica
        </div>
        <h1 style={{ fontSize:'20px', fontWeight:'500' }}>Modifica scavo</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={card}>
          <div style={sect}>Stato</div>
          <div style={{ display:'flex', gap:'8px' }}>
            {[
              { value:'in_corso', label:'In corso', bg:'#e8f0f8', color:'#1a4a7a' },
              { value:'in_elaborazione', label:'In elaborazione', bg:'#fdf3e0', color:'#8a5c0a' },
              { value:'archiviato', label:'Archiviato', bg:'#f0efe9', color:'#8a8a84' },
            ].map(s => (
              <button key={s.value} type="button" onClick={() => set('stato', s.value)}
                style={{ padding:'7px 16px', borderRadius:'20px', fontSize:'12px', cursor:'pointer',
                  background: form.stato === s.value ? s.bg : '#f8f7f4',
                  color: form.stato === s.value ? s.color : '#8a8a84',
                  border: form.stato === s.value ? `1.5px solid ${s.color}` : '0.5px solid #c8c7be',
                  fontWeight: form.stato === s.value ? '500' : '400' }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div style={card}>
          <div style={sect}>Localizzazione</div>
          <div style={{ marginBottom:'12px' }}>
            <label style={lbl}>Nazione</label>
            <input style={inp} value={form.nazione} onChange={e => set('nazione', e.target.value)} />
          </div>
          <div style={grid2}>
            <div><label style={req}>Regione *</label>
              <SearchableSelect options={regioni} value={form.regione} onChange={v => set('regione', v)} placeholder="Cerca regione..." /></div>
            <div><label style={req}>Provincia *</label>
              <SearchableSelect options={provinceFiltrate} value={form.provincia} onChange={v => set('provincia', v)} placeholder="Seleziona provincia..." /></div>
          </div>
          <div style={{ marginBottom:'12px' }}>
            <label style={req}>Comune *</label>
            <input style={inp} value={form.comune} onChange={e => set('comune', e.target.value)} required />
          </div>
          <div style={grid2}>
            <div><label style={lbl}>Località / Contrada</label>
              <input style={inp} value={form.localita} onChange={e => set('localita', e.target.value)} /></div>
            <div><label style={lbl}>Indirizzo</label>
              <input style={inp} value={form.indirizzo} onChange={e => set('indirizzo', e.target.value)} /></div>
          </div>
          <div><label style={req}>Soprintendenza (SABAP) *</label>
            <SearchableSelect options={sabapFiltrate} value={form.soprintendenza} onChange={v => set('soprintendenza', v)} placeholder="Cerca soprintendenza..." allowFreeText={true} /></div>
        </div>
        <div style={card}>
          <div style={sect}>Geolocalizzazione WGS84</div>
          <div style={grid2}>
            <div><label style={req}>Latitudine</label>
              <input style={inp} value={form.lat} onChange={e => set('lat', e.target.value)} placeholder="Es. 41.801300" /></div>
            <div><label style={req}>Longitudine</label>
              <input style={inp} value={form.lon} onChange={e => set('lon', e.target.value)} placeholder="Es. 14.908700" /></div>
          </div>
          <div><label style={lbl}>Riferimento cartografico</label>
            <input style={inp} value={form.riferimento_cartografico} onChange={e => set('riferimento_cartografico', e.target.value)} placeholder="Es. IGM 1:25000 F.163 I SO" /></div>
        </div>
        <div style={card}>
          <div style={sect}>Dati catastali (opzionali)</div>
          <div style={grid3}>
            <div><label style={lbl}>Foglio</label><input style={inp} value={form.foglio_catastale} onChange={e => set('foglio_catastale', e.target.value)} /></div>
            <div><label style={lbl}>Particella</label><input style={inp} value={form.particella} onChange={e => set('particella', e.target.value)} /></div>
            <div><label style={lbl}>Subparticella</label><input style={inp} value={form.subparticella} onChange={e => set('subparticella', e.target.value)} /></div>
          </div>
        </div>
        <div style={card}>
          <div style={sect}>Identificativi</div>
          <div style={grid2}>
            <div><label style={req}>Committente *</label>
              <input style={inp} value={form.committente} onChange={e => set('committente', e.target.value)} required /></div>
            <div><label style={req}>Operatore *</label>
              <input style={inp} value={form.operatore} onChange={e => set('operatore', e.target.value)} required /></div>
          </div>
          <div style={{ marginBottom:'12px' }}>
            <label style={lbl}>Direttore scientifico</label>
            <input style={inp} value={form.direttore_scientifico} onChange={e => set('direttore_scientifico', e.target.value)} />
          </div>
          <div style={grid2}>
            <div><label style={req}>Tipologia di intervento *</label>
              <SearchableSelect options={[]} value={form.tipologia_intervento} onChange={v => set('tipologia_intervento', v)} placeholder="Digita la tipologia..." allowFreeText={true} /></div>
            <div><label style={lbl}>Tipo di contesto</label>
              <SearchableSelect options={tipiContesto} value={form.tipo_contesto} onChange={v => set('tipo_contesto', v)} placeholder="Cerca tipo contesto..." allowFreeText={true} /></div>
          </div>
        </div>
        <div style={card}>
          <div style={sect}>Altri dati</div>
          <div style={grid2}>
            <div><label style={req}>Data inizio scavo *</label>
              <input style={inp} type="date" value={form.data_inizio} onChange={e => set('data_inizio', e.target.value)} required /></div>
            <div><label style={lbl}>Datazione del contesto</label>
              <input style={inp} value={form.datazione_contesto} onChange={e => set('datazione_contesto', e.target.value)} placeholder="Es. Necropoli sannitica, sec. VI-IV a.C." /></div>
          </div>
          <div><label style={lbl}>Note</label>
            <textarea style={{ ...inp, height:'72px', resize:'none' } as React.CSSProperties} value={form.note} onChange={e => set('note', e.target.value)} /></div>
        </div>
        {error && <p style={{ fontSize:'12px', color:'#c00', marginBottom:'12px' }}>{error}</p>}
        <div style={{ display:'flex', gap:'8px' }}>
          <button type="button" onClick={() => router.push(`/reports/scavi/${id}`)}
            style={{ flex:1, padding:'10px', background:'#f8f7f4', color:'#555550', border:'0.5px solid #c8c7be', borderRadius:'6px', fontSize:'12px', cursor:'pointer' }}>
            Annulla
          </button>
          <button type="submit" disabled={loading}
            style={{ flex:2, padding:'10px', background:'#1a4a7a', color:'#fff', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:'pointer' }}>
            {loading ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </div>
      </form>
    </div>
  )
}
