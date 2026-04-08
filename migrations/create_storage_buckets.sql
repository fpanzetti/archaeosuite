-- ==============================================================
-- Migration: Creazione bucket Supabase Storage
-- Data: 2026-04-08
--
-- Eseguire nel Supabase Dashboard → SQL Editor.
-- Crea i bucket "avatars" e "foto-scavi" se non esistono già.
--
-- IMPORTANTE: Il bucket "avatars" è PUBLIC (gli URL sono esposti
-- direttamente su account.avatar_url senza token firmati).
-- Il bucket "foto-scavi" è PRIVATE (accesso solo tramite policy RLS).
-- ==============================================================

-- Bucket avatar profilo utente (pubblico — URL diretto senza token)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,                          -- bucket pubblico
  2097152,                       -- 2 MB max per file
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- Bucket foto scavi (privato — accesso tramite RLS)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'foto-scavi',
  'foto-scavi',
  false,                         -- bucket privato
  10485760,                      -- 10 MB max per file
  ARRAY['image/jpeg','image/png','image/webp','image/heic','image/tiff']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
