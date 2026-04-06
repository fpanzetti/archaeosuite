'use client'
import { createContext, useContext, useState, useEffect } from 'react'

export type NomeTema = 'default' | 'outdoor'

export interface Palette {
  // Sfondi
  bgApp: string         // sfondo generale app
  bgPage: string        // sfondo pagina
  bgCard: string        // sfondo card / pannelli
  bgCardAlt: string     // sfondo card alternativo (riga zebrata, ecc.)
  bgInput: string       // sfondo input
  bgSidebar: string     // sfondo sidebar
  bgHighlight: string   // highlight selezione / hover
  bgBadgeNeutro: string // badge neutro (grigio)

  // Bordi
  border: string        // bordo standard
  borderStrong: string  // bordo più marcato

  // Testo
  textPrimary: string   // testo principale
  textSecondary: string // testo secondario
  textMuted: string     // testo disabilitato / placeholder

  // Accenti blu (azioni primarie)
  accentBlue: string
  accentBlueBg: string
  accentBlueBorder: string

  // Accenti verde (successo / completato)
  accentGreen: string
  accentGreenBg: string

  // Accenti ambra (in lavorazione)
  accentAmber: string
  accentAmberBg: string

  // Accenti rosso (errori / azioni distruttive)
  accentRed: string
  accentRedBg: string
  accentRedBorder: string

  // Dimensioni accessibilità outdoor
  minTouchSize: string  // min height pulsanti
  fontSizeMin: string   // font-size minimo
}

const palettaDefault: Palette = {
  bgApp: '#f8f7f4',
  bgPage: '#f8f7f4',
  bgCard: '#fff',
  bgCardAlt: '#fafaf8',
  bgInput: '#f8f7f4',
  bgSidebar: '#fff',
  bgHighlight: '#e8f0f8',
  bgBadgeNeutro: '#f0efe9',

  border: '#e0dfd8',
  borderStrong: '#c8c7be',

  textPrimary: '#1a1a1a',
  textSecondary: '#555550',
  textMuted: '#8a8a84',

  accentBlue: '#1a4a7a',
  accentBlueBg: '#e8f0f8',
  accentBlueBorder: '#1a4a7a40',

  accentGreen: '#1a6b4a',
  accentGreenBg: '#e8f4ef',

  accentAmber: '#8a5c0a',
  accentAmberBg: '#fdf3e0',

  accentRed: '#c00',
  accentRedBg: '#fff8f8',
  accentRedBorder: '#e88',

  minTouchSize: '32px',
  fontSizeMin: '12px',
}

const palettaOutdoor: Palette = {
  bgApp: '#000',
  bgPage: '#000',
  bgCard: '#1a1a1a',
  bgCardAlt: '#141414',
  bgInput: '#111',
  bgSidebar: '#0a0a0a',
  bgHighlight: '#1e2a1e',
  bgBadgeNeutro: '#2a2a2a',

  border: '#444',
  borderStrong: '#666',

  textPrimary: '#fff',
  textSecondary: '#ccc',
  textMuted: '#888',

  accentBlue: '#5b9bd5',
  accentBlueBg: '#0d1f33',
  accentBlueBorder: '#5b9bd580',

  accentGreen: '#4caf50',
  accentGreenBg: '#0d2211',

  accentAmber: '#f0a030',
  accentAmberBg: '#2a1800',

  accentRed: '#ff4444',
  accentRedBg: '#2a0000',
  accentRedBorder: '#cc2222',

  minTouchSize: '56px',
  fontSizeMin: '13px',
}

export const palettes: Record<NomeTema, Palette> = {
  default: palettaDefault,
  outdoor: palettaOutdoor,
}

interface ThemeContextType {
  tema: NomeTema
  setTema: (t: NomeTema) => void
  p: Palette
}

const ThemeContext = createContext<ThemeContextType>({
  tema: 'default',
  setTema: () => {},
  p: palettaDefault,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTemaState] = useState<NomeTema>('default')

  // Legge tema salvato all'avvio
  useEffect(() => {
    const saved = localStorage.getItem('archaeosuite-tema') as NomeTema | null
    if (saved === 'outdoor' || saved === 'default') {
      setTemaState(saved)
    }
  }, [])

  // Sincronizza body background e color con il tema attivo
  useEffect(() => {
    const pal = palettes[tema]
    document.body.style.background = pal.bgApp
    document.body.style.color = pal.textPrimary
    // Attributo data-theme per eventuali override CSS
    document.documentElement.setAttribute('data-theme', tema)
  }, [tema])

  function setTema(t: NomeTema) {
    setTemaState(t)
    localStorage.setItem('archaeosuite-tema', t)
  }

  return (
    <ThemeContext.Provider value={{ tema, setTema, p: palettes[tema] }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTema() {
  return useContext(ThemeContext)
}
