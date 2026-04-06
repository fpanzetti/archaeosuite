'use client'
import Link from 'next/link'
import { useTema } from '@/lib/theme/ThemeContext'
import EliminaProgetto from '@/components/scavo/EliminaProgetto'

interface Progetto {
  id: string
  committente: string | null
  stato: string | null
  datazione_contesto: string | null
  tipologia_intervento: string | null
  tipo_contesto: string | null
  operatore: string | null
  direttore_scientifico: string | null
  data_inizio: string | null
  note: string | null
}

interface Scavo {
  id: string
  denominazione: string | null
  stato: string | null
  us: { count: number }[]
}

interface Props {
  progetto: Progetto
  scavi: Scavo[]
}

export default function ProgettoDettaglio({ progetto, scavi }: Props) {
  const { p } = useTema()

  const statoInfo = (s: string | null) => {
    if (s === 'in_corso') return { label: 'In corso', bg: p.accentBlueBg, color: p.accentBlue }
    if (s === 'in_elaborazione') return { label: 'In elaborazione', bg: p.accentAmberBg, color: p.accentAmber }
    return { label: 'Archiviato', bg: p.bgBadgeNeutro, color: p.textMuted }
  }

  const statoProgetto = statoInfo(progetto.stato)

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '11px', color: p.textMuted, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link href="/reports" style={{ color: p.accentBlue, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', border: `0.5px solid ${p.borderStrong}`, borderRadius: '6px', fontSize: '11px' }}>
          ← Elenco attività
        </Link>
        <span style={{ color: p.border }}>/</span>
        <span>{progetto.committente ?? 'Progetto'}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', background: p.accentAmberBg, color: p.accentAmber, padding: '2px 8px', borderRadius: '10px', fontWeight: '500' }}>📁 Progetto</span>
            <span style={{ fontSize: '11px', background: statoProgetto.bg, color: statoProgetto.color, padding: '2px 8px', borderRadius: '10px', fontWeight: '500' }}>{statoProgetto.label}</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: p.textPrimary }}>
            {progetto.committente ?? '—'}
          </h1>
          {progetto.datazione_contesto && (
            <p style={{ fontSize: '13px', color: p.textSecondary, marginTop: '4px' }}>{progetto.datazione_contesto}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <EliminaProgetto
            progettoId={progetto.id}
            committente={progetto.committente ?? 'Progetto senza nome'}
            numScavi={scavi.length}
          />
          <Link href={`/reports/scavi/nuovo?progetto_id=${progetto.id}`}>
            <button style={{ padding: '7px 14px', background: p.accentBlue, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              + Nuovo scavo
            </button>
          </Link>
        </div>
      </div>

      {/* Info progetto */}
      <div style={{ background: p.bgCard, border: `0.5px solid ${p.border}`, borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: '500', color: p.accentBlue, marginBottom: '12px', paddingBottom: '8px', borderBottom: `0.5px solid ${p.accentBlueBg}` }}>
          Dati progetto
        </div>
        <div style={{ fontSize: '12px', lineHeight: '2', color: p.textSecondary }}>
          {progetto.committente && <div><span style={{ color: p.textMuted }}>Ente responsabile: </span>{progetto.committente}</div>}
          {progetto.operatore && <div><span style={{ color: p.textMuted }}>Operatore: </span>{progetto.operatore}</div>}
          {progetto.direttore_scientifico && <div><span style={{ color: p.textMuted }}>Direttore scientifico: </span>{progetto.direttore_scientifico}</div>}
          {progetto.tipologia_intervento && <div><span style={{ color: p.textMuted }}>Tipologia: </span>{progetto.tipologia_intervento}</div>}
          {progetto.tipo_contesto && <div><span style={{ color: p.textMuted }}>Tipo contesto: </span>{progetto.tipo_contesto}</div>}
          {progetto.data_inizio && <div><span style={{ color: p.textMuted }}>Data inizio: </span>{new Date(progetto.data_inizio).toLocaleDateString('it-IT')}</div>}
          {progetto.note && <div style={{ marginTop: '6px', padding: '6px 8px', background: p.bgInput, borderRadius: '4px' }}><span style={{ color: p.textMuted }}>Note: </span>{progetto.note}</div>}
        </div>
      </div>

      {/* Lista scavi del progetto */}
      <div style={{ background: p.bgCard, border: `0.5px solid ${p.border}`, borderRadius: '10px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: `0.5px solid ${p.accentBlueBg}` }}>
          <div style={{ fontSize: '11px', fontWeight: '500', color: p.accentBlue }}>
            Scavi ({scavi.length})
          </div>
          <Link href={`/reports/scavi/nuovo?progetto_id=${progetto.id}`} style={{ fontSize: '11px', color: p.accentBlue, textDecoration: 'none' }}>
            + Aggiungi
          </Link>
        </div>
        {scavi.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: p.textMuted, fontSize: '12px' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⛏️</div>
            Nessuno scavo ancora
            <div style={{ marginTop: '8px' }}>
              <Link href={`/reports/scavi/nuovo?progetto_id=${progetto.id}`} style={{ color: p.accentBlue, fontSize: '12px' }}>
                Crea il primo scavo →
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {scavi.map(scavo => {
              const info = statoInfo(scavo.stato)
              const numUS = scavo.us?.[0]?.count ?? 0
              return (
                <Link key={scavo.id} href={`/reports/scavi/${scavo.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '10px 12px', background: p.bgInput, borderRadius: '6px', border: `0.5px solid ${p.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: p.textPrimary, marginBottom: '3px' }}>
                          {scavo.denominazione}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span style={{ fontSize: '11px', background: info.bg, color: info.color, padding: '1px 6px', borderRadius: '8px' }}>{info.label}</span>
                          <span style={{ fontSize: '11px', background: p.bgBadgeNeutro, color: p.textSecondary, padding: '1px 6px', borderRadius: '8px' }}>{numUS} US</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: p.borderStrong }}>→</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
