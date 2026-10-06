export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      associazione_tags: {
        Row: {
          associazione_id: string
          tag_id: string
        }
        Insert: {
          associazione_id: string
          tag_id: string
        }
        Update: {
          associazione_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "associazione_tags_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associazione_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      associazioni: {
        Row: {
          cap_legale: string
          codice_fiscale: string
          comune_legale: string
          cover_path: string | null
          created_at: string
          denominazione: string
          descrizione: string | null
          documenti_pubblici: Json
          email_istituzionale: string
          forma_giuridica: string
          id: string
          indirizzo_legale: string
          is_verificata: boolean
          lat_legale: number | null
          lng_legale: number | null
          logo_path: string | null
          numero_runts: string | null
          partita_iva: string | null
          provincia_legale: string
          referente_cognome: string | null
          referente_nome: string | null
          referente_ruolo: string | null
          sezione_runts: string | null
          sito_web: string | null
          slug: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          cap_legale: string
          codice_fiscale: string
          comune_legale: string
          cover_path?: string | null
          created_at?: string
          denominazione: string
          descrizione?: string | null
          documenti_pubblici?: Json
          email_istituzionale: string
          forma_giuridica: string
          id: string
          indirizzo_legale: string
          is_verificata?: boolean
          lat_legale?: number | null
          lng_legale?: number | null
          logo_path?: string | null
          numero_runts?: string | null
          partita_iva?: string | null
          provincia_legale: string
          referente_cognome?: string | null
          referente_nome?: string | null
          referente_ruolo?: string | null
          sezione_runts?: string | null
          sito_web?: string | null
          slug?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          cap_legale?: string
          codice_fiscale?: string
          comune_legale?: string
          cover_path?: string | null
          created_at?: string
          denominazione?: string
          descrizione?: string | null
          documenti_pubblici?: Json
          email_istituzionale?: string
          forma_giuridica?: string
          id?: string
          indirizzo_legale?: string
          is_verificata?: boolean
          lat_legale?: number | null
          lng_legale?: number | null
          logo_path?: string | null
          numero_runts?: string | null
          partita_iva?: string | null
          provincia_legale?: string
          referente_cognome?: string | null
          referente_nome?: string | null
          referente_ruolo?: string | null
          sezione_runts?: string | null
          sito_web?: string | null
          slug?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "associazioni_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profili"
            referencedColumns: ["id"]
          },
        ]
      }
      associazioni_sedi_operative: {
        Row: {
          associazione_id: string
          cap: string
          comune: string
          id: string
          indirizzo: string
          lat: number | null
          lng: number | null
          nome: string
          provincia: string
        }
        Insert: {
          associazione_id: string
          cap: string
          comune: string
          id?: string
          indirizzo: string
          lat?: number | null
          lng?: number | null
          nome?: string
          provincia: string
        }
        Update: {
          associazione_id?: string
          cap?: string
          comune?: string
          id?: string
          indirizzo?: string
          lat?: number | null
          lng?: number | null
          nome?: string
          provincia?: string
        }
        Relationships: [
          {
            foreignKeyName: "associazioni_sedi_operative_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni"
            referencedColumns: ["id"]
          },
        ]
      }
      candidature: {
        Row: {
          created_at: string
          id: string
          note_volontario: string | null
          posizione_id: string
          stato: Database["public"]["Enums"]["stato_candidatura"]
          volontario_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_volontario?: string | null
          posizione_id: string
          stato?: Database["public"]["Enums"]["stato_candidatura"]
          volontario_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note_volontario?: string | null
          posizione_id?: string
          stato?: Database["public"]["Enums"]["stato_candidatura"]
          volontario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidature_posizione_id_fkey"
            columns: ["posizione_id"]
            isOneToOne: false
            referencedRelation: "posizioni"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidature_volontario_id_fkey"
            columns: ["volontario_id"]
            isOneToOne: false
            referencedRelation: "volontari"
            referencedColumns: ["id"]
          },
        ]
      }
      conversazione_partecipanti: {
        Row: {
          conversazione_id: string
          created_at: string
          profilo_id: string
          ultimo_letto_at: string | null
        }
        Insert: {
          conversazione_id: string
          created_at?: string
          profilo_id: string
          ultimo_letto_at?: string | null
        }
        Update: {
          conversazione_id?: string
          created_at?: string
          profilo_id?: string
          ultimo_letto_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversazione_partecipanti_conversazione_id_fkey"
            columns: ["conversazione_id"]
            isOneToOne: false
            referencedRelation: "conversazioni"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversazione_partecipanti_profilo_id_fkey"
            columns: ["profilo_id"]
            isOneToOne: false
            referencedRelation: "profili"
            referencedColumns: ["id"]
          },
        ]
      }
      conversazioni: {
        Row: {
          created_at: string
          id: string
          tipo: Database["public"]["Enums"]["tipo_conversazione"]
          titolo: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          tipo?: Database["public"]["Enums"]["tipo_conversazione"]
          titolo?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          tipo?: Database["public"]["Enums"]["tipo_conversazione"]
          titolo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messaggi: {
        Row: {
          conversazione_id: string
          created_at: string
          id: string
          is_system: boolean
          mittente_id: string
          testo: string
        }
        Insert: {
          conversazione_id: string
          created_at?: string
          id?: string
          is_system?: boolean
          mittente_id: string
          testo: string
        }
        Update: {
          conversazione_id?: string
          created_at?: string
          id?: string
          is_system?: boolean
          mittente_id?: string
          testo?: string
        }
        Relationships: [
          {
            foreignKeyName: "messaggi_conversazione_id_fkey"
            columns: ["conversazione_id"]
            isOneToOne: false
            referencedRelation: "conversazioni"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messaggi_mittente_id_fkey"
            columns: ["mittente_id"]
            isOneToOne: false
            referencedRelation: "profili"
            referencedColumns: ["id"]
          },
        ]
      }
      posizione_tags: {
        Row: {
          posizione_id: string
          tag_id: string
        }
        Insert: {
          posizione_id: string
          tag_id: string
        }
        Update: {
          posizione_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posizione_tags_posizione_id_fkey"
            columns: ["posizione_id"]
            isOneToOne: false
            referencedRelation: "posizioni"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posizione_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
posizioni: {
  Row: {
    id: string
    associazione_id: string
    titolo: string
    descrizione: string
    tipo: string
    modalita: string
    stato: string
    slug: string | null
    sede_operativa_id: string | null
    luogo_nome: string | null
    indirizzo_specifico: string | null
    comune: string | null
    provincia: string | null
    lat: number | null
    lng: number | null
    immagine_path: string | null
    data_esatta: string | null
    giorni_settimana: string[] | null
    ora_inizio: string | null
    ora_fine: string | null
    quando: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    associazione_id: string
    titolo: string
    descrizione: string
    tipo?: string
    modalita?: string
    stato?: string
    slug?: string | null
    sede_operativa_id?: string | null
    luogo_nome?: string | null
    indirizzo_specifico?: string | null
    comune?: string | null
    provincia?: string | null
    lat?: number | null
    lng?: number | null
    immagine_path?: string | null
    data_esatta?: string | null
    giorni_settimana?: string[] | null
    ora_inizio?: string | null
    ora_fine?: string | null
    quando?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    associazione_id?: string
    titolo?: string
    descrizione?: string
    tipo?: string
    modalita?: string
    stato?: string
    slug?: string | null
    sede_operativa_id?: string | null
    luogo_nome?: string | null
    indirizzo_specifico?: string | null
    comune?: string | null
    provincia?: string | null
    lat?: number | null
    lng?: number | null
    immagine_path?: string | null
    data_esatta?: string | null
    giorni_settimana?: string[] | null
    ora_inizio?: string | null
    ora_fine?: string | null
    quando?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "posizioni_associazione_id_fkey"
      columns: ["associazione_id"]
      isOneToOne: false
      referencedRelation: "associazioni"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "posizioni_sede_operativa_id_fkey"
      columns: ["sede_operativa_id"]
      isOneToOne: false
      referencedRelation: "associazioni_sedi_operative"
      referencedColumns: ["id"]
    }
  ]
}

associazioni_vetrina: {
  Row: {
    associazione_id: string
    layout_config: Json
    layout_draft: Json
    colore_brand: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    associazione_id: string
    layout_config?: Json
    layout_draft?: Json
    colore_brand?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    associazione_id?: string
    layout_config?: Json
    layout_draft?: Json
    colore_brand?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "associazioni_vetrina_associazione_id_fkey"
      columns: ["associazione_id"]
      isOneToOne: true
      referencedRelation: "associazioni"
      referencedColumns: ["id"]
    }
  ]
}
      profili: {
        Row: {
          created_at: string
          email: string
          id: string
          ruolo: Database["public"]["Enums"]["ruolo_utente"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          ruolo: Database["public"]["Enums"]["ruolo_utente"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ruolo?: Database["public"]["Enums"]["ruolo_utente"]
          updated_at?: string
        }
        Relationships: []
      }
      runts_import: {
        Row: {
          codice_fiscale: string
          comune: string | null
          created_at: string | null
          denominazione: string
          id: string
          indirizzo: string | null
          legale_rappresentante: string | null
          provincia: string | null
          sezione_runts: string | null
        }
        Insert: {
          codice_fiscale: string
          comune?: string | null
          created_at?: string | null
          denominazione: string
          id?: string
          indirizzo?: string | null
          legale_rappresentante?: string | null
          provincia?: string | null
          sezione_runts?: string | null
        }
        Update: {
          codice_fiscale?: string
          comune?: string | null
          created_at?: string | null
          denominazione?: string
          id?: string
          indirizzo?: string | null
          legale_rappresentante?: string | null
          provincia?: string | null
          sezione_runts?: string | null
        }
        Relationships: []
      }
      squadra_membri: {
        Row: {
          associazione_id: string
          data_ingresso: string
          note: string | null
          stato: Database["public"]["Enums"]["stato_squadra"]
          volontario_id: string
        }
        Insert: {
          associazione_id: string
          data_ingresso?: string
          note?: string | null
          stato?: Database["public"]["Enums"]["stato_squadra"]
          volontario_id: string
        }
        Update: {
          associazione_id?: string
          data_ingresso?: string
          note?: string | null
          stato?: Database["public"]["Enums"]["stato_squadra"]
          volontario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squadra_membri_associazione_id_fkey"
            columns: ["associazione_id"]
            isOneToOne: false
            referencedRelation: "associazioni"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squadra_membri_volontario_id_fkey"
            columns: ["volontario_id"]
            isOneToOne: false
            referencedRelation: "volontari"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          categoria: string
          id: string
          nome: string
        }
        Insert: {
          categoria?: string
          id?: string
          nome: string
        }
        Update: {
          categoria?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      volontari: {
        Row: {
          avatar_path: string | null
          bio: string | null
          citta_residenza: string | null
          codice_fiscale: string | null
          cognome: string
          data_nascita: string | null
          id: string
          nome: string
          telefono: string | null
        }
        Insert: {
          avatar_path?: string | null
          bio?: string | null
          citta_residenza?: string | null
          codice_fiscale?: string | null
          cognome: string
          data_nascita?: string | null
          id: string
          nome: string
          telefono?: string | null
        }
        Update: {
          avatar_path?: string | null
          bio?: string | null
          citta_residenza?: string | null
          codice_fiscale?: string | null
          cognome?: string
          data_nascita?: string | null
          id?: string
          nome?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volontari_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profili"
            referencedColumns: ["id"]
          },
        ]
      }
      volontario_tags: {
        Row: {
          tag_id: string
          volontario_id: string
        }
        Insert: {
          tag_id: string
          volontario_id: string
        }
        Update: {
          tag_id?: string
          volontario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volontario_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volontario_tags_volontario_id_fkey"
            columns: ["volontario_id"]
            isOneToOne: false
            referencedRelation: "volontari"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accetta_invito_sicuro: {
        Args: { token_invito: string }
        Returns: boolean
      }
      cerca_directory_unificata: {
        Args: { search_query?: string }
        Returns: {
          codice_fiscale: string
          comune: string
          denominazione: string
          id: string
          is_claimed: boolean
          is_registrata: boolean
          lat: number
          lng: number
          logo_url: string
          rank: number
          sezione_runts: string
          slug: string
          stato_verifica: string
        }[]
      }
      cerca_posizioni_vicine: {
        Args: { raggio_km: number; user_lat: number; user_lng: number }
        Returns: {
          associazione_id: string
          coords: string
          created_at: string
          data_esatta: string
          descrizione: string
          dove: string
          giorni_settimana: string[]
          id: string
          ora_fine: string
          ora_inizio: string
          quando: string
          tipo: string
          titolo: string
        }[]
      }
      chiudi_posizioni_scadute: { Args: never; Returns: undefined }
      get_dashboard_volontario_feed: {
        Args: { p_volontario_id: string }
        Returns: Json
      }
      get_ultime_posizioni: {
        Args: { limite?: number }
        Returns: {
          associazione_id: string
          coords: string
          created_at: string
          data_esatta: string
          descrizione: string
          dove: string
          giorni_settimana: string[]
          id: string
          ora_fine: string
          ora_inizio: string
          quando: string
          tipo: string
          titolo: string
        }[]
      }
      is_chat_participant: {
        Args: { _conversazione_id: string }
        Returns: boolean
      }
      ricerca_avanzata_posizioni: {
        Args: {
          filter_competenze?: string[]
          filter_data?: string
          filter_giorni?: string[]
          filter_tags?: string[]
          filter_tipo?: string
          max_lat: number
          max_lng: number
          min_lat: number
          min_lng: number
          search_q?: string
        }
        Returns: {
          associazione_denominazione: string
          associazione_id: string
          associazione_slug: string
          competenze: string[]
          created_at: string
          data_esatta: string
          descrizione: string
          dove: string
          giorni_settimana: string[]
          id: string
          immagine_url: string
          lat: number
          lng: number
          ora_fine: string
          ora_inizio: string
          quando: string
          slug: string
          tags: string[]
          tipo: string
          titolo: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slugify: { Args: { v: string }; Returns: string }
      verifica_codice_fiscale_runts: {
        Args: { cf_input: string }
        Returns: {
          comune: string
          denominazione: string
          gia_rivendicato: boolean
          provincia: string
          sezione_runts: string
          trovato: boolean
        }[]
      }
    }
    Enums: {
      modalita_posizione: "in_sede" | "luogo_specifico" | "remoto"
      ruolo_utente: "volontario" | "associazione" | "impresa"
      stato_candidatura: "in_attesa" | "approvata" | "rifiutata" | "ritirata"
      stato_posizione:
        | "bozza"
        | "pubblicata"
        | "aperta"
        | "chiusa"
        | "archiviata"
      stato_squadra: "attivo" | "sospeso" | "rimosso"
      tipo_conversazione: "diretta" | "gruppo"
      tipo_posizione: "una_tantum" | "ricorrente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      modalita_posizione: ["in_sede", "luogo_specifico", "remoto"],
      ruolo_utente: ["volontario", "associazione", "impresa"],
      stato_candidatura: ["in_attesa", "approvata", "rifiutata", "ritirata"],
      stato_posizione: [
        "bozza",
        "pubblicata",
        "aperta",
        "chiusa",
        "archiviata",
      ],
      stato_squadra: ["attivo", "sospeso", "rimosso"],
      tipo_conversazione: ["diretta", "gruppo"],
      tipo_posizione: ["una_tantum", "ricorrente"],
    },
  },
} as const
