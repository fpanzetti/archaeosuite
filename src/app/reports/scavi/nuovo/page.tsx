'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { creaScavo } from '../actions'

type Opt = { value: string; label: string }
type Sabap = { id: string; nome: string; regione: string }
type Provincia = { sigla: string; nome: string; regione: string }

export default function NuovoScavoPage() {
  const [form, setForm] = useState({
    nazione: 'Italia', regione: '', soprintendenza: '',
    provincia: '', comune: '', localita: '', indirizzo: '',
    lat: '', lon: '', riferimento_cartografico: '',
    foglio_catastale: '', particella: '', subparticella: '',
    committente: '', direttore_scientifico: '', operatore: '',
    tipologia_intervento: '', tipo_contesto: '',
    datazione_contesto: '', data_inizio: '', note: '',
  })
  const [regioni, setRegioni] = useState<Opt[]>([])
  const [province, setProvince] = useState<Provincia[]>([])
  const [provinceFiltrate, setProvinceFiltrate] = useState<Opt[]>([])
  const [sabapList, setSabapList] = useState<Sabap[]>([])
  const [sabapFiltrate, setSabapFiltrate] = useState<Opt[]>([])
  const [tipiContesto, setTipiContesto] = useState<Opt[]>([])
  const [loading, setLoading] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const [{ data: th }, { data: sb }, { data: pv }] = await Promise.all([
        supabase.from('thesaurus').select('*').order('ordine'),
        supabase.from('sabap').select('*').order('nome'),
        supabase.from('provincia').select('*').order('nome'),
      ])
      if (th) {
        setRegioni(th.filter((t: {tipo: string; valore: string}) => t.tipo === 'regione').map((t: {tipo: string; valore: string}) => ({ value: t.valore, label: t.valore })))
        setTipiContesto(th.filter((t: {tipo: string; valore: string}) => t.tipo === 'tipo_contesto').map((t: {tipo: string; valore: string}) => ({ value: t.valore, label: t.valore })))
      }
      if (sb) setSabapList(sb)
      if (pv) setProvince(pv)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (form.regione) {
      setProvinceFiltrate(province.filter(p => p.regione === form.regione).map(p => ({ value: p.sigla, label: `${p.nome} (${p.sigla})` })))
      setSabapFiltrate(sabapList.filter(s => s.regione === form.regione).map(s => ({ value: s.nome, label: s.nome })))
      setForm(prev => ({ ...prev, provincia: '', soprintendenza: '' }))
    } else {
      setProvinceFiltrate(province.map(p => ({ value: p.sigla, label: `${p.nome} (${p.sigla})` })))
      setSabapFiltrate(sabapList.map(s => ({ value: s.nome, label: s.nome })))
    }
  }, [form.regione, sabapList, province])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function getGPS() {
    if (!navigator.geolocation) { setError('Geolocalizzazione non supportata'); return }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(prev => ({ ...prev, lat: pos.coords.latitude.toFixed(6), lon: pos.coords.longitude.toFixed(6) }))
        setGpsLoading(false)
      },
      () => { setError('GPS non disponibile — inserisci le coordinate manualmente'); setGpsLoading(false) }
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.comune) { setError('Il campo Comune è obbligatorio'); return }
    setLoading(true)
    setError('')
    const result = await creaScavo(form)
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  const inp: React.CSSProperties = { width:'100%', padding:'7px 10px', border:'0.5px solid #c8c7be', borderRadius:'6px', background:'#f8f7f4', color:'#1a1a1a', fontSize:'12px', fontFamily:'inherit' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'11px', color:'#8a8a84', marginBottom:'4px', fontWeight:'500' }
  const req: React.CSSProperties = { display:'block', fontSize:'11px', color:'#1a4a7a', marginBottom:'4px', fontWeight:'500' }
  const card: React.CSSProperties = { background:'#fff', border:'0.5px solid #e0dfd8', borderRadius:'10px', padding:'20px', marginBottom:'12px' }
  const grid2: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }
  const grid3: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'12px' }
  const sect: React.CSSProperties = { fontSize:'11px', fontWeight:'500', color:'#1a4a7a', marginBottom:'14px', paddingBottom:'8px', borderBottom:'0.5px solid #e8f0f8' }

  return (
    <div style={{ padding:'24px', maxWidth:'760px' }}>
      <div style={{ marginBottom:'24px' }}>
        <div style={{ fontSize:'11px', color:'#8a8a84', marginBottom:'6px' }}>ArchaeoReports / Scavi</div>
        <h1 style={{ fontSize:'20px', fontWeight:'500' }}>Nuovo scavo</h1>
        <p style={{ fontSize:'12px', color:'#8a8a84', marginTop:'4px' }}>
          I campi in <span style={{ color:'#1a4a7a', fontWeight:'500' }}>blu</span> sono obbligatori
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={card}>
          <div style={sect}>Localizzazione</div>
          <div style={{ marginBottom:'12px' }}>
            <label style={lbl}>Nazione</label>
            <input style={inp} value={form.nazione} onChange={e => set('nazione', e.target.value)} />
          </div>
          <div style={grid2}>
            <div>
              <label style={req}>Regione *</label>
              <SearchableSelect options={regioni} value={form.regione} onChange={v => set('regione', v)} placeholder="Cerca regione..." />
            </div>
            <div>
              <label style={req}>Provincia *</label>
              <SearchableSelect options={provinceFiltrate} value={form.provincia} onChange={v => set('provincia', v)} placeholder={form.regione ? 'Seleziona provincia...' : 'Prima seleziona la regione...'} />
            </div>
          </div>
          <div style={{ marginBottom:'12px' }}>
            <label style={req}>Comune *</label>
            <input style={inp} value={form.comune} onChange={e => set('comune', e.target.value)} placeholder="Es. Larino" required />
          </div>
          <div style={grid2}>
            <div>
              <label style={lbl}>Località / Contrada</label>
              <input style={inp} value={form.localita} onChange={e => set('localita', e.target.value)} placeholder="Es. Casale San Felice" />
            </div>
            <div>
              <label style={lbl}>Indirizzo</label>
              <input style={inp} value={form.indirizzo} onChange={e => set('indirizzo', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={req}>Soprintendenza (SABAP) *</label>
            <SearchableSelect options={sabapFiltrate} value={form.soprintendenza} onChange={v => set('soprintendenza', v)} placeholder={form.regione ? 'Cerca soprintendenza...' : 'Prima seleziona la regione...'} allowFreeText={true} />
          </div>
        </div>

        <div style={card}>
          <div style={sect}>Geolocalizzazione WGS84</div>
          <div style={{ display:'flex', gap:'10px', alignItems:'flex-end' }}>
            <div style={{ flex:1 }}>
              <label style={req}>Latitudine *</label>
              <input style={inp} value={form.lat} onChange={e => set('lat', e.target.value)} placeholder="Es. 41.801300" />
            </div>
            <div style={{ flex:1 }}>
              <label style={req}>Longitudine *</label>
              <input style={inp} value={form.lon} onChange={e => set('lon', e.target.value)} placeholder="Es. 14.908700" />
            </div>
            <button type="button" onClick={getGPS} disabled={gpsLoading}
              style={{ padding:'7px 14px', background: gpsLoading ? '#f0efe9' : '#1a4a7a', color: gpsLoading ? '#8a8a84' : '#fff', border:'none', borderRadius:'6px', fontSize:'12px', cursor:'pointer', whiteSpace:'nowrap' }}>
              {gpsLoading ? '...' : '📍 GPS'}
            </button>
          </div>
          <div style={{ marginTop:'10px' }}>
            <label style={lbl}>Riferimento cartografico</label>
            <input style={inp} value={form.riferimento_cartografico} onChange={e => set('riferimento_cartografico', e.target.value)} placeholder="Es. IGM 1:25000 F.163 I SO" />
          </div>
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
            <div>
              <label style={req}>Committente *</label>
              <input style={inp} value={form.committente} onChange={e => set('committente', e.target.value)} placeholder="Es. ENI S.p.A." required />
            </div>
            <div>
              <label style={req}>Operatore *</label>
              <input style={inp} value={form.operatore} onChange={e => set('operatore', e.target.value)} placeholder="Es. Studio Archeo s.r.l." required />
            </div>
          </div>
          <div style={{ marginBottom:'12px' }}>
            <label style={lbl}>Direttore scientifico</label>
            <input style={inp} value={form.direttore_scientifico} onChange={e => set('direttore_scientifico', e.target.value)} placeholder="Nome e cognome" />
          </div>
          <div style={grid2}>
            <div>
              <label style={req}>Tipologia di intervento *</label>
              <SearchableSelect options={[]} value={form.tipologia_intervento} onChange={v => set('tipologia_intervento', v)} placeholder="Digita la tipologia..." allowFreeText={true} />
            </div>
            <div>
              <label style={lbl}>Tipo di contesto</label>
              <SearchableSelect options={tipiContesto} value={form.tipo_contesto} onChange={v => set('tipo_contesto', v)} placeholder="Cerca tipo contesto..." allowFreeText={true} />
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={sect}>Altri dati</div>
          <div style={grid2}>
            <div>
              <label style={req}>Data inizio scavo *</label>
              <input style={inp} type="date" value={form.data_inizio} onChange={e => set('data_inizio', e.target.value)} required />
            </div>
            <div>
              <label style={lbl}>Datazione del contesto</label>
              <input style={inp} value={form.datazione_contesto} onChange={e => set('datazione_contesto', e.target.value)} placeholder="Es. Necropoli sannitica, sec. VI-IV a.C." />
            </div>
          </div>
          <div>
            <label style={lbl}>Note</label>
            <textarea style={{ ...inp, height:'72px', resize:'none' } as React.CSSProperties} value={form.note} onChange={e => set('note', e.target.value)} placeholder="Note aggiuntive..." />
          </div>
        </div>

        {error && <p style={{ fontSize:'12px', color:'#c00', marginBottom:'12px' }}>{error}</p>}

        <div style={{ display:'flex', gap:'8px' }}>
          <button type="button" onClick={() => router.push('/reports')}
            style={{ flex:1, padding:'10px', background:'#f8f7f4', color:'#555550', border:'0.5px solid #c8c7be', borderRadius:'6px', fontSize:'12px', cursor:'pointer' }}>
            Annulla
          </button>
          <button type="submit" disabled={loading}
            style={{ flex:2, padding:'10px', background:'#1a4a7a', color:'#fff', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:'pointer' }}>
            {loading ? 'Salvataggio...' : 'Crea scavo'}
          </button>
        </div>
      </form>
    </div>
  )
}
