'use client'
import Link from 'next/link'
import { useTema } from '@/lib/theme/ThemeContext'
import DragDropScaviList from '@/components/scavo/DragDropScaviList'

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
  totaleScavi: number
  inCorso: number
  inElab: number
  archiviati: number
  stato?: string
  q?: string
}

export default function ReportsClient({
  progetti, scaviPerProgetto, scaviStandalone, collaboratoriPerScavo,
  totaleScavi, inCorso, inElab, archiviati, stato, q,
}: Props) {
  const { p } = useTema()

  return (
    <div style={{ padding: '24px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: p.textPrimary }}>ArchaeoReports</h1>
          <p style={{ fontSize: '12px', color: p.textMuted, marginTop: '4px' }}>
            {progetti.length} progetti · {totaleScavi} scavi
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/reports/progetti/nuovo">
            <button style={{ padding: '8px 14px', background: p.accentAmberBg, color: p.accentAmber, border: `0.5px solid ${p.accentAmber}40`, borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              📁 Nuovo progetto
            </button>
          </Link>
          <Link href="/reports/scavi/nuovo">
            <button style={{ padding: '8px 16px', background: p.accentBlue, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              + Nuovo scavo
            </button>
          </Link>
        </div>
      </div>

      {/* Filtri */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { key: 'tutti', label: `Tutti (${totaleScavi})` },
          { key: 'in_corso', label: `In corso (${inCorso})` },
          { key: 'in_elaborazione', label: `In elaborazione (${inElab})` },
          { key: 'archiviato', label: `Archiviati (${archiviati})` },
        ].map(f => {
          const attivo = (!stato && f.key === 'tutti') || stato === f.key
          return (
            <Link key={f.key} href={`/reports${f.key === 'tutti' ? '' : `?stato=${f.key}`}${q ? `${f.key === 'tutti' ? '?' : '&'}q=${q}` : ''}`}>
              <button style={{
                padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                background: attivo ? p.accentBlue : p.bgInput,
                color: attivo ? '#fff' : p.textSecondary,
                border: attivo ? 'none' : `0.5px solid ${p.borderStrong}`,
                fontWeight: attivo ? '500' : '400',
              }}>
                {f.label}
              </button>
            </Link>
          )
        })}
      </div>

      {/* Barra ricerca */}
      <form method="GET" action="/reports" style={{ marginBottom: '24px' }}>
        {stato && <input type="hidden" name="stato" value={stato} />}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input name="q" defaultValue={q} placeholder="Cerca scavi..."
            style={{ flex: 1, padding: '8px 12px', border: `0.5px solid ${p.borderStrong}`, borderRadius: '6px', background: p.bgInput, color: p.textPrimary, fontSize: '12px' }} />
          <button type="submit"
            style={{ padding: '8px 16px', background: p.bgInput, color: p.textSecondary, border: `0.5px solid ${p.borderStrong}`, borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
            Cerca
          </button>
          {q && (
            <Link href={`/reports${stato ? `?stato=${stato}` : ''}`}>
              <button type="button" style={{ padding: '8px 12px', background: p.bgInput, color: p.textMuted, border: `0.5px solid ${p.borderStrong}`, borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
            </Link>
          )}
        </div>
      </form>

      {/* Sezione Progetti + Scavi standalone */}
      {scaviStandalone.length === 0 && progetti.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: p.textMuted }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⛏️</div>
          <div style={{ fontSize: '14px', marginBottom: '6px' }}>
            {q ? `Nessun risultato per "${q}"` : 'Nessuno scavo ancora'}
          </div>
          {!q && (
            <div style={{ fontSize: '12px' }}>
              <Link href="/reports/scavi/nuovo" style={{ color: p.accentBlue }}>Crea il primo scavo →</Link>
              {' · '}
              <Link href="/reports/progetti/nuovo" style={{ color: p.accentAmber }}>o crea un progetto →</Link>
            </div>
          )}
        </div>
      ) : (
        <DragDropScaviList
          progetti={progetti}
          scaviPerProgetto={scaviPerProgetto}
          scaviStandalone={scaviStandalone}
          collaboratoriPerScavo={collaboratoriPerScavo}
        />
      )}
    </div>
  )
}
