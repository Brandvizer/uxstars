/**
 * Getypte weergave van het Supabase-schema (public). Spiegelt
 * supabase/migrations/ en parametriseert de client zodat queries
 * compile-time gecontroleerd zijn op tabel- en kolomnamen + rijvormen.
 *
 * Bijwerken na een migratie: handmatig hier, of regenereren met de Supabase
 * CLI zodra die gelinkt is:
 *   supabase gen types typescript --linked > lib/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MissieStatus =
  | "concept"
  | "in_review"
  | "open"
  | "gevuld"
  | "gearchiveerd";

export type StarStatus =
  | "aangevraagd"
  | "gevouched"
  | "actief"
  | "gepauzeerd";

export type ReactieStatus =
  | "nieuw"
  | "bekeken"
  | "uitgenodigd"
  | "afgewezen";

export type PlaatsingStatus = "actief" | "afgerond" | "geannuleerd";

export type Database = {
  public: {
    Tables: {
      opdrachtgevers: {
        Row: {
          id: string;
          naam: string;
          contactpersoon: string | null;
          email: string;
          telefoon: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          naam: string;
          contactpersoon?: string | null;
          email: string;
          telefoon?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["opdrachtgevers"]["Insert"]>;
        Relationships: [];
      };
      stars: {
        Row: {
          id: string;
          naam: string;
          specialisme: string;
          seniority: string;
          bio: string | null;
          beschikbaar: boolean;
          email: string | null;
          tarief_uur: number | null;
          status: StarStatus;
          user_id: string | null;
          portfolio_url: string | null;
          linkedin_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          naam: string;
          specialisme: string;
          seniority: string;
          bio?: string | null;
          beschikbaar?: boolean;
          email?: string | null;
          tarief_uur?: number | null;
          status?: StarStatus;
          user_id?: string | null;
          portfolio_url?: string | null;
          linkedin_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stars"]["Insert"]>;
        Relationships: [];
      };
      uitnodigingen: {
        Row: {
          id: string;
          token: string;
          uitgever_star_id: string | null;
          gebruikt_door_star_id: string | null;
          status: "open" | "gebruikt" | "ingetrokken";
          created_at: string;
          gebruikt_op: string | null;
        };
        Insert: {
          id?: string;
          token: string;
          uitgever_star_id?: string | null;
          gebruikt_door_star_id?: string | null;
          status?: "open" | "gebruikt" | "ingetrokken";
          created_at?: string;
          gebruikt_op?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["uitnodigingen"]["Insert"]>;
        Relationships: [];
      };
      missies: {
        Row: {
          id: string;
          slug: string;
          titel: string;
          rol: string;
          locatie: string | null;
          uren_per_week: string | null;
          duur: string | null;
          tarief_indicatie: string | null;
          seniority: string | null;
          start_indicatie: string | null;
          status: MissieStatus;
          intro: string | null;
          omschrijving: string[];
          opdrachtgever_id: string | null;
          opdrachtgever_label: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          titel: string;
          rol: string;
          locatie?: string | null;
          uren_per_week?: string | null;
          duur?: string | null;
          tarief_indicatie?: string | null;
          seniority?: string | null;
          start_indicatie?: string | null;
          status?: MissieStatus;
          intro?: string | null;
          omschrijving?: string[];
          opdrachtgever_id?: string | null;
          opdrachtgever_label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["missies"]["Insert"]>;
        Relationships: [];
      };
      reacties: {
        Row: {
          id: string;
          missie_id: string;
          star_id: string | null;
          motivatie: string | null;
          status: ReactieStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          missie_id: string;
          star_id?: string | null;
          motivatie?: string | null;
          status?: ReactieStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reacties"]["Insert"]>;
        Relationships: [];
      };
      vouches: {
        Row: {
          id: string;
          van_star_id: string;
          naar_star_id: string;
          toelichting: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          van_star_id: string;
          naar_star_id: string;
          toelichting?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vouches"]["Insert"]>;
        Relationships: [];
      };
      plaatsingen: {
        Row: {
          id: string;
          missie_id: string;
          star_id: string;
          startdatum: string | null;
          einddatum: string | null;
          tarief_uur: number | null;
          status: PlaatsingStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          missie_id: string;
          star_id: string;
          startdatum?: string | null;
          einddatum?: string | null;
          tarief_uur?: number | null;
          status?: PlaatsingStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["plaatsingen"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      plaats_missie: {
        Args: { payload: Json };
        Returns: string;
      };
      uitnodiging_info: {
        Args: { p_token: string };
        Returns: Json;
      };
      gebruik_uitnodiging: {
        Args: {
          p_token: string;
          p_naam: string;
          p_specialisme: string;
          p_seniority: string;
        };
        Returns: string;
      };
      mijn_profiel: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["stars"]["Row"][];
      };
      werk_profiel_bij: {
        Args: { payload: Json };
        Returns: undefined;
      };
      mijn_uitnodiging: {
        Args: Record<string, never>;
        Returns: Json;
      };
      maak_bootstrap_uitnodiging: {
        Args: Record<string, never>;
        Returns: string;
      };
      reageer_op_missie: {
        Args: { p_missie_id: string; p_motivatie: string };
        Returns: Json;
      };
      mijn_reactie: {
        Args: { p_missie_id: string };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
