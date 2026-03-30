'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function creaScavo(formData: {
  nazione: string; regione: string; soprintendenza: string;
  provincia: string; comune: string; localita: string; indirizzo: string;
  lat: string; lon: string; riferimento_cartografico: string;
  foglio_catastale: string; particella: string; subparticella: string;
  committente: string; direttore_scientifico: string; operatore: string;
  tipologia_intervento: string; tipo_contesto: string;
  datazione_contesto: string; data_inizio: string; note: string;
  progetto_id?: string;
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const denominazione = [
    formData.comune,
    formData.provincia ? `(${formData.provincia})` : '',
    formData.localita
  ].filter(Boolean).join(' ')

  const { data: scavo, error: errScavo } = await supabase
    .from('scavo')
    .insert({
      denominazione,
      nazione: formData.nazione || 'Italia',
      regione: formData.regione || null,
      soprintendenza: formData.soprintendenza || null,
      provincia: formData.provincia || null,
      comune: formData.comune,
      localita: formData.localita || null,
      indirizzo: formData.indirizzo || null,
      lat: formData.lat ? parseFloat(formData.lat) : null,
      lon: formData.lon ? parseFloat(formData.lon) : null,
      riferimento_cartografico: formData.riferimento_cartografico || null,
      foglio_catastale: formData.foglio_catastale || null,
      particella: formData.particella || null,
      subparticella: formData.subparticella || null,
      committente: formData.committente || null,
      direttore_scientifico: formData.direttore_scientifico || null,
      operatore: formData.operatore || null,
      tipologia_intervento: formData.tipologia_intervento || null,
      tipo_contesto: formData.tipo_contesto || null,
      datazione_contesto: formData.datazione_contesto || null,
      data_inizio: formData.data_inizio || null,
      note: formData.note || null,
      progetto_id: formData.progetto_id || null,
      responsabile_id: user.id,
    })
    .select()
    .single()

  if (errScavo) return { error: errScavo.message }

  await supabase.from('accesso_scavo').insert({
    account_id: user.id,
    scavo_id: scavo.id,
    ruolo: 'editor',
  })

  redirect(formData.progetto_id ? `/reports/progetti/${formData.progetto_id}` : '/reports')
}
