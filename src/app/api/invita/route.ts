import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendInviteEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { scavoId, email, ruolo } = await req.json()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { data: accesso } = await supabase
    .from('accesso_scavo')
    .select('ruolo')
    .eq('scavo_id', scavoId)
    .eq('account_id', user.id)
    .single()

  if (!accesso || accesso.ruolo !== 'editor') {
    return NextResponse.json({ error: 'Solo gli editor possono invitare collaboratori' }, { status: 403 })
  }

  const { data: scavo } = await supabase
    .from('scavo')
    .select('denominazione, comune')
    .eq('id', scavoId)
    .single()

  const { data: invitante } = await supabase
    .from('account')
    .select('nome, cognome')
    .eq('id', user.id)
    .single()

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: invito, error } = await supabase
    .from('invito')
    .upsert({
      scavo_id: scavoId,
      email: email.toLowerCase().trim(),
      ruolo: ruolo ?? 'collaboratore',
      creato_da: user.id,
      usato: false,
      expires_at: expiresAt,
    }, { onConflict: 'scavo_id,email' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin
  const nomeInvitante = invitante ? `${invitante.nome} ${invitante.cognome}` : 'Un collaboratore'
  const scavoNome = scavo?.denominazione ?? scavo?.comune ?? 'uno scavo'

  await sendInviteEmail({
    to: email,
    scavoNome,
    ruolo,
    token: invito.token,
    nomeInvitante,
    baseUrl,
  })

  const url = `${baseUrl}/invito/${invito.token}`
  return NextResponse.json({ ok: true, token: invito.token, url })
}

export async function DELETE(req: NextRequest) {
  const { invito_id } = await req.json()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  // Verifica che l'utente sia editor dello scavo associato all'invito
  const { data: invito } = await supabase
    .from('invito')
    .select('scavo_id')
    .eq('id', invito_id)
    .single()

  if (!invito) return NextResponse.json({ error: 'Invito non trovato' }, { status: 404 })

  const { data: accesso } = await supabase
    .from('accesso_scavo')
    .select('ruolo')
    .eq('scavo_id', invito.scavo_id)
    .eq('account_id', user.id)
    .single()

  if (!accesso || accesso.ruolo !== 'editor') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }

  await supabase.from('invito').delete().eq('id', invito_id)
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const { invito_id } = await req.json()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { data: invito } = await supabase
    .from('invito')
    .select('scavo_id, email, ruolo, token')
    .eq('id', invito_id)
    .single()

  if (!invito) return NextResponse.json({ error: 'Invito non trovato' }, { status: 404 })

  const { data: accesso } = await supabase
    .from('accesso_scavo')
    .select('ruolo')
    .eq('scavo_id', invito.scavo_id)
    .eq('account_id', user.id)
    .single()

  if (!accesso || accesso.ruolo !== 'editor') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase
    .from('invito')
    .update({ expires_at: expiresAt, usato: false })
    .eq('id', invito_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: scavo } = await supabase.from('scavo').select('denominazione, comune').eq('id', invito.scavo_id).single()
  const { data: invitante } = await supabase.from('account').select('nome, cognome').eq('id', user.id).single()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin

  await sendInviteEmail({
    to: invito.email,
    scavoNome: scavo?.denominazione ?? scavo?.comune ?? 'uno scavo',
    ruolo: invito.ruolo,
    token: invito.token,
    nomeInvitante: invitante ? `${invitante.nome} ${invitante.cognome}` : 'Un collaboratore',
    baseUrl,
  })

  return NextResponse.json({ ok: true })
}
