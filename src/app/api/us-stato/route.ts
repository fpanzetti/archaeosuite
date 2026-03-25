import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const usId = formData.get('usId') as string
  const scavoId = formData.get('scavoId') as string
  const stato = formData.get('stato') as string

  const supabase = await createClient()
  await supabase.from('us').update({ stato }).eq('id', usId)

  return NextResponse.redirect(new URL(`/reports/scavi/${scavoId}`, req.url))
}
