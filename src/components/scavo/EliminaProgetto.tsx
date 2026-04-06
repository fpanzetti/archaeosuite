'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { eliminaProgetto } from '@/app/reports/progetti/actions'
import { useTema } from '@/lib/theme/ThemeContext'

interface Props {
  progettoId: string
  committente: string
  numScavi: number
}

export default function EliminaProgetto({ progettoId, committente, numScavi }: Props) {
  const [modalita, setModalita] = useState(false)
  const [mostraConferma, setMostraConferma] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [errore, setErrore] = useState('')
  const router = useRouter()
  const { p } = useTema()

  async function elimina() {
    setEliminando(true)
    const result = await eliminaProgetto(progettoId)
    if (result?.error) {
      setErrore(result.error)
      setEliminando(false)
    }
    // Se ok, redirect gestito dalla Server Action
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '8px' }}>
        {!modalita ? (
          <button
            onClick={() => setModalita(true)}
            style={{ padding: '7px 14px', background: p.bgPage, color: p.textSecondary, border: `0.5px solid ${p.borderStrong}`, borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
            Modifica
          </button>
        ) : (
          <>
            <button
              onClick={() => setMostraConferma(true)}
              style={{ padding: '7px 14px', background: p.accentRedBg, color: p.accentRed, border: `0.5px solid ${p.accentRedBorder}`, borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
              Elimina progetto
            </button>
            <button
              onClick={() => setModalita(false)}
              style={{ padding: '7px 14px', background: p.bgPage, color: p.textMuted, border: `0.5px solid ${p.borderStrong}`, borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
              Annulla
            </button>
          </>
        )}
      </div>

      {mostraConferma && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: p.bgCard, borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '100%' }}>
            <div style={{ fontSize: '16px', fontWeight: '500', color: p.textPrimary, marginBottom: '8px' }}>
              Elimina progetto
            </div>
            <div style={{ fontSize: '13px', color: p.textSecondary, marginBottom: '8px' }}>
              Stai per eliminare il progetto <strong>{committente}</strong>.
            </div>
            {numScavi > 0 && (
              <div style={{ fontSize: '12px', color: p.accentAmber, background: p.accentAmberBg, padding: '8px 12px', borderRadius: '6px', marginBottom: '12px' }}>
                ⚠️ {numScavi} scavo{numScavi > 1 ? 'i' : ''} collegato{numScavi > 1 ? 'i' : ''} diventerà{numScavi > 1 ? 'nno' : ''} standalone.
              </div>
            )}
            <div style={{ fontSize: '12px', color: p.textMuted, marginBottom: '20px' }}>
              Questa azione è irreversibile.
            </div>
            {errore && <div style={{ fontSize: '12px', color: p.accentRed, marginBottom: '12px' }}>{errore}</div>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setMostraConferma(false); setErrore('') }}
                style={{ flex: 1, padding: '9px', background: p.bgPage, color: p.textSecondary, border: `0.5px solid ${p.borderStrong}`, borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                Annulla
              </button>
              <button
                onClick={elimina}
                disabled={eliminando}
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
