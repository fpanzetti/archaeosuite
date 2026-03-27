import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import PannelloInviti from '@/components/scavo/PannelloInviti'

export default async function ScavoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: scavo } = await supabase
    .from('scavo')
    .select('*')
    .eq('id', id)
    .single()

  if (!scavo) notFound()

  const { data: usList } = await supabase
    .from('us')
    .select('id, numero_us, tipo, descrizione, stato, completata')
    .eq('scavo_id', id)
    .order('numero_us', { ascending: true })

  const nome = [scavo.comune, scavo.provincia ? `(${scavo.provincia})` : '', scavo.localita]
    .filter(Boolean).join(' ')

  const statoColore = scavo.stato === 'in_corso' ? '#1a4a7a' : scavo.stato === 'in_elaborazione' ? '#8a5c0a' : '#8a8a84'
  const statoBg = scavo.stato === 'in_corso' ? '#e8f0f8' : scavo.stato === 'in_elaborazione' ? '#fdf3e0' : '#f0efe9'
  const statoLabel = scavo.stato === 'in_corso' ? 'In corso' : scavo.stato === 'in_elaborazione' ? 'In elaborazione' : 'Archiviato'

  function calcolaCompletamento(us: Record<string, unknown>): number {
    if (us.completata) return 100
    const campi = [
      'tipo', 'descrizione', 'descrizione_estesa',
      'colore', 'consistenza', 'umidita',
      'quota_min', 'quota_max', 'osservazioni',
      'interpretazione', 'cronologia_iniziale', 'tipo_formazione',
    ]
    const valorizzati = campi.filter(c => {
      const v = us[c]
      if (v === null || v === undefined || v === '') return false
      if (Array.isArray(v)) return v.length > 0
      return true
    }).length
    return Math.round((valorizzati / campi.length) * 100)
  }

  function coloreCompletamento(perc: number, completata: boolean): string {
    if (completata) return '#1a4a7a'
    const hue = Math.round(perc * 1.2) // 0→0 (rosso), 50→60 (giallo), 100→120 (verde)
    return `hsl(${hue}, 75%, 38%)`
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '11px', color: '#8a8a84', marginBottom: '16px' }}>
        <Link href="/reports" style={{ color: '#1a4a7a', textDecoration: 'none' }}>Scavi</Link>
        {' / '}{nome}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: '#1a1a1a' }}>{nome}</h1>
          {scavo.datazione_contesto && (
            <p style={{ fontSize: '13px', color: '#555550', marginTop: '4px' }}>{scavo.datazione_contesto}</p>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', background: statoBg, color: statoColore, padding: '2px 8px', borderRadius: '10px', fontWeight: '500' }}>
              {statoLabel}
            </span>
            {scavo.tipo_contesto && (
              <span style={{ fontSize: '11px', background: '#f0efe9', color: '#555550', padding: '2px 8px', borderRadius: '10px' }}>
                {scavo.tipo_contesto}
              </span>
            )}
            {scavo.tipologia_intervento && (
              <span style={{ fontSize: '11px', background: '#f0efe9', color: '#555550', padding: '2px 8px', borderRadius: '10px' }}>
                {scavo.tipologia_intervento}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href={`/reports/scavi/${id}/modifica`}>
            <button style={{ padding: '7px 14px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
              Modifica
            </button>
          </Link>
          <Link href={`/reports/scavi/${id}/us/nuova`}>
            <button style={{ padding: '7px 14px', background: '#1a4a7a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              + Nuova US
            </button>
          </Link>
        </div>
      </div>

      {/* Griglia info + US */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Dati scavo */}
        <div>
          <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '500', color: '#1a4a7a', marginBottom: '12px', paddingBottom: '8px', borderBottom: '0.5px solid #e8f0f8' }}>
              Localizzazione
            </div>
            <div style={{ fontSize: '12px', lineHeight: '2', color: '#555550' }}>
              {scavo.nazione && scavo.nazione !== 'Italia' && <div><span style={{ color: '#8a8a84' }}>Nazione: </span>{scavo.nazione}</div>}
              {scavo.regione && <div><span style={{ color: '#8a8a84' }}>Regione: </span>{scavo.regione}</div>}
              {scavo.provincia && <div><span style={{ color: '#8a8a84' }}>Provincia: </span>{scavo.provincia}</div>}
              {scavo.localita && <div><span style={{ color: '#8a8a84' }}>Località: </span>{scavo.localita}</div>}
              {scavo.indirizzo && <div><span style={{ color: '#8a8a84' }}>Indirizzo: </span>{scavo.indirizzo}</div>}
              {scavo.soprintendenza && <div><span style={{ color: '#8a8a84' }}>Ufficio MiC competente per tutela: </span>{scavo.soprintendenza}</div>}
              {scavo.committente && <div><span style={{ color: '#8a8a84' }}>Ente responsabile: </span>{scavo.committente}</div>}
              {scavo.operatore && <div><span style={{ color: '#8a8a84' }}>Operatore: </span>{scavo.operatore}</div>}
              {scavo.direttore_scientifico && <div><span style={{ color: '#8a8a84' }}>Direttore: </span>{scavo.direttore_scientifico}</div>}
              {scavo.tipologia_intervento && <div><span style={{ color: '#8a8a84' }}>Tipologia: </span>{scavo.tipologia_intervento}</div>}
              {scavo.tipo_contesto && <div><span style={{ color: '#8a8a84' }}>Contesto: </span>{scavo.tipo_contesto}</div>}
              {scavo.data_inizio && <div><span style={{ color: '#8a8a84' }}>Inizio: </span>{new Date(scavo.data_inizio).toLocaleDateString('it-IT')}</div>}
              {scavo.riferimento_cartografico && <div><span style={{ color: '#8a8a84' }}>Cartografia: </span>{scavo.riferimento_cartografico}</div>}
              {scavo.foglio_catastale && <div><span style={{ color: '#8a8a84' }}>Foglio: </span>{scavo.foglio_catastale}{scavo.particella ? ` / Part. ${scavo.particella}` : ''}{scavo.subparticella ? ` / Sub. ${scavo.subparticella}` : ''}</div>}
              {scavo.lat && scavo.lon && <div><span style={{ color: '#8a8a84' }}>Coordinate: </span>{scavo.lat}, {scavo.lon}</div>}
              {scavo.note && <div style={{ marginTop: '6px', padding: '6px 8px', background: '#f8f7f4', borderRadius: '4px', lineHeight: '1.5' }}><span style={{ color: '#8a8a84' }}>Note: </span>{scavo.note}</div>}
            </div>
          </div>
          <PannelloInviti scavoId={id} scavoDenominazione={nome} />

        </div>

        {/* Lista US */}
        <div>
          <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '0.5px solid #e8f0f8' }}>
              <div style={{ fontSize: '11px', fontWeight: '500', color: '#1a4a7a' }}>
                Unità stratigrafiche ({usList?.length ?? 0})
              </div>
              <Link href={`/reports/scavi/${id}/us/nuova`} style={{ fontSize: '11px', color: '#1a4a7a', textDecoration: 'none' }}>
                + Aggiungi
              </Link>
            </div>
            {!usList || usList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#8a8a84', fontSize: '12px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>⛏️</div>
                Nessuna US ancora
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {usList.map(us => (
                  <div key={us.id} style={{ padding: '8px 10px', background: '#f8f7f4', borderRadius: '6px', border: '0.5px solid #e0dfd8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Link href={`/reports/scavi/${id}/us/${us.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>US {us.numero_us}</span>
                          <span style={{ fontSize: '11px', background: '#e8f0f8', color: '#1a4a7a', padding: '1px 6px', borderRadius: '8px' }}>
                            {us.tipo ?? '—'}
                          </span>
                          {us.completata && (
                            <span style={{ fontSize: '11px', background: '#e8f4ef', color: '#1a6b4a', padding: '1px 6px', borderRadius: '8px', fontWeight: '500' }}>
                              ✓ Completata
                            </span>
                          )}
                        </div>
                        {(() => {
                          const perc = calcolaCompletamento(us as Record<string, unknown>)
                          const colore = coloreCompletamento(perc, !!us.completata)
                          return us.completata ? (
                            <div style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'4px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'4px', padding:'2px 8px', background:'#e8f0f8', border:'1px solid #185FA5', borderRadius:'8px' }}>
                                <span style={{ fontSize:'11px' }}>✓</span>
                                <span style={{ fontSize:'10px', fontWeight:'500', color:'#185FA5' }}>Completata</span>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'4px' }}>
                              <div style={{ width:'60px', height:'4px', background:'#e0dfd8', borderRadius:'2px', overflow:'hidden' }}>
                                <div style={{ width:`${perc}%`, height:'100%', background: colore, borderRadius:'2px', transition:'width 0.3s' }} />
                              </div>
                              <span style={{ fontSize:'10px', color: colore, fontWeight:'500', minWidth:'24px' }}>{perc}%</span>
                            </div>
                          )
                        })()}
                        {us.descrizione && (
                          <div style={{ fontSize: '11px', color: '#8a8a84', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {us.descrizione}
                          </div>
                        )}
                      </Link>
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '8px', flexShrink: 0,
                        background: us.stato === 'classificata' ? '#e8f4ef' : us.stato === 'in_lavorazione' ? '#fdf3e0' : '#f0efe9',
                        color: us.stato === 'classificata' ? '#1a6b4a' : us.stato === 'in_lavorazione' ? '#8a5c0a' : '#8a8a84',
                      }}>
                        {us.stato === 'classificata' ? 'Classif.' : us.stato === 'in_lavorazione' ? 'In lav.' : 'Aperta'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
