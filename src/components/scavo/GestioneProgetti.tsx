'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  progettoId: string
  committente: string
  numScavi: number
}

export default function GestioneProgetti({ progettoId, committente, numScavi }: Props) {
  const [modalita, setModalita] = useState(false)
  const [mostraConferma, setMostraConferma] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function elimina() {
    setEliminando(true)
    await supabase.from('scavo').update({ progetto_id: null }).eq('progetto_id', progettoId)
    await supabase.from('progetto').delete().eq('id', progettoId)
    setEliminando(false)
    setMostraConferma(false)
    router.refresh()
  }

  return (
    <>
      {!modalita ? (
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); setModalita(true) }}
          style={{ fontSize: '11px', color: '#555550', background: '#f8f7f4', border: '0.5px solid #c8c7be', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}>
          Modifica
        </button>
      ) : (
        <div style={{ display: 'flex', gap: '4px' }} onClick={e => { e.preventDefault(); e.stopPropagation() }}>
          <button
            onClick={() => setMostraConferma(true)}
            style={{ fontSize: '11px', color: '#c00', background: '#fff8f8', border: '0.5px solid #e88', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}>
            Elimina
          </button>
          <button
            onClick={() => setModalita(false)}
            style={{ fontSize: '11px', color: '#8a8a84', background: '#f8f7f4', border: '0.5px solid #c8c7be', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      )}

      {mostraConferma && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '100%' }}>
            <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px' }}>Elimina progetto</div>
            <div style={{ fontSize: '13px', color: '#555550', marginBottom: '8px' }}>
              Stai per eliminare <strong>{committente}</strong>.
            </div>
            {numScavi > 0 && (
              <div style={{ fontSize: '12px', color: '#8a5c0a', background: '#fdf3e0', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px' }}>
                ⚠️ {numScavi} scavo{numScavi > 1 ? 'i' : ''} collegato{numScavi > 1 ? 'i' : ''} diventerà{numScavi > 1 ? 'nno' : ''} standalone.
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#8a8a84', marginBottom: '20px' }}>Azione irreversibile.</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setMostraConferma(false)}
                style={{ flex: 1, padding: '9px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                Annulla
              </button>
              <button onClick={elimina} disabled={eliminando}
                style={{ flex: 1, padding: '9px', background: '#c00', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: eliminando ? 'default' : 'pointer' }}>
                {eliminando ? 'Eliminazione...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
