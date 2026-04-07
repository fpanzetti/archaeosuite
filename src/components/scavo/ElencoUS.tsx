'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTema } from '@/lib/theme/ThemeContext'

type US = {
  id: string
  numero_us: number
  tipo: string | null
  descrizione: string | null
  stato: string
  completata: boolean
  contesto_funerario_id: string | null
}

type Tomba = {
  id: string
  numero_tomba: number | null
  tipo_sepoltura: string | null
  tipo_deposizione: string | null
  datazione: string | null
  stato_conservazione: string | null
  completata: boolean
}

interface Props {
  scavoId: string
  usList: US[]
  tombeList?: Tomba[]
  ruolo?: string
}

type Filtro = 'tutti' | 'us' | 'funerario'

export default function ElencoUS({ scavoId, usList, tombeList = [], ruolo = 'editor' }: Props) {
  const [filtro, setFiltro] = useState<Filtro>('tutti')
  const [ricerca, setRicerca] = useState('')
  const [modificaAttiva, setModificaAttiva] = useState(false)
  const [selezionate, setSelezionate] = useState<Set<string>>(new Set())
  const [eliminando, setEliminando] = useState(false)
  const [mostraConferma, setMostraConferma] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { p } = useTema()

  // Filtro per tipo + ricerca
  const usFiltratePerTipo = filtro === 'funerario' ? [] : usList
  const tombeFiltratePerTipo = filtro === 'us' ? [] : tombeList
  const listeFiltrate = ricerca
    ? usFiltratePerTipo.filter(us => String(us.numero_us).includes(ricerca) || (us.descrizione ?? '').toLowerCase().includes(ricerca.toLowerCase()))
    : usFiltratePerTipo
  const tombeFiltrate = ricerca
    ? tombeFiltratePerTipo.filter(t => String(t.numero_tomba).includes(ricerca))
    : tombeFiltratePerTipo

  const nUS = usList.length
  const nFunerario = tombeList.length

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
    <div style={{ background: p.bgCard, border: `0.5px solid ${p.border}`, borderRadius: '10px', padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: `0.5px solid ${p.accentBlueBg}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: '500', color: p.accentBlue }}>
            Elenco schede
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ fontSize: '10px', background: p.accentBlueBg, color: p.accentBlue, padding: '1px 6px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/stratigrafia.svg" alt="US" style={{ width: '12px', height: '12px', display: 'block', opacity: 0.7 }} />
              {nUS + nFunerario}
            </span>
            <span style={{ fontSize: '10px', background: p.bgBadgeNeutro, color: p.textMuted, padding: '1px 6px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/tomba.svg" alt="Funerario" style={{ width: '12px', height: '12px', display: 'block' }} />
              {nFunerario}
            </span>
          </div>
        </div>
        {ruolo === 'editor' && (
          <button onClick={() => { setModificaAttiva(v => !v); setSelezionate(new Set()) }}
            style={{ fontSize: '11px', color: modificaAttiva ? p.accentRed : p.accentBlue, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
            {modificaAttiva ? 'Annulla' : 'Modifica'}
          </button>
        )}
      </div>

      {/* Ricerca */}
      {(nUS + nFunerario) > 10 && (
        <div style={{ marginBottom: '8px' }}>
          <input
            style={{ width: '100%', padding: '6px 10px', border: `0.5px solid ${p.borderStrong}`, borderRadius: '6px', background: p.bgInput, color: p.textPrimary, fontSize: '12px', fontFamily: 'inherit' }}
            value={ricerca}
            onChange={e => setRicerca(e.target.value)}
            placeholder="Cerca per numero US o descrizione..."
          />
        </div>
      )}

      {/* Filtri */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '12px', background: p.bgBadgeNeutro, borderRadius: '6px', padding: '3px' }}>
        {([['tutti', 'Tutte', null], ['us', 'US', '/icons/stratigrafia.svg'], ['funerario', 'Funerario', '/icons/tomba.svg']] as [Filtro, string, string | null][]).map(([val, label, icon]) => (
          <button key={val} onClick={() => setFiltro(val)}
            style={{ flex: 1, padding: '5px 4px', border: 'none', borderRadius: '5px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
              fontWeight: filtro === val ? '500' : '400', background: filtro === val ? p.bgCard : 'transparent',
              color: filtro === val ? p.accentBlue : p.textMuted, boxShadow: filtro === val ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            {icon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={icon} alt={label} style={{ width: '12px', height: '12px', display: 'block', opacity: 0.7 }} />
            )}
            {label}
          </button>
        ))}
      </div>

      {/* Barra azioni modifica */}
      {modificaAttiva && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '8px 10px', background: p.bgPage, borderRadius: '6px' }}>
          <input type="checkbox" checked={selezionate.size === listeFiltrate.length && listeFiltrate.length > 0}
            onChange={toggleTutte} style={{ cursor: 'pointer' }} />
          <span style={{ fontSize: '11px', color: p.textSecondary }}>{selezionate.size} selezionate</span>
          <div style={{ flex: 1 }} />
          {selezionate.size > 0 && (
            <button onClick={() => setMostraConferma(true)}
              style={{ padding: '5px 12px', background: p.accentRedBg, color: p.accentRed, border: `0.5px solid ${p.accentRedBorder}`, borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
              Elimina ({selezionate.size})
            </button>
          )}
        </div>
      )}

      {/* Lista */}
      {listeFiltrate.length === 0 && tombeFiltrate.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: p.textMuted, fontSize: '12px' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⛏️</div>
          {filtro === 'funerario' ? 'Nessuna scheda funeraria ancora' : filtro === 'us' ? 'Nessuna US ancora' : 'Nessuna scheda ancora'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {listeFiltrate.map(us => {
            const perc = calcolaCompletamento(us)
            const colore = coloreCompletamento(perc)
            return (
              <div key={us.id} style={{ padding: '8px 10px', background: p.bgPage, borderRadius: '6px', border: `0.5px solid ${selezionate.has(us.id) ? p.accentBlue : p.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {modificaAttiva && (
                    <input type="checkbox" checked={selezionate.has(us.id)} onChange={() => toggleSelezione(us.id)} style={{ cursor: 'pointer', flexShrink: 0 }} />
                  )}
                  <Link href={`/reports/scavi/${scavoId}/us/${us.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: p.textPrimary }}>US {us.numero_us}</span>
                      {us.tipo && (
                        <span style={{ fontSize: '11px', background: p.accentBlueBg, color: p.accentBlue, padding: '1px 6px', borderRadius: '8px' }}>
                          {us.tipo}
                        </span>
                      )}
                      {us.contesto_funerario_id && (() => {
                        const tb = tombeList.find(t => t.id === us.contesto_funerario_id)
                        return tb ? (
                          <span style={{ fontSize: '10px', background: '#f5e8f8', color: '#7a1a6b', padding: '1px 6px', borderRadius: '8px' }}>
                            Rif. Tb {tb.numero_tomba}
                          </span>
                        ) : null
                      })()}
                    </div>
                    {us.descrizione && (
                      <div style={{ fontSize: '11px', color: p.textSecondary, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {us.descrizione}
                      </div>
                    )}
                    {us.completata ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', padding: '2px 8px', background: p.accentBlueBg, border: `1px solid ${p.accentBlue}`, borderRadius: '8px', width: 'fit-content' }}>
                        <span style={{ fontSize: '11px' }}>✓</span>
                        <span style={{ fontSize: '10px', fontWeight: '500', color: p.accentBlue }}>Completata</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                        <div style={{ width: '60px', height: '4px', background: p.border, borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${perc}%`, height: '100%', background: colore, borderRadius: '2px' }} />
                        </div>
                        <span style={{ fontSize: '10px', color: colore, fontWeight: '500' }}>{perc}%</span>
                      </div>
                    )}
                  </Link>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', flexShrink: 0,
                    background: us.stato === 'classificata' ? p.accentGreenBg : us.stato === 'in_lavorazione' ? p.accentAmberBg : p.bgBadgeNeutro,
                    color: us.stato === 'classificata' ? p.accentGreen : us.stato === 'in_lavorazione' ? p.accentAmber : p.textMuted }}>
                    {us.stato === 'classificata' ? 'Classif.' : us.stato === 'in_lavorazione' ? 'In lav.' : 'Aperta'}
                  </span>
                </div>
              </div>
            )
          })}
          {tombeFiltrate.map(t => {
            const perc = t.completata ? 100 : Math.round((['tipo_sepoltura','tipo_deposizione','datazione','stato_conservazione'].filter(c => {
              const v = (t as unknown as Record<string,unknown>)[c]; return v !== null && v !== undefined && v !== ''
            }).length / 4) * 100)
            const colore = `hsl(${Math.round(perc * 1.2)}, 75%, 38%)`
            return (
              <Link key={t.id} href={`/reports/scavi/${scavoId}/tombe/${t.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ padding: '8px 10px', background: p.accentAmberBg, borderRadius: '6px', border: `0.5px solid ${p.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: p.textPrimary }}>Tb {t.numero_tomba}</span>
                        {t.tipo_sepoltura && (
                          <span style={{ fontSize: '11px', background: '#f5e8f8', color: '#7a1a6b', padding: '1px 6px', borderRadius: '8px' }}>{t.tipo_sepoltura}</span>
                        )}
                        {t.datazione && (
                          <span style={{ fontSize: '11px', background: p.bgBadgeNeutro, color: p.textSecondary, padding: '1px 6px', borderRadius: '8px' }}>{t.datazione}</span>
                        )}
                      </div>
                      {t.completata ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', padding: '2px 8px', background: p.accentBlueBg, border: `1px solid ${p.accentBlue}`, borderRadius: '8px', width: 'fit-content' }}>
                          <span style={{ fontSize: '11px' }}>✓</span>
                          <span style={{ fontSize: '10px', fontWeight: '500', color: p.accentBlue }}>Completata</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                          <div style={{ width: '60px', height: '4px', background: p.border, borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${perc}%`, height: '100%', background: colore, borderRadius: '2px' }} />
                          </div>
                          <span style={{ fontSize: '10px', color: colore, fontWeight: '500' }}>{perc}%</span>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', flexShrink: 0, background: '#f5e8f8', color: '#7a1a6b' }}>Tomba</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Modale conferma eliminazione */}
      {mostraConferma && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: p.bgCard, borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '100%' }}>
            <div style={{ fontSize: '16px', fontWeight: '500', color: p.textPrimary, marginBottom: '8px' }}>
              Conferma eliminazione
            </div>
            <div style={{ fontSize: '13px', color: p.textSecondary, marginBottom: '20px' }}>
              Stai per eliminare {selezionate.size} scheda{selezionate.size > 1 ? 'e' : ''} US con tutti i relativi rapporti stratigrafici e foto. Questa azione è irreversibile.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setMostraConferma(false)}
                style={{ flex: 1, padding: '9px', background: p.bgPage, color: p.textSecondary, border: `0.5px solid ${p.borderStrong}`, borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                Annulla
              </button>
              <button onClick={eliminaSelezionate} disabled={eliminando}
                style={{ flex: 1, padding: '9px', background: p.accentRed, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: eliminando ? 'default' : 'pointer' }}>
                {eliminando ? 'Eliminazione...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
