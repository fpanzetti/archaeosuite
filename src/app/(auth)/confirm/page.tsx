import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>
}) {
  const params = await searchParams
  if (params.code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(params.code)
  }
  redirect(params.next ?? '/dashboard')
}
