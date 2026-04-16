'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RecuperaPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/confirm?next=/aggiorna-password`,
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px', padding: '24px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>Recupera password</h2>

      {sent ? (
        <>
          <p style={{ fontSize: '13px', color: '#3a6b4a', background: '#f0faf5', border: '0.5px solid #b2d8c6', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
            Email inviata — controlla la tua casella e clicca il link per impostare una nuova password.
          </p>
          <p style={{ fontSize: '12px', color: '#8a8a84', textAlign: 'center' }}>
            <Link href="/login" style={{ color: '#1a6b4a' }}>Torna al login</Link>
          </p>
        </>
      ) : (
        <>
          <p style={{ fontSize: '12px', color: '#8a8a84', marginBottom: '20px' }}>
            Inserisci l&apos;email del tuo account. Ti invieremo un link per reimpostare la password.
          </p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#8a8a84', marginBottom: '4px', fontWeight: '500' }}>Email</label>
              <input
                style={{ width: '100%', padding: '7px 10px', border: '0.5px solid #c8c7be', borderRadius: '6px', background: '#f8f7f4', fontSize: '12px' }}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            {error && <p style={{ fontSize: '12px', color: '#c00', marginBottom: '12px' }}>{error}</p>}
            <button
              style={{ width: '100%', padding: '10px', background: '#1a6b4a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Invio in corso...' : 'Invia link di recupero'}
            </button>
          </form>
          <p style={{ fontSize: '12px', color: '#8a8a84', textAlign: 'center', marginTop: '16px' }}>
            <Link href="/login" style={{ color: '#1a6b4a' }}>Torna al login</Link>
          </p>
        </>
      )}
    </div>
  )
}
