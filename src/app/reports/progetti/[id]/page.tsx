import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ProgettoDettaglio from '@/components/reports/ProgettoDettaglio'

export default async function ProgettoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: progetto } = await supabase
    .from('progetto')
    .select('*')
    .eq('id', id)
    .single()

  if (!progetto) notFound()

  const { data: scavi } = await supabase
    .from('scavo')
    .select('*, us(count)')
    .eq('progetto_id', id)
    .order('created_at', { ascending: false })

  return (
    <ProgettoDettaglio
      progetto={{
        id: progetto.id,
        committente: progetto.committente ?? null,
        stato: progetto.stato ?? null,
        datazione_contesto: progetto.datazione_contesto ?? null,
        tipologia_intervento: progetto.tipologia_intervento ?? null,
        tipo_contesto: progetto.tipo_contesto ?? null,
        operatore: progetto.operatore ?? null,
        direttore_scientifico: progetto.direttore_scientifico ?? null,
        data_inizio: progetto.data_inizio ?? null,
        note: progetto.note ?? null,
      }}
      scavi={(scavi ?? []).map(s => ({
        id: s.id,
        denominazione: s.denominazione ?? null,
        stato: s.stato ?? null,
        us: (s.us as unknown as { count: number }[]) ?? [],
      }))}
    />
  )
}
