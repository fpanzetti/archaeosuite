'use client'
import { useTema } from '@/lib/theme/ThemeContext'

export default function TombsClient() {
  const { p } = useTema()

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', color: p.textMuted, marginBottom: '6px' }}>ArchaeoTombs</div>
        <h1 style={{ fontSize: '20px', fontWeight: '500', color: p.textPrimary }}>Contesti funerari</h1>
        <p style={{ fontSize: '12px', color: p.textMuted, marginTop: '4px' }}>Schede tomba, antropologia e corredo</p>
      </div>
      <div style={{ background: p.bgCard, border: `0.5px solid ${p.border}`, borderRadius: '10px', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚱️</div>
        <p style={{ fontSize: '14px', color: p.textSecondary, marginBottom: '8px' }}>In sviluppo</p>
        <p style={{ fontSize: '12px', color: p.textMuted }}>Le schede tomba saranno disponibili a breve</p>
      </div>
    </div>
  )
}
