create extension if not exists "postgis" with schema "extensions";

drop extension if exists "pg_net";


  create table "public"."associazione_tags" (
    "associazione_id" uuid not null,
    "tag_id" uuid not null
      );


alter table "public"."associazione_tags" enable row level security;


  create table "public"."associazioni" (
    "id" uuid not null default auth.uid(),
    "denominazione" text not null,
    "nome_breve" text,
    "codice_fiscale" text not null,
    "partita_iva" text,
    "forma_giuridica" text not null,
    "email_associazione" text not null,
    "telefono" text,
    "sito_web" text,
    "descrizione" text,
    "logo_url" text,
    "foto_profilo_url" text,
    "is_verificata" boolean default false,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone default timezone('utc'::text, now()),
    "anno_fondazione" integer
      );


alter table "public"."associazioni" enable row level security;


  create table "public"."associazioni_sedi" (
    "id" uuid not null default gen_random_uuid(),
    "associazione_id" uuid,
    "tipologia" text default 'operativa'::text,
    "indirizzo" text not null,
    "cap" character varying(5) not null,
    "comune" text not null,
    "provincia" text not null,
    "is_principale" boolean default false
      );


alter table "public"."associazioni_sedi" enable row level security;


  create table "public"."associazioni_trasparenza" (
    "associazione_id" uuid not null,
    "is_iscritto_runts" boolean default false,
    "tipo_registro" text,
    "runts_repertorio" text,
    "runts_sezione" text,
    "runts_data_iscrizione" date,
    "legale_rappresentante_nome" text,
    "referente_progetto_ruolo" text not null,
    "pec" text,
    "social_links" jsonb default '{}'::jsonb,
    "dichiarazione_veridicita" boolean not null default false,
    "consenso_privacy" boolean not null default false,
    "referente_progetto_nome" text not null,
    "referente_progetto_cognome" text not null,
    "consenso_newsletter" boolean default false,
    "num_soci" integer,
    "num_volontari_attivi" integer,
    "num_dipendenti" integer,
    "legale_rappresentante_cognome" text
      );


alter table "public"."associazioni_trasparenza" enable row level security;


  create table "public"."candidature" (
    "id" uuid not null default gen_random_uuid(),
    "posizione_id" uuid not null,
    "volontario_id" uuid not null,
    "stato" text not null default 'in_attesa'::text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "impresa_sponsor_id" uuid
      );


alter table "public"."candidature" enable row level security;


  create table "public"."competenze" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "is_official" boolean default false,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."competenze" enable row level security;


  create table "public"."impresa_dipendenti" (
    "impresa_id" uuid not null,
    "volontario_id" uuid not null,
    "stato" text not null default 'in_attesa'::text,
    "ruolo_aziendale" text not null default 'dipendente'::text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "id" uuid default gen_random_uuid()
      );


alter table "public"."impresa_dipendenti" enable row level security;


  create table "public"."imprese" (
    "id" uuid not null,
    "ragione_sociale" text,
    "forma_giuridica" text,
    "partita_iva" text,
    "codice_fiscale" text,
    "indirizzo_sede" text,
    "sito_web" text,
    "profili_social" text,
    "nome_referente" text,
    "settore_attivita" text,
    "fascia_dipendenti" text,
    "area_operativa" text,
    "valori_cause" text,
    "obiettivi_esg" text,
    "tipologia_impatto" text,
    "created_at" timestamp with time zone default now(),
    "cap" character varying(5),
    "foto_profilo_url" text
      );


alter table "public"."imprese" enable row level security;


  create table "public"."inviti_impresa" (
    "id" uuid not null default gen_random_uuid(),
    "impresa_id" uuid not null,
    "email" text not null,
    "token" uuid not null default gen_random_uuid(),
    "stato" text not null default 'in_attesa'::text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."inviti_impresa" enable row level security;


  create table "public"."media_associazioni" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "associazione_id" uuid not null,
    "url" text not null,
    "storage_path" text not null,
    "nome" text
      );


alter table "public"."media_associazioni" enable row level security;


  create table "public"."messaggi" (
    "id" uuid not null default gen_random_uuid(),
    "candidatura_id" uuid not null,
    "mittente_id" uuid not null,
    "testo" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."messaggi" enable row level security;


  create table "public"."posizione_competenze" (
    "posizione_id" uuid not null,
    "competenza_id" uuid not null
      );


alter table "public"."posizione_competenze" enable row level security;


  create table "public"."posizione_tags" (
    "posizione_id" uuid not null,
    "tag_id" uuid not null
      );


alter table "public"."posizione_tags" enable row level security;


  create table "public"."posizioni" (
    "id" uuid not null default gen_random_uuid(),
    "associazione_id" uuid not null,
    "titolo" text not null,
    "descrizione" text not null,
    "tipo" text not null,
    "quando" text not null,
    "dove" text not null,
    "created_at" timestamp with time zone default now(),
    "data_esatta" date,
    "ora_inizio" time without time zone,
    "ora_fine" time without time zone,
    "giorni_settimana" text[],
    "coords" extensions.geography(Point,4326),
    "immagine_id" uuid
      );


alter table "public"."posizioni" enable row level security;


  create table "public"."profili" (
    "id" uuid not null,
    "ruolo" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."profili" enable row level security;


  create table "public"."settori_intervento" (
    "id" uuid not null default gen_random_uuid(),
    "codice" text,
    "descrizione" text not null
      );


alter table "public"."settori_intervento" enable row level security;


  create table "public"."tags" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "slug" text,
    "description" text,
    "categoria" text
      );


alter table "public"."tags" enable row level security;


  create table "public"."volontari" (
    "id" uuid not null default gen_random_uuid(),
    "bio" text,
    "telefono" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "nome" text,
    "cognome" text,
    "email_contatto" text,
    "data_nascita" date,
    "sesso" text,
    "citta_residenza" text,
    "grado_istruzione" text,
    "foto_profilo_url" text,
    "cap" character varying(5)
      );


alter table "public"."volontari" enable row level security;


  create table "public"."volontario_competenze" (
    "volontario_id" uuid not null,
    "competenza_id" uuid not null
      );


alter table "public"."volontario_competenze" enable row level security;


  create table "public"."volontario_tags" (
    "volontario_id" uuid not null,
    "tag_id" uuid not null
      );


alter table "public"."volontario_tags" enable row level security;

CREATE UNIQUE INDEX associazione_tags_pkey ON public.associazione_tags USING btree (associazione_id, tag_id);

CREATE UNIQUE INDEX associazioni_codice_fiscale_key ON public.associazioni USING btree (codice_fiscale);

CREATE UNIQUE INDEX associazioni_pkey ON public.associazioni USING btree (id);

CREATE UNIQUE INDEX associazioni_sedi_associazione_id_key ON public.associazioni_sedi USING btree (associazione_id);

CREATE UNIQUE INDEX associazioni_sedi_pkey ON public.associazioni_sedi USING btree (id);

CREATE UNIQUE INDEX associazioni_trasparenza_pkey ON public.associazioni_trasparenza USING btree (associazione_id);

CREATE UNIQUE INDEX candidature_pkey ON public.candidature USING btree (id);

CREATE UNIQUE INDEX candidature_posizione_id_volontario_id_key ON public.candidature USING btree (posizione_id, volontario_id);

CREATE UNIQUE INDEX competenze_name_normalized_idx ON public.competenze USING btree (lower(TRIM(BOTH FROM name)));

CREATE UNIQUE INDEX competenze_pkey ON public.competenze USING btree (id);

CREATE UNIQUE INDEX impresa_dipendenti_id_key ON public.impresa_dipendenti USING btree (id);

CREATE UNIQUE INDEX impresa_dipendenti_pkey ON public.impresa_dipendenti USING btree (impresa_id, volontario_id);

CREATE UNIQUE INDEX imprese_partita_iva_key ON public.imprese USING btree (partita_iva);

CREATE UNIQUE INDEX imprese_pkey ON public.imprese USING btree (id);

CREATE UNIQUE INDEX inviti_impresa_pkey ON public.inviti_impresa USING btree (id);

CREATE UNIQUE INDEX inviti_impresa_token_key ON public.inviti_impresa USING btree (token);

CREATE UNIQUE INDEX media_associazioni_pkey ON public.media_associazioni USING btree (id);

CREATE UNIQUE INDEX messaggi_pkey ON public.messaggi USING btree (id);

CREATE UNIQUE INDEX posizione_competenze_pkey ON public.posizione_competenze USING btree (posizione_id, competenza_id);

CREATE UNIQUE INDEX posizione_tags_pkey ON public.posizione_tags USING btree (posizione_id, tag_id);

CREATE UNIQUE INDEX posizioni_pkey ON public.posizioni USING btree (id);

CREATE UNIQUE INDEX profili_pkey ON public.profili USING btree (id);

CREATE UNIQUE INDEX settori_intervento_codice_key ON public.settori_intervento USING btree (codice);

CREATE UNIQUE INDEX settori_intervento_pkey ON public.settori_intervento USING btree (id);

CREATE UNIQUE INDEX tags_name_key ON public.tags USING btree (name);

CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id);

CREATE UNIQUE INDEX tags_slug_key ON public.tags USING btree (slug);

CREATE UNIQUE INDEX unique_url_per_associazione ON public.media_associazioni USING btree (url, associazione_id);

CREATE UNIQUE INDEX volontari_pkey ON public.volontari USING btree (id);

CREATE UNIQUE INDEX volontario_competenze_pkey ON public.volontario_competenze USING btree (volontario_id, competenza_id);

CREATE UNIQUE INDEX volontario_tags_pkey ON public.volontario_tags USING btree (volontario_id, tag_id);

alter table "public"."associazione_tags" add constraint "associazione_tags_pkey" PRIMARY KEY using index "associazione_tags_pkey";

alter table "public"."associazioni" add constraint "associazioni_pkey" PRIMARY KEY using index "associazioni_pkey";

alter table "public"."associazioni_sedi" add constraint "associazioni_sedi_pkey" PRIMARY KEY using index "associazioni_sedi_pkey";

alter table "public"."associazioni_trasparenza" add constraint "associazioni_trasparenza_pkey" PRIMARY KEY using index "associazioni_trasparenza_pkey";

alter table "public"."candidature" add constraint "candidature_pkey" PRIMARY KEY using index "candidature_pkey";

alter table "public"."competenze" add constraint "competenze_pkey" PRIMARY KEY using index "competenze_pkey";

alter table "public"."impresa_dipendenti" add constraint "impresa_dipendenti_pkey" PRIMARY KEY using index "impresa_dipendenti_pkey";

alter table "public"."imprese" add constraint "imprese_pkey" PRIMARY KEY using index "imprese_pkey";

alter table "public"."inviti_impresa" add constraint "inviti_impresa_pkey" PRIMARY KEY using index "inviti_impresa_pkey";

alter table "public"."media_associazioni" add constraint "media_associazioni_pkey" PRIMARY KEY using index "media_associazioni_pkey";

alter table "public"."messaggi" add constraint "messaggi_pkey" PRIMARY KEY using index "messaggi_pkey";

alter table "public"."posizione_competenze" add constraint "posizione_competenze_pkey" PRIMARY KEY using index "posizione_competenze_pkey";

alter table "public"."posizione_tags" add constraint "posizione_tags_pkey" PRIMARY KEY using index "posizione_tags_pkey";

alter table "public"."posizioni" add constraint "posizioni_pkey" PRIMARY KEY using index "posizioni_pkey";

alter table "public"."profili" add constraint "profili_pkey" PRIMARY KEY using index "profili_pkey";

alter table "public"."settori_intervento" add constraint "settori_intervento_pkey" PRIMARY KEY using index "settori_intervento_pkey";

alter table "public"."tags" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";

alter table "public"."volontari" add constraint "volontari_pkey" PRIMARY KEY using index "volontari_pkey";

alter table "public"."volontario_competenze" add constraint "volontario_competenze_pkey" PRIMARY KEY using index "volontario_competenze_pkey";

alter table "public"."volontario_tags" add constraint "volontario_tags_pkey" PRIMARY KEY using index "volontario_tags_pkey";

alter table "public"."associazione_tags" add constraint "associazione_tags_associazione_id_fkey" FOREIGN KEY (associazione_id) REFERENCES public.associazioni(id) ON DELETE CASCADE not valid;

alter table "public"."associazione_tags" validate constraint "associazione_tags_associazione_id_fkey";

alter table "public"."associazione_tags" add constraint "associazione_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE not valid;

alter table "public"."associazione_tags" validate constraint "associazione_tags_tag_id_fkey";

alter table "public"."associazioni" add constraint "associazioni_codice_fiscale_key" UNIQUE using index "associazioni_codice_fiscale_key";

alter table "public"."associazioni_sedi" add constraint "associazioni_sedi_associazione_id_fkey" FOREIGN KEY (associazione_id) REFERENCES public.associazioni(id) ON DELETE CASCADE not valid;

alter table "public"."associazioni_sedi" validate constraint "associazioni_sedi_associazione_id_fkey";

alter table "public"."associazioni_sedi" add constraint "associazioni_sedi_associazione_id_key" UNIQUE using index "associazioni_sedi_associazione_id_key";

alter table "public"."associazioni_trasparenza" add constraint "associazioni_trasparenza_associazione_id_fkey" FOREIGN KEY (associazione_id) REFERENCES public.associazioni(id) ON DELETE CASCADE not valid;

alter table "public"."associazioni_trasparenza" validate constraint "associazioni_trasparenza_associazione_id_fkey";

alter table "public"."candidature" add constraint "candidature_impresa_sponsor_id_fkey" FOREIGN KEY (impresa_sponsor_id) REFERENCES public.imprese(id) ON DELETE SET NULL not valid;

alter table "public"."candidature" validate constraint "candidature_impresa_sponsor_id_fkey";

alter table "public"."candidature" add constraint "candidature_posizione_id_fkey" FOREIGN KEY (posizione_id) REFERENCES public.posizioni(id) ON DELETE CASCADE not valid;

alter table "public"."candidature" validate constraint "candidature_posizione_id_fkey";

alter table "public"."candidature" add constraint "candidature_posizione_id_volontario_id_key" UNIQUE using index "candidature_posizione_id_volontario_id_key";

alter table "public"."candidature" add constraint "candidature_volontario_id_fkey" FOREIGN KEY (volontario_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."candidature" validate constraint "candidature_volontario_id_fkey";

alter table "public"."impresa_dipendenti" add constraint "impresa_dipendenti_id_key" UNIQUE using index "impresa_dipendenti_id_key";

alter table "public"."impresa_dipendenti" add constraint "impresa_dipendenti_impresa_id_fkey" FOREIGN KEY (impresa_id) REFERENCES public.imprese(id) ON DELETE CASCADE not valid;

alter table "public"."impresa_dipendenti" validate constraint "impresa_dipendenti_impresa_id_fkey";

alter table "public"."impresa_dipendenti" add constraint "impresa_dipendenti_ruolo_aziendale_check" CHECK ((ruolo_aziendale = ANY (ARRAY['dipendente'::text, 'hr_manager'::text]))) not valid;

alter table "public"."impresa_dipendenti" validate constraint "impresa_dipendenti_ruolo_aziendale_check";

alter table "public"."impresa_dipendenti" add constraint "impresa_dipendenti_stato_check" CHECK ((stato = ANY (ARRAY['in_attesa'::text, 'attivo'::text]))) not valid;

alter table "public"."impresa_dipendenti" validate constraint "impresa_dipendenti_stato_check";

alter table "public"."impresa_dipendenti" add constraint "impresa_dipendenti_volontario_id_fkey" FOREIGN KEY (volontario_id) REFERENCES public.volontari(id) ON DELETE CASCADE not valid;

alter table "public"."impresa_dipendenti" validate constraint "impresa_dipendenti_volontario_id_fkey";

alter table "public"."imprese" add constraint "imprese_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."imprese" validate constraint "imprese_id_fkey";

alter table "public"."imprese" add constraint "imprese_partita_iva_key" UNIQUE using index "imprese_partita_iva_key";

alter table "public"."inviti_impresa" add constraint "inviti_impresa_impresa_id_fkey" FOREIGN KEY (impresa_id) REFERENCES public.imprese(id) ON DELETE CASCADE not valid;

alter table "public"."inviti_impresa" validate constraint "inviti_impresa_impresa_id_fkey";

alter table "public"."inviti_impresa" add constraint "inviti_impresa_stato_check" CHECK ((stato = ANY (ARRAY['in_attesa'::text, 'accettato'::text, 'revocato'::text]))) not valid;

alter table "public"."inviti_impresa" validate constraint "inviti_impresa_stato_check";

alter table "public"."inviti_impresa" add constraint "inviti_impresa_token_key" UNIQUE using index "inviti_impresa_token_key";

alter table "public"."media_associazioni" add constraint "unique_url_per_associazione" UNIQUE using index "unique_url_per_associazione";

alter table "public"."messaggi" add constraint "messaggi_candidatura_id_fkey" FOREIGN KEY (candidatura_id) REFERENCES public.candidature(id) ON DELETE CASCADE not valid;

alter table "public"."messaggi" validate constraint "messaggi_candidatura_id_fkey";

alter table "public"."messaggi" add constraint "messaggi_mittente_id_fkey" FOREIGN KEY (mittente_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."messaggi" validate constraint "messaggi_mittente_id_fkey";

alter table "public"."posizione_competenze" add constraint "posizione_competenze_competenza_id_fkey" FOREIGN KEY (competenza_id) REFERENCES public.competenze(id) ON DELETE CASCADE not valid;

alter table "public"."posizione_competenze" validate constraint "posizione_competenze_competenza_id_fkey";

alter table "public"."posizione_competenze" add constraint "posizione_competenze_posizione_id_fkey" FOREIGN KEY (posizione_id) REFERENCES public.posizioni(id) ON DELETE CASCADE not valid;

alter table "public"."posizione_competenze" validate constraint "posizione_competenze_posizione_id_fkey";

alter table "public"."posizione_tags" add constraint "posizione_tags_posizione_id_fkey" FOREIGN KEY (posizione_id) REFERENCES public.posizioni(id) ON DELETE CASCADE not valid;

alter table "public"."posizione_tags" validate constraint "posizione_tags_posizione_id_fkey";

alter table "public"."posizione_tags" add constraint "posizione_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE not valid;

alter table "public"."posizione_tags" validate constraint "posizione_tags_tag_id_fkey";

alter table "public"."posizioni" add constraint "posizioni_immagine_id_fkey" FOREIGN KEY (immagine_id) REFERENCES public.media_associazioni(id) ON DELETE SET NULL not valid;

alter table "public"."posizioni" validate constraint "posizioni_immagine_id_fkey";

alter table "public"."posizioni" add constraint "posizioni_tipo_check" CHECK ((tipo = ANY (ARRAY['ricorrente'::text, 'una_tantum'::text]))) not valid;

alter table "public"."posizioni" validate constraint "posizioni_tipo_check";

alter table "public"."profili" add constraint "profili_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profili" validate constraint "profili_id_fkey";

alter table "public"."profili" add constraint "profili_ruolo_check" CHECK ((ruolo = ANY (ARRAY['volontario'::text, 'associazione'::text, 'impresa'::text]))) not valid;

alter table "public"."profili" validate constraint "profili_ruolo_check";

alter table "public"."settori_intervento" add constraint "settori_intervento_codice_key" UNIQUE using index "settori_intervento_codice_key";

alter table "public"."tags" add constraint "tags_name_key" UNIQUE using index "tags_name_key";

alter table "public"."tags" add constraint "tags_slug_key" UNIQUE using index "tags_slug_key";

alter table "public"."volontario_competenze" add constraint "volontario_competenze_competenza_id_fkey" FOREIGN KEY (competenza_id) REFERENCES public.competenze(id) ON DELETE CASCADE not valid;

alter table "public"."volontario_competenze" validate constraint "volontario_competenze_competenza_id_fkey";

alter table "public"."volontario_competenze" add constraint "volontario_competenze_volontario_id_fkey" FOREIGN KEY (volontario_id) REFERENCES public.volontari(id) ON DELETE CASCADE not valid;

alter table "public"."volontario_competenze" validate constraint "volontario_competenze_volontario_id_fkey";

alter table "public"."volontario_tags" add constraint "volontario_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE not valid;

alter table "public"."volontario_tags" validate constraint "volontario_tags_tag_id_fkey";

alter table "public"."volontario_tags" add constraint "volontario_tags_volontario_id_fkey" FOREIGN KEY (volontario_id) REFERENCES public.volontari(id) ON DELETE CASCADE not valid;

alter table "public"."volontario_tags" validate constraint "volontario_tags_volontario_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.accetta_invito_sicuro(token_invito text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_invito_id UUID;
  v_impresa_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Devi essere loggato per accettare un invito.';
  END IF;

  -- AGGIUNTO IL CAST ::uuid QUI SOTTO
  SELECT id, impresa_id INTO v_invito_id, v_impresa_id
  FROM inviti_impresa
  WHERE token = token_invito::uuid AND stato = 'in_attesa'
  FOR UPDATE; 

  IF v_invito_id IS NULL THEN
    RAISE EXCEPTION 'Link non valido o già utilizzato.';
  END IF;

  -- Inserimento del dipendente
  INSERT INTO impresa_dipendenti (impresa_id, volontario_id, stato, ruolo_aziendale)
  VALUES (v_impresa_id, v_user_id, 'attivo', 'dipendente');

  -- Brucia il token
  UPDATE inviti_impresa SET stato = 'accettato' WHERE id = v_invito_id;

  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cerca_posizioni_vicine(user_lat double precision, user_lng double precision, raggio_km double precision)
 RETURNS TABLE(id uuid, associazione_id uuid, titolo text, descrizione text, tipo text, quando text, dove text, created_at timestamp with time zone, data_esatta date, ora_inizio time without time zone, ora_fine time without time zone, giorni_settimana text[], coords text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, 
    p.associazione_id, 
    p.titolo, 
    p.descrizione, 
    p.tipo, 
    p.quando, 
    p.dove, 
    p.created_at, 
    p.data_esatta, 
    p.ora_inizio, 
    p.ora_fine, 
    p.giorni_settimana,
    ST_AsText(p.coords) as coords -- La magia della traduzione
  FROM posizioni p
  WHERE p.coords IS NOT NULL
  AND ST_DWithin(
    p.coords, 
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326), 
    raggio_km * 1000 -- PostGIS lavora in metri, quindi moltiplichiamo
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_profili_candidati(p_posizione_id uuid)
 RETURNS SETOF public.volontari
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  -- Controllo di Sicurezza Invalicabile: l'utente loggato è il creatore dell'annuncio?
  if not exists (
    select 1 from posizioni 
    where id = p_posizione_id and associazione_id = auth.uid()
  ) then
    raise exception 'Non autorizzato a visualizzare questi profili';
  end if;

  -- Se è il proprietario, restituiamo i profili dei candidati a quella posizione
  return query
  select pv.*
  from volontari pv
  join candidature c on c.volontario_id = pv.id
  where c.posizione_id = p_posizione_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_ultime_posizioni(limite integer DEFAULT 50)
 RETURNS TABLE(id uuid, associazione_id uuid, titolo text, descrizione text, tipo text, quando text, dove text, created_at timestamp with time zone, data_esatta date, ora_inizio time without time zone, ora_fine time without time zone, giorni_settimana text[], coords text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, 
    p.associazione_id, 
    p.titolo, 
    p.descrizione, 
    p.tipo, 
    p.quando, 
    p.dove, 
    p.created_at, 
    p.data_esatta, 
    p.ora_inizio, 
    p.ora_fine, 
    p.giorni_settimana,
    ST_AsText(p.coords) as coords -- LA MAGIA: Traduciamo anche qui!
  FROM posizioni p
  WHERE p.coords IS NOT NULL -- Scartiamo in automatico quelle rotte
  ORDER BY p.created_at DESC
  LIMIT limite;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.ricerca_avanzata_posizioni(min_lat double precision, min_lng double precision, max_lat double precision, max_lng double precision, search_q text DEFAULT NULL::text, filter_tipo text DEFAULT NULL::text, filter_tags text[] DEFAULT NULL::text[], filter_competenze text[] DEFAULT NULL::text[], filter_data date DEFAULT NULL::date, filter_giorni text[] DEFAULT NULL::text[])
 RETURNS TABLE(id uuid, associazione_id uuid, titolo text, descrizione text, tipo text, dove text, ora_inizio time without time zone, ora_fine time without time zone, quando text, data_esatta date, giorni_settimana text[], created_at timestamp with time zone, lat double precision, lng double precision, tags text[], competenze text[], immagine_url text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH pos_base AS (
        SELECT 
            p.id, p.associazione_id, p.titolo, p.descrizione, p.tipo,
            p.dove, p.ora_inizio, p.ora_fine, p.quando, p.data_esatta,
            p.giorni_settimana, p.created_at,
            ST_Y(p.coords::geometry) as lat, 
            ST_X(p.coords::geometry) as lng, 
            p.immagine_id
        FROM public.posizioni p
        WHERE p.coords IS NOT NULL 
          AND p.coords::geometry && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    ),
    filtered_by_text AS (
        SELECT pb.* FROM pos_base pb
        WHERE search_q IS NULL 
           OR pb.titolo ILIKE '%' || search_q || '%' 
           OR pb.descrizione ILIKE '%' || search_q || '%'
    ),
    filtered_by_type AS (
        SELECT ft.* FROM filtered_by_text ft
        WHERE filter_tipo IS NULL OR ft.tipo = filter_tipo
    ),
    filtered_by_date_and_days AS (
        SELECT ftd.* FROM filtered_by_type ftd
        WHERE 
            (filter_data IS NULL OR ftd.data_esatta = filter_data)
            AND
            (
                filter_giorni IS NULL 
                OR 
                EXISTS (
                    -- 🚨 LA MAGIA: Cerca il nome del giorno (es. "Lunedì") all'interno della stringa "quando" ignorando le maiuscole!
                    SELECT 1 
                    FROM unnest(filter_giorni) AS giorno_scelto
                    WHERE ftd.quando ILIKE '%' || giorno_scelto || '%'
                )
            )
    )
    SELECT 
        f.id, f.associazione_id, f.titolo, f.descrizione, f.tipo,
        f.dove, f.ora_inizio, f.ora_fine, f.quando, f.data_esatta,
        f.giorni_settimana, f.created_at, f.lat, f.lng,
        ARRAY(
            SELECT t.name FROM public.posizione_tags pt 
            JOIN public.tags t ON pt.tag_id = t.id WHERE pt.posizione_id = f.id
        ) as tags,
        ARRAY(
            SELECT c.name FROM public.posizione_competenze pc 
            JOIN public.competenze c ON pc.competenza_id = c.id WHERE pc.posizione_id = f.id
        ) as competenze,
        ma.url as immagine_url
    FROM filtered_by_date_and_days f
    LEFT JOIN public.media_associazioni ma ON f.immagine_id = ma.id
    WHERE 
        (filter_tags IS NULL OR EXISTS (
            SELECT 1 FROM public.posizione_tags pt
            JOIN public.tags t ON pt.tag_id = t.id
            -- 🚨 Ora controlla il NOME del tag, non l'ID!
            WHERE pt.posizione_id = f.id AND t.name = ANY(filter_tags)
        ))
        AND
        (filter_competenze IS NULL OR EXISTS (
            SELECT 1 FROM public.posizione_competenze pc
            JOIN public.competenze c ON pc.competenza_id = c.id
            -- 🚨 Ora controlla il NOME della competenza, non l'ID!
            WHERE pc.posizione_id = f.id AND c.name = ANY(filter_competenze)
        ));
END;
$function$
;

grant delete on table "public"."associazione_tags" to "anon";

grant insert on table "public"."associazione_tags" to "anon";

grant references on table "public"."associazione_tags" to "anon";

grant select on table "public"."associazione_tags" to "anon";

grant trigger on table "public"."associazione_tags" to "anon";

grant truncate on table "public"."associazione_tags" to "anon";

grant update on table "public"."associazione_tags" to "anon";

grant delete on table "public"."associazione_tags" to "authenticated";

grant insert on table "public"."associazione_tags" to "authenticated";

grant references on table "public"."associazione_tags" to "authenticated";

grant select on table "public"."associazione_tags" to "authenticated";

grant trigger on table "public"."associazione_tags" to "authenticated";

grant truncate on table "public"."associazione_tags" to "authenticated";

grant update on table "public"."associazione_tags" to "authenticated";

grant delete on table "public"."associazione_tags" to "service_role";

grant insert on table "public"."associazione_tags" to "service_role";

grant references on table "public"."associazione_tags" to "service_role";

grant select on table "public"."associazione_tags" to "service_role";

grant trigger on table "public"."associazione_tags" to "service_role";

grant truncate on table "public"."associazione_tags" to "service_role";

grant update on table "public"."associazione_tags" to "service_role";

grant delete on table "public"."associazioni" to "anon";

grant insert on table "public"."associazioni" to "anon";

grant references on table "public"."associazioni" to "anon";

grant select on table "public"."associazioni" to "anon";

grant trigger on table "public"."associazioni" to "anon";

grant truncate on table "public"."associazioni" to "anon";

grant update on table "public"."associazioni" to "anon";

grant delete on table "public"."associazioni" to "authenticated";

grant insert on table "public"."associazioni" to "authenticated";

grant references on table "public"."associazioni" to "authenticated";

grant select on table "public"."associazioni" to "authenticated";

grant trigger on table "public"."associazioni" to "authenticated";

grant truncate on table "public"."associazioni" to "authenticated";

grant update on table "public"."associazioni" to "authenticated";

grant delete on table "public"."associazioni" to "service_role";

grant insert on table "public"."associazioni" to "service_role";

grant references on table "public"."associazioni" to "service_role";

grant select on table "public"."associazioni" to "service_role";

grant trigger on table "public"."associazioni" to "service_role";

grant truncate on table "public"."associazioni" to "service_role";

grant update on table "public"."associazioni" to "service_role";

grant delete on table "public"."associazioni_sedi" to "anon";

grant insert on table "public"."associazioni_sedi" to "anon";

grant references on table "public"."associazioni_sedi" to "anon";

grant select on table "public"."associazioni_sedi" to "anon";

grant trigger on table "public"."associazioni_sedi" to "anon";

grant truncate on table "public"."associazioni_sedi" to "anon";

grant update on table "public"."associazioni_sedi" to "anon";

grant delete on table "public"."associazioni_sedi" to "authenticated";

grant insert on table "public"."associazioni_sedi" to "authenticated";

grant references on table "public"."associazioni_sedi" to "authenticated";

grant select on table "public"."associazioni_sedi" to "authenticated";

grant trigger on table "public"."associazioni_sedi" to "authenticated";

grant truncate on table "public"."associazioni_sedi" to "authenticated";

grant update on table "public"."associazioni_sedi" to "authenticated";

grant delete on table "public"."associazioni_sedi" to "service_role";

grant insert on table "public"."associazioni_sedi" to "service_role";

grant references on table "public"."associazioni_sedi" to "service_role";

grant select on table "public"."associazioni_sedi" to "service_role";

grant trigger on table "public"."associazioni_sedi" to "service_role";

grant truncate on table "public"."associazioni_sedi" to "service_role";

grant update on table "public"."associazioni_sedi" to "service_role";

grant delete on table "public"."associazioni_trasparenza" to "anon";

grant insert on table "public"."associazioni_trasparenza" to "anon";

grant references on table "public"."associazioni_trasparenza" to "anon";

grant select on table "public"."associazioni_trasparenza" to "anon";

grant trigger on table "public"."associazioni_trasparenza" to "anon";

grant truncate on table "public"."associazioni_trasparenza" to "anon";

grant update on table "public"."associazioni_trasparenza" to "anon";

grant delete on table "public"."associazioni_trasparenza" to "authenticated";

grant insert on table "public"."associazioni_trasparenza" to "authenticated";

grant references on table "public"."associazioni_trasparenza" to "authenticated";

grant select on table "public"."associazioni_trasparenza" to "authenticated";

grant trigger on table "public"."associazioni_trasparenza" to "authenticated";

grant truncate on table "public"."associazioni_trasparenza" to "authenticated";

grant update on table "public"."associazioni_trasparenza" to "authenticated";

grant delete on table "public"."associazioni_trasparenza" to "service_role";

grant insert on table "public"."associazioni_trasparenza" to "service_role";

grant references on table "public"."associazioni_trasparenza" to "service_role";

grant select on table "public"."associazioni_trasparenza" to "service_role";

grant trigger on table "public"."associazioni_trasparenza" to "service_role";

grant truncate on table "public"."associazioni_trasparenza" to "service_role";

grant update on table "public"."associazioni_trasparenza" to "service_role";

grant delete on table "public"."candidature" to "anon";

grant insert on table "public"."candidature" to "anon";

grant references on table "public"."candidature" to "anon";

grant select on table "public"."candidature" to "anon";

grant trigger on table "public"."candidature" to "anon";

grant truncate on table "public"."candidature" to "anon";

grant update on table "public"."candidature" to "anon";

grant delete on table "public"."candidature" to "authenticated";

grant insert on table "public"."candidature" to "authenticated";

grant references on table "public"."candidature" to "authenticated";

grant select on table "public"."candidature" to "authenticated";

grant trigger on table "public"."candidature" to "authenticated";

grant truncate on table "public"."candidature" to "authenticated";

grant update on table "public"."candidature" to "authenticated";

grant delete on table "public"."candidature" to "service_role";

grant insert on table "public"."candidature" to "service_role";

grant references on table "public"."candidature" to "service_role";

grant select on table "public"."candidature" to "service_role";

grant trigger on table "public"."candidature" to "service_role";

grant truncate on table "public"."candidature" to "service_role";

grant update on table "public"."candidature" to "service_role";

grant delete on table "public"."competenze" to "anon";

grant insert on table "public"."competenze" to "anon";

grant references on table "public"."competenze" to "anon";

grant select on table "public"."competenze" to "anon";

grant trigger on table "public"."competenze" to "anon";

grant truncate on table "public"."competenze" to "anon";

grant update on table "public"."competenze" to "anon";

grant delete on table "public"."competenze" to "authenticated";

grant insert on table "public"."competenze" to "authenticated";

grant references on table "public"."competenze" to "authenticated";

grant select on table "public"."competenze" to "authenticated";

grant trigger on table "public"."competenze" to "authenticated";

grant truncate on table "public"."competenze" to "authenticated";

grant update on table "public"."competenze" to "authenticated";

grant delete on table "public"."competenze" to "service_role";

grant insert on table "public"."competenze" to "service_role";

grant references on table "public"."competenze" to "service_role";

grant select on table "public"."competenze" to "service_role";

grant trigger on table "public"."competenze" to "service_role";

grant truncate on table "public"."competenze" to "service_role";

grant update on table "public"."competenze" to "service_role";

grant delete on table "public"."impresa_dipendenti" to "anon";

grant insert on table "public"."impresa_dipendenti" to "anon";

grant references on table "public"."impresa_dipendenti" to "anon";

grant select on table "public"."impresa_dipendenti" to "anon";

grant trigger on table "public"."impresa_dipendenti" to "anon";

grant truncate on table "public"."impresa_dipendenti" to "anon";

grant update on table "public"."impresa_dipendenti" to "anon";

grant delete on table "public"."impresa_dipendenti" to "authenticated";

grant insert on table "public"."impresa_dipendenti" to "authenticated";

grant references on table "public"."impresa_dipendenti" to "authenticated";

grant select on table "public"."impresa_dipendenti" to "authenticated";

grant trigger on table "public"."impresa_dipendenti" to "authenticated";

grant truncate on table "public"."impresa_dipendenti" to "authenticated";

grant update on table "public"."impresa_dipendenti" to "authenticated";

grant delete on table "public"."impresa_dipendenti" to "service_role";

grant insert on table "public"."impresa_dipendenti" to "service_role";

grant references on table "public"."impresa_dipendenti" to "service_role";

grant select on table "public"."impresa_dipendenti" to "service_role";

grant trigger on table "public"."impresa_dipendenti" to "service_role";

grant truncate on table "public"."impresa_dipendenti" to "service_role";

grant update on table "public"."impresa_dipendenti" to "service_role";

grant delete on table "public"."imprese" to "anon";

grant insert on table "public"."imprese" to "anon";

grant references on table "public"."imprese" to "anon";

grant select on table "public"."imprese" to "anon";

grant trigger on table "public"."imprese" to "anon";

grant truncate on table "public"."imprese" to "anon";

grant update on table "public"."imprese" to "anon";

grant delete on table "public"."imprese" to "authenticated";

grant insert on table "public"."imprese" to "authenticated";

grant references on table "public"."imprese" to "authenticated";

grant select on table "public"."imprese" to "authenticated";

grant trigger on table "public"."imprese" to "authenticated";

grant truncate on table "public"."imprese" to "authenticated";

grant update on table "public"."imprese" to "authenticated";

grant delete on table "public"."imprese" to "service_role";

grant insert on table "public"."imprese" to "service_role";

grant references on table "public"."imprese" to "service_role";

grant select on table "public"."imprese" to "service_role";

grant trigger on table "public"."imprese" to "service_role";

grant truncate on table "public"."imprese" to "service_role";

grant update on table "public"."imprese" to "service_role";

grant delete on table "public"."inviti_impresa" to "anon";

grant insert on table "public"."inviti_impresa" to "anon";

grant references on table "public"."inviti_impresa" to "anon";

grant select on table "public"."inviti_impresa" to "anon";

grant trigger on table "public"."inviti_impresa" to "anon";

grant truncate on table "public"."inviti_impresa" to "anon";

grant update on table "public"."inviti_impresa" to "anon";

grant delete on table "public"."inviti_impresa" to "authenticated";

grant insert on table "public"."inviti_impresa" to "authenticated";

grant references on table "public"."inviti_impresa" to "authenticated";

grant select on table "public"."inviti_impresa" to "authenticated";

grant trigger on table "public"."inviti_impresa" to "authenticated";

grant truncate on table "public"."inviti_impresa" to "authenticated";

grant update on table "public"."inviti_impresa" to "authenticated";

grant delete on table "public"."inviti_impresa" to "service_role";

grant insert on table "public"."inviti_impresa" to "service_role";

grant references on table "public"."inviti_impresa" to "service_role";

grant select on table "public"."inviti_impresa" to "service_role";

grant trigger on table "public"."inviti_impresa" to "service_role";

grant truncate on table "public"."inviti_impresa" to "service_role";

grant update on table "public"."inviti_impresa" to "service_role";

grant delete on table "public"."media_associazioni" to "anon";

grant insert on table "public"."media_associazioni" to "anon";

grant references on table "public"."media_associazioni" to "anon";

grant select on table "public"."media_associazioni" to "anon";

grant trigger on table "public"."media_associazioni" to "anon";

grant truncate on table "public"."media_associazioni" to "anon";

grant update on table "public"."media_associazioni" to "anon";

grant delete on table "public"."media_associazioni" to "authenticated";

grant insert on table "public"."media_associazioni" to "authenticated";

grant references on table "public"."media_associazioni" to "authenticated";

grant select on table "public"."media_associazioni" to "authenticated";

grant trigger on table "public"."media_associazioni" to "authenticated";

grant truncate on table "public"."media_associazioni" to "authenticated";

grant update on table "public"."media_associazioni" to "authenticated";

grant delete on table "public"."media_associazioni" to "service_role";

grant insert on table "public"."media_associazioni" to "service_role";

grant references on table "public"."media_associazioni" to "service_role";

grant select on table "public"."media_associazioni" to "service_role";

grant trigger on table "public"."media_associazioni" to "service_role";

grant truncate on table "public"."media_associazioni" to "service_role";

grant update on table "public"."media_associazioni" to "service_role";

grant delete on table "public"."messaggi" to "anon";

grant insert on table "public"."messaggi" to "anon";

grant references on table "public"."messaggi" to "anon";

grant select on table "public"."messaggi" to "anon";

grant trigger on table "public"."messaggi" to "anon";

grant truncate on table "public"."messaggi" to "anon";

grant update on table "public"."messaggi" to "anon";

grant delete on table "public"."messaggi" to "authenticated";

grant insert on table "public"."messaggi" to "authenticated";

grant references on table "public"."messaggi" to "authenticated";

grant select on table "public"."messaggi" to "authenticated";

grant trigger on table "public"."messaggi" to "authenticated";

grant truncate on table "public"."messaggi" to "authenticated";

grant update on table "public"."messaggi" to "authenticated";

grant delete on table "public"."messaggi" to "service_role";

grant insert on table "public"."messaggi" to "service_role";

grant references on table "public"."messaggi" to "service_role";

grant select on table "public"."messaggi" to "service_role";

grant trigger on table "public"."messaggi" to "service_role";

grant truncate on table "public"."messaggi" to "service_role";

grant update on table "public"."messaggi" to "service_role";

grant delete on table "public"."posizione_competenze" to "anon";

grant insert on table "public"."posizione_competenze" to "anon";

grant references on table "public"."posizione_competenze" to "anon";

grant select on table "public"."posizione_competenze" to "anon";

grant trigger on table "public"."posizione_competenze" to "anon";

grant truncate on table "public"."posizione_competenze" to "anon";

grant update on table "public"."posizione_competenze" to "anon";

grant delete on table "public"."posizione_competenze" to "authenticated";

grant insert on table "public"."posizione_competenze" to "authenticated";

grant references on table "public"."posizione_competenze" to "authenticated";

grant select on table "public"."posizione_competenze" to "authenticated";

grant trigger on table "public"."posizione_competenze" to "authenticated";

grant truncate on table "public"."posizione_competenze" to "authenticated";

grant update on table "public"."posizione_competenze" to "authenticated";

grant delete on table "public"."posizione_competenze" to "service_role";

grant insert on table "public"."posizione_competenze" to "service_role";

grant references on table "public"."posizione_competenze" to "service_role";

grant select on table "public"."posizione_competenze" to "service_role";

grant trigger on table "public"."posizione_competenze" to "service_role";

grant truncate on table "public"."posizione_competenze" to "service_role";

grant update on table "public"."posizione_competenze" to "service_role";

grant delete on table "public"."posizione_tags" to "anon";

grant insert on table "public"."posizione_tags" to "anon";

grant references on table "public"."posizione_tags" to "anon";

grant select on table "public"."posizione_tags" to "anon";

grant trigger on table "public"."posizione_tags" to "anon";

grant truncate on table "public"."posizione_tags" to "anon";

grant update on table "public"."posizione_tags" to "anon";

grant delete on table "public"."posizione_tags" to "authenticated";

grant insert on table "public"."posizione_tags" to "authenticated";

grant references on table "public"."posizione_tags" to "authenticated";

grant select on table "public"."posizione_tags" to "authenticated";

grant trigger on table "public"."posizione_tags" to "authenticated";

grant truncate on table "public"."posizione_tags" to "authenticated";

grant update on table "public"."posizione_tags" to "authenticated";

grant delete on table "public"."posizione_tags" to "service_role";

grant insert on table "public"."posizione_tags" to "service_role";

grant references on table "public"."posizione_tags" to "service_role";

grant select on table "public"."posizione_tags" to "service_role";

grant trigger on table "public"."posizione_tags" to "service_role";

grant truncate on table "public"."posizione_tags" to "service_role";

grant update on table "public"."posizione_tags" to "service_role";

grant delete on table "public"."posizioni" to "anon";

grant insert on table "public"."posizioni" to "anon";

grant references on table "public"."posizioni" to "anon";

grant select on table "public"."posizioni" to "anon";

grant trigger on table "public"."posizioni" to "anon";

grant truncate on table "public"."posizioni" to "anon";

grant update on table "public"."posizioni" to "anon";

grant delete on table "public"."posizioni" to "authenticated";

grant insert on table "public"."posizioni" to "authenticated";

grant references on table "public"."posizioni" to "authenticated";

grant select on table "public"."posizioni" to "authenticated";

grant trigger on table "public"."posizioni" to "authenticated";

grant truncate on table "public"."posizioni" to "authenticated";

grant update on table "public"."posizioni" to "authenticated";

grant delete on table "public"."posizioni" to "service_role";

grant insert on table "public"."posizioni" to "service_role";

grant references on table "public"."posizioni" to "service_role";

grant select on table "public"."posizioni" to "service_role";

grant trigger on table "public"."posizioni" to "service_role";

grant truncate on table "public"."posizioni" to "service_role";

grant update on table "public"."posizioni" to "service_role";

grant delete on table "public"."profili" to "anon";

grant insert on table "public"."profili" to "anon";

grant references on table "public"."profili" to "anon";

grant select on table "public"."profili" to "anon";

grant trigger on table "public"."profili" to "anon";

grant truncate on table "public"."profili" to "anon";

grant update on table "public"."profili" to "anon";

grant delete on table "public"."profili" to "authenticated";

grant insert on table "public"."profili" to "authenticated";

grant references on table "public"."profili" to "authenticated";

grant select on table "public"."profili" to "authenticated";

grant trigger on table "public"."profili" to "authenticated";

grant truncate on table "public"."profili" to "authenticated";

grant update on table "public"."profili" to "authenticated";

grant delete on table "public"."profili" to "service_role";

grant insert on table "public"."profili" to "service_role";

grant references on table "public"."profili" to "service_role";

grant select on table "public"."profili" to "service_role";

grant trigger on table "public"."profili" to "service_role";

grant truncate on table "public"."profili" to "service_role";

grant update on table "public"."profili" to "service_role";

grant delete on table "public"."settori_intervento" to "anon";

grant insert on table "public"."settori_intervento" to "anon";

grant references on table "public"."settori_intervento" to "anon";

grant select on table "public"."settori_intervento" to "anon";

grant trigger on table "public"."settori_intervento" to "anon";

grant truncate on table "public"."settori_intervento" to "anon";

grant update on table "public"."settori_intervento" to "anon";

grant delete on table "public"."settori_intervento" to "authenticated";

grant insert on table "public"."settori_intervento" to "authenticated";

grant references on table "public"."settori_intervento" to "authenticated";

grant select on table "public"."settori_intervento" to "authenticated";

grant trigger on table "public"."settori_intervento" to "authenticated";

grant truncate on table "public"."settori_intervento" to "authenticated";

grant update on table "public"."settori_intervento" to "authenticated";

grant delete on table "public"."settori_intervento" to "service_role";

grant insert on table "public"."settori_intervento" to "service_role";

grant references on table "public"."settori_intervento" to "service_role";

grant select on table "public"."settori_intervento" to "service_role";

grant trigger on table "public"."settori_intervento" to "service_role";

grant truncate on table "public"."settori_intervento" to "service_role";

grant update on table "public"."settori_intervento" to "service_role";

grant delete on table "public"."tags" to "anon";

grant insert on table "public"."tags" to "anon";

grant references on table "public"."tags" to "anon";

grant select on table "public"."tags" to "anon";

grant trigger on table "public"."tags" to "anon";

grant truncate on table "public"."tags" to "anon";

grant update on table "public"."tags" to "anon";

grant delete on table "public"."tags" to "authenticated";

grant insert on table "public"."tags" to "authenticated";

grant references on table "public"."tags" to "authenticated";

grant select on table "public"."tags" to "authenticated";

grant trigger on table "public"."tags" to "authenticated";

grant truncate on table "public"."tags" to "authenticated";

grant update on table "public"."tags" to "authenticated";

grant delete on table "public"."tags" to "service_role";

grant insert on table "public"."tags" to "service_role";

grant references on table "public"."tags" to "service_role";

grant select on table "public"."tags" to "service_role";

grant trigger on table "public"."tags" to "service_role";

grant truncate on table "public"."tags" to "service_role";

grant update on table "public"."tags" to "service_role";

grant delete on table "public"."volontari" to "anon";

grant insert on table "public"."volontari" to "anon";

grant references on table "public"."volontari" to "anon";

grant select on table "public"."volontari" to "anon";

grant trigger on table "public"."volontari" to "anon";

grant truncate on table "public"."volontari" to "anon";

grant update on table "public"."volontari" to "anon";

grant delete on table "public"."volontari" to "authenticated";

grant insert on table "public"."volontari" to "authenticated";

grant references on table "public"."volontari" to "authenticated";

grant select on table "public"."volontari" to "authenticated";

grant trigger on table "public"."volontari" to "authenticated";

grant truncate on table "public"."volontari" to "authenticated";

grant update on table "public"."volontari" to "authenticated";

grant delete on table "public"."volontari" to "service_role";

grant insert on table "public"."volontari" to "service_role";

grant references on table "public"."volontari" to "service_role";

grant select on table "public"."volontari" to "service_role";

grant trigger on table "public"."volontari" to "service_role";

grant truncate on table "public"."volontari" to "service_role";

grant update on table "public"."volontari" to "service_role";

grant delete on table "public"."volontario_competenze" to "anon";

grant insert on table "public"."volontario_competenze" to "anon";

grant references on table "public"."volontario_competenze" to "anon";

grant select on table "public"."volontario_competenze" to "anon";

grant trigger on table "public"."volontario_competenze" to "anon";

grant truncate on table "public"."volontario_competenze" to "anon";

grant update on table "public"."volontario_competenze" to "anon";

grant delete on table "public"."volontario_competenze" to "authenticated";

grant insert on table "public"."volontario_competenze" to "authenticated";

grant references on table "public"."volontario_competenze" to "authenticated";

grant select on table "public"."volontario_competenze" to "authenticated";

grant trigger on table "public"."volontario_competenze" to "authenticated";

grant truncate on table "public"."volontario_competenze" to "authenticated";

grant update on table "public"."volontario_competenze" to "authenticated";

grant delete on table "public"."volontario_competenze" to "service_role";

grant insert on table "public"."volontario_competenze" to "service_role";

grant references on table "public"."volontario_competenze" to "service_role";

grant select on table "public"."volontario_competenze" to "service_role";

grant trigger on table "public"."volontario_competenze" to "service_role";

grant truncate on table "public"."volontario_competenze" to "service_role";

grant update on table "public"."volontario_competenze" to "service_role";

grant delete on table "public"."volontario_tags" to "anon";

grant insert on table "public"."volontario_tags" to "anon";

grant references on table "public"."volontario_tags" to "anon";

grant select on table "public"."volontario_tags" to "anon";

grant trigger on table "public"."volontario_tags" to "anon";

grant truncate on table "public"."volontario_tags" to "anon";

grant update on table "public"."volontario_tags" to "anon";

grant delete on table "public"."volontario_tags" to "authenticated";

grant insert on table "public"."volontario_tags" to "authenticated";

grant references on table "public"."volontario_tags" to "authenticated";

grant select on table "public"."volontario_tags" to "authenticated";

grant trigger on table "public"."volontario_tags" to "authenticated";

grant truncate on table "public"."volontario_tags" to "authenticated";

grant update on table "public"."volontario_tags" to "authenticated";

grant delete on table "public"."volontario_tags" to "service_role";

grant insert on table "public"."volontario_tags" to "service_role";

grant references on table "public"."volontario_tags" to "service_role";

grant select on table "public"."volontario_tags" to "service_role";

grant trigger on table "public"."volontario_tags" to "service_role";

grant truncate on table "public"."volontario_tags" to "service_role";

grant update on table "public"."volontario_tags" to "service_role";


  create policy "Le associazioni possono gestire solo i propri tag"
  on "public"."associazione_tags"
  as permissive
  for all
  to public
using ((auth.uid() = associazione_id));



  create policy "Tutti possono vedere i tag delle associazioni"
  on "public"."associazione_tags"
  as permissive
  for select
  to public
using (true);



  create policy "Consenti inserimento propria associazione"
  on "public"."associazioni"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = id));



  create policy "Consenti lettura associazioni"
  on "public"."associazioni"
  as permissive
  for select
  to public
using (true);



  create policy "Consenti modifica propria associazione"
  on "public"."associazioni"
  as permissive
  for update
  to authenticated
using ((auth.uid() = id));



  create policy "Consenti cancellazione proprie sedi"
  on "public"."associazioni_sedi"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = associazione_id));



  create policy "Consenti inserimento proprie sedi"
  on "public"."associazioni_sedi"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = associazione_id));



  create policy "Consenti lettura sedi"
  on "public"."associazioni_sedi"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Consenti modifica proprie sedi"
  on "public"."associazioni_sedi"
  as permissive
  for update
  to authenticated
using ((auth.uid() = associazione_id));



  create policy "Consenti inserimento propria trasparenza"
  on "public"."associazioni_trasparenza"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = associazione_id));



  create policy "Consenti lettura trasparenza"
  on "public"."associazioni_trasparenza"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Consenti modifica propria trasparenza"
  on "public"."associazioni_trasparenza"
  as permissive
  for update
  to authenticated
using ((auth.uid() = associazione_id));



  create policy "I volontari possono annullare le proprie candidature"
  on "public"."candidature"
  as permissive
  for delete
  to public
using ((auth.uid() = volontario_id));



  create policy "I volontari vedono le proprie candidature"
  on "public"."candidature"
  as permissive
  for select
  to public
using ((auth.uid() = volontario_id));



  create policy "Il volontario si candida per se stesso"
  on "public"."candidature"
  as permissive
  for insert
  to public
with check (((auth.role() = 'authenticated'::text) AND (auth.uid() = volontario_id)));



  create policy "Le associazioni possono aggiornare le candidature"
  on "public"."candidature"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.posizioni
  WHERE ((posizioni.id = candidature.posizione_id) AND (posizioni.associazione_id = auth.uid())))));



  create policy "Le associazioni vedono le candidature ricevute"
  on "public"."candidature"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.posizioni
  WHERE ((posizioni.id = candidature.posizione_id) AND (posizioni.associazione_id = auth.uid())))));



  create policy "Tutti leggono le competenze"
  on "public"."competenze"
  as permissive
  for select
  to public
using (true);



  create policy "I volontari vedono le proprie affiliazioni"
  on "public"."impresa_dipendenti"
  as permissive
  for select
  to public
using ((auth.uid() = volontario_id));



  create policy "I_volontari_vedono_la_propria_assunzione"
  on "public"."impresa_dipendenti"
  as permissive
  for select
  to authenticated
using ((volontario_id = auth.uid()));



  create policy "L'impresa vede i propri dipendenti"
  on "public"."impresa_dipendenti"
  as permissive
  for select
  to authenticated
using ((impresa_id = auth.uid()));



  create policy "Le imprese gestiscono i propri dipendenti"
  on "public"."impresa_dipendenti"
  as permissive
  for all
  to public
using ((auth.uid() = impresa_id));



  create policy "Impresa inserisce il suo profilo"
  on "public"."imprese"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "Impresa modifica il suo profilo"
  on "public"."imprese"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Le imprese sono pubbliche"
  on "public"."imprese"
  as permissive
  for select
  to public
using (true);



  create policy "Gestione inviti impresa"
  on "public"."inviti_impresa"
  as permissive
  for all
  to public
using ((auth.uid() = impresa_id));



  create policy "Lettura inviti tramite token"
  on "public"."inviti_impresa"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Accesso pubblico in lettura ai media"
  on "public"."media_associazioni"
  as permissive
  for select
  to public
using (true);



  create policy "Le associazioni possono eliminare i propri media"
  on "public"."media_associazioni"
  as permissive
  for delete
  to public
using ((auth.uid() = associazione_id));



  create policy "Le associazioni possono inserire i propri media"
  on "public"."media_associazioni"
  as permissive
  for insert
  to public
with check ((auth.uid() = associazione_id));



  create policy "Le associazioni vedono i propri media"
  on "public"."media_associazioni"
  as permissive
  for select
  to public
using ((auth.uid() = associazione_id));



  create policy "Inserimento messaggi"
  on "public"."messaggi"
  as permissive
  for insert
  to public
with check (((auth.role() = 'authenticated'::text) AND ((EXISTS ( SELECT 1
   FROM public.candidature
  WHERE ((candidature.id = messaggi.candidatura_id) AND (candidature.volontario_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (public.candidature c
     JOIN public.posizioni p ON ((p.id = c.posizione_id)))
  WHERE ((c.id = messaggi.candidatura_id) AND (p.associazione_id = auth.uid())))))));



  create policy "Lettura messaggi"
  on "public"."messaggi"
  as permissive
  for select
  to public
using (((auth.role() = 'authenticated'::text) AND ((EXISTS ( SELECT 1
   FROM public.candidature
  WHERE ((candidature.id = messaggi.candidatura_id) AND (candidature.volontario_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (public.candidature c
     JOIN public.posizioni p ON ((p.id = c.posizione_id)))
  WHERE ((c.id = messaggi.candidatura_id) AND (p.associazione_id = auth.uid())))))));



  create policy "Associazione cancella competenze"
  on "public"."posizione_competenze"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.posizioni
  WHERE ((posizioni.id = posizione_competenze.posizione_id) AND (posizioni.associazione_id = auth.uid())))));



  create policy "Associazione inserisce competenze"
  on "public"."posizione_competenze"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.posizioni
  WHERE ((posizioni.id = posizione_competenze.posizione_id) AND (posizioni.associazione_id = auth.uid())))));



  create policy "Tutti possono leggere le competenze delle posizioni"
  on "public"."posizione_competenze"
  as permissive
  for select
  to public
using (true);



  create policy "Consenti lettura tag posizioni a tutti (autenticati e anonimi)"
  on "public"."posizione_tags"
  as permissive
  for select
  to public
using (true);



  create policy "I tag delle posizioni sono pubblici"
  on "public"."posizione_tags"
  as permissive
  for select
  to public
using (true);



  create policy "Le associazioni possono cancellare i tag dei propri annunci"
  on "public"."posizione_tags"
  as permissive
  for delete
  to public
using ((auth.uid() IN ( SELECT posizioni.associazione_id
   FROM public.posizioni
  WHERE (posizioni.id = posizione_tags.posizione_id))));



  create policy "Le associazioni possono inserire tag per i propri annunci"
  on "public"."posizione_tags"
  as permissive
  for insert
  to public
with check ((auth.uid() IN ( SELECT posizioni.associazione_id
   FROM public.posizioni
  WHERE (posizioni.id = posizione_tags.posizione_id))));



  create policy "Permetti inserimento tag posizioni alle associazioni"
  on "public"."posizione_tags"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Le associazioni creano le proprie posizioni"
  on "public"."posizioni"
  as permissive
  for insert
  to public
with check ((auth.uid() = associazione_id));



  create policy "Le associazioni eliminano le proprie posizioni"
  on "public"."posizioni"
  as permissive
  for delete
  to public
using ((auth.uid() = associazione_id));



  create policy "Le associazioni possono modificare i propri annunci"
  on "public"."posizioni"
  as permissive
  for update
  to public
using ((auth.uid() = associazione_id));



  create policy "Le posizioni sono pubbliche"
  on "public"."posizioni"
  as permissive
  for select
  to public
using (true);



  create policy "Gli utenti possono aggiornare il proprio profilo"
  on "public"."profili"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Gli utenti possono inserire il proprio profilo"
  on "public"."profili"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "Gli utenti possono vedere il proprio profilo"
  on "public"."profili"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "I tag sono leggibili da tutti"
  on "public"."tags"
  as permissive
  for select
  to public
using (true);



  create policy "Inserimento profilo personale"
  on "public"."volontari"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = id));



  create policy "L'impresa vede il profilo dei propri dipendenti"
  on "public"."volontari"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.impresa_dipendenti
  WHERE ((impresa_dipendenti.volontario_id = volontari.id) AND (impresa_dipendenti.impresa_id = auth.uid())))));



  create policy "Permetti aggiornamento profilo volontario"
  on "public"."volontari"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Permetti inserimento profilo volontario"
  on "public"."volontari"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "Visualizzazione profilo personale"
  on "public"."volontari"
  as permissive
  for select
  to authenticated
using ((auth.uid() = id));



  create policy "Tutti possono vedere le competenze"
  on "public"."volontario_competenze"
  as permissive
  for select
  to public
using (true);



  create policy "Volontari cancellano proprie competenze"
  on "public"."volontario_competenze"
  as permissive
  for delete
  to public
using ((auth.uid() = volontario_id));



  create policy "Volontari inseriscono proprie competenze"
  on "public"."volontario_competenze"
  as permissive
  for insert
  to public
with check ((auth.uid() = volontario_id));



  create policy "Public read tags"
  on "public"."volontario_tags"
  as permissive
  for select
  to public
using (true);



  create policy "Tutti possono vedere i tag"
  on "public"."volontario_tags"
  as permissive
  for select
  to public
using (true);



  create policy "Users can delete their own tags"
  on "public"."volontario_tags"
  as permissive
  for delete
  to public
using ((auth.uid() = volontario_id));



  create policy "Users can insert their own tags"
  on "public"."volontario_tags"
  as permissive
  for insert
  to public
with check ((auth.uid() = volontario_id));



  create policy "Volontari cancellano propri tag"
  on "public"."volontario_tags"
  as permissive
  for delete
  to public
using ((auth.uid() = volontario_id));



  create policy "Volontari inseriscono propri tag"
  on "public"."volontario_tags"
  as permissive
  for insert
  to public
with check ((auth.uid() = volontario_id));



  create policy "Volontario cancella i suoi tag"
  on "public"."volontario_tags"
  as permissive
  for delete
  to public
using ((auth.uid() = volontario_id));



  create policy "Volontario inserisce i suoi tag"
  on "public"."volontario_tags"
  as permissive
  for insert
  to public
with check ((auth.uid() = volontario_id));



  create policy "Accesso Pubblico Avatars"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Eliminazione proprie foto"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'posizioni-immagini'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Gli utenti autenticati possono aggiornare foto"
  on "storage"."objects"
  as permissive
  for update
  to public
with check (((bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Gli utenti autenticati possono caricare foto"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Immagini visibili a tutti"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'posizioni-immagini'::text));



  create policy "Le foto profilo sono pubbliche"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Logos visibili a tutti"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'logos'::text));



  create policy "Modifica e cancellazione proprie foto"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'posizioni-immagini'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Permetti download avatars"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'avatars'::text));



  create policy "Update logo permessi"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'logos'::text));



  create policy "Upload logo permessi"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'logos'::text));



  create policy "Upload solo per utenti loggati"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'posizioni-immagini'::text) AND (auth.role() = 'authenticated'::text)));



