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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          name: string
          primary_color: string
          accent_color: string
        }
        Insert: {
          created_at?: string | null
          domain: string
          id?: string
          name: string
          primary_color: string
          accent_color: string
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          name?: string
          primary_color: string
          accent_color: string
        }
        Relationships: []
      }
      // --- START: NEW CUSTOMERS TABLE ---
      customers: {
        Row: {
          id: string
          created_at: string
          company_id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          company_id: string
          user_id: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          company_id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // --- END: NEW CUSTOMERS TABLE ---
      custom_fields: {
        Row: {
          company_id: string
          created_at: string | null
          field_name: string
          field_order: number
          field_type: string
          id: string
          table_name: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          field_name: string
          field_order?: number
          field_type: string
          id?: string
          table_name: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          field_name?: string
          field_order?: number
          field_type?: string
          id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_fields_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: Database["public"]["Enums"]["item_category"]
          company_id: string | null
          created_at: string | null
          custom_data: Json | null
          id: string
          name: string
          price: number | null
          quantity: number
          reorder_level: number
          unit: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["item_category"]
          company_id?: string | null
          created_at?: string | null
          custom_data?: Json | null
          id?: string
          name: string
          price?: number | null
          quantity?: number
          reorder_level?: number
          unit: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["item_category"]
          company_id?: string | null
          created_at?: string | null
          custom_data?: Json | null
          id?: string
          name?: string
          price?: number | null
          quantity?: number
          reorder_level?: number
          unit?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          inventory_item_id: string | null
          notes: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          inventory_item_id?: string | null
          notes?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          inventory_item_id?: string | null
          notes?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          inventory_item_id: string | null
          item_name: string
          order_id: string
          price: number
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string | null
          item_name: string
          order_id: string
          price: number
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          order_id?: string
          price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          company_id: string | null
          created_at: string | null
          custom_data: Json | null
          customer_email: string
          customer_name: string
          customer_phone: string
          customer_id: string | null
          id: string
          needs_shipping: boolean | null
          order_number: string
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          shipping_address: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          custom_data?: Json | null
          customer_email: string
          customer_name: string
          customer_phone: string
          customer_id?: string | null
          id?: string
          needs_shipping?: boolean | null
          order_number: string
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          custom_data?: Json | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          customer_id?: string | null
          id?: string
          needs_shipping?: boolean | null
          order_number?: string
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          email: string
          role: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id: string
          email: string
          role: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          email: string
          role: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          carrier: string | null
          company_id: string
          created_at: string | null
          custom_data: Json | null
          id: string
          notes: string | null
          order_id: string | null
          recipient_email: string | null
          recipient_name: string
          recipient_phone: string | null
          scheduled_date: string
          shipment_number: string
          shipment_type: Database["public"]["Enums"]["transaction_type"]
          shipped_date: string | null
          shipping_address: string | null
          status: Database["public"]["Enums"]["shipment_status"]
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          carrier?: string | null
          company_id: string
          created_at?: string | null
          custom_data?: Json | null
          id?: string
          notes?: string | null
          order_id?: string | null
          recipient_email?: string | null
          recipient_name: string
          recipient_phone?: string | null
          scheduled_date: string
          shipment_number: string
          shipment_type?: Database["public"]["Enums"]["transaction_type"]
          shipped_date?: string | null
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          carrier?: string | null
          company_id?: string
          created_at?: string | null
          custom_data?: Json | null
          id?: string
          notes?: string | null
          order_id?: string | null
          recipient_email?: string | null
          recipient_name?: string
          recipient_phone?: string | null
          scheduled_date?: string
          shipment_number?: string
          shipment_type?: Database["public"]["Enums"]["transaction_type"]
          shipped_date?: string | null
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      item_category: "raw" | "finished"
      order_status: "pending" | "processing" | "completed" | "cancelled"
      shipment_status: "scheduled" | "in_transit" | "delivered" | "cancelled"
      transaction_type:
      | "order"
      | "shipment"
      | "restock"
      | "adjustment"
      | "sample"
      | "distributor_pickup"
      | "store_delivery"
      | "add_new"
      | "damaged_goods"
      | "correction"
      | "returns"
      | "other"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
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
      item_category: ["raw", "finished"],
      order_status: ["pending", "processing", "completed", "cancelled"],
      shipment_status: ["scheduled", "in_transit", "delivered", "cancelled"],
      transaction_type: [
        "order",
        "shipment",
        "restock",
        "adjustment",
        "sample",
        "distributor_pickup",
        "store_delivery",
      ],
    },
  },
} as const