import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const usId = formData.get('usId') as string
  const scavoId = formData.get('scavoId') as string
  const stato = formData.get('stato') as string

  const supabase = await createClient()

  // Verifica autenticazione
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  // L'UPDATE è protetto da RLS (richiede editor/collaboratore dello scavo)
  const { error } = await supabase.from('us').update({ stato }).eq('id', usId)
  if (error) return NextResponse.json({ error: error.message }, { status: 403 })

  return NextResponse.redirect(new URL(`/reports/scavi/${scavoId}`, req.url))
}
