'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Tomba {
  id: string
  numero_tomba: number | null
  tipo_sepoltura: string | null
  tipo_deposizione: string | null
  datazione: string | null
  stato_conservazione: string | null
  settore: string | null
  completata: boolean
  orientamento_cranio: string | null
  rituale: string | null
  stima_eta: string | null
  stima_sesso: string | null
  interpretazione: string | null
}

interface Props {
  scavoId: string
}

export default function ElencoTombe({ scavoId }: Props) {
  const [tombe, setTombe] = useState<Tomba[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function carica() {
      setLoading(true)
      const { data } = await supabase
        .from('contesto_funerario')
        .select('id, numero_tomba, tipo_sepoltura, tipo_deposizione, datazione, stato_conservazione, settore, completata, orientamento_cranio, rituale, stima_eta, stima_sesso, interpretazione')
        .eq('scavo_id', scavoId)
        .order('numero_tomba')
      setTombe(data ?? [])
      setLoading(false)
    }
    carica()
  }, [scavoId])

  if (loading) return <div style={{ fontSize: '12px', color: '#8a8a84', padding: '8px 0' }}>Caricamento tombe...</div>

  if (tombe.length === 0) return (
    <div style={{ textAlign: 'center', padding: '20px', color: '#8a8a84', fontSize: '12px', background: '#f8f7f4', borderRadius: '8px', border: '0.5px dashed #c8c7be' }}>
      Nessun contesto funerario ancora
    </div>
  )

  function calcolaCompletamento(t: Tomba): number {
    if (t.completata) return 100
    const campi = ['tipo_sepoltura', 'tipo_deposizione', 'datazione', 'stato_conservazione', 'orientamento_cranio', 'rituale', 'stima_eta', 'stima_sesso', 'interpretazione']
    const valorizzati = campi.filter(c => {
      const v = (t as unknown as Record<string, unknown>)[c]
      return v !== null && v !== undefined && v !== ''
    }).length
    return Math.round((valorizzati / campi.length) * 100)
  }

  function coloreCompletamento(perc: number): string {
    const hue = Math.round(perc * 1.2)
    return `hsl(${hue}, 75%, 38%)`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {tombe.map(t => {
        const perc = calcolaCompletamento(t)
        const colore = coloreCompletamento(perc)
        return (
        <div key={t.id}
          onClick={() => router.push(`/reports/scavi/${scavoId}/tombe/${t.id}`)}
          style={{ padding: '10px 14px', background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '3px' }}>
              Tomba {t.numero_tomba}
              {t.settore && <span style={{ fontSize: '11px', color: '#8a8a84', marginLeft: '8px' }}>Settore {t.settore}</span>}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
              {t.tipo_sepoltura && (
                <span style={{ fontSize: '11px', background: '#f5e8f8', color: '#7a1a6b', padding: '1px 6px', borderRadius: '8px' }}>{t.tipo_sepoltura}</span>
              )}
              {t.tipo_deposizione && (
                <span style={{ fontSize: '11px', background: '#f0efe9', color: '#555550', padding: '1px 6px', borderRadius: '8px' }}>{t.tipo_deposizione}</span>
              )}
              {t.datazione && (
                <span style={{ fontSize: '11px', background: '#f0efe9', color: '#555550', padding: '1px 6px', borderRadius: '8px' }}>{t.datazione}</span>
              )}
              {t.stato_conservazione && (
                <span style={{ fontSize: '11px', background: '#f0efe9', color: '#555550', padding: '1px 6px', borderRadius: '8px' }}>{t.stato_conservazione}</span>
              )}
            </div>
            {t.completata ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: '#e8f0f8', border: '1px solid #185FA5', borderRadius: '8px', width: 'fit-content' }}>
                <span style={{ fontSize: '11px' }}>✓</span>
                <span style={{ fontSize: '10px', fontWeight: '500', color: '#185FA5' }}>Completata</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '60px', height: '4px', background: '#e0dfd8', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${perc}%`, height: '100%', background: colore, borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '10px', color: colore, fontWeight: '500' }}>{perc}%</span>
              </div>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#c8c7be', marginLeft: '12px' }}>→</div>
        </div>
        )
      })}
    </div>
  )
}
