'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Accesso = {
  scavo_id: string
  ruolo: string
  scavo: {
    denominazione: string
    comune: string
    provincia: string | null
    stato: string
  }
}

const PROFESSIONI = [
  'Archeologo','Antropologo fisico','Numismatico','Paleobotanico',
  'Zooarcheologo','Restauratore','Topografo','Specialista','Admin',
]

export default function ProfiloPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [resettingPwd, setResettingPwd] = useState(false)
  const [pwdMsg, setPwdMsg] = useState('')
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [createdAt, setCreatedAt] = useState('')
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [professione, setProfessione] = useState('')
  const [accessi, setAccessi] = useState<Accesso[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      setEmail(user.email ?? '')
      setCreatedAt(user.created_at ?? '')
      const { data: account } = await supabase.from('account').select('nome, cognome, professione').eq('id', user.id).single()
      if (account) { setNome(account.nome ?? ''); setCognome(account.cognome ?? ''); setProfessione(account.professione ?? '') }
      const { data: accessiData } = await supabase.from('accesso_scavo').select('scavo_id, ruolo, scavo:scavo(denominazione, comune, provincia, stato)').eq('account_id', user.id)
      if (accessiData) setAccessi((accessiData as unknown[]).map((a) => { const r = a as { scavo_id: string; ruolo: string; scavo: { denominazione: string; comune: string; provincia: string | null; stato: string }[] }; return { ...r, scavo: r.scavo[0] } }))
      setLoading(false)
    }
    load()
  }, [])

  async function salva() {
    setSaving(true)
    await supabase.from('account').update({ nome, cognome, professione }).eq('id', userId)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function resetPassword() {
    setResettingPwd(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` })
    setResettingPwd(false)
    setPwdMsg(error ? 'Errore nell\'invio. Riprova.' : 'Email inviata — controlla la tua casella.')
    setTimeout(() => setPwdMsg(''), 4000)
  }

  const inp: React.CSSProperties = { width:'100%', padding:'7px 10px', border:'0.5px solid #c8c7be', borderRadius:'6px', background:'#f8f7f4', color:'#1a1a1a', fontSize:'12px', fontFamily:'inherit' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'11px', color:'#8a8a84', marginBottom:'4px', fontWeight:'500' }
  const card: React.CSSProperties = { background:'#fff', border:'0.5px solid #e0dfd8', borderRadius:'10px', padding:'20px', marginBottom:'12px' }
  const sectionTitle: React.CSSProperties = { fontSize:'11px', fontWeight:'600', color:'#8a8a84', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'14px', paddingBottom:'8px', borderBottom:'0.5px solid #e0dfd8' }
  const grid2: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }
  const infoRow: React.CSSProperties = { padding:'6px 10px', background:'#f8f7f4', borderRadius:'6px', fontSize:'12px', color:'#555550' }
  const infoLabel: React.CSSProperties = { fontSize:'10px', color:'#8a8a84', display:'block', marginBottom:'2px' }

  const ruoloColore = (ruolo: string) => {
    if (ruolo === 'editor') return { bg:'#e8f0f8', color:'#1a4a7a' }
    if (ruolo === 'collaboratore') return { bg:'#e8f4ef', color:'#1a6b4a' }
    return { bg:'#f0efe9', color:'#8a8a84' }
  }
  const statoLabel = (stato: string) => stato === 'in_corso' ? 'In corso' : stato === 'in_elaborazione' ? 'In elaborazione' : 'Archiviato'
  const iniziali = [nome?.[0], cognome?.[0]].filter(Boolean).join('').toUpperCase() || email?.[0]?.toUpperCase()
  const nomeDisplay = [nome, cognome].filter(Boolean).join(' ') || email

  if (loading) return <div style={{ padding:'24px', color:'#8a8a84', fontSize:'12px' }}>Caricamento...</div>

  return (
    <div style={{ padding:'24px', maxWidth:'680px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'24px' }}>
        <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'#e8f0f8', color:'#1a4a7a', fontSize:'18px', fontWeight:'600', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{iniziali}</div>
        <div>
          <h1 style={{ fontSize:'20px', fontWeight:'500', margin:0 }}>{nomeDisplay}</h1>
          {professione && <p style={{ fontSize:'12px', color:'#8a8a84', margin:'2px 0 0' }}>{professione}</p>}
        </div>
      </div>
      <div style={card}>
        <div style={sectionTitle}>Dati personali</div>
        <div style={grid2}>
          <div><label style={lbl}>Nome</label><input style={inp} value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome" /></div>
          <div><label style={lbl}>Cognome</label><input style={inp} value={cognome} onChange={e => setCognome(e.target.value)} placeholder="Cognome" /></div>
        </div>
        <div style={{ marginBottom:'12px' }}>
          <label style={lbl}>Email</label>
          <div style={{ ...infoRow, color:'#8a8a84' }}>{email}</div>
        </div>
        <div style={{ marginBottom:'16px' }}>
          <label style={lbl}>Professione</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
            {PROFESSIONI.map(p => (
              <button key={p} type="button" onClick={() => setProfessione(professione === p ? '' : p)}
                style={{ padding:'5px 12px', borderRadius:'6px', fontSize:'12px', cursor:'pointer',
                  background: professione === p ? '#e8f0f8' : '#f8f7f4',
                  color: professione === p ? '#1a4a7a' : '#555550',
                  border: professione === p ? '0.5px solid #1a4a7a' : '0.5px solid #c8c7be',
                  fontWeight: professione === p ? '500' : '400' }}>{p}</button>
            ))}
          </div>
        </div>
        <button onClick={salva} disabled={saving}
          style={{ padding:'7px 20px', background: saved ? '#1a6b4a' : '#1a4a7a', color:'#fff', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:'pointer' }}>
          {saving ? 'Salvataggio...' : saved ? '✓ Salvato' : 'Salva modifiche'}
        </button>
      </div>
      <div style={card}>
        <div style={sectionTitle}>Sicurezza</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:'12px', color:'#1a1a1a', fontWeight:'500' }}>Password</div>
            <div style={{ fontSize:'11px', color:'#8a8a84', marginTop:'2px' }}>Riceverai un'email con il link per cambiarla</div>
          </div>
          <button onClick={resetPassword} disabled={resettingPwd}
            style={{ padding:'7px 16px', background:'#f8f7f4', color:'#555550', border:'0.5px solid #c8c7be', borderRadius:'6px', fontSize:'12px', cursor:'pointer' }}>
            {resettingPwd ? '...' : 'Cambia password'}
          </button>
        </div>
        {pwdMsg && <div style={{ marginTop:'8px', fontSize:'11px', color:'#1a6b4a' }}>{pwdMsg}</div>}
      </div>
      <div style={card}>
        <div style={sectionTitle}>Scavi e ruoli</div>
        {accessi.length === 0 ? (
          <div style={{ fontSize:'12px', color:'#8a8a84', textAlign:'center', padding:'12px 0' }}>Nessuno scavo associato</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {accessi.map(a => {
              const { bg, color } = ruoloColore(a.ruolo)
              return (
                <div key={a.scavo_id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', background:'#f8f7f4', borderRadius:'6px' }}>
                  <div>
                    <div style={{ fontSize:'12px', fontWeight:'500', color:'#1a1a1a' }}>{a.scavo?.denominazione || a.scavo?.comune}</div>
                    <div style={{ fontSize:'11px', color:'#8a8a84', marginTop:'2px' }}>{statoLabel(a.scavo?.stato)}</div>
                  </div>
                  <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', background:bg, color, fontWeight:'500', textTransform:'capitalize' }}>{a.ruolo}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div style={card}>
        <div style={sectionTitle}>Account</div>
        <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
          <div style={infoRow}><span style={infoLabel}>ID utente</span><span style={{ fontFamily:'monospace', fontSize:'11px' }}>{userId}</span></div>
          <div style={infoRow}><span style={infoLabel}>Registrato il</span>{createdAt ? new Date(createdAt).toLocaleDateString('it-IT', { day:'2-digit', month:'long', year:'numeric' }) : '—'}</div>
        </div>
      </div>
      <div style={{ ...card, opacity:0.6 }}>
        <div style={sectionTitle}>Notifiche</div>
        <div style={{ fontSize:'12px', color:'#8a8a84' }}>Presto disponibile</div>
      </div>
    </div>
  )
}
