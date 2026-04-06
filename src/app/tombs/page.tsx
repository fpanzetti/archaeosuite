import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TombsClient from '@/components/tombs/TombsClient'

export default async function TombsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <TombsClient />
}
