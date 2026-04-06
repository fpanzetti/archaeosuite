'use client'
import Link from 'next/link'
import { useTema } from '@/lib/theme/ThemeContext'
import PannelloInviti from './PannelloInviti'
import AggiuntaUS from './AggiuntaUS'
import ElencoUS from './ElencoUS'

type Scavo = {
  id: string
  comune: string
  provincia: string | null
  localita: string | null
  denominazione: string | null
  datazione_contesto: string | null
  stato: string
  tipo_contesto: string | null
  tipologia_intervento: string | null
  responsabile_id: string | null
  nazione: string | null
  regione: string | null
  indirizzo: string | null
  soprintendenza: string | null
  committente: string | null
  operatore: string | null
  direttore_scientifico: string | null
  data_inizio: string | null
  riferimento_cartografico: string | null
  foglio_catastale: string | null
  particella: string | null
  subparticella: string | null
  lat: number | null
  lon: number | null
  note: string | null
}

type USItem = {
  id: string
  numero_us: number
  tipo: string | null
  descrizione: string | null
  stato: string
  completata: boolean
  contesto_funerario_id: string | null
}

type TombaItem = {
  id: string
  numero_tomba: number
  tipo_sepoltura: string | null
  tipo_deposizione: string | null
  datazione: string | null
  stato_conservazione: string | null
  completata: boolean
}

interface Props {
  scavo: Scavo
  id: string
  ruoloCorrente: string
  usList: USItem[]
  tombeList: TombaItem[]
}

export default function ScavoDettaglio({ scavo, id, ruoloCorrente, usList, tombeList }: Props) {
  const { p } = useTema()

  const nome = [scavo.comune, scavo.provincia ? `(${scavo.provincia})` : '', scavo.localita]
    .filter(Boolean).join(' ')

  const statoColore = scavo.stato === 'in_corso' ? p.accentBlue : scavo.stato === 'in_elaborazione' ? p.accentAmber : p.textMuted
  const statoBg = scavo.stato === 'in_corso' ? p.accentBlueBg : scavo.stato === 'in_elaborazione' ? p.accentAmberBg : p.bgBadgeNeutro
  const statoLabel = scavo.stato === 'in_corso' ? 'In corso' : scavo.stato === 'in_elaborazione' ? 'In elaborazione' : 'Archiviato'

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: '11px', color: p.textMuted, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link href="/reports" style={{ color: p.accentBlue, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', border: `0.5px solid ${p.borderStrong}`, borderRadius: '6px', fontSize: '11px' }}>
          ← Elenco attività
        </Link>
        <span style={{ color: p.border }}>/</span>
        <span>{nome}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: p.textPrimary }}>{nome}</h1>
          {scavo.datazione_contesto && (
            <p style={{ fontSize: '13px', color: p.textSecondary, marginTop: '4px' }}>{scavo.datazione_contesto}</p>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', background: statoBg, color: statoColore, padding: '2px 8px', borderRadius: '10px', fontWeight: '500' }}>
              {statoLabel}
            </span>
            {scavo.tipo_contesto && (
              <span style={{ fontSize: '11px', background: p.bgBadgeNeutro, color: p.textSecondary, padding: '2px 8px', borderRadius: '10px' }}>
                {scavo.tipo_contesto}
              </span>
            )}
            {scavo.tipologia_intervento && (
              <span style={{ fontSize: '11px', background: p.bgBadgeNeutro, color: p.textSecondary, padding: '2px 8px', borderRadius: '10px' }}>
                {scavo.tipologia_intervento}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href={`/reports/scavi/${id}/modifica`}>
            <button style={{ padding: '7px 14px', background: p.bgInput, color: p.textSecondary, border: `0.5px solid ${p.borderStrong}`, borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
              Modifica
            </button>
          </Link>
          {ruoloCorrente !== 'visualizzatore' && <AggiuntaUS scavoId={id} />}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <div style={{ background: p.bgCard, border: `0.5px solid ${p.border}`, borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '500', color: p.accentBlue, marginBottom: '12px', paddingBottom: '8px', borderBottom: `0.5px solid ${p.accentBlueBg}` }}>
              Localizzazione
            </div>
            <div style={{ fontSize: '12px', lineHeight: '2', color: p.textSecondary }}>
              {scavo.nazione && scavo.nazione !== 'Italia' && <div><span style={{ color: p.textMuted }}>Nazione: </span>{scavo.nazione}</div>}
              {scavo.regione && <div><span style={{ color: p.textMuted }}>Regione: </span>{scavo.regione}</div>}
              {scavo.provincia && <div><span style={{ color: p.textMuted }}>Provincia: </span>{scavo.provincia}</div>}
              {scavo.localita && <div><span style={{ color: p.textMuted }}>Località: </span>{scavo.localita}</div>}
              {scavo.indirizzo && <div><span style={{ color: p.textMuted }}>Indirizzo: </span>{scavo.indirizzo}</div>}
              {scavo.soprintendenza && <div><span style={{ color: p.textMuted }}>Ufficio MiC competente per tutela: </span>{scavo.soprintendenza}</div>}
              {scavo.committente && <div><span style={{ color: p.textMuted }}>Ente responsabile: </span>{scavo.committente}</div>}
              {scavo.operatore && <div><span style={{ color: p.textMuted }}>Operatore: </span>{scavo.operatore}</div>}
              {scavo.direttore_scientifico && <div><span style={{ color: p.textMuted }}>Direttore: </span>{scavo.direttore_scientifico}</div>}
              {scavo.tipologia_intervento && <div><span style={{ color: p.textMuted }}>Tipologia: </span>{scavo.tipologia_intervento}</div>}
              {scavo.tipo_contesto && <div><span style={{ color: p.textMuted }}>Contesto: </span>{scavo.tipo_contesto}</div>}
              {scavo.data_inizio && <div><span style={{ color: p.textMuted }}>Inizio: </span>{new Date(scavo.data_inizio).toLocaleDateString('it-IT')}</div>}
              {scavo.riferimento_cartografico && <div><span style={{ color: p.textMuted }}>Cartografia: </span>{scavo.riferimento_cartografico}</div>}
              {scavo.foglio_catastale && <div><span style={{ color: p.textMuted }}>Foglio: </span>{scavo.foglio_catastale}{scavo.particella ? ` / Part. ${scavo.particella}` : ''}{scavo.subparticella ? ` / Sub. ${scavo.subparticella}` : ''}</div>}
              {scavo.lat && scavo.lon && <div><span style={{ color: p.textMuted }}>Coordinate: </span>{scavo.lat}, {scavo.lon}</div>}
              {scavo.note && <div style={{ marginTop: '6px', padding: '6px 8px', background: p.bgInput, borderRadius: '4px', lineHeight: '1.5' }}><span style={{ color: p.textMuted }}>Note: </span>{scavo.note}</div>}
            </div>
          </div>
          <PannelloInviti scavoId={id} scavoDenominazione={nome} ruoloEsterno={ruoloCorrente} />
        </div>

        <div>
          <ElencoUS scavoId={id} usList={usList} tombeList={tombeList} ruolo={ruoloCorrente} />
        </div>
      </div>
    </div>
  )
}
