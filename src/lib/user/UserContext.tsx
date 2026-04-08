'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─────────────────────────────────────────────────────────────
// Tipo dati utente
// ─────────────────────────────────────────────────────────────
export interface DatiUtente {
  id:          string
  email:       string
  nome:        string
  cognome:     string
  professione: string
  avatarUrl:   string
  createdAt:   string
}

interface UserContextValue {
  utente:         DatiUtente | null
  loading:        boolean
  // Chiamare dopo ogni aggiornamento del profilo per forzare il reload
  refreshUtente:  () => Promise<void>
  // Aggiornamento ottimistico locale (senza round-trip al DB)
  setUtenteLocal: (patch: Partial<DatiUtente>) => void
}

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────
const UserContext = createContext<UserContextValue>({
  utente:         null,
  loading:        true,
  refreshUtente:  async () => {},
  setUtenteLocal: () => {},
})

// ─────────────────────────────────────────────────────────────
// Provider — da inserire in AppShell, avvolge Sidebar + pagine
// ─────────────────────────────────────────────────────────────
export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [utente, setUtente]   = useState<DatiUtente | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUtente = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) { console.error('UserContext — auth error:', authError); setUtente(null); setLoading(false); return }
      if (!user)     { setUtente(null); setLoading(false); return }

      const { data: account, error: accountError } = await supabase
        .from('account')
        .select('nome, cognome, professione, avatar_url')
        .eq('id', user.id)
        .single()

      if (accountError) console.error('UserContext — account query error:', accountError)

      // Imposta utente anche se account è null (es. colonna mancante, RLS):
      // la UI mostra almeno email e id, senza bloccarsi su "Caricamento..."
      setUtente({
        id:          user.id,
        email:       user.email      ?? '',
        nome:        account?.nome        ?? '',
        cognome:     account?.cognome     ?? '',
        professione: account?.professione ?? '',
        avatarUrl:   account?.avatar_url  ?? '',
        createdAt:   user.created_at ?? '',
      })
    } catch (err) {
      console.error('UserContext — fetchUtente exception:', err)
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Carica al mount, una volta sola
  useEffect(() => {
    fetchUtente()
  }, [fetchUtente])

  // Aggiornamento ottimistico: aggiorna lo stato locale immediatamente,
  // così la UI risponde senza aspettare il round-trip al DB.
  const setUtenteLocal = useCallback((patch: Partial<DatiUtente>) => {
    setUtente(prev => prev ? { ...prev, ...patch } : prev)
  }, [])

  return (
    <UserContext.Provider value={{
      utente,
      loading,
      refreshUtente:  fetchUtente,
      setUtenteLocal,
    }}>
      {children}
    </UserContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────
export function useUser() {
  return useContext(UserContext)
}
