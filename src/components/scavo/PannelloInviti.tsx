'use client'
import { useState } from 'react'

interface Props {
  scavoId: string
  scavoDenominazione: string
}

export default function PannelloInviti({ scavoId, scavoDenominazione }: Props) {
  const [email, setEmail] = useState('')
  const [ruolo, setRuolo] = useState('collaboratore')
  const [loading, setLoading] = useState(false)
  const [risultato, setRisultato] = useState<{ url?: string; errore?: string } | null>(null)

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
        Invita collaboratore
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <div style={{ flex: 2 }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#8a8a84', marginBottom: '4px', fontWeight: '500' }}>Email</label>
          <input style={inp} type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="nome@email.com"
            onKeyDown={e => { if (e.key === 'Enter') invita() }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#8a8a84', marginBottom: '4px', fontWeight: '500' }}>Ruolo</label>
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
          fontSize: '12px', fontWeight: '500', cursor: email ? 'pointer' : 'default',
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
