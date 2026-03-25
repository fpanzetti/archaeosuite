'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Foto {
  id: string
  url: string
  url_thumb: string | null
  didascalia: string | null
  nome_file: string | null
  data_scatto: string | null
  tipo: string | null
  larghezza: number | null
  altezza: number | null
  dimensione_kb: number | null
}

interface Props {
  scavoId: string
  usId?: string
  onFotoAggiunta?: (foto: Foto) => void
}

const MAX_LATO = 1920
const MAX_THUMB = 400
const QUALITA = 0.8

async function ridimensiona(file: File, maxLato: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxLato || height > maxLato) {
        if (width > height) { height = Math.round(height * maxLato / width); width = maxLato }
        else { width = Math.round(width * maxLato / height); height = maxLato }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => {
        if (blob) resolve(blob)
        else reject(new Error('Conversione fallita'))
      }, 'image/jpeg', QUALITA)
    }
    img.onerror = reject
    img.src = url
  })
}

export default function UploadFoto({ scavoId, usId, onFotoAggiunta }: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [didascalia, setDidascalia] = useState('')
  const [tipo, setTipo] = useState('generale')
  const [fileSelezionato, setFileSelezionato] = useState<File | null>(null)
  const [errore, setErrore] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileSelezionato(file)
    setErrore('')
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function upload() {
    if (!fileSelezionato) return
    setUploading(true)
    setErrore('')

    try {
      // Leggi dimensioni originali
      const imgOrig = new Image()
      const origUrl = URL.createObjectURL(fileSelezionato)
      await new Promise(res => { imgOrig.onload = res; imgOrig.src = origUrl })
      const { width: w, height: h } = imgOrig
      URL.revokeObjectURL(origUrl)

      // Ridimensiona immagine principale
      const blobMain = await ridimensiona(fileSelezionato, MAX_LATO)
      const blobThumb = await ridimensiona(fileSelezionato, MAX_THUMB)

      const timestamp = Date.now()
      const baseName = `${scavoId}/${usId ?? 'scavo'}/${timestamp}`
      const pathMain = `${baseName}.jpg`
      const pathThumb = `${baseName}_thumb.jpg`

      // Upload principale
      const { error: e1 } = await supabase.storage
        .from('foto-scavi')
        .upload(pathMain, blobMain, { contentType: 'image/jpeg', upsert: false })
      if (e1) throw new Error(e1.message)

      // Upload thumbnail
      const { error: e2 } = await supabase.storage
        .from('foto-scavi')
        .upload(pathThumb, blobThumb, { contentType: 'image/jpeg', upsert: false })
      if (e2) throw new Error(e2.message)

      // URL pubblici
      const { data: urlMain } = supabase.storage.from('foto-scavi').getPublicUrl(pathMain)
      const { data: urlThumb } = supabase.storage.from('foto-scavi').getPublicUrl(pathThumb)

      // Salva in DB
      const { data: foto, error: eDb } = await supabase.from('foto').insert({
        scavo_id: scavoId,
        us_id: usId ?? null,
        url: urlMain.publicUrl,
        url_thumb: urlThumb.publicUrl,
        nome_file: fileSelezionato.name,
        didascalia: didascalia || null,
        tipo: tipo,
        larghezza: w,
        altezza: h,
        dimensione_kb: Math.round(blobMain.size / 1024),
        data_scatto: new Date().toISOString().split('T')[0],
      }).select().single()

      if (eDb) throw new Error(eDb.message)

      onFotoAggiunta?.(foto)
      setPreview(null)
      setFileSelezionato(null)
      setDidascalia('')
      if (inputRef.current) inputRef.current.value = ''

    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'Errore durante upload')
    }
    setUploading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '7px 10px',
    border: '0.5px solid #c8c7be', borderRadius: '6px',
    background: '#f8f7f4', color: '#1a1a1a',
    fontSize: '12px', fontFamily: 'inherit',
  }

  return (
    <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px', padding: '16px' }}>
      <div style={{ fontSize: '11px', fontWeight: '500', color: '#1a4a7a', marginBottom: '12px', paddingBottom: '8px', borderBottom: '0.5px solid #e8f0f8' }}>
        Aggiungi foto
      </div>

      {!preview ? (
        <div
          onClick={() => inputRef.current?.click()}
          style={{ border: '1.5px dashed #c8c7be', borderRadius: '8px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#f8f7f4' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
          <div style={{ fontSize: '12px', color: '#8a8a84' }}>Clicca per selezionare una foto</div>
          <div style={{ fontSize: '11px', color: '#c8c7be', marginTop: '4px' }}>JPG, PNG, WEBP — max 10MB</div>
          <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
        </div>
      ) : (
        <div>
          <img src={preview} alt="anteprima"
            style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', background: '#f0efe9', borderRadius: '6px', marginBottom: '10px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#8a8a84', marginBottom: '4px', fontWeight: '500' }}>Tipo</label>
              <select style={inp} value={tipo} onChange={e => setTipo(e.target.value)}>
                <option value="generale">Generale</option>
                <option value="us">US</option>
                <option value="reperto">Reperto</option>
                <option value="dettaglio">Dettaglio</option>
                <option value="altro">Altro</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#8a8a84', marginBottom: '4px', fontWeight: '500' }}>Didascalia</label>
            <input style={inp} value={didascalia} onChange={e => setDidascalia(e.target.value)} placeholder="Descrizione opzionale..." />
          </div>
          {errore && <p style={{ fontSize: '11px', color: '#c00', marginBottom: '8px' }}>{errore}</p>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setPreview(null); setFileSelezionato(null) }}
              style={{ flex: 1, padding: '8px', background: '#f8f7f4', color: '#555550', border: '0.5px solid #c8c7be', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
              Annulla
            </button>
            <button onClick={upload} disabled={uploading}
              style={{ flex: 2, padding: '8px', background: uploading ? '#f0efe9' : '#1a4a7a', color: uploading ? '#8a8a84' : '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: uploading ? 'default' : 'pointer' }}>
              {uploading ? 'Caricamento...' : 'Carica foto'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
