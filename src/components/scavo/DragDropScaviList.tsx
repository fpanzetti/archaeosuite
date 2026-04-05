'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BadgeTeam from '@/components/scavo/BadgeTeam'
import GestioneProgetti from '@/components/scavo/GestioneProgetti'

type Collaboratore = { id: string; nome: string | null; cognome: string | null }

interface Scavo {
  id: string
  denominazione: string
  stato: string | null
  tipologia_intervento: string | null
  us: { count: number }[]
}

interface Progetto {
  id: string
  committente: string | null
  stato: string | null
  tipologia_intervento: string | null
  datazione_contesto: string | null
}

interface Props {
  progetti: Progetto[]
  scaviPerProgetto: Record<string, Scavo[]>
  scaviStandalone: Scavo[]
  collaboratoriPerScavo: Record<string, Collaboratore[]>
}

export default function DragDropScaviList({
  progetti,
  scaviPerProgetto,
  scaviStandalone,
  collaboratoriPerScavo,
}: Props) {
  // Stato drag & drop
  const [draggedScavoId, setDraggedScavoId] = useState<string | null>(null)
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null) // progetto id | 'standalone' | null

  // Stato sezione standalone (ex-AssegnaProgetto)
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

  // ── Drag & drop handlers ──────────────────────────────────────────────────

  async function handleDrop(targetProgettoId: string | null) {
    if (!draggedScavoId) return
    setDragOverTarget(null)
    await supabase
      .from('scavo')
      .update({ progetto_id: targetProgettoId })
      .eq('id', draggedScavoId)
    setDraggedScavoId(null)
    router.refresh()
  }

  // ── Standalone section handlers ───────────────────────────────────────────

  function toggleScavo(id: string) {
    setSelezionati(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function annullaAssegna() {
    setModalita(false)
    setSelezionati(new Set())
    setProgettoScelto('')
  }

  async function assegna() {
    if (!progettoScelto || selezionati.size === 0) return
    setAssegnando(true)
    await supabase.from('scavo').update({ progetto_id: progettoScelto }).in('id', [...selezionati])
    setAssegnando(false)
    annullaAssegna()
    router.refresh()
  }

  async function eliminaScavo() {
    if (!scavoDaEliminare) return
    setEliminando(true)
    await supabase.from('scavo').delete().eq('id', scavoDaEliminare.id)
    setEliminando(false)
    setScavoDaEliminare(null)
    router.refresh()
  }

  const inpStyle: React.CSSProperties = {
    padding: '7px 10px', border: '0.5px solid #c8c7be', borderRadius: '6px',
    background: '#f8f7f4', color: '#1a1a1a', fontSize: '12px', fontFamily: 'inherit',
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Sezione Progetti ── */}
      {progetti.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#8a8a84', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Progetti
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {progetti.map(progetto => {
              const scaviP = scaviPerProgetto[progetto.id] ?? []
              const statoP = statoInfo(progetto.stato)
              const isDragOver = dragOverTarget === progetto.id && draggedScavoId !== null
              return (
                <div
                  key={progetto.id}
                  onDragOver={e => { e.preventDefault(); setDragOverTarget(progetto.id) }}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverTarget(null) }}
                  onDrop={e => { e.preventDefault(); handleDrop(progetto.id) }}
                  style={{
                    background: isDragOver ? '#eef4ff' : '#fff',
                    border: isDragOver ? '1.5px dashed #1a4a7a' : '0.5px solid #e0dfd8',
                    borderRadius: '10px', overflow: 'hidden',
                    transition: 'border 0.15s, background 0.15s',
                  }}
                >
                  {/* Header progetto */}
                  <div style={{ padding: '14px 16px', borderBottom: scaviP.length > 0 ? '0.5px solid #f0efe9' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px' }}>📁</span>
                          <Link href={`/reports/progetti/${progetto.id}`} style={{ textDecoration: 'none' }}>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>
                              {progetto.committente ?? 'Progetto senza nome'}
                            </span>
                          </Link>
                          <span style={{ fontSize: '11px', background: statoP.bg, color: statoP.color, padding: '1px 6px', borderRadius: '8px' }}>
                            {statoP.label}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#8a8a84' }}>
                          {[progetto.tipologia_intervento, progetto.datazione_contesto].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', background: '#f0efe9', color: '#555550', padding: '2px 8px', borderRadius: '10px' }}>
                          {scaviP.length} scavi
                        </span>
                        <Link
                          href={`/reports/scavi/nuovo?progetto_id=${progetto.id}`}
                          style={{ fontSize: '11px', color: '#1a4a7a', textDecoration: 'none', padding: '2px 8px', border: '0.5px solid #1a4a7a40', borderRadius: '4px' }}
                        >
                          + Scavo
                        </Link>
                        <GestioneProgetti
                          progettoId={progetto.id}
                          committente={progetto.committente ?? 'Progetto senza nome'}
                          numScavi={scaviP.length}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Corpo: scavi del progetto */}
                  {scaviP.length > 0 ? (
                    <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '6px', background: isDragOver ? '#eef4ff' : '#fafaf8' }}>
                      {scaviP.map(scavo => {
                        const info = statoInfo(scavo.stato)
                        const numUS = scavo.us?.[0]?.count ?? 0
                        const isDragging = draggedScavoId === scavo.id
                        return (
                          <div
                            key={scavo.id}
                            draggable
                            onDragStart={e => {
                              e.stopPropagation()
                              setDraggedScavoId(scavo.id)
                              e.dataTransfer.effectAllowed = 'move'
                            }}
                            onDragEnd={() => { setDraggedScavoId(null); setDragOverTarget(null) }}
                            onClick={() => { if (!draggedScavoId) router.push(`/reports/scavi/${scavo.id}`) }}
                            style={{
                              padding: '10px 12px',
                              background: isDragging ? '#f0ede4' : '#f8f7f4',
                              borderRadius: '6px', border: '0.5px solid #e0dfd8',
                              cursor: 'grab', opacity: isDragging ? 0.5 : 1,
                              transition: 'opacity 0.15s',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '3px' }}>
                                  {scavo.denominazione}
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                  <span style={{ fontSize: '11px', background: info.bg, color: info.color, padding: '1px 6px', borderRadius: '8px' }}>{info.label}</span>
                                  <span style={{ fontSize: '11px', background: '#f0efe9', color: '#555550', padding: '1px 6px', borderRadius: '8px' }}>{numUS} US</span>
                                  {(collaboratoriPerScavo[scavo.id] ?? []).length > 0 && (
                                    <BadgeTeam collaboratori={collaboratoriPerScavo[scavo.id]} />
                                  )}
                                </div>
                              </div>
                              <div style={{ fontSize: '14px', color: '#c8c7be', marginLeft: '12px', userSelect: 'none' }}>⠿</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{
                      padding: '12px 16px', fontSize: '12px',
                      color: isDragOver ? '#1a4a7a' : '#c8c7be',
                      background: isDragOver ? '#eef4ff' : '#fafaf8',
                      textAlign: isDragOver ? 'center' : 'left',
                    }}>
                      {isDragOver
                        ? '↓ Rilascia per aggiungere a questo progetto'
                        : <>Nessuno scavo ancora —{' '}<Link href={`/reports/scavi/nuovo?progetto_id=${progetto.id}`} style={{ color: '#1a4a7a' }}>creane uno</Link></>
                      }
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Sezione Scavi standalone ── */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOverTarget('standalone') }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverTarget(null) }}
        onDrop={e => { e.preventDefault(); handleDrop(null) }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#8a8a84', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Scavi non assegnati a progetti
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {!modalita && !modalitaModifica && progetti.length > 0 && scaviStandalone.length > 0 && (
              <button
                onClick={() => setModalita(true)}
                style={{ fontSize: '11px', color: '#8a5c0a', background: '#fdf3e0', border: '0.5px solid #8a5c0a40', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}
              >
                📁 Aggiungi a progetto
              </button>
            )}
            {!modalita && !modalitaModifica && scaviStandalone.length > 0 && (
              <button
                onClick={() => setModalitaModifica(true)}
                style={{ fontSize: '11px', color: '#555550', background: '#f8f7f4', border: '0.5px solid #c8c7be', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}
              >
                Modifica
              </button>
            )}
            {modalitaModifica && (
              <button
                onClick={() => { setModalitaModifica(false); setScavoDaEliminare(null) }}
                style={{ fontSize: '11px', color: '#8a8a84', background: '#f8f7f4', border: '0.5px solid #c8c7be', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Lista scavi standalone */}
        {scaviStandalone.length === 0 ? (
          <div style={{
            fontSize: '12px', padding: '16px',
            color: dragOverTarget === 'standalone' ? '#1a4a7a' : '#c8c7be',
            border: dragOverTarget === 'standalone' ? '1.5px dashed #1a4a7a' : '1.5px dashed transparent',
            borderRadius: '10px',
            background: dragOverTarget === 'standalone' ? '#eef4ff' : 'transparent',
            textAlign: 'center',
            transition: 'border 0.15s, background 0.15s',
          }}>
            {dragOverTarget === 'standalone'
              ? '↓ Rilascia per rimuovere dal progetto'
              : 'Tutti gli scavi sono assegnati a un progetto'}
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '8px',
            border: dragOverTarget === 'standalone' && draggedScavoId ? '1.5px dashed #1a4a7a' : '1.5px dashed transparent',
            borderRadius: '10px',
            padding: dragOverTarget === 'standalone' && draggedScavoId ? '8px' : '0',
            background: dragOverTarget === 'standalone' && draggedScavoId ? '#eef4ff' : 'transparent',
            transition: 'border 0.15s, background 0.15s, padding 0.15s',
          }}>
            {scaviStandalone.map(scavo => {
              const info = statoInfo(scavo.stato)
              const numUS = scavo.us?.[0]?.count ?? 0
              const selezionato = selezionati.has(scavo.id)
              const isDragging = draggedScavoId === scavo.id
              return (
                <div
                  key={scavo.id}
                  draggable={!modalita && !modalitaModifica}
                  onDragStart={e => { setDraggedScavoId(scavo.id); e.dataTransfer.effectAllowed = 'move' }}
                  onDragEnd={() => { setDraggedScavoId(null); setDragOverTarget(null) }}
                  onClick={() => modalita ? toggleScavo(scavo.id) : modalitaModifica ? undefined : router.push(`/reports/scavi/${scavo.id}`)}
                  style={{
                    background: selezionato ? '#e8f4ef' : isDragging ? '#f0ede4' : '#fff',
                    border: selezionato ? '0.5px solid #1a6b4a' : '0.5px solid #e0dfd8',
                    borderRadius: '10px', padding: '14px 16px',
                    cursor: modalita ? 'pointer' : modalitaModifica ? 'default' : 'grab',
                    opacity: isDragging ? 0.5 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
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
                          {(collaboratoriPerScavo[scavo.id] ?? []).length > 0 && (
                            <BadgeTeam collaboratori={collaboratoriPerScavo[scavo.id]} />
                          )}
                        </div>
                      </div>
                    </div>
                    {!modalita && !modalitaModifica && (
                      <div style={{ fontSize: '14px', color: '#c8c7be', marginLeft: '12px', userSelect: 'none' }}>⠿</div>
                    )}
                    {modalitaModifica && (
                      <button
                        onClick={e => { e.stopPropagation(); setScavoDaEliminare({ id: scavo.id, denominazione: scavo.denominazione }) }}
                        style={{ fontSize: '11px', color: '#c00', background: '#fff8f8', border: '0.5px solid #e88', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer', flexShrink: 0, marginLeft: '10px' }}
                      >
                        Elimina
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modal conferma eliminazione scavo ── */}
      {scavoDaEliminare && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '100%' }}>
            <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px' }}>Elimina scavo</div>
            <div style={{ fontSize: '13px', color: '#555550', marginBottom: '16px' }}>
              Stai per eliminare lo scavo <strong>{scavoDaEliminare.denominazione}</strong>.
            </div>
            <div style={{ fontSize: '12px', color: '#8a8a84', marginBottom: '20px' }}>Questa azione è irreversibile.</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setScavoDaEliminare(null)}
                style={{ flex: 1, padding: '9px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                Annulla
              </button>
              <button onClick={eliminaScavo} disabled={eliminando}
                style={{ flex: 1, padding: '9px', background: '#c00', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: eliminando ? 'default' : 'pointer' }}>
                {eliminando ? 'Eliminazione...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Barra di assegnazione (modalità Aggiungi a progetto) ── */}
      {modalita && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: '#fff', borderTop: '0.5px solid #e0dfd8',
          padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: '12px', color: '#555550', flexShrink: 0 }}>
            {selezionati.size === 0
              ? 'Seleziona uno o più scavi'
              : `${selezionati.size} scavo${selezionati.size > 1 ? 'i' : ''} selezionato${selezionati.size > 1 ? 'i' : ''}`}
          </div>
          <select
            style={{ ...inpStyle, flex: 1, maxWidth: '300px' }}
            value={progettoScelto}
            onChange={e => setProgettoScelto(e.target.value)}
          >
            <option value="">Scegli progetto...</option>
            {progetti.map(p => (
              <option key={p.id} value={p.id}>{p.committente ?? 'Progetto senza nome'}</option>
            ))}
          </select>
          <button
            onClick={assegna}
            disabled={assegnando || selezionati.size === 0 || !progettoScelto}
            style={{
              padding: '8px 16px',
              background: selezionati.size > 0 && progettoScelto ? '#1a4a7a' : '#f0efe9',
              color: selezionati.size > 0 && progettoScelto ? '#fff' : '#8a8a84',
              border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer',
            }}
          >
            {assegnando ? 'Assegnazione...' : 'Assegna'}
          </button>
          <button onClick={annullaAssegna}
            style={{ padding: '8px 14px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
            Annulla
          </button>
        </div>
      )}
    </>
  )
}
