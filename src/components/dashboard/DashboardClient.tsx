'use client'
import { useTema } from '@/lib/theme/ThemeContext'

export default function DashboardClient({ nome }: { nome: string }) {
  const { p } = useTema()

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '500', color: p.textPrimary }}>Benvenuto, {nome}</h1>
        <p style={{ fontSize: '12px', color: p.textMuted, marginTop: '4px' }}>Seleziona un modulo per iniziare</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
        <a href="/reports" style={{ textDecoration: 'none' }}>
          <div style={{ background: p.bgCard, border: `0.5px solid ${p.border}`, borderLeft: `3px solid ${p.accentBlue}`, borderRadius: '10px', padding: '14px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>📋</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: p.accentBlue }}>ArchaeoReports</div>
                <span style={{ fontSize: '10px', background: p.accentBlueBg, color: p.accentBlue, padding: '2px 7px', borderRadius: '10px' }}>In sviluppo</span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: p.textMuted }}>Diario di scavo, schede US, documentazione stratigrafica</p>
          </div>
        </a>
        <a href="/tombs" style={{ textDecoration: 'none' }}>
          <div style={{ background: p.bgCard, border: `0.5px solid ${p.border}`, borderLeft: `3px solid ${p.accentAmber}`, borderRadius: '10px', padding: '14px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>⚱️</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: p.accentAmber }}>ArchaeoTombs</div>
                <span style={{ fontSize: '10px', background: p.accentAmberBg, color: p.accentAmber, padding: '2px 7px', borderRadius: '10px' }}>In sviluppo</span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: p.textMuted }}>Schede contesti funerari, antropologia, corredo</p>
          </div>
        </a>
        <div style={{ background: p.bgCard, border: `0.5px solid ${p.border}`, borderLeft: `3px solid ${p.border}`, borderRadius: '10px', padding: '14px', opacity: 0.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>📦</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: p.textSecondary }}>ArchaeoFinds</div>
              <span style={{ fontSize: '10px', background: p.bgBadgeNeutro, color: p.textMuted, padding: '2px 7px', borderRadius: '10px' }}>Prossimamente</span>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: p.textMuted }}>Gestione magazzino, CMD, cassette, reperti notevoli</p>
        </div>
        <div style={{ background: p.bgCard, border: `0.5px solid ${p.border}`, borderLeft: `3px solid ${p.border}`, borderRadius: '10px', padding: '14px', opacity: 0.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>🗺️</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: p.textSecondary }}>ArchaeoSurvey</div>
              <span style={{ fontSize: '10px', background: p.bgBadgeNeutro, color: p.textMuted, padding: '2px 7px', borderRadius: '10px' }}>Prossimamente</span>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: p.textMuted }}>Ricognizioni sistematiche, raccolta dati sul campo</p>
        </div>
      </div>
    </div>
  )
}
