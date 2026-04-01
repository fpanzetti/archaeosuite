# ArchaeoSuite — Ticket aperti al 1 aprile 2026

> Generato da Notion Kanban. Aggiornare manualmente dopo ogni sessione.

## In sviluppo

### ArchaeoTombs — Scheda contesto funerario
- **AS-TOMBA-01** — Scheda tomba: tab Foto mostra foto non pertinenti
  Correggere passando contesto_funerario_id a GalleriaFoto invece di scavoId generico.
- **AS-TOMBA-02** — Scheda tomba: foto per ogni RP nella tab Reperti
  Aggiungere upload e anteprima foto per ogni RP. Card con prima foto + contatore. Click apre gallery.
- **AS-TOMBA-03** — Scheda tomba: toast Salvato troppo in alto
  Spostare sotto il pulsante Salva, più discreto ma visibile.
- **AS-TOMBA-04** — SearchableSelect: campo editabile inline su valore già selezionato (AS-75)
  Quando si clicca su valore selezionato con allowFreeText, campo torna editabile con valore precompilato.

## Da fare — Alta priorità

### ArchaeoReports
- **AS-34** — Badge "Condiviso con" nella lista scavi
  Badge con nome collaboratori sulle card scavo in /reports. Query accessiMap non restituisce dati.

### Infrastruttura
- **FIX-RLS** — Fix RLS (CRITICO prima della beta)
  Ripristinare Row Level Security su tutte le tabelle con policy corrette per auth.uid() in Server Actions.

## Da fare — Media priorità

### ArchaeoTombs
- **AS-TOMBA-05** — Sezione 9 (Collocazione materiale) rimanda ad ArchaeoFinds
  Da implementare quando ArchaeoFinds sarà disponibile.

## Backlog

### Infrastruttura
- **AS-76** — Vocabolario personalizzato per valori custom nei campi thesaurus (Milestone M3)
  Salvare valori custom in thesaurus_utente per ricarico automatico.

### ArchaeoTombs
- **AS-58** — Assegna US a scheda di contesto funerario
  Dropdown "Assegna a" nella creazione US con elenco tombe disponibili.

### ArchaeoReports
- **AS-WRITER** — ArchaeoReport Writer (Milestone M4)
  Editor scientifico con riferimenti live al DB, grafici auto-generati, output PDF con cartouche SABAP.

## Note tecniche per Cursor

### Problema AS-34 (badge condiviso)
La query `accessiMap` in `reports/page.tsx` carica correttamente i dati ma il badge non appare.
I dati sono in Supabase: scavo "Sepino (CB) Altilia" ha 2 utenti in `accesso_scavo`.
La query usa `.filter()` lato JS invece di `.neq()` su Supabase. Da investigare il rendering.

### Problema AS-75 (SearchableSelect editabile)
Il componente `SearchableSelect.tsx` ha già `onFocus` che pre-popola la query con `displayValue`.
Il salvataggio nel thesaurus via `upsert` con `onConflict: 'tipo,valore'` fallisce silenziosamente.
Verificare che il constraint UNIQUE `thesaurus_tipo_valore_unique` sia attivo e che l'upsert usi la sintassi corretta per Supabase JS v2.

### Problema tab Foto in scheda tomba
`GalleriaFoto` riceve `scavoId` invece di filtrare per `contesto_funerario_id`.
La colonna `contesto_funerario_id` esiste nella tabella `foto` ma non viene usata nel query.
Fix: aggiungere prop `contestoFunerarioId` a `GalleriaFoto` e usarla come filtro.
