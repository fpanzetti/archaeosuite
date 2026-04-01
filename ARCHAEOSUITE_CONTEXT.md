# ArchaeoSuite — Contesto di sviluppo

Aggiornato al 1 aprile 2026.

## Cos'è ArchaeoSuite
Piattaforma SaaS modulare per la documentazione archeologica professionale italiana.
Target: archeologi professionisti, cooperative, Soprintendenze.
Sviluppato da Francesco Panzetti (Chicco) con Franco Zetti.

## Moduli
- **ArchaeoReports** — documentazione scavi, schede US (core, attivo)
- **ArchaeoTombs** — schede di contesto funerario (in sviluppo)
- **ArchaeoFinds** — gestione reperti (pianificato)
- **ArchaeoReport Writer** — editor scientifico con output PDF (pianificato)

## Stack tecnico
- Next.js 16.2.1 + React 19 + TypeScript 5
- Supabase (PostgreSQL + Auth + Storage)
- Vercel (deploy)
- Repository: github.com/fpanzetti/archaeosuite
- Produzione: archaeosuite.vercel.app
- Locale: ~/Developer/archaeosuite

## Stato attuale (1 aprile 2026)

### Completato
- Auth login/registrazione + middleware protezione route (proxy.ts)
- Gerarchia Progetto → Scavo → US + Contesto funerario
- Dashboard /reports con sezione Progetti e Scavi standalone
- Form nuovo progetto e pagina dettaglio progetto
- Funzione "Aggiungi a progetto" con selezione multipla scavi
- Scheda scavo con anagrafica, Team e ruoli, elenco US e tombe
- Scheda US a 7 step con autosave, dirty state, rapporti stratigrafici
- Gestione foto: EXIF, ID automatico, autore, didascalia modificabile, galleria
- PannelloInviti: invita, rimuovi, abbandona, cambia ruolo
- SearchableSelect con allowFreeText, X per cancellare, editabile inline
- Scheda contesto funerario (ArchaeoTombs) a 11 step completa
- ElencoTombe nella scheda scavo
- Creazione tomba diretta da AggiuntaUS

### In corso
- Fix layout scheda tomba (ticket aperti in Kanban)
- Tab Foto in scheda tomba (mostra foto scavo invece di tomba)
- Foto per RP nella tab Reperti

### Pendente
- Fix RLS (critico prima della beta)
- Badge "Condiviso con" in lista scavi (AS-34)
- Salvataggio valori custom nel thesaurus (AS-76)
- ArchaeoFinds
- ArchaeoReport Writer

## Vincoli critici
1. RLS DISABILITATA su tutte le tabelle — workaround auth.uid() null
2. Server Actions in file actions.ts separati (mai inline in JSX)
3. Middleware: proxy.ts (non middleware.ts)
4. useSearchParams() richiede Suspense boundary
5. File >300 righe: riscrittura completa con cat > file

## Convenzioni
- Stili inline TypeScript: inp, lbl, card, grid2, grid3, sectionTitle
- Palette: #f8f7f4 (bg), #fff (card), #1a4a7a (blu), #1a6b4a (verde), #8a5c0a (ambra), #c00 (rosso)
- Commit dopo ogni modifica logica
- Test su archaeosuite.vercel.app dopo ogni push

## File di documentazione nel repository
- CURSOR_CONTEXT.md — contesto tecnico per Cursor
- SCHEMA_DB.md — schema completo del DB Supabase
- OPEN_TICKETS.md — ticket aperti dal Kanban Notion
- ARCHAEOSUITE_CONTEXT.md — questo file

## Notion (gestione progetto)
- Hub: https://notion.so/32ce40309587813db89cdb44a4d825e4
- Kanban: collection://9542de98-6de8-4052-af5f-10aa3dd923a3
- Time Tracker: collection://94f8c52d-3a79-44c5-aeec-b742924604b6
