'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Foto {
  id: string
  url: string
  url_thumb: string | null
  didascalia: string | null
  autore: string | null
  nome_file: string | null
  data_scatto: string | null
  tipo: string | null
  larghezza: number | null
  altezza: number | null
  dimensione_kb: number | null
}

interface Props {
  scavoId: string
  usId?: string
  contestoFunerarioId?: string
  aggiornamento?: number
  tipo?: string
}

export default function GalleriaFoto({ scavoId, usId, contestoFunerarioId, aggiornamento, tipo }: Props) {
  const [foto, setFoto] = useState<Foto[]>([])
  const [fotoAperta, setFotoAperta] = useState<Foto | null>(null)
  const [editingDidascalia, setEditingDidascalia] = useState(false)
  const [editingAutore, setEditingAutore] = useState(false)
  const [didascaliaInput, setDidascaliaInput] = useState('')
  const [autoreInput, setAutoreInput] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function carica() {
      setLoading(true)
      let query = supabase.from('foto').select('*').eq('scavo_id', scavoId).order('created_at', { ascending: true })
      if (usId) query = query.eq('us_id', usId)
      if (contestoFunerarioId) query = query.eq('contesto_funerario_id', contestoFunerarioId)
      if (tipo) query = query.eq('tipo', tipo)
      const { data } = await query
      setFoto(data ?? [])
      setLoading(false)
    }
    carica()
  }, [scavoId, usId, contestoFunerarioId, aggiornamento, tipo])

  function apriLightbox(f: Foto) {
    setFotoAperta(f)
    setDidascaliaInput(f.didascalia ?? '')
    setAutoreInput(f.autore ?? '')
    setEditingDidascalia(false)
    setEditingAutore(false)
  }

  async function eliminaFoto(id: string, url: string) {
    if (!confirm('Eliminare questa foto?')) return
    const path = url.split('/foto-scavi/')[1]
    if (path) await supabase.storage.from('foto-scavi').remove([path])
    await supabase.from('foto').delete().eq('id', id)
    setFoto(prev => prev.filter(f => f.id !== id))
    if (fotoAperta?.id === id) setFotoAperta(null)
  }

  async function salvaDidascalia() {
    if (!fotoAperta) return
    setSalvando(true)
    await supabase.from('foto').update({ didascalia: didascaliaInput || null }).eq('id', fotoAperta.id)
    const aggiornata = { ...fotoAperta, didascalia: didascaliaInput || null }
    setFotoAperta(aggiornata)
    setFoto(prev => prev.map(f => f.id === fotoAperta.id ? aggiornata : f))
    setSalvando(false)
    setEditingDidascalia(false)
  }

  async function salvaAutore() {
    if (!fotoAperta) return
    setSalvando(true)
    await supabase.from('foto').update({ autore: autoreInput || null }).eq('id', fotoAperta.id)
    const aggiornata = { ...fotoAperta, autore: autoreInput || null }
    setFotoAperta(aggiornata)
    setFoto(prev => prev.map(f => f.id === fotoAperta.id ? aggiornata : f))
    setSalvando(false)
    setEditingAutore(false)
  }

  // Messaggi stato vuoto corretti
  const msgVuoto = tipo === 'foto' ? 'Nessuna foto'
    : tipo === 'rilievo' ? 'Nessun rilievo'
    : tipo === 'altro' ? 'Nessun altro documento'
    : 'Nessun allegato'

  const inp: React.CSSProperties = { width: '100%', padding: '6px 10px', border: '0.5px solid #c8c7be', borderRadius: '6px', background: '#f8f7f4', color: '#1a1a1a', fontSize: '12px', fontFamily: 'inherit' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', color: '#8a8a84', marginBottom: '3px', fontWeight: '500' }

  if (loading) return <div style={{ fontSize: '12px', color: '#8a8a84', padding: '12px 0' }}>Caricamento...</div>
  if (foto.length === 0) return (
    <div style={{ textAlign: 'center', padding: '24px', color: '#8a8a84', fontSize: '12px', background: '#f8f7f4', borderRadius: '8px', border: '0.5px dashed #c8c7be' }}>
      {msgVuoto}
    </div>
  )

  return (
    <>
      {/* Griglia thumbnail */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px' }}>
        {foto.map(f => (
          <div key={f.id} className="foto-thumb" onClick={() => apriLightbox(f)}>
            <img src={f.url_thumb ?? f.url} alt={f.didascalia ?? f.nome_file ?? 'allegato'} />
            {f.didascalia && (
              <div className="foto-overlay">{f.didascalia}</div>
            )}
            {f.didascalia && (
              <div style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '10px', padding: '1px 5px', borderRadius: '3px' }}>✎</div>
            )}
            {f.autore && (
              <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '10px', padding: '1px 5px', borderRadius: '3px' }}>👤</div>
            )}
          </div>
        ))}
      </div>

      {/* Legenda badge */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#8a8a84' }}>
          <span style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '0 4px', borderRadius: '3px', fontSize: '10px' }}>✎</span>
          Ha una didascalia
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#8a8a84' }}>
          <span style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '0 4px', borderRadius: '3px', fontSize: '10px' }}>👤</span>
          Autore presente
        </div>
      </div>

      {/* Lightbox */}
      {fotoAperta && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => { setFotoAperta(null); setEditingDidascalia(false); setEditingAutore(false) }}>
          <div style={{ maxWidth: '800px', width: '100%', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}>
            <img src={fotoAperta.url} alt={fotoAperta.didascalia ?? ''}
              style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', background: '#1a1a1a' }} />
            <div style={{ padding: '12px 16px' }}>

              {/* Didascalia */}
              <div style={{ marginBottom: '8px' }}>
                <label style={lbl}>Didascalia</label>
                {editingDidascalia ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input autoFocus style={{ ...inp, flex: 1 }} value={didascaliaInput}
                      onChange={e => setDidascaliaInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') salvaDidascalia(); if (e.key === 'Escape') setEditingDidascalia(false) }}
                      placeholder="Aggiungi una didascalia..." />
                    <button onClick={salvaDidascalia} disabled={salvando}
                      style={{ padding: '5px 12px', background: '#1a4a7a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                      {salvando ? '...' : 'Salva'}
                    </button>
                    <button onClick={() => setEditingDidascalia(false)}
                      style={{ padding: '5px 10px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                      Annulla
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: fotoAperta.didascalia ? '#1a1a1a' : '#c8c7be' }}>
                      {fotoAperta.didascalia ?? 'Nessuna didascalia'}
                    </span>
                    <button onClick={() => setEditingDidascalia(true)}
                      style={{ padding: '2px 8px', background: 'none', border: '0.5px solid #c8c7be', borderRadius: '4px', fontSize: '11px', color: '#8a8a84', cursor: 'pointer' }}>
                      ✎ {fotoAperta.didascalia ? 'Modifica' : 'Aggiungi'}
                    </button>
                  </div>
                )}
              </div>

              {/* Autore */}
              <div style={{ marginBottom: '10px' }}>
                <label style={lbl}>Autore</label>
                {editingAutore ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input autoFocus style={{ ...inp, flex: 1 }} value={autoreInput}
                      onChange={e => setAutoreInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') salvaAutore(); if (e.key === 'Escape') setEditingAutore(false) }}
                      placeholder="Nome e cognome..." />
                    <button onClick={salvaAutore} disabled={salvando}
                      style={{ padding: '5px 12px', background: '#1a4a7a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                      {salvando ? '...' : 'Salva'}
                    </button>
                    <button onClick={() => setEditingAutore(false)}
                      style={{ padding: '5px 10px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                      Annulla
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: fotoAperta.autore ? '#1a1a1a' : '#c8c7be' }}>
                      {fotoAperta.autore ?? 'Nessun autore'}
                    </span>
                    <button onClick={() => setEditingAutore(true)}
                      style={{ padding: '2px 8px', background: 'none', border: '0.5px solid #c8c7be', borderRadius: '4px', fontSize: '11px', color: '#8a8a84', cursor: 'pointer' }}>
                      ✎ {fotoAperta.autore ? 'Modifica' : 'Aggiungi'}
                    </button>
                  </div>
                )}
              </div>

              {/* Metadati e azioni */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', color: '#8a8a84', display: 'flex', gap: '12px' }}>
                  {fotoAperta.tipo && <span>{fotoAperta.tipo}</span>}
                  {fotoAperta.data_scatto && <span>{new Date(fotoAperta.data_scatto).toLocaleDateString('it-IT')}</span>}
                  {fotoAperta.larghezza && fotoAperta.altezza && <span>{fotoAperta.larghezza}×{fotoAperta.altezza}px</span>}
                  {fotoAperta.dimensione_kb && <span>{fotoAperta.dimensione_kb} KB</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a href={fotoAperta.url} download target="_blank" rel="noreferrer"
                    style={{ padding: '5px 10px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '11px', textDecoration: 'none' }}>
                    Scarica
                  </a>
                  <button onClick={() => eliminaFoto(fotoAperta.id, fotoAperta.url)}
                    style={{ padding: '5px 10px', background: '#fff8f8', color: '#c00', border: '0.5px solid #e88', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                    Elimina
                  </button>
                  <button onClick={() => { setFotoAperta(null); setEditingDidascalia(false); setEditingAutore(false) }}
                    style={{ padding: '5px 10px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                    Chiudi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
