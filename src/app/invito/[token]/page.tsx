'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'

export default function AccettaInvitoPage() {
  const params = useParams()
  const token = params.token as string
  const [invito, setInvito] = useState<{
    id: string; scavo_id: string; email: string; ruolo: string;
    stato: string; scavo?: { denominazione: string; comune: string; regione: string }
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [accettando, setAccettando] = useState(false)
  const [errore, setErrore] = useState('')
  const [successo, setSuccesso] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function caricaInvito() {
      const { data } = await supabase
        .from('invito')
        .select('*, scavo:scavo_id(denominazione, comune, regione)')
        .eq('token', token)
        .single()

      if (!data) { setErrore('Invito non valido o scaduto'); setLoading(false); return }
      if (data.stato === 'accettato') { setErrore('Questo invito è già stato accettato'); setLoading(false); return }
      if (new Date(data.expires_at) < new Date()) { setErrore('Questo invito è scaduto'); setLoading(false); return }

      setInvito(data)
      setLoading(false)
    }
    caricaInvito()
  }, [token])

  async function accetta() {
    if (!invito) return
    setAccettando(true)
    setErrore('')

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push(`/login?redirect=/invito/${token}`)
      return
    }

    if (user.email?.toLowerCase() !== invito.email.toLowerCase()) {
      setErrore(`Questo invito è destinato a ${invito.email}. Sei loggato come ${user.email}.`)
      setAccettando(false)
      return
    }

    // Aggiunge l'accesso allo scavo
    const { error: errAccesso } = await supabase
      .from('accesso_scavo')
      .upsert({
        account_id: user.id,
        scavo_id: invito.scavo_id,
        ruolo: invito.ruolo,
      })

    if (errAccesso) { setErrore(errAccesso.message); setAccettando(false); return }

    // Segna l'invito come accettato
    await supabase.from('invito').update({ stato: 'accettato' }).eq('token', token)

    setSuccesso(true)
    setTimeout(() => router.push(`/reports/scavi/${invito.scavo_id}`), 2000)
  }

  const card: React.CSSProperties = {
    maxWidth: '480px', margin: '80px auto', padding: '32px',
    background: '#fff', border: '0.5px solid #e0dfd8',
    borderRadius: '12px',
  }

  if (loading) return (
    <div style={card}>
      <p style={{ fontSize: '14px', color: '#8a8a84', textAlign: 'center' }}>Verifica invito...</p>
    </div>
  )

  if (errore && !invito) return (
    <div style={card}>
      <div style={{ fontSize: '24px', textAlign: 'center', marginBottom: '16px' }}>⚠️</div>
      <h1 style={{ fontSize: '18px', fontWeight: '500', textAlign: 'center', marginBottom: '8px' }}>Invito non valido</h1>
      <p style={{ fontSize: '13px', color: '#8a8a84', textAlign: 'center' }}>{errore}</p>
    </div>
  )

  if (successo) return (
    <div style={card}>
      <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '16px' }}>✅</div>
      <h1 style={{ fontSize: '18px', fontWeight: '500', textAlign: 'center', marginBottom: '8px' }}>Invito accettato</h1>
      <p style={{ fontSize: '13px', color: '#8a8a84', textAlign: 'center' }}>Reindirizzamento allo scavo...</p>
    </div>
  )

  const scavo = invito?.scavo as { denominazione: string; comune: string; regione: string } | undefined

  return (
    <div style={card}>
      <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '20px' }}>📬</div>
      <h1 style={{ fontSize: '20px', fontWeight: '500', textAlign: 'center', marginBottom: '6px' }}>
        Sei stato invitato
      </h1>
      <p style={{ fontSize: '13px', color: '#8a8a84', textAlign: 'center', marginBottom: '24px' }}>
        come <strong>{invito?.ruolo}</strong>
      </p>

      <div style={{ background: '#f8f7f4', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '4px' }}>
          {scavo?.denominazione}
        </div>
        <div style={{ fontSize: '12px', color: '#8a8a84' }}>
          {[scavo?.comune, scavo?.regione].filter(Boolean).join(' · ')}
        </div>
      </div>

      {errore && (
        <p style={{ fontSize: '12px', color: '#c00', marginBottom: '16px', textAlign: 'center' }}>{errore}</p>
      )}

      <button onClick={accetta} disabled={accettando}
        style={{ width: '100%', padding: '12px', background: '#1a4a7a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
        {accettando ? 'Accettazione...' : 'Accetta invito'}
      </button>

      <p style={{ fontSize: '11px', color: '#8a8a84', textAlign: 'center', marginTop: '12px' }}>
        Invito destinato a <strong>{invito?.email}</strong>
      </p>
    </div>
  )
}
