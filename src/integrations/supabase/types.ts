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
      categories: {
        Row: {
          blurb: string
          created_at: string
          id: string
          name: string
          slug: string
          tamil_name: string
          updated_at: string
        }
        Insert: {
          blurb?: string
          created_at?: string
          id: string
          name: string
          slug: string
          tamil_name?: string
          updated_at?: string
        }
        Update: {
          blurb?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
          tamil_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          area: string
          avatar_url: string
          created_at: string
          id: string
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          area?: string
          avatar_url?: string
          created_at?: string
          id: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Update: {
          area?: string
          avatar_url?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          created_at: string
          customer_name: string
          event_date: string
          id: string
          message: string
          phone: string
          product_id: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name?: string
          event_date?: string
          id: string
          message?: string
          phone?: string
          product_id?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          event_date?: string
          id?: string
          message?: string
          phone?: string
          product_id?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          image_url: string
          name: string
          price: number
          seller_id: string
          type: string
          unit: string
          updated_at: string
          views: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id: string
          image_url?: string
          name: string
          price?: number
          seller_id: string
          type?: string
          unit?: string
          updated_at?: string
          views?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          name?: string
          price?: number
          seller_id?: string
          type?: string
          unit?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          approved: boolean
          comment: string
          created_at: string
          customer_name: string
          id: string
          rating: number
          seller_id: string
          updated_at: string
        }
        Insert: {
          approved?: boolean
          comment?: string
          created_at?: string
          customer_name?: string
          id: string
          rating?: number
          seller_id: string
          updated_at?: string
        }
        Update: {
          approved?: boolean
          comment?: string
          created_at?: string
          customer_name?: string
          id?: string
          rating?: number
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_accounts: {
        Row: {
          created_at: string
          nammaspot_id: string
          profile: Json | null
          seller_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          nammaspot_id: string
          profile?: Json | null
          seller_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          nammaspot_id?: string
          profile?: Json | null
          seller_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sellers: {
        Row: {
          about: string
          area: string
          business_name: string
          category_id: string
          city: string
          cover_url: string
          created_at: string
          delivers_across_city: boolean
          email: string
          featured: boolean
          id: string
          image_url: string
          instagram: string
          owner_name: string
          price_from: number
          slug: string
          status: string
          tagline: string
          tags: string[]
          updated_at: string
          whatsapp: string
        }
        Insert: {
          about?: string
          area?: string
          business_name: string
          category_id?: string
          city?: string
          cover_url?: string
          created_at?: string
          delivers_across_city?: boolean
          email?: string
          featured?: boolean
          id: string
          image_url?: string
          instagram?: string
          owner_name?: string
          price_from?: number
          slug: string
          status?: string
          tagline?: string
          tags?: string[]
          updated_at?: string
          whatsapp?: string
        }
        Update: {
          about?: string
          area?: string
          business_name?: string
          category_id?: string
          city?: string
          cover_url?: string
          created_at?: string
          delivers_across_city?: boolean
          email?: string
          featured?: boolean
          id?: string
          image_url?: string
          instagram?: string
          owner_name?: string
          price_from?: number
          slug?: string
          status?: string
          tagline?: string
          tags?: string[]
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      nammaspot_id_available: { Args: { _id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
