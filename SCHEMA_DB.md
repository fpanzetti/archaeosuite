# ArchaeoSuite — Schema DB Supabase

> Aggiornato al 1 aprile 2026. RLS DISABILITATA su tutte le tabelle.

## account
| Campo | Tipo | Note |
|-------|------|-------|
| id | UUID PK | = auth.users.id |
| nome | TEXT | |
| cognome | TEXT | |
| email | TEXT | |
| professione | TEXT | |
| avatar_url | TEXT NULLABLE | URL pubblico immagine profilo (storage.avatars) |
| created_at | TIMESTAMPTZ | |

## progetto
| Campo | Tipo | Note |
|-------|------|-------|
| id | UUID PK | |
| denominazione | TEXT | costruita da committente + tipologia |
| committente | TEXT | |
| operatore | TEXT | |
| direttore_scientifico | TEXT | |
| tipologia_intervento | TEXT | |
| tipo_contesto | TEXT | |
| datazione_contesto | TEXT | |
| data_inizio | DATE | |
| note | TEXT | |
| stato | TEXT | default 'in_corso' |
| responsabile_id | UUID | FK → auth.users |
| created_at | TIMESTAMPTZ | |

## scavo
| Campo | Tipo | Note |
|-------|------|-------|
| id | UUID PK | |
| progetto_id | UUID NULLABLE | FK → progetto |
| denominazione | TEXT | auto: comune (provincia) localita |
| nazione | TEXT | default 'Italia' |
| regione | TEXT | |
| soprintendenza | TEXT | |
| provincia | TEXT | |
| comune | TEXT | |
| localita | TEXT | |
| indirizzo | TEXT | |
| lat | NUMERIC | |
| lon | NUMERIC | |
| riferimento_cartografico | TEXT | |
| foglio_catastale | TEXT | |
| particella | TEXT | |
| subparticella | TEXT | |
| committente | TEXT | |
| direttore_scientifico | TEXT | |
| operatore | TEXT | |
| responsabile_campo | TEXT | |
| tipologia_intervento | TEXT | |
| tipo_contesto | TEXT | |
| datazione_contesto | TEXT | |
| data_inizio | DATE | |
| note | TEXT | |
| stato | TEXT | in_corso/in_elaborazione/archiviato |
| responsabile_id | UUID | FK → auth.users |
| created_at | TIMESTAMPTZ | |

## us
Tabella principale per le Unità Stratigrafiche.
| Campo | Tipo | Note |
|-------|------|-------|
| id | UUID PK | |
| scavo_id | UUID | FK → scavo |
| numero_us | INTEGER | |
| tipo | TEXT | us/funerario |
| natura | TEXT | Naturale/Artificiale |
| polarita | TEXT | Positiva/Negativa |
| saggio | TEXT | |
| edificio | TEXT | |
| struttura | TEXT | |
| deposizione | TEXT | |
| area_scavo | TEXT | |
| ambiente | TEXT | |
| posizione | TEXT | |
| settore | TEXT | |
| quadrati | TEXT | |
| quota_min | NUMERIC | |
| quota_max | NUMERIC | |
| colore | TEXT | |
| consistenza | TEXT | |
| inclusi_organici | TEXT | |
| inclusi_inorganici | TEXT | |
| definizione | TEXT | |
| criteri_distinzione | TEXT | |
| modo_formazione | TEXT | |
| descrizione_estesa | TEXT | |
| stato_conservazione | TEXT | |
| elementi_datanti | TEXT | |
| campionature | TEXT | sì/no |
| tipo_campionatura | TEXT | |
| quantita_campionatura | TEXT | |
| posizione_campionatura | TEXT | |
| flottazione | TEXT | |
| setacciatura | TEXT | |
| affidabilita_stratigrafica | TEXT | |
| osservazioni | TEXT | |
| lunghezza | NUMERIC | |
| larghezza | NUMERIC | |
| spessore | NUMERIC | |
| interpretazione | TEXT | |
| epoca | TEXT | |
| periodo | TEXT | |
| fase | TEXT | |
| cronologia_iniziale | TEXT | |
| cronologia_finale | TEXT | |
| metodo_datazione | TEXT | |
| responsabile_campo | TEXT | |
| contesto_funerario_id | UUID NULLABLE | FK → contesto_funerario |
| updated_at | TIMESTAMPTZ | trigger automatico |
| created_at | TIMESTAMPTZ | |

## contesto_funerario
Scheda di contesto funerario (ArchaeoTombs).
| Campo | Tipo | Note |
|-------|------|-------|
| id | UUID PK | |
| scavo_id | UUID | FK → scavo |
| numero_tomba | INTEGER | progressivo per scavo |
| emergenza_n | INTEGER | |
| vertici | TEXT | |
| settore | TEXT | |
| data_inizio_scavo | DATE | |
| data_recupero | DATE | |
| tipologia_elementi_strutturali | TEXT | |
| archeologo | TEXT | |
| antropologo | TEXT | |
| larghezza | NUMERIC(6,2) | |
| lunghezza | NUMERIC(6,2) | |
| profondita_max | NUMERIC(6,2) | |
| orientamento | TEXT | N/NNE/NE/... |
| us_copertura | TEXT | numeri separati da virgola |
| us_defunto_corredo | TEXT | |
| us_corredo_accompagno | TEXT | |
| us_taglio | TEXT | |
| us_altro | TEXT | |
| rp_corredo_personale | TEXT | |
| rp_corredo_accompagno | TEXT | |
| rp_altro | TEXT | |
| relazioni_altri_contesti | TEXT | |
| nucleo_sepolcrale | TEXT | sì/no/non determinabile |
| nucleo_sepolcrale_n | INTEGER | |
| datazione | TEXT | |
| criteri_datazione | TEXT | |
| tipo_sepoltura | TEXT | Incinerazione/Inumazione |
| tipo_numerosita | TEXT | Singola/Bisoma/Multipla/Collettiva |
| numero_individui | INTEGER | |
| tipo_deposizione | TEXT | Primaria/Primaria rimaneggiata/Secondaria/Ridotta |
| natura_rimaneggiamento | TEXT | |
| segnacolo | TEXT | sì/no |
| cassone_muratura | TEXT | |
| dromos | TEXT | |
| tumulo | TEXT | |
| cassa | TEXT | |
| circolo | TEXT | |
| tronco | TEXT | |
| cuscino | TEXT | |
| piano_deposizionale | TEXT | |
| sudario | TEXT | |
| tipologia_copertura | TEXT | |
| frammentazione_ceramica | TEXT | |
| oggetti_rituali | TEXT | |
| organico_pasto | TEXT | |
| libagione | TEXT | |
| connessione_anatomica | TEXT | sì/no/parziale |
| eta_morte | TEXT | Infante/Sub-adulto/Adulto |
| sesso_antropologico | TEXT | M/F/Non determinabile/Non determinato |
| sesso_archeologico | TEXT | M/F/Non determinabile |
| criteri_diagnosi | TEXT | |
| orientamento_cranio | TEXT | |
| posizione_scheletro | TEXT | Supino/Su lato dx/... |
| posizione_cranio | TEXT | |
| temporo_mandibolare | TEXT | Articolato/Separato/Dislocato |
| cranio_atlante | TEXT | |
| atlante_epistrofeo | TEXT | |
| epistrofeo_c3 | TEXT | |
| mandibola | TEXT | Aperta/Chiusa |
| vertebre_cervicali_sx | TEXT | soloUna — no DX |
| vertebre_toraciche_sx | TEXT | soloUna — no DX |
| scapola_clavicola_sx/dx | TEXT | |
| scapola_omero_sx/dx | TEXT | |
| polso_sx/dx | TEXT | |
| metacarpo_falange_sx/dx | TEXT | |
| rotula_sx/dx | TEXT | |
| metatarso_falange_sx/dx | TEXT | |
| vertebre_lombari_sx | TEXT | soloUna — no DX |
| lombo_sacrale_sx | TEXT | soloUna — no DX |
| sacro_iliaca_sx/dx | TEXT | |
| coxo_femorale_sx/dx | TEXT | |
| gomito_sx/dx | TEXT | |
| ginocchio_sx/dx | TEXT | |
| caviglia_sx/dx | TEXT | |
| tarso_sx/dx | TEXT | |
| omero_sx/dx | TEXT | Disteso/Assente/Dislocato |
| avambraccio_sx/dx | TEXT | |
| mano_sx/dx | TEXT | |
| femore_sx/dx | TEXT | |
| tibia_sx/dx | TEXT | Distesa/Assente/Dislocata |
| piede_sx/dx | TEXT | |
| elementi_dislocati | TEXT | |
| appiattimento_torace | TEXT | sì/no |
| caduta_sterno | TEXT | |
| cinto_pelvico | TEXT | Aperto/Chiuso/Semi-chiuso |
| ginocchia | TEXT | Aperte/Unite/Semi-chiuse |
| caviglie | TEXT | |
| verticalizzazione_clavicola | TEXT | SX/DX/Entrambe |
| scapola_obliqua | TEXT | |
| rotazione_mediale_omero | TEXT | |
| rotazione_laterale_femore | TEXT | |
| parte_scheletro_compressione | TEXT | |
| compressione_dovuta_a | TEXT | |
| decomposizione | TEXT | Spazio vuoto/Spazio pieno/Altro |
| decomposizione_altro | TEXT | |
| lunghezza_scheletro_determinabile | TEXT | Determinabile/Non determinabile |
| lunghezza_scheletro_cm | NUMERIC(6,1) | |
| misure_ossa | JSONB | [{osso, lato, valore}] |
| alterazioni_scheletriche | TEXT | |
| stato_conservazione | TEXT | Ottimo/Buono/Discreto/Cattivo/Pessimo |
| completata | BOOLEAN | default false |
| consolidanti_collanti | TEXT | |
| descrizione | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | trigger automatico |

## reperto_funerario
| Campo | Tipo | Note |
|-------|------|-------|
| id | UUID PK | |
| contesto_funerario_id | UUID | FK → contesto_funerario |
| scavo_id | UUID | FK → scavo |
| rp_n | INTEGER | |
| descrizione | TEXT | |
| datazione | TEXT | |
| created_at | TIMESTAMPTZ | |

## foto
| Campo | Tipo | Note |
|-------|------|-------|
| id | UUID PK | |
| scavo_id | UUID | FK → scavo |
| us_id | UUID NULLABLE | FK → us |
| contesto_funerario_id | UUID NULLABLE | FK → contesto_funerario |
| reperto_funerario_id | UUID NULLABLE | FK → reperto_funerario |
| url | TEXT | URL pubblica Supabase Storage |
| url_thumb | TEXT | |
| nome_file | TEXT | formato: scavoId_usId_timestamp |
| didascalia | TEXT | |
| autore | TEXT | |
| tipo | TEXT | foto/rilievo/altro |
| larghezza | INTEGER | |
| altezza | INTEGER | |
| dimensione_kb | INTEGER | |
| data_scatto | DATE | da EXIF o oggi |
| created_at | TIMESTAMPTZ | |

## accesso_scavo
| Campo | Tipo | Note |
|-------|------|-------|
| id | UUID PK | |
| scavo_id | UUID | FK → scavo |
| account_id | UUID | FK → account |
| ruolo | TEXT | editor/collaboratore/visualizzatore |
| created_at | TIMESTAMPTZ | |

## invito
| Campo | Tipo | Note |
|-------|------|-------|
| id | UUID PK | |
| scavo_id | UUID | FK → scavo |
| email | TEXT | |
| ruolo | TEXT | |
| token | TEXT | UNIQUE |
| usato | BOOLEAN | |
| created_at | TIMESTAMPTZ | |

## rapporto_stratigrafico
| Campo | Tipo | Note |
|-------|------|-------|
| id | UUID PK | |
| us_id | UUID | FK → us (US di riferimento) |
| us_correlata_id | UUID NULLABLE | FK → us |
| us_correlata_numero | INTEGER NULLABLE | per US non ancora create |
| tipo | TEXT | copre/coperto_da/taglia/tagliato_da/... |
| created_at | TIMESTAMPTZ | |

## thesaurus
| Campo | Tipo | Note |
|-------|------|-------|
| id | UUID PK | |
| tipo | TEXT | regione/tipo_contesto/metodo_datazione/... |
| valore | TEXT | |
| ordine | INTEGER | |
| UNIQUE | (tipo, valore) | |

## munsell
| Campo | Tipo | Note |
|-------|------|-------|
| id | UUID PK | |
| codice | TEXT | |
| nome_italiano | TEXT | |

## sabap
| Campo | Tipo | Note |
|-------|------|-------|
| id | UUID PK | |
| nome | TEXT | |
| regione | TEXT | |

## provincia
| Campo | Tipo | Note |
|-------|------|-------|
| sigla | TEXT PK | |
| nome | TEXT | |
| regione | TEXT | |
