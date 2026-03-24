'use client'
import { useState, useRef, useEffect } from 'react'

interface Option { value: string; label: string }

interface Props {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  allowFreeText?: boolean
}

export default function SearchableSelect({ options, value, onChange, placeholder = 'Cerca...', allowFreeText = false }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase())
  )

  const selected = options.find(o => o.value === value)
  const displayValue = selected ? selected.label : (allowFreeText && value ? value : '')

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

  const inp = {
    width: '100%', padding: '7px 10px',
    border: '0.5px solid #c8c7be', borderRadius: '6px',
    background: '#f8f7f4', color: '#1a1a1a', fontSize: '12px',
    cursor: 'pointer' as const,
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        style={inp}
        value={open ? query : displayValue}
        placeholder={placeholder}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: '#fff', border: '0.5px solid #c8c7be', borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto',
          marginTop: '2px',
        }}>
          {allowFreeText && query && !options.find(o => o.label.toLowerCase() === query.toLowerCase()) && (
            <div
              style={{ padding: '8px 10px', fontSize: '12px', color: '#1a4a7a', cursor: 'pointer', borderBottom: '0.5px solid #f0efe9' }}
              onMouseDown={() => { onChange(query); setOpen(false); setQuery('') }}
            >
              Usa &quot;{query}&quot;
            </div>
          )}
          {filtered.length === 0 && !allowFreeText && (
            <div style={{ padding: '8px 10px', fontSize: '12px', color: '#8a8a84' }}>Nessun risultato</div>
          )}
          {filtered.map(o => (
            <div
              key={o.value}
              style={{
                padding: '8px 10px', fontSize: '12px', cursor: 'pointer',
                background: o.value === value ? '#e8f0f8' : 'transparent',
                color: o.value === value ? '#1a4a7a' : '#1a1a1a',
              }}
              onMouseDown={() => { onChange(o.value); setOpen(false); setQuery('') }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
