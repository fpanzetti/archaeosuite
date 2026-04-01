import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendInviteEmail({
  to, scavoNome, ruolo, token, nomeInvitante, baseUrl,
}: {
  to: string
  scavoNome: string
  ruolo: string
  token: string
  nomeInvitante: string
  baseUrl: string
}) {
  if (!resend) {
    console.log('[email] RESEND_API_KEY non impostata — invio saltato. Link:', `${baseUrl}/invito/${token}`)
    return { ok: true, skipped: true }
  }

  const url = `${baseUrl}/invito/${token}`
  const { error } = await resend.emails.send({
    from: 'ArchaeoSuite <noreply@archaeosuite.app>',
    to,
    subject: `Invito a collaborare su ${scavoNome}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="font-size: 20px; font-weight: 500; color: #1a1a1a; margin-bottom: 8px;">
          Sei stato invitato su ArchaeoSuite
        </h2>
        <p style="font-size: 14px; color: #555550; margin-bottom: 24px;">
          <strong>${nomeInvitante}</strong> ti ha invitato a collaborare come
          <strong>${ruolo}</strong> sullo scavo <strong>${scavoNome}</strong>.
        </p>
        <a href="${url}"
          style="display: inline-block; padding: 12px 24px; background: #1a4a7a; color: #fff;
          text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;">
          Accetta invito
        </a>
        <p style="font-size: 12px; color: #8a8a84; margin-top: 24px;">
          Il link scade tra 7 giorni. Se non ti aspettavi questo invito puoi ignorare questa email.
        </p>
        <p style="font-size: 11px; color: #c8c7be; margin-top: 8px;">${url}</p>
      </div>
    `,
  })

  if (error) {
    console.error('[email] Errore invio:', error)
    return { ok: false, error }
  }
  return { ok: true }
}
