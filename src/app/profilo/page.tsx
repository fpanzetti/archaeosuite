'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTema } from '@/lib/theme/ThemeContext'
import type { Palette } from '@/lib/theme/ThemeContext'

type Accesso = {
  scavo_id: string
  ruolo: string
  scavo: {
    denominazione: string
    comune: string
    provincia: string | null
    stato: string
  }
}

const PROFESSIONI = [
  'Archeologo','Antropologo fisico','Numismatico','Paleobotanico',
  'Zooarcheologo','Restauratore','Topografo','Specialista','Admin',
]

// ─────────────────────────────────────────────────────────────
// Modal ritaglio foto
// ─────────────────────────────────────────────────────────────
function ModalRitaglio({
  src,
  onConferma,
  onAnnulla,
  p,
}: {
  src: string
  onConferma: (blob: Blob) => void
  onAnnulla: () => void
  p: Palette
}) {
  const DIM = 220 // dimensione canvas in px

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef    = useRef<HTMLImageElement | null>(null)
  const zoomRef   = useRef(1)
  const offsetRef = useRef({ x: 0, y: 0 })
  const dragRef   = useRef({ attivo: false, ultimaX: 0, ultimaY: 0 })

  const [sliderZoom, setSliderZoom]   = useState(1)
  const [trascinando, setTrascinando] = useState(false)

  // ── disegno canvas ──────────────────────────────────────────
  function disegna() {
    const canvas = canvasRef.current
    const img    = imgRef.current
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const zoom           = zoomRef.current
    const { x, y }       = offsetRef.current
    const baseScale      = Math.max(DIM / img.naturalWidth, DIM / img.naturalHeight)
    const scala          = baseScale * zoom
    const w              = img.naturalWidth  * scala
    const h              = img.naturalHeight * scala
    const dx             = (DIM - w) / 2 + x
    const dy             = (DIM - h) / 2 + y

    ctx.clearRect(0, 0, DIM, DIM)

    // area circolare
    ctx.save()
    ctx.beginPath()
    ctx.arc(DIM / 2, DIM / 2, DIM / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(img, dx, dy, w, h)
    ctx.restore()

    // bordo cerchio
    ctx.beginPath()
    ctx.arc(DIM / 2, DIM / 2, DIM / 2 - 1, 0, Math.PI * 2)
    ctx.strokeStyle = p.accentBlue
    ctx.lineWidth   = 2
    ctx.stroke()
  }

  // ── caricamento immagine ─────────────────────────────────────
  useEffect(() => {
    const img = new window.Image()
    img.onload = () => { imgRef.current = img; disegna() }
    img.src = src
    imgRef.current = img
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  // ── zoom ────────────────────────────────────────────────────
  function aggiornaZoom(v: number) {
    zoomRef.current = v
    setSliderZoom(v)
    disegna()
  }

  // ── drag mouse ───────────────────────────────────────────────
  function inizia(clientX: number, clientY: number) {
    dragRef.current = { attivo: true, ultimaX: clientX, ultimaY: clientY }
    setTrascinando(true)
  }

  function muovi(clientX: number, clientY: number) {
    if (!dragRef.current.attivo) return
    const dx = clientX - dragRef.current.ultimaX
    const dy = clientY - dragRef.current.ultimaY
    dragRef.current.ultimaX = clientX
    dragRef.current.ultimaY = clientY
    offsetRef.current = { x: offsetRef.current.x + dx, y: offsetRef.current.y + dy }
    disegna()
  }

  function termina() {
    dragRef.current.attivo = false
    setTrascinando(false)
  }

  // ── conferma: esporta canvas come JPEG ───────────────────────
  function conferma() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(blob => { if (blob) onConferma(blob) }, 'image/jpeg', 0.92)
  }

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)',
               display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
      onMouseMove={e  => muovi(e.clientX, e.clientY)}
      onMouseUp={termina}
    >
      <div
        style={{ background:p.bgCard, borderRadius:'14px', padding:'24px',
                 display:'flex', flexDirection:'column', alignItems:'center', gap:'16px',
                 border:`0.5px solid ${p.border}`, minWidth:'280px', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* titolo */}
        <div style={{ width:'100%' }}>
          <div style={{ fontSize:'14px', fontWeight:'600', color:p.textPrimary, marginBottom:'4px' }}>
            Ritaglia la foto profilo
          </div>
          <div style={{ fontSize:'11px', color:p.textMuted }}>
            Trascina per posizionare · Usa lo slider per ingrandire
          </div>
        </div>

        {/* canvas */}
        <canvas
          ref={canvasRef}
          width={DIM}
          height={DIM}
          onMouseDown={e  => inizia(e.clientX, e.clientY)}
          onTouchStart={e => { const t = e.touches[0]; inizia(t.clientX, t.clientY); e.preventDefault() }}
          onTouchMove={e  => { const t = e.touches[0]; muovi(t.clientX,  t.clientY);  e.preventDefault() }}
          onTouchEnd={termina}
          style={{
            cursor:     trascinando ? 'grabbing' : 'grab',
            borderRadius:'50%',
            userSelect: 'none',
            touchAction:'none',
            display:    'block',
          }}
        />

        {/* slider zoom */}
        <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:'6px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'11px', color:p.textMuted }}>Zoom</span>
            <span style={{ fontSize:'11px', color:p.textSecondary, fontVariantNumeric:'tabular-nums' }}>
              {sliderZoom.toFixed(1)}×
            </span>
          </div>
          <input
            type="range" min={1} max={4} step={0.05} value={sliderZoom}
            onChange={e => aggiornaZoom(Number(e.target.value))}
            style={{ width:'100%', accentColor:p.accentBlue, cursor:'pointer' }}
          />
        </div>

        {/* azioni */}
        <div style={{ display:'flex', gap:'8px', width:'100%' }}>
          <button
            onClick={onAnnulla}
            style={{ flex:1, padding:'8px', background:p.bgInput, color:p.textSecondary,
                     border:`0.5px solid ${p.borderStrong}`, borderRadius:'6px',
                     fontSize:'12px', cursor:'pointer', fontFamily:'inherit' }}
          >
            Annulla
          </button>
          <button
            onClick={conferma}
            style={{ flex:1, padding:'8px', background:p.accentBlue, color:'#fff',
                     border:'none', borderRadius:'6px', fontSize:'12px',
                     fontWeight:'500', cursor:'pointer', fontFamily:'inherit' }}
          >
            Usa questa foto
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Pagina Profilo
// ─────────────────────────────────────────────────────────────
export default function ProfiloPage() {
  const supabase = createClient()
  const router   = useRouter()
  const { p }    = useTema()

  const [loading,          setLoading]          = useState(true)
  const [saving,           setSaving]           = useState(false)
  const [saved,            setSaved]            = useState(false)
  const [resettingPwd,     setResettingPwd]     = useState(false)
  const [pwdMsg,           setPwdMsg]           = useState('')
  const [userId,           setUserId]           = useState('')
  const [email,            setEmail]            = useState('')
  const [createdAt,        setCreatedAt]        = useState('')
  const [nome,             setNome]             = useState('')
  const [cognome,          setCognome]          = useState('')
  const [professione,      setProfessione]      = useState('')
  const [accessi,          setAccessi]          = useState<Accesso[]>([])
  const [avatarUrl,        setAvatarUrl]        = useState('')
  const [uploadingAvatar,  setUploadingAvatar]  = useState(false)
  const [erroreAvatar,     setErroreAvatar]     = useState('')
  // src dell'immagine da ritagliare (null = modal chiuso)
  const [srcRitaglio,      setSrcRitaglio]      = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── caricamento dati utente ──────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      setEmail(user.email ?? '')
      setCreatedAt(user.created_at ?? '')
      const { data: account } = await supabase
        .from('account')
        .select('nome, cognome, professione, avatar_url')
        .eq('id', user.id)
        .single()
      if (account) {
        setNome(account.nome ?? '')
        setCognome(account.cognome ?? '')
        setProfessione(account.professione ?? '')
        setAvatarUrl(account.avatar_url ?? '')
      }
      const { data: accessiData } = await supabase
        .from('accesso_scavo')
        .select('scavo_id, ruolo, scavo:scavo(denominazione, comune, provincia, stato)')
        .eq('account_id', user.id)
      if (accessiData) {
        setAccessi(
          (accessiData as unknown[]).map(a => {
            const r = a as {
              scavo_id: string; ruolo: string
              scavo: { denominazione: string; comune: string; provincia: string | null; stato: string }[]
            }
            return { ...r, scavo: r.scavo[0] }
          })
        )
      }
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── selezione file → apre il modal di ritaglio ───────────────
  function handleSelezioneFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Reset input: permette di selezionare di nuovo lo stesso file
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      if (typeof ev.target?.result === 'string') setSrcRitaglio(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  // ── upload del blob ritagliato su Supabase Storage ───────────
  // FIX PRINCIPALE: aggiunta del timestamp ?t=... per forzare
  // il browser a ricaricare l'immagine anche se il filename
  // è invariato (problema di cache che impediva l'aggiornamento
  // visivo del badge dopo l'upload).
  async function caricaAvatar(blob: Blob) {
    try {
      setUploadingAvatar(true)
      setErroreAvatar('')
      setSrcRitaglio(null)

      const filename = `${userId}-avatar.jpg`
      const { error } = await supabase.storage
        .from('avatars')
        .upload(filename, blob, { upsert: true, contentType: 'image/jpeg' })
      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filename)

      // Cache-busting: aggiunge un timestamp all'URL in modo che React
      // veda un valore di stato *diverso* e il browser scarichi la
      // nuova immagine invece di servire quella in cache.
      const urlFinale = `${publicUrl}?t=${Date.now()}`
      setAvatarUrl(urlFinale)
      await supabase.from('account').update({ avatar_url: urlFinale }).eq('id', userId)
      // Forza il re-render del layout (Sidebar) per aggiornare il badge
      router.refresh()
    } catch (err) {
      console.error('Errore caricamento avatar:', err)
      setErroreAvatar('Errore durante il caricamento della foto. Riprova.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  // ── salvataggio dati personali ───────────────────────────────
  async function salva() {
    setSaving(true)
    await supabase.from('account').update({ nome, cognome, professione }).eq('id', userId)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // ── reset password ───────────────────────────────────────────
  async function resetPassword() {
    setResettingPwd(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    setResettingPwd(false)
    setPwdMsg(error ? "Errore nell'invio. Riprova." : 'Email inviata — controlla la tua casella.')
    setTimeout(() => setPwdMsg(''), 4000)
  }

  // ── stili ────────────────────────────────────────────────────
  const inp:          React.CSSProperties = { width:'100%', padding:'7px 10px', border:`0.5px solid ${p.borderStrong}`, borderRadius:'6px', background:p.bgInput, color:p.textPrimary, fontSize:'12px', fontFamily:'inherit' }
  const lbl:          React.CSSProperties = { display:'block', fontSize:'11px', color:p.textMuted, marginBottom:'4px', fontWeight:'500' }
  const card:         React.CSSProperties = { background:p.bgCard, border:`0.5px solid ${p.border}`, borderRadius:'10px', padding:'20px', marginBottom:'12px' }
  const sectionTitle: React.CSSProperties = { fontSize:'11px', fontWeight:'600', color:p.textMuted, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'14px', paddingBottom:'8px', borderBottom:`0.5px solid ${p.border}` }
  const grid2:        React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }
  const infoRow:      React.CSSProperties = { padding:'6px 10px', background:p.bgInput, borderRadius:'6px', fontSize:'12px', color:p.textSecondary }
  const infoLabel:    React.CSSProperties = { fontSize:'10px', color:p.textMuted, display:'block', marginBottom:'2px' }

  const ruoloColore = (ruolo: string) => {
    if (ruolo === 'editor')        return { bg: p.accentBlueBg,  color: p.accentBlue  }
    if (ruolo === 'collaboratore') return { bg: p.accentGreenBg, color: p.accentGreen }
    return { bg: p.bgBadgeNeutro, color: p.textMuted }
  }
  const statoLabel = (stato: string) =>
    stato === 'in_corso'        ? 'In corso' :
    stato === 'in_elaborazione' ? 'In elaborazione' : 'Archiviato'

  const iniziali    = [nome?.[0], cognome?.[0]].filter(Boolean).join('').toUpperCase() || email?.[0]?.toUpperCase()
  const nomeDisplay = [nome, cognome].filter(Boolean).join(' ') || email

  if (loading) return <div style={{ padding:'24px', color:p.textMuted, fontSize:'12px' }}>Caricamento...</div>

  return (
    <div style={{ padding:'24px', maxWidth:'680px' }}>

      {/* Modal ritaglio foto */}
      {srcRitaglio && (
        <ModalRitaglio
          src={srcRitaglio}
          onConferma={caricaAvatar}
          onAnnulla={() => setSrcRitaglio(null)}
          p={p}
        />
      )}

      {/* Input file nascosto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleSelezioneFoto}
        style={{ display:'none' }}
      />

      {/* Bottone indietro */}
      <button
        onClick={() => router.back()}
        style={{ padding:'6px 12px', marginBottom:'20px', background:p.bgInput, color:p.textSecondary, border:`0.5px solid ${p.borderStrong}`, borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontFamily:'inherit' }}
      >
        <span style={{ fontSize:'14px' }}>←</span> Indietro
      </button>

      {/* Header: badge + nome */}
      <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'24px' }}>
        <div style={{ position:'relative', flexShrink:0 }}>
          {/* badge principale */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            title="Cambia foto profilo"
            style={{ width:'56px', height:'56px', borderRadius:'50%',
                     background: avatarUrl ? 'none' : p.accentBlueBg,
                     color: p.accentBlue, fontSize:'20px', fontWeight:'600',
                     display:'flex', alignItems:'center', justifyContent:'center',
                     border:'none', cursor: uploadingAvatar ? 'default' : 'pointer',
                     padding:0, overflow:'hidden' }}
          >
            {uploadingAvatar ? (
              <span style={{ fontSize:'22px' }}>⟳</span>
            ) : avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            ) : (
              <span>{iniziali}</span>
            )}
          </button>
          {/* bottone matita */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            title="Cambia foto profilo"
            style={{ position:'absolute', bottom:0, right:0, width:'20px', height:'20px', borderRadius:'50%',
                     background:p.accentBlue, color:'#fff', fontSize:'10px',
                     display:'flex', alignItems:'center', justifyContent:'center',
                     border:`2px solid ${p.bgCard}`, cursor:'pointer', padding:0, lineHeight:1 }}
          >
            ✏️
          </button>
        </div>
        <div>
          <h1 style={{ fontSize:'20px', fontWeight:'500', margin:0, color:p.textPrimary }}>{nomeDisplay}</h1>
          {professione && <p style={{ fontSize:'12px', color:p.textMuted, margin:'2px 0 0' }}>{professione}</p>}
          {erroreAvatar && (
            <p style={{ fontSize:'11px', color:p.accentRed, margin:'4px 0 0' }}>{erroreAvatar}</p>
          )}
        </div>
      </div>

      {/* Dati personali */}
      <div style={card}>
        <div style={sectionTitle}>Dati personali</div>
        <div style={grid2}>
          <div><label style={lbl}>Nome</label><input style={inp} value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome" /></div>
          <div><label style={lbl}>Cognome</label><input style={inp} value={cognome} onChange={e => setCognome(e.target.value)} placeholder="Cognome" /></div>
        </div>
        <div style={{ marginBottom:'12px' }}>
          <label style={lbl}>Email</label>
          <div style={{ ...infoRow, color:p.textMuted }}>{email}</div>
        </div>
        <div style={{ marginBottom:'16px' }}>
          <label style={lbl}>Professione</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
            {PROFESSIONI.map(prof => (
              <button key={prof} type="button"
                onClick={() => setProfessione(professione === prof ? '' : prof)}
                style={{ padding:'5px 12px', borderRadius:'6px', fontSize:'12px', cursor:'pointer', fontFamily:'inherit',
                  background:  professione === prof ? p.accentBlueBg  : p.bgInput,
                  color:       professione === prof ? p.accentBlue    : p.textSecondary,
                  border:      professione === prof ? `0.5px solid ${p.accentBlue}` : `0.5px solid ${p.borderStrong}`,
                  fontWeight:  professione === prof ? '500' : '400' }}
              >
                {prof}
              </button>
            ))}
          </div>
        </div>
        <button onClick={salva} disabled={saving}
          style={{ padding:'7px 20px', background: saved ? p.accentGreen : p.accentBlue, color:'#fff', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'500', cursor:'pointer', fontFamily:'inherit' }}>
          {saving ? 'Salvataggio...' : saved ? '✓ Salvato' : 'Salva modifiche'}
        </button>
      </div>

      {/* Sicurezza */}
      <div style={card}>
        <div style={sectionTitle}>Sicurezza</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:'12px', color:p.textPrimary, fontWeight:'500' }}>Password</div>
            <div style={{ fontSize:'11px', color:p.textMuted, marginTop:'2px' }}>Riceverai un&apos;email con il link per cambiarla</div>
          </div>
          <button onClick={resetPassword} disabled={resettingPwd}
            style={{ padding:'7px 16px', background:p.bgInput, color:p.textSecondary, border:`0.5px solid ${p.borderStrong}`, borderRadius:'6px', fontSize:'12px', cursor:'pointer', fontFamily:'inherit' }}>
            {resettingPwd ? '...' : 'Cambia password'}
          </button>
        </div>
        {pwdMsg && <div style={{ marginTop:'8px', fontSize:'11px', color:p.accentGreen }}>{pwdMsg}</div>}
      </div>

      {/* Scavi e ruoli */}
      <div style={card}>
        <div style={sectionTitle}>Scavi e ruoli</div>
        {accessi.length === 0 ? (
          <div style={{ fontSize:'12px', color:p.textMuted, textAlign:'center', padding:'12px 0' }}>Nessuno scavo associato</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {accessi.map(a => {
              const { bg, color } = ruoloColore(a.ruolo)
              return (
                <div key={a.scavo_id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', background:p.bgInput, borderRadius:'6px' }}>
                  <div>
                    <div style={{ fontSize:'12px', fontWeight:'500', color:p.textPrimary }}>{a.scavo?.denominazione || a.scavo?.comune}</div>
                    <div style={{ fontSize:'11px', color:p.textMuted, marginTop:'2px' }}>{statoLabel(a.scavo?.stato)}</div>
                  </div>
                  <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', background:bg, color, fontWeight:'500', textTransform:'capitalize' }}>{a.ruolo}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Account */}
      <div style={card}>
        <div style={sectionTitle}>Account</div>
        <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
          <div style={infoRow}><span style={infoLabel}>ID utente</span><span style={{ fontFamily:'monospace', fontSize:'11px' }}>{userId}</span></div>
          <div style={infoRow}><span style={infoLabel}>Registrato il</span>{createdAt ? new Date(createdAt).toLocaleDateString('it-IT', { day:'2-digit', month:'long', year:'numeric' }) : '—'}</div>
        </div>
      </div>

      {/* Notifiche (coming soon) */}
      <div style={{ ...card, opacity:0.6 }}>
        <div style={sectionTitle}>Notifiche</div>
        <div style={{ fontSize:'12px', color:p.textMuted }}>Presto disponibile</div>
      </div>
    </div>
  )
}
