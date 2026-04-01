'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Collaboratore {
  account_id: string
  ruolo: string
  account: {
    nome: string
    cognome: string
  } | null
}

interface InvitoPendente {
  id: string
  email: string
  ruolo: string
  expires_at: string
  created_at: string
}

interface Props {
  scavoId: string
  scavoDenominazione: string
  ruoloEsterno?: string
}

export default function PannelloInviti({ scavoId, scavoDenominazione, ruoloEsterno }: Props) {
  const [collaboratori, setCollaboratori] = useState<Collaboratore[]>([])
  const [email, setEmail] = useState('')
  const [ruolo, setRuolo] = useState('collaboratore')
  const [loading, setLoading] = useState(false)
  const [risultato, setRisultato] = useState<{ url?: string; errore?: string } | null>(null)
  const [utenteCorrente, setUtenteCorrente] = useState<string | null>(null)
  const [ruoloCorrente, setRuoloCorrente] = useState<string | null>(null)
  const [mostraConferma, setMostraConferma] = useState<string | null>(null) // account_id da rimuovere
  const [mostraConfermaAbbandono, setMostraConfermaAbbandono] = useState(false)
  const [azione, setAzione] = useState(false)
  const [inviti, setInviti] = useState<InvitoPendente[]>([])
  const [reinviando, setReinviando] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function carica() {
      const { data: { user } } = await supabase.auth.getUser()
      setUtenteCorrente(user?.id ?? null)

      const { data: accessi } = await supabase
        .from('accesso_scavo')
        .select('account_id, ruolo')
        .eq('scavo_id', scavoId)

      if (!accessi) return

      const mioAccesso = accessi.find(a => a.account_id === user?.id)
      setRuoloCorrente(ruoloEsterno ?? mioAccesso?.ruolo ?? null)

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

      // Carica inviti pendenti (solo editor)
      if (mioAccesso?.ruolo === 'editor') {
        const { data: invPendenti } = await supabase
          .from('invito')
          .select('id, email, ruolo, expires_at, created_at')
          .eq('scavo_id', scavoId)
          .eq('usato', false)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
        setInviti(invPendenti ?? [])
      }
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

  async function rimuoviCollaboratore(accountId: string) {
    setAzione(true)
    await supabase.from('accesso_scavo').delete()
      .eq('scavo_id', scavoId)
      .eq('account_id', accountId)
    setCollaboratori(prev => prev.filter(c => c.account_id !== accountId))
    setMostraConferma(null)
    setAzione(false)
  }

  async function abbandonaScavo() {
    if (!utenteCorrente) return
    setAzione(true)
    await supabase.from('accesso_scavo').delete()
      .eq('scavo_id', scavoId)
      .eq('account_id', utenteCorrente)
    setMostraConfermaAbbandono(false)
    setAzione(false)
    router.push('/reports')
  }

  async function revocaInvito(invito_id: string) {
    await fetch('/api/invita', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invito_id }),
    })
    setInviti(prev => prev.filter(i => i.id !== invito_id))
  }

  async function reinviaInvito(invito_id: string) {
    setReinviando(invito_id)
    await fetch('/api/invita', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invito_id }),
    })
    // Aggiorna expires_at localmente
    const nuovaScadenza = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    setInviti(prev => prev.map(i => i.id === invito_id ? { ...i, expires_at: nuovaScadenza } : i))
    setReinviando(null)
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
      // Aggiunge il nuovo invito alla lista pendenti
      if (data.token) {
        const nuovoInvito: InvitoPendente = {
          id: data.token, // temporaneo, refresh lo sistemerà
          email: email.toLowerCase().trim(),
          ruolo,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        }
        setInviti(prev => [nuovoInvito, ...prev])
      }
    }
    setLoading(false)
  }

  const isResponsabile = ruoloCorrente === 'editor'

  const inp: React.CSSProperties = {
    width: '100%', padding: '7px 10px',
    border: '0.5px solid #c8c7be', borderRadius: '6px',
    background: '#f8f7f4', color: '#1a1a1a',
    fontSize: '12px', fontFamily: 'inherit',
  }

  return (
    <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px', padding: '16px', marginTop: '12px' }}>
      <div style={{ fontSize: '11px', fontWeight: '500', color: '#1a4a7a', marginBottom: '12px', paddingBottom: '8px', borderBottom: '0.5px solid #e8f0f8' }}>
        Team e ruoli
      </div>

      {/* Lista collaboratori */}
      {collaboratori.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {collaboratori.map(c => {
            const badge = coloreBadge(c.ruolo)
            const sonoIo = c.account_id === utenteCorrente
            const nomeCompleto = c.account ? `${c.account.nome} ${c.account.cognome}` : c.account_id.slice(0, 8)
            return (
              <div key={c.account_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '0.5px solid #f0efe9' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: sonoIo ? '#e8f4ef' : badge.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', color: sonoIo ? '#1a6b4a' : badge.color, flexShrink: 0, border: sonoIo ? '1.5px solid #1a6b4a' : 'none' }}>
                  {iniziali(c)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {sonoIo ? 'tu' : nomeCompleto}
                    {sonoIo && <span style={{ fontSize: '10px', color: '#8a8a84' }}>({nomeCompleto})</span>}
                  </div>
                </div>
                <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '8px', background: badge.bg, color: badge.color, fontWeight: '500', flexShrink: 0 }}>
                  {c.ruolo}
                </span>
                {/* Azioni */}
                {!sonoIo && isResponsabile && (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                    <select
                      value={c.ruolo}
                      onChange={async e => {
                        const nuovoRuolo = e.target.value
                        await supabase.from('accesso_scavo').update({ ruolo: nuovoRuolo })
                          .eq('scavo_id', scavoId).eq('account_id', c.account_id)
                        setCollaboratori(prev => prev.map(x =>
                          x.account_id === c.account_id ? { ...x, ruolo: nuovoRuolo } : x
                        ))
                      }}
                      style={{ padding: '2px 6px', border: '0.5px solid #c8c7be', borderRadius: '4px', fontSize: '11px', background: '#f8f7f4', color: '#555550', cursor: 'pointer' }}>
                      <option value="editor">Editor</option>
                      <option value="collaboratore">Collaboratore</option>
                      <option value="visualizzatore">Visualizzatore</option>
                    </select>
                    <button onClick={() => setMostraConferma(c.account_id)}
                      style={{ padding: '3px 8px', background: 'none', border: '0.5px solid #e88', color: '#c00', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                      Rimuovi
                    </button>
                  </div>
                )}
                {sonoIo && !isResponsabile && (
                  <button onClick={() => setMostraConfermaAbbandono(true)}
                    style={{ padding: '3px 8px', background: 'none', border: '0.5px solid #c8c7be', color: '#8a8a84', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}>
                    Abbandona
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Form invito — solo per editor */}
      {isResponsabile && (
        <>
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
                <button onClick={() => navigator.clipboard.writeText(risultato.url!)}
                  style={{ padding: '5px 10px', background: '#1a4a7a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Copia
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modale conferma rimozione */}
      {mostraConferma && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '380px', width: '100%' }}>
            <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px' }}>Rimuovi collaboratore</div>
            <div style={{ fontSize: '12px', color: '#555550', marginBottom: '20px' }}>
              Sei sicuro di voler rimuovere {collaboratori.find(c => c.account_id === mostraConferma)?.account?.nome} {collaboratori.find(c => c.account_id === mostraConferma)?.account?.cognome} dallo scavo <strong>{scavoDenominazione}</strong>?
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setMostraConferma(null)}
                style={{ flex: 1, padding: '9px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                Annulla
              </button>
              <button onClick={() => rimuoviCollaboratore(mostraConferma)} disabled={azione}
                style={{ flex: 1, padding: '9px', background: '#c00', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: azione ? 'default' : 'pointer' }}>
                {azione ? 'Rimozione...' : 'Rimuovi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale conferma abbandono */}
      {mostraConfermaAbbandono && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '380px', width: '100%' }}>
            <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px' }}>Abbandona scavo</div>
            <div style={{ fontSize: '12px', color: '#555550', marginBottom: '20px' }}>
              Sei sicuro di voler abbandonare lo scavo <strong>{scavoDenominazione}</strong>? Non potrai più accedervi senza un nuovo invito.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setMostraConfermaAbbandono(false)}
                style={{ flex: 1, padding: '9px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                Annulla
              </button>
              <button onClick={abbandonaScavo} disabled={azione}
                style={{ flex: 1, padding: '9px', background: '#c00', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: azione ? 'default' : 'pointer' }}>
                {azione ? 'Abbandono...' : 'Abbandona'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
