'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type US = {
  id: string
  numero_us: number
  tipo: string | null
  descrizione: string | null
  stato: string
  completata: boolean
}

interface Props {
  scavoId: string
  usList: US[]
}

type Filtro = 'tutti' | 'us' | 'funerario'

export default function ElencoUS({ scavoId, usList }: Props) {
  const [filtro, setFiltro] = useState<Filtro>('tutti')
  const [modificaAttiva, setModificaAttiva] = useState(false)
  const [selezionate, setSelezionate] = useState<Set<string>>(new Set())
  const [eliminando, setEliminando] = useState(false)
  const [mostraConferma, setMostraConferma] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Per ora tutte le US sono tipo "us" — il tipo funerario arriverà dopo
  const listeFiltrate = usList.filter(us => {
    if (filtro === 'tutti') return true
    if (filtro === 'us') return true // tutti per ora
    if (filtro === 'funerario') return false // nessuno per ora
    return true
  })

  const nUS = usList.length
  const nFunerario = 0 // placeholder

  function toggleSelezione(id: string) {
    setSelezionate(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleTutte() {
    if (selezionate.size === listeFiltrate.length) setSelezionate(new Set())
    else setSelezionate(new Set(listeFiltrate.map(u => u.id)))
  }

  async function eliminaSelezionate() {
    setEliminando(true)
    for (const id of selezionate) {
      await supabase.from('rapporto_stratigrafico').delete().eq('us_id', id)
      await supabase.from('rapporto_stratigrafico').delete().eq('us_correlata_id', id)
      await supabase.from('foto').delete().eq('us_id', id)
      await supabase.from('us').delete().eq('id', id)
    }
    setEliminando(false)
    setMostraConferma(false)
    setSelezionate(new Set())
    setModificaAttiva(false)
    router.refresh()
  }

  function calcolaCompletamento(us: US): number {
    if (us.completata) return 100
    const campi = ['tipo', 'descrizione', 'colore', 'consistenza', 'quota_min', 'quota_max', 'osservazioni', 'interpretazione', 'cronologia_iniziale']
    const valorizzati = campi.filter(c => {
      const v = (us as Record<string, unknown>)[c]
      return v !== null && v !== undefined && v !== ''
    }).length
    return Math.round((valorizzati / campi.length) * 100)
  }

  function coloreCompletamento(perc: number): string {
    const hue = Math.round(perc * 1.2)
    return `hsl(${hue}, 75%, 38%)`
  }

  return (
    <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px', padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '0.5px solid #e8f0f8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: '500', color: '#1a4a7a' }}>
            Unità stratigrafiche
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ fontSize: '10px', background: '#e8f0f8', color: '#1a4a7a', padding: '1px 6px', borderRadius: '8px' }}>
              US {nUS}
            </span>
            <span style={{ fontSize: '10px', background: '#f0efe9', color: '#8a8a84', padding: '1px 6px', borderRadius: '8px' }}>
              ⚱️ {nFunerario}
            </span>
          </div>
        </div>
        <button onClick={() => { setModificaAttiva(v => !v); setSelezionate(new Set()) }}
          style={{ fontSize: '11px', color: modificaAttiva ? '#c00' : '#1a4a7a', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
          {modificaAttiva ? 'Annulla' : 'Modifica'}
        </button>
      </div>

      {/* Filtri */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '12px', background: '#f0efe9', borderRadius: '6px', padding: '3px' }}>
        {([['tutti', 'Tutte'], ['us', 'US'], ['funerario', '⚱️ Funerario']] as [Filtro, string][]).map(([val, label]) => (
          <button key={val} onClick={() => setFiltro(val)}
            style={{ flex: 1, padding: '5px 4px', border: 'none', borderRadius: '5px', fontSize: '11px', cursor: 'pointer',
              fontWeight: filtro === val ? '500' : '400', background: filtro === val ? '#fff' : 'transparent',
              color: filtro === val ? '#1a4a7a' : '#8a8a84', boxShadow: filtro === val ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Barra azioni modifica */}
      {modificaAttiva && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '8px 10px', background: '#f8f7f4', borderRadius: '6px' }}>
          <input type="checkbox" checked={selezionate.size === listeFiltrate.length && listeFiltrate.length > 0}
            onChange={toggleTutte} style={{ cursor: 'pointer' }} />
          <span style={{ fontSize: '11px', color: '#555550' }}>{selezionate.size} selezionate</span>
          <div style={{ flex: 1 }} />
          {selezionate.size > 0 && (
            <button onClick={() => setMostraConferma(true)}
              style={{ padding: '5px 12px', background: '#fff8f8', color: '#c00', border: '0.5px solid #e88', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
              Elimina ({selezionate.size})
            </button>
          )}
        </div>
      )}

      {/* Lista */}
      {listeFiltrate.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#8a8a84', fontSize: '12px' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⛏️</div>
          {filtro === 'funerario' ? 'Nessuna scheda funeraria ancora' : 'Nessuna US ancora'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {listeFiltrate.map(us => {
            const perc = calcolaCompletamento(us)
            const colore = coloreCompletamento(perc)
            return (
              <div key={us.id} style={{ padding: '8px 10px', background: '#f8f7f4', borderRadius: '6px', border: `0.5px solid ${selezionate.has(us.id) ? '#1a4a7a' : '#e0dfd8'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {modificaAttiva && (
                    <input type="checkbox" checked={selezionate.has(us.id)} onChange={() => toggleSelezione(us.id)} style={{ cursor: 'pointer', flexShrink: 0 }} />
                  )}
                  <Link href={`/reports/scavi/${scavoId}/us/${us.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>US {us.numero_us}</span>
                      {us.tipo && (
                        <span style={{ fontSize: '11px', background: '#e8f0f8', color: '#1a4a7a', padding: '1px 6px', borderRadius: '8px' }}>
                          {us.tipo}
                        </span>
                      )}
                    </div>
                    {us.descrizione && (
                      <div style={{ fontSize: '11px', color: '#555550', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {us.descrizione}
                      </div>
                    )}
                    {us.completata ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', padding: '2px 8px', background: '#e8f0f8', border: '1px solid #185FA5', borderRadius: '8px', width: 'fit-content' }}>
                        <span style={{ fontSize: '11px' }}>✓</span>
                        <span style={{ fontSize: '10px', fontWeight: '500', color: '#185FA5' }}>Completata</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                        <div style={{ width: '60px', height: '4px', background: '#e0dfd8', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${perc}%`, height: '100%', background: colore, borderRadius: '2px' }} />
                        </div>
                        <span style={{ fontSize: '10px', color: colore, fontWeight: '500' }}>{perc}%</span>
                      </div>
                    )}
                  </Link>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', flexShrink: 0,
                    background: us.stato === 'classificata' ? '#e8f4ef' : us.stato === 'in_lavorazione' ? '#fdf3e0' : '#f0efe9',
                    color: us.stato === 'classificata' ? '#1a6b4a' : us.stato === 'in_lavorazione' ? '#8a5c0a' : '#8a8a84' }}>
                    {us.stato === 'classificata' ? 'Classif.' : us.stato === 'in_lavorazione' ? 'In lav.' : 'Aperta'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modale conferma eliminazione */}
      {mostraConferma && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '100%' }}>
            <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px' }}>
              Conferma eliminazione
            </div>
            <div style={{ fontSize: '13px', color: '#555550', marginBottom: '20px' }}>
              Stai per eliminare {selezionate.size} scheda{selezionate.size > 1 ? 'e' : ''} US con tutti i relativi rapporti stratigrafici e foto. Questa azione è irreversibile.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setMostraConferma(false)}
                style={{ flex: 1, padding: '9px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                Annulla
              </button>
              <button onClick={eliminaSelezionate} disabled={eliminando}
                style={{ flex: 1, padding: '9px', background: '#c00', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: eliminando ? 'default' : 'pointer' }}>
                {eliminando ? 'Eliminazione...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
