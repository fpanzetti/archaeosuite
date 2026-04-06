'use client'
import { useState, useRef, useEffect } from 'react'
import { useTema } from '@/lib/theme/ThemeContext'

interface Option { value: string; label: string }

interface Props {
  options: Option[]
  value: string
  onChange: (value: string) => void
  onNewValue?: (value: string) => void
  placeholder?: string
  allowFreeText?: boolean
}

export default function SearchableSelect({ options, value, onChange, onNewValue, placeholder = 'Cerca...', allowFreeText = false }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { p } = useTema()

  const selected = options.find(o => o.value === value)
  const displayValue = selected ? selected.label : (allowFreeText && value ? value : '')

  // Quando apro il dropdown mostro subito tutti i valori, filtrati se query non vuota
  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // FIX ID-75: quando l'utente clicca sul campo con un valore già selezionato,
  // il campo diventa editabile mostrando il valore corrente come query
  function handleFocus() {
    if (value && !open) {
      // Pre-popola la query con il valore attuale così l'utente può modificarlo inline
      setQuery(displayValue)
    } else {
      setQuery('')
    }
    setOpen(true)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setOpen(true)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    setQuery('')
    setOpen(false)
  }

  function selectValue(val: string, isNew: boolean = false) {
    onChange(val)
    if (isNew && onNewValue) onNewValue(val)
    setOpen(false)
    setQuery('')
  }

  const inp: React.CSSProperties = {
    flex: 1,
    padding: '7px 10px',
    border: 'none',
    background: 'transparent',
    color: p.textPrimary,
    fontSize: p.fontSizeMin,
    cursor: 'text',
    outline: 'none',
    fontFamily: 'inherit',
    minWidth: 0,
  }

  const queryIsNew = query && !options.find(o => o.label.toLowerCase() === query.toLowerCase()) && query !== value

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        border: `0.5px solid ${p.borderStrong}`, borderRadius: '6px',
        background: p.bgInput, overflow: 'hidden',
      }}>
        <input
          ref={inputRef}
          style={inp}
          value={open ? query : displayValue}
          placeholder={placeholder}
          onChange={handleChange}
          onFocus={handleFocus}
        />
        {value && (
          <button type="button" onMouseDown={handleClear}
            style={{ padding: '0 8px', background: 'none', border: 'none', color: p.textMuted, cursor: 'pointer', fontSize: '16px', lineHeight: 1, flexShrink: 0 }}
            title="Cancella">
            ×
          </button>
        )}
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: p.bgCard, border: `0.5px solid ${p.borderStrong}`, borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: '200px', overflowY: 'auto',
          marginTop: '2px',
        }}>
          {/* Opzione "Usa valore digitato" per testo libero nuovo */}
          {allowFreeText && queryIsNew && (
            <div
              style={{ padding: '8px 10px', fontSize: '12px', color: p.accentBlue, cursor: 'pointer', borderBottom: `0.5px solid ${p.border}`, background: p.accentBlueBg }}
              onMouseDown={() => selectValue(query, true)}>
              Usa &quot;{query}&quot;
            </div>
          )}
          {filtered.length === 0 && !allowFreeText && (
            <div style={{ padding: '8px 10px', fontSize: '12px', color: p.textMuted }}>Nessun risultato</div>
          )}
          {filtered.length === 0 && allowFreeText && query && !queryIsNew && (
            <div style={{ padding: '8px 10px', fontSize: '12px', color: p.textMuted }}>{value}</div>
          )}
          {filtered.map(o => (
            <div key={o.value}
              style={{
                padding: '8px 10px', fontSize: '12px', cursor: 'pointer',
                background: o.value === value ? p.accentBlueBg : 'transparent',
                color: o.value === value ? p.accentBlue : p.textPrimary,
              }}
              onMouseDown={() => selectValue(o.value)}>
              {o.label}
            </div>
          ))}
          {filtered.length === 0 && allowFreeText && !query && (
            <div style={{ padding: '8px 10px', fontSize: '12px', color: p.border }}>
              Digita per cercare o inserire un nuovo valore
            </div>
          )}
        </div>
      )}
    </div>
  )
}
