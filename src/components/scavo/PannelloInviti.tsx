'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Collaboratore {
  account_id: string
  ruolo: string
  account: {
    nome: string
    cognome: string
  } | null
}

interface Props {
  scavoId: string
  scavoDenominazione: string
}

export default function PannelloInviti({ scavoId }: Props) {
  const [collaboratori, setCollaboratori] = useState<Collaboratore[]>([])
  const [email, setEmail] = useState('')
  const [ruolo, setRuolo] = useState('collaboratore')
  const [loading, setLoading] = useState(false)
  const [risultato, setRisultato] = useState<{ url?: string; errore?: string } | null>(null)
  const [utenteCorrente, setUtenteCorrente] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function carica() {
      const { data: { user } } = await supabase.auth.getUser()
      setUtenteCorrente(user?.id ?? null)

      // Prima query: accessi
      const { data: accessi } = await supabase
        .from('accesso_scavo')
        .select('account_id, ruolo')
        .eq('scavo_id', scavoId)

      if (!accessi) return

      // Seconda query: dati account
      const ids = accessi.map(a => a.account_id)
      const { data: accounts } = await supabase
        .from('account')
        .select('id, nome, cognome')
        .in('id', ids)

      const merged = accessi.map(a => ({
        account_id: a.account_id,
        ruolo: a.ruolo,
        account: accounts?.find(ac => ac.id === a.account_id) ?? null,
      }))

      setCollaboratori(merged)
    }
    carica()
  }, [scavoId])

  function iniziali(c: Collaboratore) {
    const n = c.account?.nome?.[0] ?? ''
    const cog = c.account?.cognome?.[0] ?? ''
    return (n + cog).toUpperCase() || '?'
  }

  function coloreBadge(ruolo: string) {
    if (ruolo === 'editor') return { bg: '#e8f0f8', color: '#1a4a7a' }
    if (ruolo === 'collaboratore') return { bg: '#e8f4ef', color: '#1a6b4a' }
    return { bg: '#f0efe9', color: '#8a8a84' }
  }

  async function invita() {
    if (!email) return
    setLoading(true)
    setRisultato(null)

    const res = await fetch('/api/invita', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scavoId, email, ruolo }),
    })
    const data = await res.json()

    if (data.error) {
      setRisultato({ errore: data.error })
    } else {
      setRisultato({ url: data.url })
      setEmail('')
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '7px 10px',
    border: '0.5px solid #c8c7be', borderRadius: '6px',
    background: '#f8f7f4', color: '#1a1a1a',
    fontSize: '12px', fontFamily: 'inherit',
  }

  return (
    <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px', padding: '16px', marginTop: '12px' }}>
      <div style={{ fontSize: '11px', fontWeight: '500', color: '#1a4a7a', marginBottom: '12px', paddingBottom: '8px', borderBottom: '0.5px solid #e8f0f8' }}>
        Accesso e collaboratori
      </div>

      {/* Lista collaboratori */}
      {collaboratori.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {collaboratori.map(c => {
            const badge = coloreBadge(c.ruolo)
            const sonoIo = c.account_id === utenteCorrente
            return (
              <div key={c.account_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '0.5px solid #f0efe9' }}>
                {/* Avatar iniziali */}
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: badge.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '500', color: badge.color, flexShrink: 0 }}>
                  {iniziali(c)}
                </div>
                {/* Nome e email */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a1a' }}>
                    {c.account ? `${c.account.nome} ${c.account.cognome}` : c.account_id.slice(0, 8)}
                    {sonoIo && <span style={{ fontSize: '10px', color: '#8a8a84', marginLeft: '6px' }}>tu</span>}
                  </div>

                </div>
                {/* Badge ruolo */}
                <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '8px', background: badge.bg, color: badge.color, fontWeight: '500', flexShrink: 0 }}>
                  {c.ruolo}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Form invito */}
      <div style={{ fontSize: '11px', color: '#8a8a84', fontWeight: '500', marginBottom: '8px' }}>
        Invita un collaboratore
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <div style={{ flex: 2 }}>
          <input style={inp} type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="nome@email.com"
            onKeyDown={e => { if (e.key === 'Enter') invita() }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <select style={inp} value={ruolo} onChange={e => setRuolo(e.target.value)}>
            <option value="editor">Editor</option>
            <option value="collaboratore">Collaboratore</option>
            <option value="visualizzatore">Visualizzatore</option>
          </select>
        </div>
      </div>

      <button onClick={invita} disabled={loading || !email}
        style={{
          width: '100%', padding: '8px',
          background: email ? '#1a4a7a' : '#f0efe9',
          color: email ? '#fff' : '#8a8a84',
          border: 'none', borderRadius: '6px',
          fontSize: '12px', fontWeight: '500',
          cursor: email ? 'pointer' : 'default',
        }}>
        {loading ? 'Invio...' : 'Invia invito'}
      </button>

      {risultato?.errore && (
        <p style={{ fontSize: '11px', color: '#c00', marginTop: '8px' }}>{risultato.errore}</p>
      )}

      {risultato?.url && (
        <div style={{ marginTop: '10px', padding: '10px', background: '#e8f4ef', borderRadius: '6px', border: '0.5px solid #1a6b4a30' }}>
          <div style={{ fontSize: '11px', color: '#1a6b4a', fontWeight: '500', marginBottom: '4px' }}>✓ Invito creato</div>
          <div style={{ fontSize: '11px', color: '#555550', marginBottom: '6px' }}>Copia e invia questo link al collaboratore:</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input style={{ ...inp, fontSize: '11px', color: '#1a4a7a' }}
              value={risultato.url} readOnly
              onClick={e => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={() => navigator.clipboard.writeText(risultato.url!)}
              style={{ padding: '5px 10px', background: '#1a4a7a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Copia
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
