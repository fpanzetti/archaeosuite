import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ProgettoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: progetto } = await supabase
    .from('progetto')
    .select('*')
    .eq('id', id)
    .single()

  if (!progetto) notFound()

  const { data: scavi } = await supabase
    .from('scavo')
    .select('*, us(count)')
    .eq('progetto_id', id)
    .order('created_at', { ascending: false })

  const statoInfo = (s: string) => {
    if (s === 'in_corso') return { label: 'In corso', bg: '#e8f0f8', color: '#1a4a7a' }
    if (s === 'in_elaborazione') return { label: 'In elaborazione', bg: '#fdf3e0', color: '#8a5c0a' }
    return { label: 'Archiviato', bg: '#f0efe9', color: '#8a8a84' }
  }

  const statoProgetto = statoInfo(progetto.stato ?? 'in_corso')

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      {/* Breadcrumb + torna */}
      <div style={{ fontSize: '11px', color: '#8a8a84', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link href="/reports" style={{ color: '#1a4a7a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '11px' }}>
          ← Elenco scavi
        </Link>
        <span style={{ color: '#c8c7be' }}>/</span>
        <span>{progetto.committente ?? 'Progetto'}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', background: '#f0efe9', color: '#8a5c0a', padding: '2px 8px', borderRadius: '10px', fontWeight: '500' }}>📁 Progetto</span>
            <span style={{ fontSize: '11px', background: statoProgetto.bg, color: statoProgetto.color, padding: '2px 8px', borderRadius: '10px', fontWeight: '500' }}>{statoProgetto.label}</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: '#1a1a1a' }}>
            {progetto.committente ?? '—'}
          </h1>
          {progetto.datazione_contesto && (
            <p style={{ fontSize: '13px', color: '#555550', marginTop: '4px' }}>{progetto.datazione_contesto}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href={`/reports/scavi/nuovo?progetto_id=${id}`}>
            <button style={{ padding: '7px 14px', background: '#1a4a7a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              + Nuovo scavo
            </button>
          </Link>
        </div>
      </div>

      {/* Info progetto */}
      <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: '500', color: '#1a4a7a', marginBottom: '12px', paddingBottom: '8px', borderBottom: '0.5px solid #e8f0f8' }}>
          Dati progetto
        </div>
        <div style={{ fontSize: '12px', lineHeight: '2', color: '#555550' }}>
          {progetto.committente && <div><span style={{ color: '#8a8a84' }}>Ente responsabile: </span>{progetto.committente}</div>}
          {progetto.operatore && <div><span style={{ color: '#8a8a84' }}>Operatore: </span>{progetto.operatore}</div>}
          {progetto.direttore_scientifico && <div><span style={{ color: '#8a8a84' }}>Direttore scientifico: </span>{progetto.direttore_scientifico}</div>}
          {progetto.tipologia_intervento && <div><span style={{ color: '#8a8a84' }}>Tipologia: </span>{progetto.tipologia_intervento}</div>}
          {progetto.tipo_contesto && <div><span style={{ color: '#8a8a84' }}>Tipo contesto: </span>{progetto.tipo_contesto}</div>}
          {progetto.data_inizio && <div><span style={{ color: '#8a8a84' }}>Data inizio: </span>{new Date(progetto.data_inizio).toLocaleDateString('it-IT')}</div>}
          {progetto.note && <div style={{ marginTop: '6px', padding: '6px 8px', background: '#f8f7f4', borderRadius: '4px' }}><span style={{ color: '#8a8a84' }}>Note: </span>{progetto.note}</div>}
        </div>
      </div>

      {/* Lista scavi del progetto */}
      <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '0.5px solid #e8f0f8' }}>
          <div style={{ fontSize: '11px', fontWeight: '500', color: '#1a4a7a' }}>
            Scavi ({scavi?.length ?? 0})
          </div>
          <Link href={`/reports/scavi/nuovo?progetto_id=${id}`} style={{ fontSize: '11px', color: '#1a4a7a', textDecoration: 'none' }}>
            + Aggiungi
          </Link>
        </div>
        {!scavi || scavi.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#8a8a84', fontSize: '12px' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⛏️</div>
            Nessuno scavo ancora
            <div style={{ marginTop: '8px' }}>
              <Link href={`/reports/scavi/nuovo?progetto_id=${id}`} style={{ color: '#1a4a7a', fontSize: '12px' }}>
                Crea il primo scavo →
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {scavi.map(scavo => {
              const info = statoInfo(scavo.stato ?? 'archiviato')
              const numUS = (scavo.us as unknown as { count: number }[])?.[0]?.count ?? 0
              return (
                <Link key={scavo.id} href={`/reports/scavi/${scavo.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '10px 12px', background: '#f8f7f4', borderRadius: '6px', border: '0.5px solid #e0dfd8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '3px' }}>
                          {scavo.denominazione}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span style={{ fontSize: '11px', background: info.bg, color: info.color, padding: '1px 6px', borderRadius: '8px' }}>{info.label}</span>
                          <span style={{ fontSize: '11px', background: '#f0efe9', color: '#555550', padding: '1px 6px', borderRadius: '8px' }}>{numUS} US</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#c8c7be' }}>→</div>
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
