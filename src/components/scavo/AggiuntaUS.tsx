'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTema } from '@/lib/theme/ThemeContext'

interface Props {
  scavoId: string
}

export default function AggiuntaUS({ scavoId }: Props) {
  const [aperto, setAperto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { p } = useTema()

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
        style={{ padding: '7px 14px', background: p.accentBlue, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', minHeight: p.minTouchSize }}>
        Aggiungi
        <span style={{ fontSize: '10px', opacity: 0.8 }}>{aperto ? '▲' : '▼'}</span>
      </button>
      {aperto && (
        <div style={{ position: 'absolute', right: 0, top: '40px', background: p.bgCard, border: `0.5px solid ${p.border}`, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, minWidth: '180px', overflow: 'hidden' }}>
          <button onClick={() => { setAperto(false); router.push(`/reports/scavi/${scavoId}/us/nuova`) }}
            style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', fontSize: '12px', color: p.textPrimary, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}
            onMouseEnter={e => (e.currentTarget.style.background = p.bgHighlight)}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/stratigrafia.svg" alt="US" style={{ width: '16px', height: '16px', display: 'block', opacity: 0.8 }} />
            US
          </button>
          <div style={{ borderTop: `0.5px solid ${p.bgBadgeNeutro}` }} />
          <button onClick={async () => {
              setAperto(false)
              const { createClient } = await import('@/lib/supabase/client')
              const supabase = createClient()
              const { data: tombe } = await supabase
                .from('contesto_funerario')
                .select('numero_tomba')
                .eq('scavo_id', scavoId)
                .order('numero_tomba', { ascending: false })
                .limit(1)
              const prossimoN = (tombe?.[0]?.numero_tomba ?? 0) + 1
              const { data } = await supabase
                .from('contesto_funerario')
                .insert({ scavo_id: scavoId, numero_tomba: prossimoN })
                .select()
                .single()
              if (data) router.push(`/reports/scavi/${scavoId}/tombe/${data.id}`)
            }}
            style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', fontSize: '12px', color: p.textPrimary, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}
            onMouseEnter={e => (e.currentTarget.style.background = p.bgHighlight)}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/tomba.svg" alt="Contesto funerario" style={{ width: '16px', height: '16px', display: 'block', opacity: 0.8 }} />
            Contesto funerario
          </button>
        </div>
      )}
    </div>
  )
}
