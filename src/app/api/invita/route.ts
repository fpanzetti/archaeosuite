import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { scavoId, email, ruolo } = await req.json()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  // Verifica che l'utente abbia accesso allo scavo
  const { data: accesso } = await supabase
    .from('accesso_scavo')
    .select('ruolo')
    .eq('scavo_id', scavoId)
    .eq('account_id', user.id)
    .single()

  if (!accesso) return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

  // Crea o aggiorna invito
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

  // URL di accettazione
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin
  const urlAccettazione = `${baseUrl}/invito/${invito.token}`

  return NextResponse.json({ ok: true, token: invito.token, url: urlAccettazione })
}
