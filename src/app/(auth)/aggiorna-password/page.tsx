'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AggiornaPasswordPage() {
  const [password, setPassword] = useState('')
  const [conferma, setConferma] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La password deve contenere almeno 8 caratteri.')
      return
    }
    if (password !== conferma) {
      setError('Le password non coincidono.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  return (
    <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px', padding: '24px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>Nuova password</h2>

      {done ? (
        <p style={{ fontSize: '13px', color: '#3a6b4a', background: '#f0faf5', border: '0.5px solid #b2d8c6', borderRadius: '6px', padding: '12px' }}>
          Password aggiornata con successo. Reindirizzamento in corso…
        </p>
      ) : (
        <>
          <p style={{ fontSize: '12px', color: '#8a8a84', marginBottom: '20px' }}>
            Scegli una nuova password per il tuo account.
          </p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#8a8a84', marginBottom: '4px', fontWeight: '500' }}>Nuova password</label>
              <input
                style={{ width: '100%', padding: '7px 10px', border: '0.5px solid #c8c7be', borderRadius: '6px', background: '#f8f7f4', fontSize: '12px' }}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#8a8a84', marginBottom: '4px', fontWeight: '500' }}>Conferma password</label>
              <input
                style={{ width: '100%', padding: '7px 10px', border: '0.5px solid #c8c7be', borderRadius: '6px', background: '#f8f7f4', fontSize: '12px' }}
                type="password"
                value={conferma}
                onChange={e => setConferma(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            {error && <p style={{ fontSize: '12px', color: '#c00', marginBottom: '12px' }}>{error}</p>}
            <button
              style={{ width: '100%', padding: '10px', background: '#1a6b4a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Salvataggio...' : 'Aggiorna password'}
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
