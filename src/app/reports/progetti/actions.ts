'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function eliminaProgetto(progettoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Scollega gli scavi dal progetto (diventano standalone).
  // Usa il filtro su responsabile_id per rispettare la policy RLS di scavo (UPDATE richiede editor).
  // Se l'utente è responsabile_id dello scavo, ha accesso implicito via ha_accesso_scavo.
  await supabase
    .from('scavo')
    .update({ progetto_id: null })
    .eq('progetto_id', progettoId)
    .eq('responsabile_id', user.id)

  // Elimina il progetto
  const { error } = await supabase
    .from('progetto')
    .delete()
    .eq('id', progettoId)
    .eq('responsabile_id', user.id) // solo il proprietario può eliminare

  if (error) return { error: error.message }
  redirect('/reports')
}
