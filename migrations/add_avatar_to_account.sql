-- AS-138: Aggiungi colonna avatar_url alla tabella account
-- Consente agli utenti di caricare un'immagine di profilo

ALTER TABLE account
ADD COLUMN avatar_url TEXT NULLABLE;

COMMENT ON COLUMN account.avatar_url IS 'URL pubblico dell''immagine di profilo utente in storage.avatars';
