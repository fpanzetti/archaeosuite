'use client'
import { useState } from 'react'

type Collaboratore = { id: string; nome: string | null; cognome: string | null }

const COLORI = ['#1a4a7a', '#1a6b4a', '#8a5c0a', '#7a1a6b', '#4a1a6b', '#1a6b6b']

function iniziali(c: Collaboratore) {
  const n = (c.nome?.[0] ?? '').toUpperCase()
  const cg = (c.cognome?.[0] ?? '').toUpperCase()
  return n + cg || '?'
}

export default function BadgeTeam({ collaboratori }: { collaboratori: Collaboratore[] }) {
  const [aperto, setAperto] = useState<string | null>(null)

  if (collaboratori.length === 0) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', position: 'relative' }}>
      <span style={{ fontSize: '10px', color: '#8a8a84', marginRight: '2px' }}>Team:</span>
      {collaboratori.map((c, i) => {
        const colore = COLORI[i % COLORI.length]
        const isAperto = aperto === c.id
        return (
          <div key={c.id} style={{ position: 'relative' }}>
            <div
              onClick={e => { e.preventDefault(); e.stopPropagation(); setAperto(isAperto ? null : c.id) }}
              style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: colore, color: '#fff',
                fontSize: '9px', fontWeight: '600',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', userSelect: 'none',
                border: '1.5px solid #fff',
                marginLeft: i > 0 ? '-6px' : '0',
                zIndex: i,
                position: 'relative',
              }}
            >
              {iniziali(c)}
            </div>
            {isAperto && (
              <div style={{
                position: 'absolute', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
                background: '#1a1a1a', color: '#fff', borderRadius: '6px',
                padding: '6px 10px', fontSize: '11px', whiteSpace: 'nowrap',
                zIndex: 1000, pointerEvents: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}>
                {[c.nome, c.cognome].filter(Boolean).join(' ') || 'Utente'}
                <div style={{
                  position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                  border: '4px solid transparent', borderTopColor: '#1a1a1a',
                }} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
