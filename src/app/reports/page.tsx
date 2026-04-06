import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportsClient from '@/components/reports/ReportsClient'

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
    <ReportsClient
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
      totaleScavi={totaleScavi}
      inCorso={inCorso}
      inElab={inElab}
      archiviati={archiviati}
      stato={stato}
      q={q}
    />
  )
}
