'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Foto {
  id: string
  url: string
  url_thumb: string | null
  didascalia: string | null
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
  aggiornamento?: number
}

export default function GalleriaFoto({ scavoId, usId, aggiornamento }: Props) {
  const [foto, setFoto] = useState<Foto[]>([])
  const [fotoAperta, setFotoAperta] = useState<Foto | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function carica() {
      setLoading(true)
      let query = supabase.from('foto').select('*').eq('scavo_id', scavoId).order('created_at', { ascending: false })
      if (usId) query = query.eq('us_id', usId)
      const { data } = await query
      setFoto(data ?? [])
      setLoading(false)
    }
    carica()
  }, [scavoId, usId, aggiornamento])

  async function eliminaFoto(id: string, url: string) {
    if (!confirm('Eliminare questa foto?')) return
    const path = url.split('/foto-scavi/')[1]
    if (path) await supabase.storage.from('foto-scavi').remove([path])
    await supabase.from('foto').delete().eq('id', id)
    setFoto(prev => prev.filter(f => f.id !== id))
    if (fotoAperta?.id === id) setFotoAperta(null)
  }

  if (loading) return <div style={{ fontSize: '12px', color: '#8a8a84', padding: '12px 0' }}>Caricamento foto...</div>
  if (foto.length === 0) return (
    <div style={{ textAlign: 'center', padding: '24px', color: '#8a8a84', fontSize: '12px', background: '#f8f7f4', borderRadius: '8px', border: '0.5px dashed #c8c7be' }}>
      Nessuna foto ancora
    </div>
  )

  return (
    <>
      {/* Griglia thumbnail */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px' }}>
        {foto.map(f => (
          <div key={f.id} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setFotoAperta(f)}>
            <img
              src={f.url_thumb ?? f.url}
              alt={f.didascalia ?? f.nome_file ?? 'foto'}
              style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '6px', border: '0.5px solid #e0dfd8' }}
            />
            {f.tipo && f.tipo !== 'generale' && (
              <div style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '9px', padding: '1px 5px', borderRadius: '3px' }}>
                {f.tipo}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {fotoAperta && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setFotoAperta(null)}
        >
          <div style={{ maxWidth: '800px', width: '100%', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}>
            <img src={fotoAperta.url} alt={fotoAperta.didascalia ?? ''}
              style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', background: '#1a1a1a' }} />
            <div style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  {fotoAperta.didascalia && <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '4px' }}>{fotoAperta.didascalia}</div>}
                  <div style={{ fontSize: '11px', color: '#8a8a84', display: 'flex', gap: '12px' }}>
                    {fotoAperta.tipo && <span>{fotoAperta.tipo}</span>}
                    {fotoAperta.data_scatto && <span>{new Date(fotoAperta.data_scatto).toLocaleDateString('it-IT')}</span>}
                    {fotoAperta.larghezza && fotoAperta.altezza && <span>{fotoAperta.larghezza}×{fotoAperta.altezza}px</span>}
                    {fotoAperta.dimensione_kb && <span>{fotoAperta.dimensione_kb} KB</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a href={fotoAperta.url} download target="_blank" rel="noreferrer"
                    style={{ padding: '5px 10px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '11px', textDecoration: 'none', cursor: 'pointer' }}>
                    Scarica
                  </a>
                  <button onClick={() => eliminaFoto(fotoAperta.id, fotoAperta.url)}
                    style={{ padding: '5px 10px', background: '#fff8f8', color: '#c00', border: '0.5px solid #e88', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                    Elimina
                  </button>
                  <button onClick={() => setFotoAperta(null)}
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
