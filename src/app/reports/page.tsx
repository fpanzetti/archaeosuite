import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ stato?: string; q?: string }>
}) {
  const { stato, q } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Carica progetti
  const { data: progetti } = await supabase
    .from('progetto')
    .select('*')
    .order('created_at', { ascending: false })

  // Carica scavi con contatore US
  let queryScavi = supabase
    .from('scavo')
    .select('*, us(count)')
    .order('created_at', { ascending: false })

  if (stato && stato !== 'tutti') queryScavi = queryScavi.eq('stato', stato)
  if (q) queryScavi = queryScavi.ilike('denominazione', `%${q}%`)

  const { data: tuttiScavi } = await queryScavi

  // Separa scavi con progetto da quelli standalone
  const scaviConProgetto = tuttiScavi?.filter(s => s.progetto_id) ?? []
  const scaviStandalone = tuttiScavi?.filter(s => !s.progetto_id) ?? []

  // Mappa scavi per progetto
  const scaviPerProgetto: Record<string, typeof scaviConProgetto> = {}
  scaviConProgetto.forEach(s => {
    if (!scaviPerProgetto[s.progetto_id]) scaviPerProgetto[s.progetto_id] = []
    scaviPerProgetto[s.progetto_id].push(s)
  })

  const statoInfo = (s: string) => {
    if (s === 'in_corso') return { label: 'In corso', bg: '#e8f0f8', color: '#1a4a7a' }
    if (s === 'in_elaborazione') return { label: 'In elaborazione', bg: '#fdf3e0', color: '#8a5c0a' }
    return { label: 'Archiviato', bg: '#f0efe9', color: '#8a8a84' }
  }

  const totaleScavi = tuttiScavi?.length ?? 0
  const inCorso = tuttiScavi?.filter(s => s.stato === 'in_corso').length ?? 0
  const inElab = tuttiScavi?.filter(s => s.stato === 'in_elaborazione').length ?? 0
  const archiviati = tuttiScavi?.filter(s => s.stato === 'archiviato').length ?? 0



  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '500' }}>ArchaeoReports</h1>
          <p style={{ fontSize: '12px', color: '#8a8a84', marginTop: '4px' }}>
            {progetti?.length ?? 0} progetti · {totaleScavi} scavi
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/reports/progetti/nuovo">
            <button style={{ padding: '8px 14px', background: '#f8f7f4', color: '#8a5c0a', border: '0.5px solid #8a5c0a40', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              📁 Nuovo progetto
            </button>
          </Link>
          <Link href="/reports/scavi/nuovo">
            <button style={{ padding: '8px 16px', background: '#1a4a7a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              + Nuovo scavo
            </button>
          </Link>
        </div>
      </div>

      {/* Filtri */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { key: 'tutti', label: `Tutti (${totaleScavi})` },
          { key: 'in_corso', label: `In corso (${inCorso})` },
          { key: 'in_elaborazione', label: `In elaborazione (${inElab})` },
          { key: 'archiviato', label: `Archiviati (${archiviati})` },
        ].map(f => {
          const attivo = (!stato && f.key === 'tutti') || stato === f.key
          return (
            <Link key={f.key} href={`/reports${f.key === 'tutti' ? '' : `?stato=${f.key}`}${q ? `${f.key === 'tutti' ? '?' : '&'}q=${q}` : ''}`}>
              <button style={{
                padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                background: attivo ? '#1a4a7a' : '#f8f7f4',
                color: attivo ? '#fff' : '#555550',
                border: attivo ? 'none' : '0.5px solid #c8c7be',
                fontWeight: attivo ? '500' : '400',
              }}>
                {f.label}
              </button>
            </Link>
          )
        })}
      </div>

      {/* Barra ricerca */}
      <form method="GET" action="/reports" style={{ marginBottom: '24px' }}>
        {stato && <input type="hidden" name="stato" value={stato} />}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input name="q" defaultValue={q} placeholder="Cerca scavi..."
            style={{ flex: 1, padding: '8px 12px', border: '0.5px solid #c8c7be', borderRadius: '6px', background: '#f8f7f4', color: '#1a1a1a', fontSize: '12px' }} />
          <button type="submit"
            style={{ padding: '8px 16px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
            Cerca
          </button>
          {q && (
            <Link href={`/reports${stato ? `?stato=${stato}` : ''}`}>
              <button type="button" style={{ padding: '8px 12px', background: '#f8f7f4', color: '#8a8a84', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
            </Link>
          )}
        </div>
      </form>

      {/* Sezione Progetti */}
      {progetti && progetti.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#8a8a84', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Progetti
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {progetti.map(progetto => {
              const scaviProgetto = scaviPerProgetto[progetto.id] ?? []
              const statoP = statoInfo(progetto.stato ?? 'in_corso')
              return (
                <div key={progetto.id} style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px', overflow: 'hidden' }}>
                  {/* Header progetto */}
                  <div style={{ padding: '14px 16px', borderBottom: scaviProgetto.length > 0 ? '0.5px solid #f0efe9' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px' }}>📁</span>
                          <Link href={`/reports/progetti/${progetto.id}`} style={{ textDecoration: 'none' }}>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>
                              {progetto.committente ?? 'Progetto senza nome'}
                            </span>
                          </Link>
                          <span style={{ fontSize: '11px', background: statoP.bg, color: statoP.color, padding: '1px 6px', borderRadius: '8px' }}>{statoP.label}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#8a8a84' }}>
                          {[progetto.tipologia_intervento, progetto.datazione_contesto].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', background: '#f0efe9', color: '#555550', padding: '2px 8px', borderRadius: '10px' }}>
                          {scaviProgetto.length} scavi
                        </span>
                        <Link href={`/reports/scavi/nuovo?progetto_id=${progetto.id}`}
                          style={{ fontSize: '11px', color: '#1a4a7a', textDecoration: 'none', padding: '2px 8px', border: '0.5px solid #1a4a7a40', borderRadius: '4px' }}>
                          + Scavo
                        </Link>
                      </div>
                    </div>
                  </div>
                  {/* Scavi del progetto */}
                  {scaviProgetto.length > 0 && (
                    <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '6px', background: '#fafaf8' }}>
                      {scaviProgetto.map(scavo => {
                        const info = statoInfo(scavo.stato ?? 'archiviato')
                        const numUS = (scavo.us as unknown as { count: number }[])?.[0]?.count ?? 0
                        return (
                          <Link key={scavo.id} href={`/reports/scavi/${scavo.id}`} style={{ textDecoration: 'none' }}>
                            <div style={{ padding: '10px 12px', background: '#f8f7f4', borderRadius: '6px', border: '0.5px solid #e0dfd8' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '3px' }}>{scavo.denominazione}</div>
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '11px', background: info.bg, color: info.color, padding: '1px 6px', borderRadius: '8px' }}>{info.label}</span>
                                    <span style={{ fontSize: '11px', background: '#f0efe9', color: '#555550', padding: '1px 6px', borderRadius: '8px' }}>{numUS} US</span>
                                  </div>
                                </div>
                                <div style={{ fontSize: '12px', color: '#c8c7be', marginLeft: '12px' }}>→</div>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                  {scaviProgetto.length === 0 && (
                    <div style={{ padding: '12px 16px', fontSize: '12px', color: '#c8c7be', background: '#fafaf8' }}>
                      Nessuno scavo ancora —{' '}
                      <Link href={`/reports/scavi/nuovo?progetto_id=${progetto.id}`} style={{ color: '#1a4a7a' }}>creane uno</Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sezione Scavi standalone */}
      <div>
        {progetti && progetti.length > 0 && (
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#8a8a84', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Scavi non assegnati a progetti
          </div>
        )}
        {scaviStandalone.length === 0 && (!progetti || progetti.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#8a8a84' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⛏️</div>
            <div style={{ fontSize: '14px', marginBottom: '6px' }}>
              {q ? `Nessun risultato per "${q}"` : 'Nessuno scavo ancora'}
            </div>
            {!q && (
              <div style={{ fontSize: '12px' }}>
                <Link href="/reports/scavi/nuovo" style={{ color: '#1a4a7a' }}>Crea il primo scavo →</Link>
                {' · '}
                <Link href="/reports/progetti/nuovo" style={{ color: '#8a5c0a' }}>o crea un progetto →</Link>
              </div>
            )}
          </div>
        ) : scaviStandalone.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#c8c7be', padding: '12px 0' }}>
            Tutti gli scavi sono assegnati a un progetto
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {scaviStandalone.map(scavo => {
              const info = statoInfo(scavo.stato ?? 'archiviato')
              const numUS = (scavo.us as unknown as { count: number }[])?.[0]?.count ?? 0
              return (
                <Link key={scavo.id} href={`/reports/scavi/${scavo.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '3px' }}>
                          {scavo.denominazione}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8a8a84', marginBottom: '8px' }}>
                          {[scavo.regione, scavo.datazione_contesto].filter(Boolean).join(' · ')}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', background: info.bg, color: info.color, padding: '2px 8px', borderRadius: '10px' }}>{info.label}</span>
                          <span style={{ fontSize: '11px', background: '#f0efe9', color: '#555550', padding: '2px 8px', borderRadius: '10px' }}>{numUS} US</span>
                          {scavo.tipologia_intervento && (
                            <span style={{ fontSize: '11px', background: '#f0efe9', color: '#555550', padding: '2px 8px', borderRadius: '10px' }}>{scavo.tipologia_intervento}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#c8c7be', marginLeft: '12px' }}>→</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
