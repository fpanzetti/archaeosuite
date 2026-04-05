'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import BadgeTeam from '@/components/scavo/BadgeTeam'

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

  const statoInfo = (s: string | null) => {
    if (s === 'in_corso') return { label: 'In corso', bg: '#e8f0f8', color: '#1a4a7a' }
    if (s === 'in_elaborazione') return { label: 'In elaborazione', bg: '#fdf3e0', color: '#8a5c0a' }
    return { label: 'Archiviato', bg: '#f0efe9', color: '#8a8a84' }
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
    padding: '7px 10px', border: '0.5px solid #c8c7be', borderRadius: '6px',
    background: '#f8f7f4', color: '#1a1a1a', fontSize: '12px', fontFamily: 'inherit',
  }

  return (
    <div>
      {/* Header sezione scavi standalone */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: '#8a8a84', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Scavi non assegnati a progetti
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {!modalita && !modalitaModifica && progetti.length > 0 && scavi.length > 0 && (
            <button onClick={() => setModalita(true)}
              style={{ fontSize: '11px', color: '#8a5c0a', background: '#fdf3e0', border: '0.5px solid #8a5c0a40', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
              📁 Aggiungi a progetto
            </button>
          )}
          {!modalita && !modalitaModifica && scavi.length > 0 && (
            <button onClick={() => setModalitaModifica(true)}
              style={{ fontSize: '11px', color: '#555550', background: '#f8f7f4', border: '0.5px solid #c8c7be', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}>
              Modifica
            </button>
          )}
          {modalitaModifica && (
            <button onClick={annullaModifica}
              style={{ fontSize: '11px', color: '#8a8a84', background: '#f8f7f4', border: '0.5px solid #c8c7be', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Lista scavi con selezione opzionale */}
      {scavi.length === 0 ? (
        <div style={{ fontSize: '12px', color: '#c8c7be', padding: '12px 0' }}>
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
                  background: selezionato ? '#e8f4ef' : '#fff',
                  border: selezionato ? '0.5px solid #1a6b4a' : '0.5px solid #e0dfd8',
                  borderRadius: '10px', padding: '14px 16px', cursor: modalitaModifica ? 'default' : 'pointer',
                }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                    {modalita && (
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0, marginTop: '2px',
                        border: selezionato ? '2px solid #1a6b4a' : '1.5px solid #c8c7be',
                        background: selezionato ? '#1a6b4a' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {selezionato && <span style={{ color: '#fff', fontSize: '10px', fontWeight: '700' }}>✓</span>}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '3px' }}>
                        {scavo.denominazione}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', background: info.bg, color: info.color, padding: '2px 8px', borderRadius: '10px' }}>{info.label}</span>
                        <span style={{ fontSize: '11px', background: '#f0efe9', color: '#555550', padding: '2px 8px', borderRadius: '10px' }}>{numUS} US</span>
                        {scavo.tipologia_intervento && (
                          <span style={{ fontSize: '11px', background: '#f0efe9', color: '#555550', padding: '2px 8px', borderRadius: '10px' }}>{scavo.tipologia_intervento}</span>
                        )}
                        {scavo.collaboratori.length > 0 && (
                          <BadgeTeam collaboratori={scavo.collaboratori} />
                        )}
                      </div>
                    </div>
                  </div>
                  {!modalita && !modalitaModifica && <div style={{ fontSize: '12px', color: '#c8c7be', marginLeft: '12px' }}>→</div>}
                  {modalitaModifica && (
                    <button
                      onClick={e => { e.stopPropagation(); setScavoDaEliminare({ id: scavo.id, denominazione: scavo.denominazione }) }}
                      style={{ fontSize: '11px', color: '#c00', background: '#fff8f8', border: '0.5px solid #e88', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer', flexShrink: 0, marginLeft: '10px' }}>
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
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '100%' }}>
            <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px' }}>Elimina scavo</div>
            <div style={{ fontSize: '13px', color: '#555550', marginBottom: '16px' }}>
              Stai per eliminare lo scavo <strong>{scavoDaEliminare.denominazione}</strong>.
            </div>
            <div style={{ fontSize: '12px', color: '#8a8a84', marginBottom: '20px' }}>Questa azione è irreversibile.</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setScavoDaEliminare(null)}
                style={{ flex: 1, padding: '9px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                Annulla
              </button>
              <button
                onClick={eliminaScavo}
                disabled={eliminando}
                style={{ flex: 1, padding: '9px', background: '#c00', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: eliminando ? 'default' : 'pointer' }}>
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
          background: '#fff', borderTop: '0.5px solid #e0dfd8',
          padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: '12px', color: '#555550', flexShrink: 0 }}>
            {selezionati.size === 0 ? 'Seleziona uno o più scavi' : `${selezionati.size} scavo${selezionati.size > 1 ? 'i' : ''} selezionato${selezionati.size > 1 ? 'i' : ''}`}
          </div>
          <select style={{ ...inp, flex: 1, maxWidth: '300px' }} value={progettoScelto} onChange={e => setProgettoScelto(e.target.value)}>
            <option value="">Scegli progetto...</option>
            {progetti.map(p => (
              <option key={p.id} value={p.id}>{p.committente ?? p.denominazione ?? 'Progetto senza nome'}</option>
            ))}
          </select>
          <button onClick={assegna} disabled={assegnando || selezionati.size === 0 || !progettoScelto}
            style={{
              padding: '8px 16px', background: selezionati.size > 0 && progettoScelto ? '#1a4a7a' : '#f0efe9',
              color: selezionati.size > 0 && progettoScelto ? '#fff' : '#8a8a84',
              border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer',
            }}>
            {assegnando ? 'Assegnazione...' : 'Assegna'}
          </button>
          <button onClick={annulla}
            style={{ padding: '8px 14px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
            Annulla
          </button>
        </div>
      )}
    </div>
  )
}
