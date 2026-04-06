import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ScavoDettaglio from '@/components/scavo/ScavoDettaglio'

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
    .select('id, numero_us, tipo, descrizione, stato, completata, contesto_funerario_id')
    .eq('scavo_id', id)
    .order('numero_us', { ascending: true })

  const { data: tombeList } = await supabase
    .from('contesto_funerario')
    .select('id, numero_tomba, tipo_sepoltura, tipo_deposizione, datazione, stato_conservazione, completata')
    .eq('scavo_id', id)
    .order('numero_tomba', { ascending: true })

  // Ruolo dell'utente corrente su questo scavo
  const { data: accessoCorrente } = await supabase
    .from('accesso_scavo')
    .select('ruolo')
    .eq('scavo_id', id)
    .eq('account_id', user.id)
    .single()
  // Il responsabile dello scavo è sempre editor anche senza accesso_scavo
  const ruoloCorrente = accessoCorrente?.ruolo ?? (scavo.responsabile_id === user.id ? 'editor' : 'visualizzatore')

  return (
    <ScavoDettaglio
      scavo={scavo}
      id={id}
      ruoloCorrente={ruoloCorrente}
      usList={(usList ?? []).map(u => ({ ...u, stato: u.stato ?? 'aperta' }))}
      tombeList={tombeList ?? []}
    />
  )
}
