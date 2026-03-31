'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  scavoId: string
}

export default function AggiuntaUS({ scavoId }: Props) {
  const [aperto, setAperto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAperto(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setAperto(v => !v)}
        style={{ padding: '7px 14px', background: '#1a4a7a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
        Aggiungi
        <span style={{ fontSize: '10px', opacity: 0.8 }}>{aperto ? '▲' : '▼'}</span>
      </button>
      {aperto && (
        <div style={{ position: 'absolute', right: 0, top: '36px', background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, minWidth: '180px', overflow: 'hidden' }}>
          <button onClick={() => { setAperto(false); router.push(`/reports/scavi/${scavoId}/us/nuova`) }}
            style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', fontSize: '12px', color: '#1a1a1a', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f8f7f4')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <span>⛏️</span> US
          </button>
          <div style={{ borderTop: '0.5px solid #f0efe9' }} />
          <button onClick={() => { setAperto(false); router.push(`/reports/scavi/${scavoId}/tombe/nuova`) }}
            style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', fontSize: '12px', color: '#1a1a1a', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f8f7f4')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <span>⚱️</span> Contesto funerario
          </button>
        </div>
      )}
    </div>
  )
}
