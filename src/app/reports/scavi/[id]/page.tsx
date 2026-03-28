import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import PannelloInviti from '@/components/scavo/PannelloInviti'
import AggiuntaUS from '@/components/scavo/AggiuntaUS'
import ElencoUS from '@/components/scavo/ElencoUS'

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
    .select('id, numero_us, tipo, descrizione, stato, completata')
    .eq('scavo_id', id)
    .order('numero_us', { ascending: true })

  const nome = [scavo.comune, scavo.provincia ? `(${scavo.provincia})` : '', scavo.localita]
    .filter(Boolean).join(' ')

  const statoColore = scavo.stato === 'in_corso' ? '#1a4a7a' : scavo.stato === 'in_elaborazione' ? '#8a5c0a' : '#8a8a84'
  const statoBg = scavo.stato === 'in_corso' ? '#e8f0f8' : scavo.stato === 'in_elaborazione' ? '#fdf3e0' : '#f0efe9'
  const statoLabel = scavo.stato === 'in_corso' ? 'In corso' : scavo.stato === 'in_elaborazione' ? 'In elaborazione' : 'Archiviato'

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: '11px', color: '#8a8a84', marginBottom: '16px' }}>
        <Link href="/reports" style={{ color: '#1a4a7a', textDecoration: 'none' }}>Scavi</Link>
        {' / '}{nome}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: '#1a1a1a' }}>{nome}</h1>
          {scavo.datazione_contesto && (
            <p style={{ fontSize: '13px', color: '#555550', marginTop: '4px' }}>{scavo.datazione_contesto}</p>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', background: statoBg, color: statoColore, padding: '2px 8px', borderRadius: '10px', fontWeight: '500' }}>
              {statoLabel}
            </span>
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
          <AggiuntaUS scavoId={id} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '500', color: '#1a4a7a', marginBottom: '12px', paddingBottom: '8px', borderBottom: '0.5px solid #e8f0f8' }}>
              Localizzazione
            </div>
            <div style={{ fontSize: '12px', lineHeight: '2', color: '#555550' }}>
              {scavo.nazione && scavo.nazione !== 'Italia' && <div><span style={{ color: '#8a8a84' }}>Nazione: </span>{scavo.nazione}</div>}
              {scavo.regione && <div><span style={{ color: '#8a8a84' }}>Regione: </span>{scavo.regione}</div>}
              {scavo.provincia && <div><span style={{ color: '#8a8a84' }}>Provincia: </span>{scavo.provincia}</div>}
              {scavo.localita && <div><span style={{ color: '#8a8a84' }}>Località: </span>{scavo.localita}</div>}
              {scavo.indirizzo && <div><span style={{ color: '#8a8a84' }}>Indirizzo: </span>{scavo.indirizzo}</div>}
              {scavo.soprintendenza && <div><span style={{ color: '#8a8a84' }}>Ufficio MiC competente per tutela: </span>{scavo.soprintendenza}</div>}
              {scavo.committente && <div><span style={{ color: '#8a8a84' }}>Ente responsabile: </span>{scavo.committente}</div>}
              {scavo.operatore && <div><span style={{ color: '#8a8a84' }}>Operatore: </span>{scavo.operatore}</div>}
              {scavo.direttore_scientifico && <div><span style={{ color: '#8a8a84' }}>Direttore: </span>{scavo.direttore_scientifico}</div>}
              {scavo.tipologia_intervento && <div><span style={{ color: '#8a8a84' }}>Tipologia: </span>{scavo.tipologia_intervento}</div>}
              {scavo.tipo_contesto && <div><span style={{ color: '#8a8a84' }}>Contesto: </span>{scavo.tipo_contesto}</div>}
              {scavo.data_inizio && <div><span style={{ color: '#8a8a84' }}>Inizio: </span>{new Date(scavo.data_inizio).toLocaleDateString('it-IT')}</div>}
              {scavo.riferimento_cartografico && <div><span style={{ color: '#8a8a84' }}>Cartografia: </span>{scavo.riferimento_cartografico}</div>}
              {scavo.foglio_catastale && <div><span style={{ color: '#8a8a84' }}>Foglio: </span>{scavo.foglio_catastale}{scavo.particella ? ` / Part. ${scavo.particella}` : ''}{scavo.subparticella ? ` / Sub. ${scavo.subparticella}` : ''}</div>}
              {scavo.lat && scavo.lon && <div><span style={{ color: '#8a8a84' }}>Coordinate: </span>{scavo.lat}, {scavo.lon}</div>}
              {scavo.note && <div style={{ marginTop: '6px', padding: '6px 8px', background: '#f8f7f4', borderRadius: '4px', lineHeight: '1.5' }}><span style={{ color: '#8a8a84' }}>Note: </span>{scavo.note}</div>}
            </div>
          </div>
          <PannelloInviti scavoId={id} scavoDenominazione={nome} />
        </div>

        <div>
          <ElencoUS scavoId={id} usList={usList ?? []} />
        </div>
      </div>
    </div>
  )
}
