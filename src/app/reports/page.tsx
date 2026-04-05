import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DragDropScaviList from '@/components/scavo/DragDropScaviList'

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

  // Carica collaboratori per tutti gli scavi
  const scaviIds = tuttiScavi?.map(s => s.id) ?? []
  const { data: accessi } = scaviIds.length > 0
    ? await supabase
        .from('accesso_scavo')
        .select('scavo_id, account(id, nome, cognome)')
        .in('scavo_id', scaviIds)
        .neq('account_id', user.id)
    : { data: [] }

  // Mappa scavoId → collaboratori
  type Collaboratore = { id: string; nome: string | null; cognome: string | null }
  const collaboratoriPerScavo: Record<string, Collaboratore[]> = {}
  accessi?.forEach((a: { scavo_id: string; account: Collaboratore | Collaboratore[] }) => {
    const acc = Array.isArray(a.account) ? a.account[0] : a.account
    if (!acc) return
    if (!collaboratoriPerScavo[a.scavo_id]) collaboratoriPerScavo[a.scavo_id] = []
    collaboratoriPerScavo[a.scavo_id].push(acc)
  })

  // Separa scavi con progetto da quelli standalone
  const scaviConProgetto = tuttiScavi?.filter(s => s.progetto_id) ?? []
  const scaviStandalone = tuttiScavi?.filter(s => !s.progetto_id) ?? []

  // Mappa scavi per progetto
  const scaviPerProgetto: Record<string, typeof scaviConProgetto> = {}
  scaviConProgetto.forEach(s => {
    if (!scaviPerProgetto[s.progetto_id]) scaviPerProgetto[s.progetto_id] = []
    scaviPerProgetto[s.progetto_id].push(s)
  })

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

      {/* Sezione Progetti + Scavi standalone — gestite da componente Client con drag & drop */}
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
      ) : (
        <DragDropScaviList
          progetti={(progetti ?? []).map(p => ({
            id: p.id,
            committente: p.committente ?? null,
            stato: p.stato ?? null,
            tipologia_intervento: p.tipologia_intervento ?? null,
            datazione_contesto: p.datazione_contesto ?? null,
          }))}
          scaviPerProgetto={Object.fromEntries(
            Object.entries(scaviPerProgetto).map(([pid, scavi]) => [
              pid,
              scavi.map(s => ({
                id: s.id,
                denominazione: s.denominazione ?? '',
                stato: s.stato ?? null,
                tipologia_intervento: s.tipologia_intervento ?? null,
                us: (s.us as unknown as { count: number }[]) ?? [],
              })),
            ])
          )}
          scaviStandalone={scaviStandalone.map(s => ({
            id: s.id,
            denominazione: s.denominazione ?? '',
            stato: s.stato ?? null,
            tipologia_intervento: s.tipologia_intervento ?? null,
            us: (s.us as unknown as { count: number }[]) ?? [],
          }))}
          collaboratoriPerScavo={collaboratoriPerScavo}
        />
      )}
    </div>
  )
}
