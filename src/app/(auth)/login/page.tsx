'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div style={{ background:'#fff', border:'0.5px solid #e0dfd8', borderRadius:'10px', padding:'24px' }}>
      <h2 style={{ fontSize:'16px', fontWeight:'500', marginBottom:'20px' }}>Accedi</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom:'12px' }}>
          <label style={{ display:'block', fontSize:'11px', color:'#8a8a84', marginBottom:'4px', fontWeight:'500' }}>Email</label>
          <input style={{ width:'100%', padding:'7px 10px', border:'0.5px solid #c8c7be', borderRadius:'6px', background:'#f8f7f4', fontSize:'12px' }} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div style={{ marginBottom:'20px' }}>
          <label style={{ display:'block', fontSize:'11px', color:'#8a8a84', marginBottom:'4px', fontWeight:'500' }}>Password</label>
          <input style={{ width:'100%', padding:'7px 10px', border:'0.5px solid #c8c7be', borderRadius:'6px', background:'#f8f7f4', fontSize:'12px' }} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <p style={{ fontSize:'12px', color:'#c00', marginBottom:'12px' }}>{error}</p>}
        <button style={{ width:'100%', padding:'10px', background:'#1a6b4a', color:'#fff', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:'pointer' }} type="submit" disabled={loading}>
          {loading ? 'Accesso in corso...' : 'Accedi'}
        </button>
      </form>
      <p style={{ fontSize:'12px', color:'#8a8a84', textAlign:'center', marginTop:'16px' }}>
        Non hai un account? <Link href="/register" style={{ color:'#1a6b4a' }}>Registrati</Link>
      </p>
    </div>
  )
}
