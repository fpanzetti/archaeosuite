'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function creaTomba(scavoId: string, form: Record<string, string>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase.from('contesto_funerario').insert({
    scavo_id: scavoId,
    numero_tomba: parseInt(form.numero_tomba) || null,
    emergenza_n: form.emergenza_n ? parseInt(form.emergenza_n) : null,
    vertici: form.vertici || null,
    settore: form.settore || null,
    data_inizio_scavo: form.data_inizio_scavo || null,
    data_recupero: form.data_recupero || null,
    tipologia_elementi_strutturali: form.tipologia_elementi_strutturali || null,
    archeologo: form.archeologo || null,
    antropologo: form.antropologo || null,
  }).select().single()

  if (error) return { error: error.message }
  redirect(`/reports/scavi/${scavoId}/tombe/${data.id}`)
}

export async function getProssimoNumeroTomba(scavoId: string): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('contesto_funerario')
    .select('numero_tomba')
    .eq('scavo_id', scavoId)
    .order('numero_tomba', { ascending: false })
    .limit(1)
  return (data?.[0]?.numero_tomba ?? 0) + 1
}
