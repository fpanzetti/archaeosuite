import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

  if (!accesso) return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

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

  const { data: invito, error } = await supabase
    .from('invito')
    .upsert({
      scavo_id: scavoId,
      email: email.toLowerCase().trim(),
      ruolo: ruolo ?? 'collaboratore',
      creato_da: user.id,
      stato: 'in_attesa',
    }, { onConflict: 'scavo_id,email' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin
  const urlAccettazione = `${baseUrl}/invito/${invito.token}`
  const nomeInvitante = invitante ? `${invitante.nome} ${invitante.cognome}` : 'Un collaboratore'

  // Invia email tramite Resend
  const { error: emailError } = await resend.emails.send({
    from: 'ArchaeoSuite <onboarding@resend.dev>',
    to: email,
    subject: `Invito a collaborare su ${scavo?.denominazione ?? 'uno scavo'}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="font-size: 20px; font-weight: 500; color: #1a1a1a; margin-bottom: 8px;">
          Sei stato invitato su ArchaeoSuite
        </h2>
        <p style="font-size: 14px; color: #555550; margin-bottom: 24px;">
          <strong>${nomeInvitante}</strong> ti ha invitato a collaborare come <strong>${ruolo}</strong>
          sullo scavo <strong>${scavo?.denominazione ?? scavo?.comune ?? 'N/D'}</strong>.
        </p>
        <a href="${urlAccettazione}"
          style="display: inline-block; padding: 12px 24px; background: #1a4a7a; color: #fff;
          text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;">
          Accetta invito
        </a>
        <p style="font-size: 12px; color: #8a8a84; margin-top: 24px;">
          Il link scade tra 7 giorni. Se non ti aspettavi questo invito puoi ignorare questa email.
        </p>
        <p style="font-size: 11px; color: #c8c7be; margin-top: 8px;">
          ${urlAccettazione}
        </p>
      </div>
    `,
  })

  if (emailError) {
    console.error('Errore invio email:', emailError)
    // Non blocchiamo — l'invito è comunque creato e il link è disponibile
  }

  return NextResponse.json({ ok: true, token: invito.token, url: urlAccettazione })
}
