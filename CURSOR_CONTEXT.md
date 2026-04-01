# ArchaeoSuite — Cursor Context

## Panoramica
ArchaeoSuite è una piattaforma SaaS modulare per la documentazione archeologica professionale.
Repository: github.com/fpanzetti/archaeosuite
URL produzione: archaeosuite.vercel.app
Stack: Next.js 16.2.1, React 19, TypeScript 5, Supabase, Vercel

## Struttura directory chiave
```
src/app/
  reports/
    page.tsx                              — dashboard Progetti + Scavi standalone
    progetti/
      nuovo/page.tsx + actions.ts         — form nuovo progetto
      [id]/page.tsx                       — pagina dettaglio progetto
    scavi/
      actions.ts                          — Server Action creaScavo
      nuovo/page.tsx                      — form nuovo scavo
      [id]/page.tsx                       — scheda scavo con elenco US e tombe
      [id]/modifica/page.tsx              — modifica anagrafica scavo
      [id]/us/nuova/page.tsx              — form nuova US
      [id]/us/[usId]/page.tsx             — scheda US a 7 step (1100+ righe)
      [id]/tombe/nuova/actions.ts         — Server Action creaTomba
      [id]/tombe/[tombaId]/page.tsx       — scheda contesto funerario a 11 step
  profilo/page.tsx
src/components/
  layout/Sidebar.tsx
  ui/
    SearchableSelect.tsx
    UploadFoto.tsx
    GalleriaFoto.tsx
  scavo/
    PannelloInviti.tsx                    — Team e ruoli
    AggiuntaUS.tsx
    ElencoUS.tsx
    ElencoTombe.tsx
    AssegnaProgetto.tsx
```

## Vincoli architetturali critici
1. **RLS DISABILITATA** su tutte le tabelle Supabase — workaround per `auth.uid()` null in Server Actions
2. **Server Actions** devono stare in file `actions.ts` separati, MAI inline in JSX
3. **Middleware** si chiama `proxy.ts` (non `middleware.ts`) — conflitto Next.js 16
4. **useSearchParams()** richiede Suspense boundary in Next.js 16

## Convenzioni di codice
- Stili inline come oggetti TypeScript: `const inp: React.CSSProperties = {...}`
- Palette: sfondo `#f8f7f4`, card `#fff`, blu `#1a4a7a`, verde `#1a6b4a`, ambra `#8a5c0a`, rosso `#c00`
- Variabili stile ricorrenti: `inp`, `lbl`, `card`, `grid2`, `grid3`, `sectionTitle`
- File >300 righe: riscrittura con `cat > file << 'ENDOFFILE'`
- Patch piccole: Python con `content.replace()`
- Commit dopo ogni modifica logica

## Pattern autosave (scheda US e scheda Tomba)
```typescript
const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
function set(field: string, value: unknown) {
  setForm(prev => ({ ...prev, [field]: value }))
  setDirty(true)
  if (autosaveRef.current) clearTimeout(autosaveRef.current)
  autosaveRef.current = setTimeout(() => salva(), 3000)
}
```

## Gerarchia dati
Progetto → Scavo → (Contesto funerario) → US
- Un progetto può contenere N scavi
- Uno scavo può contenere N US e N contesti funerari
- Un contesto funerario può contenere N reperti (reperto_funerario)
- Le foto sono collegate a scavo_id + opzionalmente us_id o contesto_funerario_id
