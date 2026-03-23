'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const [form, setForm] = useState({ nome: '', cognome: '', email: '', cellulare: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { nome: form.nome, cognome: form.cognome, cellulare: form.cellulare } }
    })
    if (error) { setError(error.message); setLoading(false) }
    else setSuccess(true)
  }

  if (success) return (
    <div style={{ background:'#fff', border:'0.5px solid #e0dfd8', borderRadius:'10px', padding:'24px', textAlign:'center' }}>
      <div style={{ fontSize:'32px', marginBottom:'12px' }}>✓</div>
      <h2 style={{ fontSize:'16px', fontWeight:'500', marginBottom:'8px' }}>Controlla la tua email</h2>
      <p style={{ fontSize:'12px', color:'#8a8a84' }}>
        Abbiamo inviato un link di conferma a <strong>{form.email}</strong>.<br/>
        Clicca il link per attivare il tuo account.
      </p>
    </div>
  )

  return (
    <div style={{ background:'#fff', border:'0.5px solid #e0dfd8', borderRadius:'10px', padding:'24px' }}>
      <h2 style={{ fontSize:'16px', fontWeight:'500', marginBottom:'20px' }}>Crea account</h2>
      <form onSubmit={handleRegister}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
          <div>
            <label style={{ display:'block', fontSize:'11px', color:'#8a8a84', marginBottom:'4px', fontWeight:'500' }}>Nome *</label>
            <input style={{ width:'100%', padding:'7px 10px', border:'0.5px solid #c8c7be', borderRadius:'6px', background:'#f8f7f4', fontSize:'12px' }} value={form.nome} onChange={e => set('nome', e.target.value)} required />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'11px', color:'#8a8a84', marginBottom:'4px', fontWeight:'500' }}>Cognome *</label>
            <input style={{ width:'100%', padding:'7px 10px', border:'0.5px solid #c8c7be', borderRadius:'6px', background:'#f8f7f4', fontSize:'12px' }} value={form.cognome} onChange={e => set('cognome', e.target.value)} required />
          </div>
        </div>
        <div style={{ marginBottom:'12px' }}>
          <label style={{ display:'block', fontSize:'11px', color:'#8a8a84', marginBottom:'4px', fontWeight:'500' }}>Email *</label>
          <input style={{ width:'100%', padding:'7px 10px', border:'0.5px solid #c8c7be', borderRadius:'6px', background:'#f8f7f4', fontSize:'12px' }} type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
        </div>
        <div style={{ marginBottom:'12px' }}>
          <label style={{ display:'block', fontSize:'11px', color:'#8a8a84', marginBottom:'4px', fontWeight:'500' }}>Cellulare *</label>
          <input style={{ width:'100%', padding:'7px 10px', border:'0.5px solid #c8c7be', borderRadius:'6px', background:'#f8f7f4', fontSize:'12px' }} type="tel" placeholder="+39 333 1234567" value={form.cellulare} onChange={e => set('cellulare', e.target.value)} required />
        </div>
        <div style={{ marginBottom:'20px' }}>
          <label style={{ display:'block', fontSize:'11px', color:'#8a8a84', marginBottom:'4px', fontWeight:'500' }}>Password *</label>
          <input style={{ width:'100%', padding:'7px 10px', border:'0.5px solid #c8c7be', borderRadius:'6px', background:'#f8f7f4', fontSize:'12px' }} type="password" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
          <p style={{ fontSize:'11px', color:'#8a8a84', marginTop:'4px' }}>Minimo 8 caratteri</p>
        </div>
        {error && <p style={{ fontSize:'12px', color:'#c00', marginBottom:'12px' }}>{error}</p>}
        <button style={{ width:'100%', padding:'10px', background:'#1a6b4a', color:'#fff', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:'pointer' }} type="submit" disabled={loading}>
          {loading ? 'Creazione account...' : 'Crea account'}
        </button>
      </form>
      <p style={{ fontSize:'12px', color:'#8a8a84', textAlign:'center', marginTop:'16px' }}>
        Hai già un account? <Link href="/login" style={{ color:'#1a6b4a' }}>Accedi</Link>
      </p>
    </div>
  )
}
