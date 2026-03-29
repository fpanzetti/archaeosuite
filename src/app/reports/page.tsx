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

  let query = supabase
    .from('scavo')
    .select('*, us(count)')
    .order('created_at', { ascending: false })

  if (stato && stato !== 'tutti') query = query.eq('stato', stato)
  if (q) query = query.ilike('denominazione', `%${q}%`)

  const { data: scavi } = await query

  // Carica accessi condivisi: altri utenti che hanno accesso agli stessi scavi dell'utente corrente
  const scaviIds = scavi?.map(s => s.id) ?? []
  const accessiMap: Record<string, { nome: string; cognome: string }[]> = {}

  if (scaviIds.length > 0) {
    // Carica tutti gli accessi per questi scavi (incluso l'utente corrente)
    const { data: tuttiAccessi } = await supabase
      .from('accesso_scavo')
      .select('scavo_id, account_id')
      .in('scavo_id', scaviIds)

    // Filtra solo gli altri utenti
    const altriAccessi = (tuttiAccessi ?? []).filter(a => a.account_id !== user.id)

    if (altriAccessi.length > 0) {
      const accountIds = [...new Set(altriAccessi.map(a => a.account_id))]
      const { data: accounts } = await supabase
        .from('account')
        .select('id, nome, cognome')
        .in('id', accountIds)

      altriAccessi.forEach(a => {
        const account = accounts?.find(ac => ac.id === a.account_id)
        if (!account) return
        if (!accessiMap[a.scavo_id]) accessiMap[a.scavo_id] = []
        // Evita duplicati
        const giaPresente = accessiMap[a.scavo_id].some(c => c.nome === account.nome && c.cognome === account.cognome)
        if (!giaPresente) accessiMap[a.scavo_id].push({ nome: account.nome, cognome: account.cognome })
      })
    }
  }

  const statoInfo = (s: string) => {
    if (s === 'in_corso') return { label: 'In corso', bg: '#e8f0f8', color: '#1a4a7a' }
    if (s === 'in_elaborazione') return { label: 'In elaborazione', bg: '#fdf3e0', color: '#8a5c0a' }
    return { label: 'Archiviato', bg: '#f0efe9', color: '#8a8a84' }
  }

  const totali = scavi?.length ?? 0
  const inCorso = scavi?.filter(s => s.stato === 'in_corso').length ?? 0
  const inElab = scavi?.filter(s => s.stato === 'in_elaborazione').length ?? 0
  const archiviati = scavi?.filter(s => s.stato === 'archiviato').length ?? 0

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '500' }}>Scavi</h1>
          <p style={{ fontSize: '12px', color: '#8a8a84', marginTop: '4px' }}>{totali} scavi totali</p>
        </div>
        <Link href="/reports/scavi/nuovo">
          <button style={{ padding: '8px 16px', background: '#1a4a7a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
            + Nuovo scavo
          </button>
        </Link>
      </div>

      {/* Filtri stato */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { key: 'tutti', label: `Tutti (${totali})` },
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

      {/* Barra di ricerca */}
      <form method="GET" action="/reports" style={{ marginBottom: '20px' }}>
        {stato && <input type="hidden" name="stato" value={stato} />}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            name="q"
            defaultValue={q}
            placeholder="Cerca per denominazione, comune, località..."
            style={{ flex: 1, padding: '8px 12px', border: '0.5px solid #c8c7be', borderRadius: '6px', background: '#f8f7f4', color: '#1a1a1a', fontSize: '12px' }}
          />
          <button type="submit"
            style={{ padding: '8px 16px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
            Cerca
          </button>
          {q && (
            <Link href={`/reports${stato ? `?stato=${stato}` : ''}`}>
              <button type="button"
                style={{ padding: '8px 12px', background: '#f8f7f4', color: '#8a8a84', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                ✕
              </button>
            </Link>
          )}
        </div>
      </form>

      {/* Lista scavi */}
      {!scavi || scavi.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#8a8a84' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⛏️</div>
          <div style={{ fontSize: '14px', marginBottom: '6px' }}>
            {q ? `Nessun risultato per "${q}"` : 'Nessuno scavo ancora'}
          </div>
          <div style={{ fontSize: '12px' }}>
            {!q && <Link href="/reports/scavi/nuovo" style={{ color: '#1a4a7a' }}>Crea il primo scavo →</Link>}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {scavi.map(scavo => {
            const info = statoInfo(scavo.stato ?? 'archiviato')
            const numUS = (scavo.us as unknown as { count: number }[])?.[0]?.count ?? 0
            const collaboratori = accessiMap[scavo.id] ?? []
            return (
              <Link key={scavo.id} href={`/reports/scavi/${scavo.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px',
                  padding: '14px 16px', cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '3px' }}>
                        {scavo.denominazione}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8a8a84', marginBottom: '8px' }}>
                        {[scavo.regione, scavo.datazione_contesto].filter(Boolean).join(' · ')}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', background: info.bg, color: info.color, padding: '2px 8px', borderRadius: '10px' }}>
                          {info.label}
                        </span>
                        <span style={{ fontSize: '11px', background: '#f0efe9', color: '#555550', padding: '2px 8px', borderRadius: '10px' }}>
                          {numUS} US
                        </span>
                        {scavo.tipologia_intervento && (
                          <span style={{ fontSize: '11px', background: '#f0efe9', color: '#555550', padding: '2px 8px', borderRadius: '10px' }}>
                            {scavo.tipologia_intervento}
                          </span>
                        )}
                        {collaboratori.map((c, i) => (
                          <span key={i} style={{ fontSize: '11px', background: '#e8f4ef', color: '#1a6b4a', padding: '2px 8px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            👤 {c.nome} {c.cognome}
                          </span>
                        ))}
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
  )
}
