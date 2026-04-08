-- ==============================================================
-- ArchaeoSuite — Row Level Security Policies
-- Versione: 1.0  |  Data: 2026-04-07
--
-- Applicare nel Supabase Dashboard → SQL Editor
-- Eseguire TUTTO in una volta (seleziona tutto, Run)
--
-- LOGICA DI ACCESSO:
--   responsabile_id = proprietario dello scavo/progetto
--   accesso_scavo.ruolo:
--     editor        → lettura + scrittura + inviti
--     collaboratore → lettura + scrittura dati (no inviti, no elimina scavo)
--     visualizzatore → sola lettura
-- ==============================================================

-- ───────────────────────────────────────────────────────────────
-- 0. Helper function — controlla accesso ad uno scavo
--    SECURITY DEFINER: gira come postgres, bypassando RLS
--    per evitare ricorsione nelle policy.
--    p_ruoli = NULL  →  qualsiasi ruolo è accettato
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION ha_accesso_scavo(
  p_scavo_id UUID,
  p_ruoli    TEXT[] DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    -- È il responsabile (owner)
    EXISTS (
      SELECT 1 FROM scavo
      WHERE id = p_scavo_id
        AND responsabile_id = auth.uid()
    )
    OR
    -- Ha un record in accesso_scavo con il ruolo richiesto
    EXISTS (
      SELECT 1 FROM accesso_scavo
      WHERE scavo_id    = p_scavo_id
        AND account_id  = auth.uid()
        AND (p_ruoli IS NULL OR ruolo = ANY(p_ruoli))
    )
$$;


-- ==============================================================
-- 1. account
--    Ogni utente legge/modifica solo il proprio profilo.
-- ==============================================================
ALTER TABLE account ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "account_select_own"  ON account;
DROP POLICY IF EXISTS "account_insert_own"  ON account;
DROP POLICY IF EXISTS "account_update_own"  ON account;

CREATE POLICY "account_select_own" ON account
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "account_insert_own" ON account
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "account_update_own" ON account
  FOR UPDATE TO authenticated
  USING    (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ==============================================================
-- 2. progetto
--    Visibile al responsabile e a chi partecipa a uno scavo
--    del progetto (via accesso_scavo).
-- ==============================================================
ALTER TABLE progetto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "progetto_select" ON progetto;
DROP POLICY IF EXISTS "progetto_insert" ON progetto;
DROP POLICY IF EXISTS "progetto_update" ON progetto;
DROP POLICY IF EXISTS "progetto_delete" ON progetto;

CREATE POLICY "progetto_select" ON progetto
  FOR SELECT TO authenticated
  USING (
    responsabile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM scavo s
      WHERE s.progetto_id = progetto.id
        AND ha_accesso_scavo(s.id)
    )
  );

CREATE POLICY "progetto_insert" ON progetto
  FOR INSERT TO authenticated
  WITH CHECK (responsabile_id = auth.uid());

-- Solo il responsabile del progetto può modificarlo
CREATE POLICY "progetto_update" ON progetto
  FOR UPDATE TO authenticated
  USING    (responsabile_id = auth.uid())
  WITH CHECK (responsabile_id = auth.uid());

CREATE POLICY "progetto_delete" ON progetto
  FOR DELETE TO authenticated
  USING (responsabile_id = auth.uid());


-- ==============================================================
-- 3. scavo
--    SELECT: responsabile o membro (qualsiasi ruolo)
--    INSERT: solo chi lo crea (responsabile_id = auth.uid())
--    UPDATE: responsabile o editor
--    DELETE: solo responsabile
-- ==============================================================
ALTER TABLE scavo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scavo_select" ON scavo;
DROP POLICY IF EXISTS "scavo_insert" ON scavo;
DROP POLICY IF EXISTS "scavo_update" ON scavo;
DROP POLICY IF EXISTS "scavo_delete" ON scavo;

CREATE POLICY "scavo_select" ON scavo
  FOR SELECT TO authenticated
  USING (ha_accesso_scavo(id));

CREATE POLICY "scavo_insert" ON scavo
  FOR INSERT TO authenticated
  WITH CHECK (responsabile_id = auth.uid());

CREATE POLICY "scavo_update" ON scavo
  FOR UPDATE TO authenticated
  USING    (ha_accesso_scavo(id, ARRAY['editor']::TEXT[]))
  WITH CHECK (ha_accesso_scavo(id, ARRAY['editor']::TEXT[]));

CREATE POLICY "scavo_delete" ON scavo
  FOR DELETE TO authenticated
  USING (responsabile_id = auth.uid());


-- ==============================================================
-- 4. us (Unità Stratigrafica)
--    SELECT: chi ha accesso allo scavo (qualsiasi ruolo)
--    INSERT/UPDATE: responsabile, editor, collaboratore
--    DELETE: responsabile o editor
-- ==============================================================
ALTER TABLE us ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "us_select" ON us;
DROP POLICY IF EXISTS "us_insert" ON us;
DROP POLICY IF EXISTS "us_update" ON us;
DROP POLICY IF EXISTS "us_delete" ON us;

CREATE POLICY "us_select" ON us
  FOR SELECT TO authenticated
  USING (ha_accesso_scavo(scavo_id));

CREATE POLICY "us_insert" ON us
  FOR INSERT TO authenticated
  WITH CHECK (ha_accesso_scavo(scavo_id, ARRAY['editor','collaboratore']::TEXT[]));

CREATE POLICY "us_update" ON us
  FOR UPDATE TO authenticated
  USING    (ha_accesso_scavo(scavo_id, ARRAY['editor','collaboratore']::TEXT[]))
  WITH CHECK (ha_accesso_scavo(scavo_id, ARRAY['editor','collaboratore']::TEXT[]));

CREATE POLICY "us_delete" ON us
  FOR DELETE TO authenticated
  USING (ha_accesso_scavo(scavo_id, ARRAY['editor']::TEXT[]));


-- ==============================================================
-- 5. contesto_funerario (ArchaeoTombs)
--    Stesse regole di us.
-- ==============================================================
ALTER TABLE contesto_funerario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cf_select" ON contesto_funerario;
DROP POLICY IF EXISTS "cf_insert" ON contesto_funerario;
DROP POLICY IF EXISTS "cf_update" ON contesto_funerario;
DROP POLICY IF EXISTS "cf_delete" ON contesto_funerario;

CREATE POLICY "cf_select" ON contesto_funerario
  FOR SELECT TO authenticated
  USING (ha_accesso_scavo(scavo_id));

CREATE POLICY "cf_insert" ON contesto_funerario
  FOR INSERT TO authenticated
  WITH CHECK (ha_accesso_scavo(scavo_id, ARRAY['editor','collaboratore']::TEXT[]));

CREATE POLICY "cf_update" ON contesto_funerario
  FOR UPDATE TO authenticated
  USING    (ha_accesso_scavo(scavo_id, ARRAY['editor','collaboratore']::TEXT[]))
  WITH CHECK (ha_accesso_scavo(scavo_id, ARRAY['editor','collaboratore']::TEXT[]));

CREATE POLICY "cf_delete" ON contesto_funerario
  FOR DELETE TO authenticated
  USING (ha_accesso_scavo(scavo_id, ARRAY['editor']::TEXT[]));


-- ==============================================================
-- 6. reperto_funerario
--    Accesso tramite contesto_funerario → scavo.
-- ==============================================================
ALTER TABLE reperto_funerario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rp_select" ON reperto_funerario;
DROP POLICY IF EXISTS "rp_insert" ON reperto_funerario;
DROP POLICY IF EXISTS "rp_update" ON reperto_funerario;
DROP POLICY IF EXISTS "rp_delete" ON reperto_funerario;

CREATE POLICY "rp_select" ON reperto_funerario
  FOR SELECT TO authenticated
  USING (ha_accesso_scavo(scavo_id));

CREATE POLICY "rp_insert" ON reperto_funerario
  FOR INSERT TO authenticated
  WITH CHECK (ha_accesso_scavo(scavo_id, ARRAY['editor','collaboratore']::TEXT[]));

CREATE POLICY "rp_update" ON reperto_funerario
  FOR UPDATE TO authenticated
  USING    (ha_accesso_scavo(scavo_id, ARRAY['editor','collaboratore']::TEXT[]))
  WITH CHECK (ha_accesso_scavo(scavo_id, ARRAY['editor','collaboratore']::TEXT[]));

CREATE POLICY "rp_delete" ON reperto_funerario
  FOR DELETE TO authenticated
  USING (ha_accesso_scavo(scavo_id, ARRAY['editor']::TEXT[]));


-- ==============================================================
-- 7. foto
--    Accesso tramite scavo_id.
-- ==============================================================
ALTER TABLE foto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "foto_select" ON foto;
DROP POLICY IF EXISTS "foto_insert" ON foto;
DROP POLICY IF EXISTS "foto_update" ON foto;
DROP POLICY IF EXISTS "foto_delete" ON foto;

CREATE POLICY "foto_select" ON foto
  FOR SELECT TO authenticated
  USING (ha_accesso_scavo(scavo_id));

CREATE POLICY "foto_insert" ON foto
  FOR INSERT TO authenticated
  WITH CHECK (ha_accesso_scavo(scavo_id, ARRAY['editor','collaboratore']::TEXT[]));

CREATE POLICY "foto_update" ON foto
  FOR UPDATE TO authenticated
  USING    (ha_accesso_scavo(scavo_id, ARRAY['editor','collaboratore']::TEXT[]))
  WITH CHECK (ha_accesso_scavo(scavo_id, ARRAY['editor','collaboratore']::TEXT[]));

CREATE POLICY "foto_delete" ON foto
  FOR DELETE TO authenticated
  USING (ha_accesso_scavo(scavo_id, ARRAY['editor']::TEXT[]));


-- ==============================================================
-- 8. rapporto_stratigrafico
--    Accesso tramite us → scavo_id.
--    Nota: rapporto_stratigrafico non ha scavo_id diretto,
--    il join passa per us.
-- ==============================================================
ALTER TABLE rapporto_stratigrafico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rs_select" ON rapporto_stratigrafico;
DROP POLICY IF EXISTS "rs_insert" ON rapporto_stratigrafico;
DROP POLICY IF EXISTS "rs_update" ON rapporto_stratigrafico;
DROP POLICY IF EXISTS "rs_delete" ON rapporto_stratigrafico;

CREATE POLICY "rs_select" ON rapporto_stratigrafico
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM us WHERE us.id = rapporto_stratigrafico.us_id
        AND ha_accesso_scavo(us.scavo_id)
    )
  );

CREATE POLICY "rs_insert" ON rapporto_stratigrafico
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM us WHERE us.id = rapporto_stratigrafico.us_id
        AND ha_accesso_scavo(us.scavo_id, ARRAY['editor','collaboratore']::TEXT[])
    )
  );

CREATE POLICY "rs_update" ON rapporto_stratigrafico
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM us WHERE us.id = rapporto_stratigrafico.us_id
        AND ha_accesso_scavo(us.scavo_id, ARRAY['editor','collaboratore']::TEXT[])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM us WHERE us.id = rapporto_stratigrafico.us_id
        AND ha_accesso_scavo(us.scavo_id, ARRAY['editor','collaboratore']::TEXT[])
    )
  );

CREATE POLICY "rs_delete" ON rapporto_stratigrafico
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM us WHERE us.id = rapporto_stratigrafico.us_id
        AND ha_accesso_scavo(us.scavo_id, ARRAY['editor']::TEXT[])
    )
  );


-- ==============================================================
-- 9. accesso_scavo
--    SELECT: chi ha già accesso allo scavo vede la lista team
--    INSERT: responsabile (crea lo scavo) O invitato con token valido
--    UPDATE: editor del scavo O l'utente stesso (per re-accept invite)
--    DELETE: responsabile, editor, o l'utente stesso (abbandona)
-- ==============================================================
ALTER TABLE accesso_scavo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "accesso_select" ON accesso_scavo;
DROP POLICY IF EXISTS "accesso_insert" ON accesso_scavo;
DROP POLICY IF EXISTS "accesso_update" ON accesso_scavo;
DROP POLICY IF EXISTS "accesso_delete" ON accesso_scavo;

CREATE POLICY "accesso_select" ON accesso_scavo
  FOR SELECT TO authenticated
  USING (ha_accesso_scavo(scavo_id));

-- INSERT: solo per se stessi; richiede essere responsabile O avere un invito valido
CREATE POLICY "accesso_insert" ON accesso_scavo
  FOR INSERT TO authenticated
  WITH CHECK (
    account_id = auth.uid()
    AND (
      -- Il responsabile si aggiunge come editor quando crea lo scavo
      EXISTS (
        SELECT 1 FROM scavo
        WHERE id = accesso_scavo.scavo_id
          AND responsabile_id = auth.uid()
      )
      OR
      -- Oppure c'è un invito valido per la sua email e il ruolo corretto
      EXISTS (
        SELECT 1 FROM invito
        WHERE scavo_id = accesso_scavo.scavo_id
          AND email    = lower(auth.email())
          AND ruolo    = accesso_scavo.ruolo
          AND (stato IS NULL OR stato <> 'accettato')
          AND expires_at > now()
      )
    )
  );

-- UPDATE: l'utente aggiorna il proprio record (re-accept) O un editor aggiorna gli altri
CREATE POLICY "accesso_update" ON accesso_scavo
  FOR UPDATE TO authenticated
  USING (
    account_id = auth.uid()
    OR ha_accesso_scavo(scavo_id, ARRAY['editor']::TEXT[])
  )
  WITH CHECK (
    account_id = auth.uid()
    OR ha_accesso_scavo(scavo_id, ARRAY['editor']::TEXT[])
  );

-- DELETE: abbandono (account stesso) O revoca da editor/responsabile
CREATE POLICY "accesso_delete" ON accesso_scavo
  FOR DELETE TO authenticated
  USING (
    account_id = auth.uid()
    OR ha_accesso_scavo(scavo_id, ARRAY['editor']::TEXT[])
  );


-- ==============================================================
-- 10. invito
--     SELECT: editor del scavo O il destinatario (email match)
--     INSERT: solo editor del scavo
--     UPDATE: editor del scavo (revoca/rinnovo) O destinatario (accetta)
--     DELETE: editor del scavo
-- ==============================================================
ALTER TABLE invito ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invito_select" ON invito;
DROP POLICY IF EXISTS "invito_insert" ON invito;
DROP POLICY IF EXISTS "invito_update" ON invito;
DROP POLICY IF EXISTS "invito_delete" ON invito;

CREATE POLICY "invito_select" ON invito
  FOR SELECT TO authenticated
  USING (
    lower(email) = lower(auth.email())
    OR ha_accesso_scavo(scavo_id, ARRAY['editor']::TEXT[])
  );

CREATE POLICY "invito_insert" ON invito
  FOR INSERT TO authenticated
  WITH CHECK (
    ha_accesso_scavo(scavo_id, ARRAY['editor']::TEXT[])
  );

-- UPDATE: editor (rinnova/revoca) O destinatario (segna come accettato)
CREATE POLICY "invito_update" ON invito
  FOR UPDATE TO authenticated
  USING (
    lower(email) = lower(auth.email())
    OR ha_accesso_scavo(scavo_id, ARRAY['editor']::TEXT[])
  )
  WITH CHECK (
    lower(email) = lower(auth.email())
    OR ha_accesso_scavo(scavo_id, ARRAY['editor']::TEXT[])
  );

CREATE POLICY "invito_delete" ON invito
  FOR DELETE TO authenticated
  USING (ha_accesso_scavo(scavo_id, ARRAY['editor']::TEXT[]));


-- ==============================================================
-- 11. thesaurus
--     Lettura per tutti gli autenticati.
--     Scrittura per tutti (vocabolario condiviso e custom).
--     AS-76 aggiungerà thesaurus_utente per valori personali.
-- ==============================================================
ALTER TABLE thesaurus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "thesaurus_select" ON thesaurus;
DROP POLICY IF EXISTS "thesaurus_insert" ON thesaurus;
DROP POLICY IF EXISTS "thesaurus_update" ON thesaurus;

CREATE POLICY "thesaurus_select" ON thesaurus
  FOR SELECT TO authenticated
  USING (true);

-- Tutti gli autenticati possono aggiungere valori custom
CREATE POLICY "thesaurus_insert" ON thesaurus
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Nessuno può modificare i valori esistenti (solo aggiunta)
-- (solo gli admin Supabase possono via service_role)


-- ==============================================================
-- 12. Tabelle di lookup — sola lettura per tutti gli autenticati
--     (munsell, sabap, provincia)
-- ==============================================================
ALTER TABLE munsell  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sabap    ENABLE ROW LEVEL SECURITY;
ALTER TABLE provincia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "munsell_select"   ON munsell;
DROP POLICY IF EXISTS "sabap_select"     ON sabap;
DROP POLICY IF EXISTS "provincia_select" ON provincia;

CREATE POLICY "munsell_select"   ON munsell   FOR SELECT TO authenticated USING (true);
CREATE POLICY "sabap_select"     ON sabap     FOR SELECT TO authenticated USING (true);
CREATE POLICY "provincia_select" ON provincia FOR SELECT TO authenticated USING (true);


-- ==============================================================
-- 13. Indici di performance per le policy RLS
--     (le policy fanno molti join — questi indici sono critici)
-- ==============================================================
CREATE INDEX IF NOT EXISTS idx_scavo_responsabile
  ON scavo(responsabile_id);

CREATE INDEX IF NOT EXISTS idx_accesso_scavo_account
  ON accesso_scavo(account_id);

CREATE INDEX IF NOT EXISTS idx_accesso_scavo_scavo
  ON accesso_scavo(scavo_id);

CREATE INDEX IF NOT EXISTS idx_accesso_composito
  ON accesso_scavo(scavo_id, account_id, ruolo);

CREATE INDEX IF NOT EXISTS idx_us_scavo
  ON us(scavo_id);

CREATE INDEX IF NOT EXISTS idx_cf_scavo
  ON contesto_funerario(scavo_id);

CREATE INDEX IF NOT EXISTS idx_rp_scavo
  ON reperto_funerario(scavo_id);

CREATE INDEX IF NOT EXISTS idx_foto_scavo
  ON foto(scavo_id);

CREATE INDEX IF NOT EXISTS idx_rs_us
  ON rapporto_stratigrafico(us_id);

CREATE INDEX IF NOT EXISTS idx_invito_scavo
  ON invito(scavo_id);

CREATE INDEX IF NOT EXISTS idx_invito_email
  ON invito(lower(email));

-- ==============================================================
-- 14. Storage — bucket "avatars"
--     Ogni utente autenticato può caricare/aggiornare/eliminare
--     SOLO il proprio file ({user_id}-avatar.jpg).
--     La lettura è pubblica (l'URL viene salvato su account.avatar_url
--     ed esposto nella UI senza token).
-- ==============================================================

-- INSERT (nuovo oggetto)
DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND name = (auth.uid()::text || '-avatar.jpg')
  );

-- UPDATE (upsert — Supabase usa UPDATE per sovrascrivere)
DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name = (auth.uid()::text || '-avatar.jpg')
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND name = (auth.uid()::text || '-avatar.jpg')
  );

-- DELETE
DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name = (auth.uid()::text || '-avatar.jpg')
  );

-- SELECT — lettura pubblica (il bucket deve essere impostato come "public"
-- nel Dashboard; questa policy copre anche i client autenticati)
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
CREATE POLICY "avatars_select_public" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');


-- ==============================================================
-- 15. Storage — bucket "foto-scavi"
--     Struttura path: {scavo_id}/{us_segment}/{file_id}.jpg
--     La prima componente del path è lo scavo_id.
--     Lettura:   chi ha accesso allo scavo (qualsiasi ruolo)
--     Scrittura: editor o collaboratore dello scavo
--     Elimina:   editor dello scavo
-- ==============================================================

-- Helper: estrae lo scavo_id dalla prima componente del path Storage.
-- Usato nelle policy qui sotto per evitare duplicazione.
CREATE OR REPLACE FUNCTION storage_scavo_id(obj_name TEXT)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT (split_part(obj_name, '/', 1))::UUID
$$;

-- SELECT
DROP POLICY IF EXISTS "foto_scavi_select" ON storage.objects;
CREATE POLICY "foto_scavi_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'foto-scavi'
    AND ha_accesso_scavo(storage_scavo_id(name))
  );

-- INSERT
DROP POLICY IF EXISTS "foto_scavi_insert" ON storage.objects;
CREATE POLICY "foto_scavi_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'foto-scavi'
    AND ha_accesso_scavo(storage_scavo_id(name), ARRAY['editor','collaboratore']::TEXT[])
  );

-- UPDATE
DROP POLICY IF EXISTS "foto_scavi_update" ON storage.objects;
CREATE POLICY "foto_scavi_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'foto-scavi'
    AND ha_accesso_scavo(storage_scavo_id(name), ARRAY['editor','collaboratore']::TEXT[])
  )
  WITH CHECK (
    bucket_id = 'foto-scavi'
    AND ha_accesso_scavo(storage_scavo_id(name), ARRAY['editor','collaboratore']::TEXT[])
  );

-- DELETE
DROP POLICY IF EXISTS "foto_scavi_delete" ON storage.objects;
CREATE POLICY "foto_scavi_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'foto-scavi'
    AND ha_accesso_scavo(storage_scavo_id(name), ARRAY['editor']::TEXT[])
  );


-- ==============================================================
-- Fine script RLS
-- Dopo aver eseguito, verifica in Table Editor → Auth Policies
-- che ogni tabella mostri "RLS enabled".
-- Per i bucket Storage: Dashboard → Storage → [bucket] → Policies
-- Assicurarsi che i bucket "avatars" e "foto-scavi" esistano e
-- che "avatars" sia impostato come PUBLIC (per gli URL pubblici).
-- ==============================================================
