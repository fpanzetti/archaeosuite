'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTema } from '@/lib/theme/ThemeContext'

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
  const { p } = useTema()

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
          style={{ fontSize: '11px', color: p.textSecondary, background: p.bgPage, border: `0.5px solid ${p.borderStrong}`, borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}>
          Modifica
        </button>
      ) : (
        <div style={{ display: 'flex', gap: '4px' }} onClick={e => { e.preventDefault(); e.stopPropagation() }}>
          <button
            onClick={() => setMostraConferma(true)}
            style={{ fontSize: '11px', color: p.accentRed, background: p.accentRedBg, border: `0.5px solid ${p.accentRedBorder}`, borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}>
            Elimina
          </button>
          <button
            onClick={() => setModalita(false)}
            style={{ fontSize: '11px', color: p.textMuted, background: p.bgPage, border: `0.5px solid ${p.borderStrong}`, borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      )}

      {mostraConferma && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ background: p.bgCard, borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '100%' }}>
            <div style={{ fontSize: '16px', fontWeight: '500', color: p.textPrimary, marginBottom: '8px' }}>Elimina progetto</div>
            <div style={{ fontSize: '13px', color: p.textSecondary, marginBottom: '8px' }}>
              Stai per eliminare <strong>{committente}</strong>.
            </div>
            {numScavi > 0 && (
              <div style={{ fontSize: '12px', color: p.accentAmber, background: p.accentAmberBg, padding: '8px 12px', borderRadius: '6px', marginBottom: '12px' }}>
                ⚠️ {numScavi} scavo{numScavi > 1 ? 'i' : ''} collegato{numScavi > 1 ? 'i' : ''} diventerà{numScavi > 1 ? 'nno' : ''} standalone.
              </div>
            )}
            <div style={{ fontSize: '12px', color: p.textMuted, marginBottom: '20px' }}>Azione irreversibile.</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setMostraConferma(false)}
                style={{ flex: 1, padding: '9px', background: p.bgPage, color: p.textSecondary, border: `0.5px solid ${p.borderStrong}`, borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                Annulla
              </button>
              <button onClick={elimina} disabled={eliminando}
                style={{ flex: 1, padding: '9px', background: p.accentRed, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: eliminando ? 'default' : 'pointer' }}>
                {eliminando ? 'Eliminazione...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
