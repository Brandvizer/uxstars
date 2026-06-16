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
          user_id: string | null;
          website: string | null;
          logo_url: string | null;
          membership_status: string;
          membership_tier: string | null;
          membership_tot: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          naam: string;
          contactpersoon?: string | null;
          email: string;
          telefoon?: string | null;
          user_id?: string | null;
          website?: string | null;
          logo_url?: string | null;
          membership_status?: string;
          membership_tier?: string | null;
          membership_tot?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
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
          foto_url: string | null;
          foto_toestemming: boolean;
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
          foto_url?: string | null;
          foto_toestemming?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stars"]["Insert"]>;
        Relationships: [];
      };
      vouch_aanvragen: {
        Row: {
          id: string;
          naam: string;
          email: string;
          portfolio_url: string | null;
          motivatie: string | null;
          status: "nieuw" | "uitgenodigd" | "afgewezen";
          uitnodiging_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          naam: string;
          email: string;
          portfolio_url?: string | null;
          motivatie?: string | null;
          status?: "nieuw" | "uitgenodigd" | "afgewezen";
          uitnodiging_id?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["vouch_aanvragen"]["Insert"]
        >;
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
          deal_type: string;
          klant_tarief_uur: number | null;
          marge_uur: number | null;
          contract_status: string;
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
          deal_type?: string;
          klant_tarief_uur?: number | null;
          marge_uur?: number | null;
          contract_status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["plaatsingen"]["Insert"]>;
        Relationships: [];
      };
      admins: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admins"]["Insert"]>;
        Relationships: [];
      };
      bedrijf_leads: {
        Row: {
          id: string;
          ster_id: string | null;
          bedrijf_naam: string;
          contact_naam: string | null;
          contact_email: string | null;
          toelichting: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ster_id?: string | null;
          bedrijf_naam: string;
          contact_naam?: string | null;
          contact_email?: string | null;
          toelichting?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bedrijf_leads"]["Insert"]>;
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
      admin_reacties: {
        Args: Record<string, never>;
        Returns: Json;
      };
      markeer_voorgesteld: {
        Args: { p_reactie_id: string };
        Returns: undefined;
      };
      bevestig_plaatsing: {
        Args: {
          p_reactie_id: string;
          p_deal_type?: string;
          p_ster_tarief?: number;
          p_klant_tarief?: number;
        };
        Returns: undefined;
      };
      admin_plaatsingen: {
        Args: Record<string, never>;
        Returns: Json;
      };
      zet_contract_status: {
        Args: { p_plaatsing_id: string; p_status: string };
        Returns: undefined;
      };
      publieke_sterren: {
        Args: Record<string, never>;
        Returns: Json;
      };
      vraag_vouch_aan: {
        Args: { payload: Json };
        Returns: undefined;
      };
      admin_vouch_aanvragen: {
        Args: Record<string, never>;
        Returns: Json;
      };
      nodig_kandidaat_uit: {
        Args: { p_aanvraag_id: string };
        Returns: Json;
      };
      wijs_kandidaat_af: {
        Args: { p_aanvraag_id: string };
        Returns: undefined;
      };
      maak_bedrijf: {
        Args: { p_naam: string };
        Returns: string;
      };
      mijn_bedrijf: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["opdrachtgevers"]["Row"][];
      };
      werk_bedrijf_bij: {
        Args: { payload: Json };
        Returns: undefined;
      };
      admin_bedrijven: {
        Args: Record<string, never>;
        Returns: Json;
      };
      zet_membership: {
        Args: {
          p_bedrijf_id: string;
          p_status: string;
          p_tier: string;
          p_tot: string | null;
        };
        Returns: undefined;
      };
      plaats_missie_als_bedrijf: {
        Args: { payload: Json };
        Returns: string;
      };
      mijn_missies: {
        Args: Record<string, never>;
        Returns: Json;
      };
      publieke_leden: {
        Args: Record<string, never>;
        Returns: Json;
      };
      mijn_stelsel: {
        Args: Record<string, never>;
        Returns: Json;
      };
      beveel_bedrijf_aan: {
        Args: { payload: Json };
        Returns: undefined;
      };
      mijn_aanbevelingen: {
        Args: Record<string, never>;
        Returns: Json;
      };
      admin_bedrijf_leads: {
        Args: Record<string, never>;
        Returns: Json;
      };
      zet_lead_status: {
        Args: { p_id: string; p_status: string };
        Returns: undefined;
      };
      verwijder_vouch_aanvraag: {
        Args: { p_id: string };
        Returns: undefined;
      };
      start_membership_trial: {
        Args: { p_tier: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
