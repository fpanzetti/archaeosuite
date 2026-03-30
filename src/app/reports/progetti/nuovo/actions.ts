'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function creaProgetto(form: Record<string, string>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autenticato' }

  const denominazione = [form.committente, form.tipologia_intervento].filter(Boolean).join(' — ') || 'Progetto senza nome'

  const { data, error } = await supabase.from('progetto').insert({
    denominazione,
    committente: form.committente || null,
    operatore: form.operatore || null,
    direttore_scientifico: form.direttore_scientifico || null,
    tipologia_intervento: form.tipologia_intervento || null,
    tipo_contesto: form.tipo_contesto || null,
    datazione_contesto: form.datazione_contesto || null,
    data_inizio: form.data_inizio || null,
    note: form.note || null,
    stato: 'in_corso',
    responsabile_id: user.id,
  }).select().single()

  if (error) return { error: error.message }
  redirect(`/reports/progetti/${data.id}`)
}
