


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."accetta_invito_sicuro"("token_invito" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."accetta_invito_sicuro"("token_invito" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cerca_posizioni_vicine"("user_lat" double precision, "user_lng" double precision, "raggio_km" double precision) RETURNS TABLE("id" "uuid", "associazione_id" "uuid", "titolo" "text", "descrizione" "text", "tipo" "text", "quando" "text", "dove" "text", "created_at" timestamp with time zone, "data_esatta" "date", "ora_inizio" time without time zone, "ora_fine" time without time zone, "giorni_settimana" "text"[], "coords" "text")
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."cerca_posizioni_vicine"("user_lat" double precision, "user_lng" double precision, "raggio_km" double precision) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."volontari" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bio" "text",
    "telefono" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "nome" "text",
    "cognome" "text",
    "email_contatto" "text",
    "data_nascita" "date",
    "sesso" "text",
    "citta_residenza" "text",
    "grado_istruzione" "text",
    "foto_profilo_url" "text",
    "cap" character varying(5)
);


ALTER TABLE "public"."volontari" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profili_candidati"("p_posizione_id" "uuid") RETURNS SETOF "public"."volontari"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_profili_candidati"("p_posizione_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ultime_posizioni"("limite" integer DEFAULT 50) RETURNS TABLE("id" "uuid", "associazione_id" "uuid", "titolo" "text", "descrizione" "text", "tipo" "text", "quando" "text", "dove" "text", "created_at" timestamp with time zone, "data_esatta" "date", "ora_inizio" time without time zone, "ora_fine" time without time zone, "giorni_settimana" "text"[], "coords" "text")
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."get_ultime_posizioni"("limite" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ricerca_avanzata_posizioni"("min_lat" double precision, "min_lng" double precision, "max_lat" double precision, "max_lng" double precision, "search_q" "text" DEFAULT NULL::"text", "filter_tipo" "text" DEFAULT NULL::"text", "filter_tags" "text"[] DEFAULT NULL::"text"[], "filter_competenze" "text"[] DEFAULT NULL::"text"[], "filter_data" "date" DEFAULT NULL::"date", "filter_giorni" "text"[] DEFAULT NULL::"text"[]) RETURNS TABLE("id" "uuid", "associazione_id" "uuid", "titolo" "text", "descrizione" "text", "tipo" "text", "dove" "text", "ora_inizio" time without time zone, "ora_fine" time without time zone, "quando" "text", "data_esatta" "date", "giorni_settimana" "text"[], "created_at" timestamp with time zone, "lat" double precision, "lng" double precision, "tags" "text"[], "competenze" "text"[], "immagine_url" "text")
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."ricerca_avanzata_posizioni"("min_lat" double precision, "min_lng" double precision, "max_lat" double precision, "max_lng" double precision, "search_q" "text", "filter_tipo" "text", "filter_tags" "text"[], "filter_competenze" "text"[], "filter_data" "date", "filter_giorni" "text"[]) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."associazione_tags" (
    "associazione_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."associazione_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."associazioni" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "descrizione" "text",
    "citta" "text",
    "email_contatto" "text",
    "sito_web" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "forma_giuridica" "text",
    "codice_fiscale" "text",
    "indirizzo_sede" "text",
    "telefono" "text",
    "profili_social" "text",
    "nome_referente" "text",
    "cap" character varying(5),
    "foto_profilo_url" "text"
);


ALTER TABLE "public"."associazioni" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."candidature" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "posizione_id" "uuid" NOT NULL,
    "volontario_id" "uuid" NOT NULL,
    "stato" "text" DEFAULT 'in_attesa'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "impresa_sponsor_id" "uuid"
);


ALTER TABLE "public"."candidature" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."competenze" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "is_official" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."competenze" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."impresa_dipendenti" (
    "impresa_id" "uuid" NOT NULL,
    "volontario_id" "uuid" NOT NULL,
    "stato" "text" DEFAULT 'in_attesa'::"text" NOT NULL,
    "ruolo_aziendale" "text" DEFAULT 'dipendente'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"(),
    CONSTRAINT "impresa_dipendenti_ruolo_aziendale_check" CHECK (("ruolo_aziendale" = ANY (ARRAY['dipendente'::"text", 'hr_manager'::"text"]))),
    CONSTRAINT "impresa_dipendenti_stato_check" CHECK (("stato" = ANY (ARRAY['in_attesa'::"text", 'attivo'::"text"])))
);


ALTER TABLE "public"."impresa_dipendenti" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."imprese" (
    "id" "uuid" NOT NULL,
    "ragione_sociale" "text",
    "forma_giuridica" "text",
    "partita_iva" "text",
    "codice_fiscale" "text",
    "indirizzo_sede" "text",
    "sito_web" "text",
    "profili_social" "text",
    "nome_referente" "text",
    "settore_attivita" "text",
    "fascia_dipendenti" "text",
    "area_operativa" "text",
    "valori_cause" "text",
    "obiettivi_esg" "text",
    "tipologia_impatto" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "cap" character varying(5),
    "foto_profilo_url" "text"
);


ALTER TABLE "public"."imprese" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inviti_impresa" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "impresa_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stato" "text" DEFAULT 'in_attesa'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "inviti_impresa_stato_check" CHECK (("stato" = ANY (ARRAY['in_attesa'::"text", 'accettato'::"text", 'revocato'::"text"])))
);


ALTER TABLE "public"."inviti_impresa" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media_associazioni" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "associazione_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "nome" "text"
);


ALTER TABLE "public"."media_associazioni" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messaggi" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "candidatura_id" "uuid" NOT NULL,
    "mittente_id" "uuid" NOT NULL,
    "testo" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."messaggi" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posizione_competenze" (
    "posizione_id" "uuid" NOT NULL,
    "competenza_id" "uuid" NOT NULL
);


ALTER TABLE "public"."posizione_competenze" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posizione_tags" (
    "posizione_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."posizione_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posizioni" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "associazione_id" "uuid" NOT NULL,
    "titolo" "text" NOT NULL,
    "descrizione" "text" NOT NULL,
    "tipo" "text" NOT NULL,
    "quando" "text" NOT NULL,
    "dove" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "data_esatta" "date",
    "ora_inizio" time without time zone,
    "ora_fine" time without time zone,
    "giorni_settimana" "text"[],
    "coords" "extensions"."geography"(Point,4326),
    "immagine_id" "uuid",
    CONSTRAINT "posizioni_tipo_check" CHECK (("tipo" = ANY (ARRAY['ricorrente'::"text", 'una_tantum'::"text"])))
);


ALTER TABLE "public"."posizioni" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profili" (
    "id" "uuid" NOT NULL,
    "ruolo" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "profili_ruolo_check" CHECK (("ruolo" = ANY (ARRAY['volontario'::"text", 'associazione'::"text", 'impresa'::"text"])))
);


ALTER TABLE "public"."profili" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."volontario_competenze" (
    "volontario_id" "uuid" NOT NULL,
    "competenza_id" "uuid" NOT NULL
);


ALTER TABLE "public"."volontario_competenze" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."volontario_tags" (
    "volontario_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."volontario_tags" OWNER TO "postgres";


ALTER TABLE ONLY "public"."associazione_tags"
    ADD CONSTRAINT "associazione_tags_pkey" PRIMARY KEY ("associazione_id", "tag_id");



ALTER TABLE ONLY "public"."associazioni"
    ADD CONSTRAINT "associazioni_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."candidature"
    ADD CONSTRAINT "candidature_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."candidature"
    ADD CONSTRAINT "candidature_posizione_id_volontario_id_key" UNIQUE ("posizione_id", "volontario_id");



ALTER TABLE ONLY "public"."competenze"
    ADD CONSTRAINT "competenze_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."impresa_dipendenti"
    ADD CONSTRAINT "impresa_dipendenti_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."impresa_dipendenti"
    ADD CONSTRAINT "impresa_dipendenti_pkey" PRIMARY KEY ("impresa_id", "volontario_id");



ALTER TABLE ONLY "public"."imprese"
    ADD CONSTRAINT "imprese_partita_iva_key" UNIQUE ("partita_iva");



ALTER TABLE ONLY "public"."imprese"
    ADD CONSTRAINT "imprese_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inviti_impresa"
    ADD CONSTRAINT "inviti_impresa_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inviti_impresa"
    ADD CONSTRAINT "inviti_impresa_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."media_associazioni"
    ADD CONSTRAINT "media_associazioni_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messaggi"
    ADD CONSTRAINT "messaggi_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posizione_competenze"
    ADD CONSTRAINT "posizione_competenze_pkey" PRIMARY KEY ("posizione_id", "competenza_id");



ALTER TABLE ONLY "public"."posizione_tags"
    ADD CONSTRAINT "posizione_tags_pkey" PRIMARY KEY ("posizione_id", "tag_id");



ALTER TABLE ONLY "public"."posizioni"
    ADD CONSTRAINT "posizioni_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profili"
    ADD CONSTRAINT "profili_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_associazioni"
    ADD CONSTRAINT "unique_url_per_associazione" UNIQUE ("url", "associazione_id");



ALTER TABLE ONLY "public"."volontari"
    ADD CONSTRAINT "volontari_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."volontario_competenze"
    ADD CONSTRAINT "volontario_competenze_pkey" PRIMARY KEY ("volontario_id", "competenza_id");



ALTER TABLE ONLY "public"."volontario_tags"
    ADD CONSTRAINT "volontario_tags_pkey" PRIMARY KEY ("volontario_id", "tag_id");



CREATE UNIQUE INDEX "competenze_name_normalized_idx" ON "public"."competenze" USING "btree" ("lower"(TRIM(BOTH FROM "name")));



ALTER TABLE ONLY "public"."associazione_tags"
    ADD CONSTRAINT "associazione_tags_associazione_id_fkey" FOREIGN KEY ("associazione_id") REFERENCES "public"."associazioni"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."associazione_tags"
    ADD CONSTRAINT "associazione_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."candidature"
    ADD CONSTRAINT "candidature_impresa_sponsor_id_fkey" FOREIGN KEY ("impresa_sponsor_id") REFERENCES "public"."imprese"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."candidature"
    ADD CONSTRAINT "candidature_posizione_id_fkey" FOREIGN KEY ("posizione_id") REFERENCES "public"."posizioni"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."candidature"
    ADD CONSTRAINT "candidature_volontario_id_fkey" FOREIGN KEY ("volontario_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."impresa_dipendenti"
    ADD CONSTRAINT "impresa_dipendenti_impresa_id_fkey" FOREIGN KEY ("impresa_id") REFERENCES "public"."imprese"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."impresa_dipendenti"
    ADD CONSTRAINT "impresa_dipendenti_volontario_id_fkey" FOREIGN KEY ("volontario_id") REFERENCES "public"."volontari"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."imprese"
    ADD CONSTRAINT "imprese_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inviti_impresa"
    ADD CONSTRAINT "inviti_impresa_impresa_id_fkey" FOREIGN KEY ("impresa_id") REFERENCES "public"."imprese"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."media_associazioni"
    ADD CONSTRAINT "media_associazioni_associazione_id_fkey" FOREIGN KEY ("associazione_id") REFERENCES "public"."associazioni"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messaggi"
    ADD CONSTRAINT "messaggi_candidatura_id_fkey" FOREIGN KEY ("candidatura_id") REFERENCES "public"."candidature"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messaggi"
    ADD CONSTRAINT "messaggi_mittente_id_fkey" FOREIGN KEY ("mittente_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posizione_competenze"
    ADD CONSTRAINT "posizione_competenze_competenza_id_fkey" FOREIGN KEY ("competenza_id") REFERENCES "public"."competenze"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posizione_competenze"
    ADD CONSTRAINT "posizione_competenze_posizione_id_fkey" FOREIGN KEY ("posizione_id") REFERENCES "public"."posizioni"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posizione_tags"
    ADD CONSTRAINT "posizione_tags_posizione_id_fkey" FOREIGN KEY ("posizione_id") REFERENCES "public"."posizioni"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posizione_tags"
    ADD CONSTRAINT "posizione_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posizioni"
    ADD CONSTRAINT "posizioni_associazione_id_fkey" FOREIGN KEY ("associazione_id") REFERENCES "public"."associazioni"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posizioni"
    ADD CONSTRAINT "posizioni_immagine_id_fkey" FOREIGN KEY ("immagine_id") REFERENCES "public"."media_associazioni"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profili"
    ADD CONSTRAINT "profili_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."volontario_competenze"
    ADD CONSTRAINT "volontario_competenze_competenza_id_fkey" FOREIGN KEY ("competenza_id") REFERENCES "public"."competenze"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."volontario_competenze"
    ADD CONSTRAINT "volontario_competenze_volontario_id_fkey" FOREIGN KEY ("volontario_id") REFERENCES "public"."volontari"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."volontario_tags"
    ADD CONSTRAINT "volontario_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."volontario_tags"
    ADD CONSTRAINT "volontario_tags_volontario_id_fkey" FOREIGN KEY ("volontario_id") REFERENCES "public"."volontari"("id") ON DELETE CASCADE;



CREATE POLICY "Accesso pubblico in lettura ai media" ON "public"."media_associazioni" FOR SELECT USING (true);



CREATE POLICY "Associazione cancella competenze" ON "public"."posizione_competenze" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."posizioni"
  WHERE (("posizioni"."id" = "posizione_competenze"."posizione_id") AND ("posizioni"."associazione_id" = "auth"."uid"())))));



CREATE POLICY "Associazione inserisce competenze" ON "public"."posizione_competenze" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."posizioni"
  WHERE (("posizioni"."id" = "posizione_competenze"."posizione_id") AND ("posizioni"."associazione_id" = "auth"."uid"())))));



CREATE POLICY "Associazione inserisce il suo profilo" ON "public"."associazioni" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Associazione modifica il suo profilo" ON "public"."associazioni" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Gestione inviti impresa" ON "public"."inviti_impresa" USING (("auth"."uid"() = "impresa_id"));



CREATE POLICY "Gli utenti possono aggiornare il proprio profilo" ON "public"."profili" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Gli utenti possono inserire il proprio profilo" ON "public"."profili" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Gli utenti possono vedere il proprio profilo" ON "public"."profili" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "I tag delle posizioni sono pubblici" ON "public"."posizione_tags" FOR SELECT USING (true);



CREATE POLICY "I tag sono leggibili da tutti" ON "public"."tags" FOR SELECT USING (true);



CREATE POLICY "I volontari possono annullare le proprie candidature" ON "public"."candidature" FOR DELETE USING (("auth"."uid"() = "volontario_id"));



CREATE POLICY "I volontari vedono le proprie affiliazioni" ON "public"."impresa_dipendenti" FOR SELECT USING (("auth"."uid"() = "volontario_id"));



CREATE POLICY "I volontari vedono le proprie candidature" ON "public"."candidature" FOR SELECT USING (("auth"."uid"() = "volontario_id"));



CREATE POLICY "I_volontari_vedono_la_propria_assunzione" ON "public"."impresa_dipendenti" FOR SELECT TO "authenticated" USING (("volontario_id" = "auth"."uid"()));



CREATE POLICY "Il volontario si candida per se stesso" ON "public"."candidature" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("auth"."uid"() = "volontario_id")));



CREATE POLICY "Impresa inserisce il suo profilo" ON "public"."imprese" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Impresa modifica il suo profilo" ON "public"."imprese" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Inserimento messaggi" ON "public"."messaggi" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ((EXISTS ( SELECT 1
   FROM "public"."candidature"
  WHERE (("candidature"."id" = "messaggi"."candidatura_id") AND ("candidature"."volontario_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."candidature" "c"
     JOIN "public"."posizioni" "p" ON (("p"."id" = "c"."posizione_id")))
  WHERE (("c"."id" = "messaggi"."candidatura_id") AND ("p"."associazione_id" = "auth"."uid"())))))));



CREATE POLICY "Inserimento profilo personale" ON "public"."volontari" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "L'impresa vede i propri dipendenti" ON "public"."impresa_dipendenti" FOR SELECT TO "authenticated" USING (("impresa_id" = "auth"."uid"()));



CREATE POLICY "L'impresa vede il profilo dei propri dipendenti" ON "public"."volontari" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."impresa_dipendenti"
  WHERE (("impresa_dipendenti"."volontario_id" = "volontari"."id") AND ("impresa_dipendenti"."impresa_id" = "auth"."uid"())))));



CREATE POLICY "Le associazioni creano le proprie posizioni" ON "public"."posizioni" FOR INSERT WITH CHECK (("auth"."uid"() = "associazione_id"));



CREATE POLICY "Le associazioni eliminano le proprie posizioni" ON "public"."posizioni" FOR DELETE USING (("auth"."uid"() = "associazione_id"));



CREATE POLICY "Le associazioni possono aggiornare le candidature" ON "public"."candidature" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."posizioni"
  WHERE (("posizioni"."id" = "candidature"."posizione_id") AND ("posizioni"."associazione_id" = "auth"."uid"())))));



CREATE POLICY "Le associazioni possono cancellare i tag dei propri annunci" ON "public"."posizione_tags" FOR DELETE USING (("auth"."uid"() IN ( SELECT "posizioni"."associazione_id"
   FROM "public"."posizioni"
  WHERE ("posizioni"."id" = "posizione_tags"."posizione_id"))));



CREATE POLICY "Le associazioni possono eliminare i propri media" ON "public"."media_associazioni" FOR DELETE USING (("auth"."uid"() = "associazione_id"));



CREATE POLICY "Le associazioni possono gestire solo i propri tag" ON "public"."associazione_tags" USING (("auth"."uid"() = "associazione_id"));



CREATE POLICY "Le associazioni possono inserire i propri media" ON "public"."media_associazioni" FOR INSERT WITH CHECK (("auth"."uid"() = "associazione_id"));



CREATE POLICY "Le associazioni possono inserire tag per i propri annunci" ON "public"."posizione_tags" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "posizioni"."associazione_id"
   FROM "public"."posizioni"
  WHERE ("posizioni"."id" = "posizione_tags"."posizione_id"))));



CREATE POLICY "Le associazioni possono modificare i propri annunci" ON "public"."posizioni" FOR UPDATE USING (("auth"."uid"() = "associazione_id"));



CREATE POLICY "Le associazioni sono pubbliche" ON "public"."associazioni" FOR SELECT USING (true);



CREATE POLICY "Le associazioni vedono i propri media" ON "public"."media_associazioni" FOR SELECT USING (("auth"."uid"() = "associazione_id"));



CREATE POLICY "Le associazioni vedono le candidature ricevute" ON "public"."candidature" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."posizioni"
  WHERE (("posizioni"."id" = "candidature"."posizione_id") AND ("posizioni"."associazione_id" = "auth"."uid"())))));



CREATE POLICY "Le imprese gestiscono i propri dipendenti" ON "public"."impresa_dipendenti" USING (("auth"."uid"() = "impresa_id"));



CREATE POLICY "Le imprese sono pubbliche" ON "public"."imprese" FOR SELECT USING (true);



CREATE POLICY "Le posizioni sono pubbliche" ON "public"."posizioni" FOR SELECT USING (true);



CREATE POLICY "Lettura inviti tramite token" ON "public"."inviti_impresa" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Lettura messaggi" ON "public"."messaggi" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ((EXISTS ( SELECT 1
   FROM "public"."candidature"
  WHERE (("candidature"."id" = "messaggi"."candidatura_id") AND ("candidature"."volontario_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."candidature" "c"
     JOIN "public"."posizioni" "p" ON (("p"."id" = "c"."posizione_id")))
  WHERE (("c"."id" = "messaggi"."candidatura_id") AND ("p"."associazione_id" = "auth"."uid"())))))));



CREATE POLICY "Permetti aggiornamento profilo volontario" ON "public"."volontari" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Permetti inserimento profilo volontario" ON "public"."volontari" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Permetti inserimento tag posizioni alle associazioni" ON "public"."posizione_tags" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Permetti lettura tag posizioni a tutti gli utenti" ON "public"."posizione_tags" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Public read tags" ON "public"."volontario_tags" FOR SELECT USING (true);



CREATE POLICY "Tutti leggono le competenze" ON "public"."competenze" FOR SELECT USING (true);



CREATE POLICY "Tutti possono leggere le competenze delle posizioni" ON "public"."posizione_competenze" FOR SELECT USING (true);



CREATE POLICY "Tutti possono vedere i tag" ON "public"."volontario_tags" FOR SELECT USING (true);



CREATE POLICY "Tutti possono vedere i tag delle associazioni" ON "public"."associazione_tags" FOR SELECT USING (true);



CREATE POLICY "Tutti possono vedere le competenze" ON "public"."volontario_competenze" FOR SELECT USING (true);



CREATE POLICY "Users can delete their own tags" ON "public"."volontario_tags" FOR DELETE USING (("auth"."uid"() = "volontario_id"));



CREATE POLICY "Users can insert their own tags" ON "public"."volontario_tags" FOR INSERT WITH CHECK (("auth"."uid"() = "volontario_id"));



CREATE POLICY "Visualizzazione profilo personale" ON "public"."volontari" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Volontari cancellano propri tag" ON "public"."volontario_tags" FOR DELETE USING (("auth"."uid"() = "volontario_id"));



CREATE POLICY "Volontari cancellano proprie competenze" ON "public"."volontario_competenze" FOR DELETE USING (("auth"."uid"() = "volontario_id"));



CREATE POLICY "Volontari inseriscono propri tag" ON "public"."volontario_tags" FOR INSERT WITH CHECK (("auth"."uid"() = "volontario_id"));



CREATE POLICY "Volontari inseriscono proprie competenze" ON "public"."volontario_competenze" FOR INSERT WITH CHECK (("auth"."uid"() = "volontario_id"));



CREATE POLICY "Volontario cancella i suoi tag" ON "public"."volontario_tags" FOR DELETE USING (("auth"."uid"() = "volontario_id"));



CREATE POLICY "Volontario inserisce i suoi tag" ON "public"."volontario_tags" FOR INSERT WITH CHECK (("auth"."uid"() = "volontario_id"));



ALTER TABLE "public"."associazione_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."associazioni" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."candidature" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."competenze" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."impresa_dipendenti" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."imprese" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inviti_impresa" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."media_associazioni" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messaggi" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posizione_competenze" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posizione_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posizioni" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profili" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."volontari" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."volontario_competenze" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."volontario_tags" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."messaggi";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


















































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."accetta_invito_sicuro"("token_invito" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."accetta_invito_sicuro"("token_invito" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accetta_invito_sicuro"("token_invito" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cerca_posizioni_vicine"("user_lat" double precision, "user_lng" double precision, "raggio_km" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."cerca_posizioni_vicine"("user_lat" double precision, "user_lng" double precision, "raggio_km" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."cerca_posizioni_vicine"("user_lat" double precision, "user_lng" double precision, "raggio_km" double precision) TO "service_role";



GRANT ALL ON TABLE "public"."volontari" TO "anon";
GRANT ALL ON TABLE "public"."volontari" TO "authenticated";
GRANT ALL ON TABLE "public"."volontari" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profili_candidati"("p_posizione_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_profili_candidati"("p_posizione_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profili_candidati"("p_posizione_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ultime_posizioni"("limite" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_ultime_posizioni"("limite" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ultime_posizioni"("limite" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."ricerca_avanzata_posizioni"("min_lat" double precision, "min_lng" double precision, "max_lat" double precision, "max_lng" double precision, "search_q" "text", "filter_tipo" "text", "filter_tags" "text"[], "filter_competenze" "text"[], "filter_data" "date", "filter_giorni" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."ricerca_avanzata_posizioni"("min_lat" double precision, "min_lng" double precision, "max_lat" double precision, "max_lng" double precision, "search_q" "text", "filter_tipo" "text", "filter_tags" "text"[], "filter_competenze" "text"[], "filter_data" "date", "filter_giorni" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."ricerca_avanzata_posizioni"("min_lat" double precision, "min_lng" double precision, "max_lat" double precision, "max_lng" double precision, "search_q" "text", "filter_tipo" "text", "filter_tags" "text"[], "filter_competenze" "text"[], "filter_data" "date", "filter_giorni" "text"[]) TO "service_role";

















































































GRANT ALL ON TABLE "public"."associazione_tags" TO "anon";
GRANT ALL ON TABLE "public"."associazione_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."associazione_tags" TO "service_role";



GRANT ALL ON TABLE "public"."associazioni" TO "anon";
GRANT ALL ON TABLE "public"."associazioni" TO "authenticated";
GRANT ALL ON TABLE "public"."associazioni" TO "service_role";



GRANT ALL ON TABLE "public"."candidature" TO "anon";
GRANT ALL ON TABLE "public"."candidature" TO "authenticated";
GRANT ALL ON TABLE "public"."candidature" TO "service_role";



GRANT ALL ON TABLE "public"."competenze" TO "anon";
GRANT ALL ON TABLE "public"."competenze" TO "authenticated";
GRANT ALL ON TABLE "public"."competenze" TO "service_role";



GRANT ALL ON TABLE "public"."impresa_dipendenti" TO "anon";
GRANT ALL ON TABLE "public"."impresa_dipendenti" TO "authenticated";
GRANT ALL ON TABLE "public"."impresa_dipendenti" TO "service_role";



GRANT ALL ON TABLE "public"."imprese" TO "anon";
GRANT ALL ON TABLE "public"."imprese" TO "authenticated";
GRANT ALL ON TABLE "public"."imprese" TO "service_role";



GRANT ALL ON TABLE "public"."inviti_impresa" TO "anon";
GRANT ALL ON TABLE "public"."inviti_impresa" TO "authenticated";
GRANT ALL ON TABLE "public"."inviti_impresa" TO "service_role";



GRANT ALL ON TABLE "public"."media_associazioni" TO "anon";
GRANT ALL ON TABLE "public"."media_associazioni" TO "authenticated";
GRANT ALL ON TABLE "public"."media_associazioni" TO "service_role";



GRANT ALL ON TABLE "public"."messaggi" TO "anon";
GRANT ALL ON TABLE "public"."messaggi" TO "authenticated";
GRANT ALL ON TABLE "public"."messaggi" TO "service_role";



GRANT ALL ON TABLE "public"."posizione_competenze" TO "anon";
GRANT ALL ON TABLE "public"."posizione_competenze" TO "authenticated";
GRANT ALL ON TABLE "public"."posizione_competenze" TO "service_role";



GRANT ALL ON TABLE "public"."posizione_tags" TO "anon";
GRANT ALL ON TABLE "public"."posizione_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."posizione_tags" TO "service_role";



GRANT ALL ON TABLE "public"."posizioni" TO "anon";
GRANT ALL ON TABLE "public"."posizioni" TO "authenticated";
GRANT ALL ON TABLE "public"."posizioni" TO "service_role";



GRANT ALL ON TABLE "public"."profili" TO "anon";
GRANT ALL ON TABLE "public"."profili" TO "authenticated";
GRANT ALL ON TABLE "public"."profili" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."volontario_competenze" TO "anon";
GRANT ALL ON TABLE "public"."volontario_competenze" TO "authenticated";
GRANT ALL ON TABLE "public"."volontario_competenze" TO "service_role";



GRANT ALL ON TABLE "public"."volontario_tags" TO "anon";
GRANT ALL ON TABLE "public"."volontario_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."volontario_tags" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































