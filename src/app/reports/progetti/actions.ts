'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function eliminaProgetto(progettoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Scollega gli scavi dal progetto (diventano standalone)
  await supabase
    .from('scavo')
    .update({ progetto_id: null })
    .eq('progetto_id', progettoId)

  // Elimina il progetto
  const { error } = await supabase
    .from('progetto')
    .delete()
    .eq('id', progettoId)
    .eq('responsabile_id', user.id) // solo il proprietario può eliminare

  if (error) return { error: error.message }
  redirect('/reports')
}
