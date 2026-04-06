'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import BadgeTeam from '@/components/scavo/BadgeTeam'
import { useTema } from '@/lib/theme/ThemeContext'

type Collaboratore = { id: string; nome: string | null; cognome: string | null }

interface Scavo {
  id: string
  denominazione: string
  stato: string | null
  tipologia_intervento: string | null
  us: { count: number }[]
  collaboratori: Collaboratore[]
}

interface Progetto {
  id: string
  committente: string | null
  denominazione: string | null
}

interface Props {
  scavi: Scavo[]
  progetti: Progetto[]
}

export default function AssegnaProgetto({ scavi, progetti }: Props) {
  const [modalita, setModalita] = useState(false)
  const [selezionati, setSelezionati] = useState<Set<string>>(new Set())
  const [progettoScelto, setProgettoScelto] = useState('')
  const [assegnando, setAssegnando] = useState(false)
  const [modalitaModifica, setModalitaModifica] = useState(false)
  const [scavoDaEliminare, setScavoDaEliminare] = useState<{ id: string; denominazione: string } | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { p } = useTema()

  function statoInfo(s: string | null) {
    if (s === 'in_corso') return { label: 'In corso', bg: p.accentBlueBg, color: p.accentBlue }
    if (s === 'in_elaborazione') return { label: 'In elaborazione', bg: p.accentAmberBg, color: p.accentAmber }
    return { label: 'Archiviato', bg: p.bgBadgeNeutro, color: p.textMuted }
  }

  function toggleScavo(id: string) {
    setSelezionati(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function annulla() {
    setModalita(false)
    setSelezionati(new Set())
    setProgettoScelto('')
  }

  function annullaModifica() {
    setModalitaModifica(false)
    setScavoDaEliminare(null)
  }

  async function eliminaScavo() {
    if (!scavoDaEliminare) return
    setEliminando(true)
    await supabase.from('scavo').delete().eq('id', scavoDaEliminare.id)
    setEliminando(false)
    setScavoDaEliminare(null)
    router.refresh()
  }

  async function assegna() {
    if (!progettoScelto || selezionati.size === 0) return
    setAssegnando(true)
    await supabase.from('scavo')
      .update({ progetto_id: progettoScelto })
      .in('id', [...selezionati])
    setAssegnando(false)
    annulla()
    router.refresh()
  }

  const inp: React.CSSProperties = {
    padding: '7px 10px', border: `0.5px solid ${p.borderStrong}`, borderRadius: '6px',
    background: p.bgInput, color: p.textPrimary, fontSize: '12px', fontFamily: 'inherit',
  }

  return (
    <div>
      {/* Header sezione scavi standalone */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: p.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Scavi non assegnati a progetti
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {!modalita && !modalitaModifica && progetti.length > 0 && scavi.length > 0 && (
            <button onClick={() => setModalita(true)}
              style={{ fontSize: '11px', color: p.accentAmber, background: p.accentAmberBg, border: `0.5px solid ${p.accentAmber}40`, borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
              📁 Aggiungi a progetto
            </button>
          )}
          {!modalita && !modalitaModifica && scavi.length > 0 && (
            <button onClick={() => setModalitaModifica(true)}
              style={{ fontSize: '11px', color: p.textSecondary, background: p.bgPage, border: `0.5px solid ${p.borderStrong}`, borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}>
              Modifica
            </button>
          )}
          {modalitaModifica && (
            <button onClick={annullaModifica}
              style={{ fontSize: '11px', color: p.textMuted, background: p.bgPage, border: `0.5px solid ${p.borderStrong}`, borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Lista scavi con selezione opzionale */}
      {scavi.length === 0 ? (
        <div style={{ fontSize: '12px', color: p.border, padding: '12px 0' }}>
          Tutti gli scavi sono assegnati a un progetto
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {scavi.map(scavo => {
            const info = statoInfo(scavo.stato)
            const numUS = scavo.us?.[0]?.count ?? 0
            const selezionato = selezionati.has(scavo.id)
            return (
              <div key={scavo.id}
                onClick={() => modalita ? toggleScavo(scavo.id) : modalitaModifica ? undefined : router.push(`/reports/scavi/${scavo.id}`)}
                style={{
                  background: selezionato ? p.accentGreenBg : p.bgCard,
                  border: selezionato ? `0.5px solid ${p.accentGreen}` : `0.5px solid ${p.border}`,
                  borderRadius: '10px', padding: '14px 16px', cursor: modalitaModifica ? 'default' : 'pointer',
                }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                    {modalita && (
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0, marginTop: '2px',
                        border: selezionato ? `2px solid ${p.accentGreen}` : `1.5px solid ${p.borderStrong}`,
                        background: selezionato ? p.accentGreen : p.bgCard,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {selezionato && <span style={{ color: '#fff', fontSize: '10px', fontWeight: '700' }}>✓</span>}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: p.textPrimary, marginBottom: '3px' }}>
                        {scavo.denominazione}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', background: info.bg, color: info.color, padding: '2px 8px', borderRadius: '10px' }}>{info.label}</span>
                        <span style={{ fontSize: '11px', background: p.bgBadgeNeutro, color: p.textSecondary, padding: '2px 8px', borderRadius: '10px' }}>{numUS} US</span>
                        {scavo.tipologia_intervento && (
                          <span style={{ fontSize: '11px', background: p.bgBadgeNeutro, color: p.textSecondary, padding: '2px 8px', borderRadius: '10px' }}>{scavo.tipologia_intervento}</span>
                        )}
                        {scavo.collaboratori.length > 0 && (
                          <BadgeTeam collaboratori={scavo.collaboratori} />
                        )}
                      </div>
                    </div>
                  </div>
                  {!modalita && !modalitaModifica && <div style={{ fontSize: '12px', color: p.border, marginLeft: '12px' }}>→</div>}
                  {modalitaModifica && (
                    <button
                      onClick={e => { e.stopPropagation(); setScavoDaEliminare({ id: scavo.id, denominazione: scavo.denominazione }) }}
                      style={{ fontSize: '11px', color: p.accentRed, background: p.accentRedBg, border: `0.5px solid ${p.accentRedBorder}`, borderRadius: '5px', padding: '2px 8px', cursor: 'pointer', flexShrink: 0, marginLeft: '10px' }}>
                      Elimina
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal conferma eliminazione scavo */}
      {scavoDaEliminare && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: p.bgCard, borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '100%' }}>
            <div style={{ fontSize: '16px', fontWeight: '500', color: p.textPrimary, marginBottom: '8px' }}>Elimina scavo</div>
            <div style={{ fontSize: '13px', color: p.textSecondary, marginBottom: '16px' }}>
              Stai per eliminare lo scavo <strong>{scavoDaEliminare.denominazione}</strong>.
            </div>
            <div style={{ fontSize: '12px', color: p.textMuted, marginBottom: '20px' }}>Questa azione è irreversibile.</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setScavoDaEliminare(null)}
                style={{ flex: 1, padding: '9px', background: p.bgPage, color: p.textSecondary, border: `0.5px solid ${p.borderStrong}`, borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                Annulla
              </button>
              <button
                onClick={eliminaScavo}
                disabled={eliminando}
                style={{ flex: 1, padding: '9px', background: p.accentRed, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: eliminando ? 'default' : 'pointer' }}>
                {eliminando ? 'Eliminazione...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra di assegnazione */}
      {modalita && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: p.bgCard, borderTop: `0.5px solid ${p.border}`,
          padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: '12px', color: p.textSecondary, flexShrink: 0 }}>
            {selezionati.size === 0 ? 'Seleziona uno o più scavi' : `${selezionati.size} scavo${selezionati.size > 1 ? 'i' : ''} selezionato${selezionati.size > 1 ? 'i' : ''}`}
          </div>
          <select style={{ ...inp, flex: 1, maxWidth: '300px' }} value={progettoScelto} onChange={e => setProgettoScelto(e.target.value)}>
            <option value="">Scegli progetto...</option>
            {progetti.map(prog => (
              <option key={prog.id} value={prog.id}>{prog.committente ?? prog.denominazione ?? 'Progetto senza nome'}</option>
            ))}
          </select>
          <button onClick={assegna} disabled={assegnando || selezionati.size === 0 || !progettoScelto}
            style={{
              padding: '8px 16px', background: selezionati.size > 0 && progettoScelto ? p.accentBlue : p.bgBadgeNeutro,
              color: selezionati.size > 0 && progettoScelto ? '#fff' : p.textMuted,
              border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer',
            }}>
            {assegnando ? 'Assegnazione...' : 'Assegna'}
          </button>
          <button onClick={annulla}
            style={{ padding: '8px 14px', background: p.bgPage, color: p.textSecondary, border: `0.5px solid ${p.borderStrong}`, borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
            Annulla
          </button>
        </div>
      )}
    </div>
  )
}
