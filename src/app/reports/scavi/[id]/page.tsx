import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ScavoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: scavo } = await supabase
    .from('scavo')
    .select('*')
    .eq('id', id)
    .single()

  if (!scavo) notFound()

  const { data: usList } = await supabase
    .from('us')
    .select('*')
    .eq('scavo_id', id)
    .order('numero_us', { ascending: true })

  const nome = [scavo.comune, scavo.provincia ? `(${scavo.provincia})` : '', scavo.localita]
    .filter(Boolean).join(' ')

  const statoColore = scavo.stato === 'in_corso' ? '#1a4a7a' : scavo.stato === 'in_elaborazione' ? '#8a5c0a' : '#8a8a84'
  const statoBg = scavo.stato === 'in_corso' ? '#e8f0f8' : scavo.stato === 'in_elaborazione' ? '#fdf3e0' : '#f0efe9'
  const statoLabel = scavo.stato === 'in_corso' ? 'In corso' : scavo.stato === 'in_elaborazione' ? 'In elaborazione' : 'Archiviato'

  return (
    <div style={{ padding: '24px' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '11px', color: '#8a8a84', marginBottom: '16px' }}>
        <Link href="/reports" style={{ color: '#1a4a7a', textDecoration: 'none' }}>Scavi</Link>
        {' / '}{nome}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: '#1a1a1a' }}>{nome}</h1>
          {scavo.datazione_contesto && (
            <p style={{ fontSize: '13px', color: '#555550', marginTop: '4px' }}>{scavo.datazione_contesto}</p>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <form action={async (fd: FormData) => {
              'use server'
              const { createClient } = await import('@/lib/supabase/server')
              const sb = await createClient()
              await sb.from('scavo').update({ stato: fd.get('stato') as string }).eq('id', id)
              const { revalidatePath } = await import('next/cache')
              revalidatePath(`/reports/scavi/${id}`)
            }}>
              <select name="stato" defaultValue={scavo.stato ?? 'in_corso'}
                onChange={(e) => (e.target.form as HTMLFormElement).requestSubmit()}
                style={{ fontSize: '11px', background: statoBg, color: statoColore, padding: '2px 8px', borderRadius: '10px', border: `0.5px solid ${statoColore}40`, cursor: 'pointer', fontWeight: '500' }}>
                <option value="in_corso">In corso</option>
                <option value="in_elaborazione">In elaborazione</option>
                <option value="archiviato">Archiviato</option>
              </select>
            </form>
            {scavo.tipo_contesto && (
              <span style={{ fontSize: '11px', background: '#f0efe9', color: '#555550', padding: '2px 8px', borderRadius: '10px' }}>
                {scavo.tipo_contesto}
              </span>
            )}
            {scavo.tipologia_intervento && (
              <span style={{ fontSize: '11px', background: '#f0efe9', color: '#555550', padding: '2px 8px', borderRadius: '10px' }}>
                {scavo.tipologia_intervento}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href={`/reports/scavi/${id}/modifica`}>
            <button style={{ padding: '7px 14px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
              Modifica
            </button>
          </Link>
          <Link href={`/reports/scavi/${id}/us/nuova`}>
            <button style={{ padding: '7px 14px', background: '#1a4a7a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              + Nuova US
            </button>
          </Link>
        </div>
      </div>

      {/* Griglia info + US */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Dati scavo */}
        <div>
          <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '500', color: '#1a4a7a', marginBottom: '12px', paddingBottom: '8px', borderBottom: '0.5px solid #e8f0f8' }}>
              Localizzazione
            </div>
            <div style={{ fontSize: '12px', lineHeight: '2', color: '#555550' }}>
              {scavo.nazione && <div><span style={{ color: '#8a8a84' }}>Nazione: </span>{scavo.nazione}</div>}
              {scavo.regione && <div><span style={{ color: '#8a8a84' }}>Regione: </span>{scavo.regione}</div>}
              {scavo.soprintendenza && <div><span style={{ color: '#8a8a84' }}>SABAP: </span>{scavo.soprintendenza}</div>}
              {scavo.committente && <div><span style={{ color: '#8a8a84' }}>Committente: </span>{scavo.committente}</div>}
              {scavo.operatore && <div><span style={{ color: '#8a8a84' }}>Operatore: </span>{scavo.operatore}</div>}
              {scavo.data_inizio && <div><span style={{ color: '#8a8a84' }}>Inizio: </span>{new Date(scavo.data_inizio).toLocaleDateString('it-IT')}</div>}
              {scavo.lat && scavo.lon && (
                <div><span style={{ color: '#8a8a84' }}>Coordinate: </span>{scavo.lat}, {scavo.lon}</div>
              )}
            </div>
          </div>
        </div>

        {/* Lista US */}
        <div>
          <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '0.5px solid #e8f0f8' }}>
              <div style={{ fontSize: '11px', fontWeight: '500', color: '#1a4a7a' }}>
                Unità stratigrafiche ({usList?.length ?? 0})
              </div>
              <Link href={`/reports/scavi/${id}/us/nuova`} style={{ fontSize: '11px', color: '#1a4a7a', textDecoration: 'none' }}>
                + Aggiungi
              </Link>
            </div>
            {!usList || usList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#8a8a84', fontSize: '12px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>⛏️</div>
                Nessuna US ancora
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {usList.map(us => (
                  <Link key={us.id} href={`/reports/scavi/${id}/us/${us.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '8px 10px', background: '#f8f7f4', borderRadius: '6px', border: '0.5px solid #e0dfd8', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>US {us.numero_us}</span>
                        <span style={{ fontSize: '11px', background: '#e8f0f8', color: '#1a4a7a', padding: '1px 6px', borderRadius: '8px' }}>
                          {us.tipo ?? '—'}
                        </span>
                      </div>
                      {us.descrizione && (
                        <div style={{ fontSize: '11px', color: '#8a8a84', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {us.descrizione}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
