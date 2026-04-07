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
      activity_log: {
        Row: {
          action: string
          admin_user_id: string | null
          changes: Json | null
          created_at: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          changes?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          changes?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          admin_user_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type: string
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          auth_user_id: string
          avatar_url: string | null
          created_at: string | null
          custom_permissions: Json | null
          display_name: string
          email: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          auth_user_id: string
          avatar_url?: string | null
          created_at?: string | null
          custom_permissions?: Json | null
          display_name: string
          email: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string
          avatar_url?: string | null
          created_at?: string | null
          custom_permissions?: Json | null
          display_name?: string
          email?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          page_url: string | null
          referral_source: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          page_url?: string | null
          referral_source?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          page_url?: string | null
          referral_source?: string | null
          session_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          body: string
          cover_image_url: string | null
          created_at: string | null
          deleted_at: string | null
          excerpt: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          og_image_url: string | null
          published_at: string | null
          scheduled_for: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          body: string
          cover_image_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          body?: string
          cover_image_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          brand_name: string
          created_at: string | null
          display_order: number | null
          id: string
          in_stock: boolean | null
          is_default_for_tier: boolean | null
          price: number
          product_id: string
          size_variant: string | null
          stock_quantity: number | null
          tier: string
        }
        Insert: {
          brand_name: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          in_stock?: boolean | null
          is_default_for_tier?: boolean | null
          price: number
          product_id: string
          size_variant?: string | null
          stock_quantity?: number | null
          tier: string
        }
        Update: {
          brand_name?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          in_stock?: boolean | null
          is_default_for_tier?: boolean | null
          price?: number
          product_id?: string
          size_variant?: string | null
          stock_quantity?: number | null
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_items: {
        Row: {
          brand_id: string | null
          bundle_id: string
          display_order: number | null
          id: string
          product_id: string
          quantity: number | null
        }
        Insert: {
          brand_id?: string | null
          bundle_id: string
          display_order?: number | null
          id?: string
          product_id: string
          quantity?: number | null
        }
        Update: {
          brand_id?: string | null
          bundle_id?: string
          display_order?: number | null
          id?: string
          product_id?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bundle_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bundles: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          delivery_method: string | null
          description: string | null
          display_order: number | null
          emoji: string | null
          hospital_type: string
          id: string
          image_url: string | null
          is_active: boolean | null
          item_count: number
          meta_description: string | null
          meta_title: string | null
          name: string
          og_image_url: string | null
          price: number
          slug: string
          tier: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          delivery_method?: string | null
          description?: string | null
          display_order?: number | null
          emoji?: string | null
          hospital_type: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          item_count: number
          meta_description?: string | null
          meta_title?: string | null
          name: string
          og_image_url?: string | null
          price: number
          slug: string
          tier: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          delivery_method?: string | null
          description?: string | null
          display_order?: number | null
          emoji?: string | null
          hospital_type?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          item_count?: number
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          og_image_url?: string | null
          price?: number
          slug?: string
          tier?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      delivery_settings: {
        Row: {
          cities: string[] | null
          created_at: string | null
          delivery_days_max: number
          delivery_days_min: number
          delivery_fee: number
          display_order: number | null
          free_delivery_threshold: number | null
          id: string
          is_active: boolean | null
          states: string[] | null
          zone_name: string
        }
        Insert: {
          cities?: string[] | null
          created_at?: string | null
          delivery_days_max: number
          delivery_days_min: number
          delivery_fee: number
          display_order?: number | null
          free_delivery_threshold?: number | null
          id?: string
          is_active?: boolean | null
          states?: string[] | null
          zone_name: string
        }
        Update: {
          cities?: string[] | null
          created_at?: string | null
          delivery_days_max?: number
          delivery_days_min?: number
          delivery_fee?: number
          display_order?: number | null
          free_delivery_threshold?: number | null
          id?: string
          is_active?: boolean | null
          states?: string[] | null
          zone_name?: string
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          deleted_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          question: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          deleted_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          deleted_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          brand_id: string | null
          brand_name: string
          color: string | null
          created_at: string | null
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          size: string | null
          unit_price: number
        }
        Insert: {
          brand_id?: string | null
          brand_name: string
          color?: string | null
          created_at?: string | null
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          size?: string | null
          unit_price: number
        }
        Update: {
          brand_id?: string | null
          brand_name?: string
          color?: string | null
          created_at?: string | null
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          size?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          actual_delivery_date: string | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_city: string
          delivery_fee: number
          delivery_notes: string | null
          delivery_state: string
          discount: number | null
          estimated_delivery_end: string | null
          estimated_delivery_start: string | null
          gift_message: string | null
          gift_wrapping: boolean | null
          id: string
          order_number: string | null
          order_status: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          quiz_answers: Json | null
          referral_code_used: string | null
          service_fee: number
          subtotal: number
          total: number
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_city: string
          delivery_fee?: number
          delivery_notes?: string | null
          delivery_state: string
          discount?: number | null
          estimated_delivery_end?: string | null
          estimated_delivery_start?: string | null
          gift_message?: string | null
          gift_wrapping?: boolean | null
          id?: string
          order_number?: string | null
          order_status?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          quiz_answers?: Json | null
          referral_code_used?: string | null
          service_fee?: number
          subtotal: number
          total: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          delivery_address?: string
          delivery_city?: string
          delivery_fee?: number
          delivery_notes?: string | null
          delivery_state?: string
          discount?: number | null
          estimated_delivery_end?: string | null
          estimated_delivery_start?: string | null
          gift_message?: string | null
          gift_wrapping?: boolean | null
          id?: string
          order_number?: string | null
          order_status?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          quiz_answers?: Json | null
          referral_code_used?: string | null
          service_fee?: number
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_colors: {
        Row: {
          color_hex: string | null
          color_name: string
          display_order: number | null
          gender_match: string | null
          id: string
          in_stock: boolean | null
          product_id: string
        }
        Insert: {
          color_hex?: string | null
          color_name: string
          display_order?: number | null
          gender_match?: string | null
          id?: string
          in_stock?: boolean | null
          product_id: string
        }
        Update: {
          color_hex?: string | null
          color_name?: string
          display_order?: number | null
          gender_match?: string | null
          id?: string
          in_stock?: boolean | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_colors_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          is_primary: boolean | null
          medium_url: string | null
          product_id: string | null
          thumbnail_url: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          medium_url?: string | null
          product_id?: string | null
          thumbnail_url?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          medium_url?: string | null
          product_id?: string | null
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sizes: {
        Row: {
          display_order: number | null
          id: string
          in_stock: boolean | null
          is_default: boolean | null
          product_id: string
          size_code: string
          size_label: string
        }
        Insert: {
          display_order?: number | null
          id?: string
          in_stock?: boolean | null
          is_default?: boolean | null
          product_id: string
          size_code: string
          size_label: string
        }
        Update: {
          display_order?: number | null
          id?: string
          in_stock?: boolean | null
          is_default?: boolean | null
          product_id?: string
          size_code?: string
          size_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_sizes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          id: string
          product_id: string
          tag_type: string
          tag_value: string
        }
        Insert: {
          id?: string
          product_id: string
          tag_type: string
          tag_value: string
        }
        Update: {
          id?: string
          product_id?: string
          tag_type?: string
          tag_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allergen_info: string | null
          badge: string | null
          category: string
          contents: string | null
          created_at: string | null
          deleted_at: string | null
          description: string
          display_order: number | null
          emoji: string | null
          first_baby: boolean | null
          gender_colors: Json | null
          gender_relevant: boolean | null
          id: string
          image_url: string | null
          is_active: boolean | null
          material: string | null
          meta_description: string | null
          meta_title: string | null
          multiples_bump: number | null
          name: string
          og_image_url: string | null
          pack_count: string | null
          priority: string
          rating: number | null
          review_count: number | null
          safety_info: string | null
          scheduled_for: string | null
          slug: string
          updated_at: string | null
          why_included: string | null
          why_included_variants: Json | null
        }
        Insert: {
          allergen_info?: string | null
          badge?: string | null
          category: string
          contents?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description: string
          display_order?: number | null
          emoji?: string | null
          first_baby?: boolean | null
          gender_colors?: Json | null
          gender_relevant?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          material?: string | null
          meta_description?: string | null
          meta_title?: string | null
          multiples_bump?: number | null
          name: string
          og_image_url?: string | null
          pack_count?: string | null
          priority: string
          rating?: number | null
          review_count?: number | null
          safety_info?: string | null
          scheduled_for?: string | null
          slug: string
          updated_at?: string | null
          why_included?: string | null
          why_included_variants?: Json | null
        }
        Update: {
          allergen_info?: string | null
          badge?: string | null
          category?: string
          contents?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string
          display_order?: number | null
          emoji?: string | null
          first_baby?: boolean | null
          gender_colors?: Json | null
          gender_relevant?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          material?: string | null
          meta_description?: string | null
          meta_title?: string | null
          multiples_bump?: number | null
          name?: string
          og_image_url?: string | null
          pack_count?: string | null
          priority?: string
          rating?: number | null
          review_count?: number | null
          safety_info?: string | null
          scheduled_for?: string | null
          slug?: string
          updated_at?: string | null
          why_included?: string | null
          why_included_variants?: Json | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          referrer_email: string
          referrer_name: string
          referrer_order_id: string | null
          times_used: number | null
          total_earned: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          referrer_email: string
          referrer_name: string
          referrer_order_id?: string | null
          times_used?: number | null
          total_earned?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          referrer_email?: string
          referrer_name?: string
          referrer_order_id?: string | null
          times_used?: number | null
          total_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_referrer_order_id_fkey"
            columns: ["referrer_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_redemptions: {
        Row: {
          created_at: string | null
          discount_amount: number
          id: string
          referral_code_id: string | null
          referred_order_id: string | null
          referrer_credit: number
        }
        Insert: {
          created_at?: string | null
          discount_amount?: number
          id?: string
          referral_code_id?: string | null
          referred_order_id?: string | null
          referrer_credit?: number
        }
        Update: {
          created_at?: string | null
          discount_amount?: number
          id?: string
          referral_code_id?: string | null
          referred_order_id?: string | null
          referrer_credit?: number
        }
        Relationships: [
          {
            foreignKeyName: "referral_redemptions_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_redemptions_referred_order_id_fkey"
            columns: ["referred_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      revisions: {
        Row: {
          change_summary: string | null
          changed_by: string | null
          changed_fields: string[] | null
          created_at: string | null
          data_snapshot: Json
          entity_id: string
          entity_type: string
          id: string
          revision_number: number
        }
        Insert: {
          change_summary?: string | null
          changed_by?: string | null
          changed_fields?: string[] | null
          created_at?: string | null
          data_snapshot: Json
          entity_id: string
          entity_type: string
          id?: string
          revision_number: number
        }
        Update: {
          change_summary?: string | null
          changed_by?: string | null
          changed_fields?: string[] | null
          created_at?: string | null
          data_snapshot?: Json
          entity_id?: string
          entity_type?: string
          id?: string
          revision_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "revisions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string | null
          customer_city: string
          customer_initial: string | null
          customer_name: string
          deleted_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          quote: string
          rating: number | null
        }
        Insert: {
          created_at?: string | null
          customer_city: string
          customer_initial?: string | null
          customer_name: string
          deleted_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          quote: string
          rating?: number | null
        }
        Update: {
          created_at?: string | null
          customer_city?: string
          customer_initial?: string | null
          customer_name?: string
          deleted_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          quote?: string
          rating?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_delivery_fee: {
        Args: { p_city: string; p_state: string; p_subtotal: number }
        Returns: {
          days_max: number
          days_min: number
          fee: number
          zone: string
        }[]
      }
      has_admin_permission: {
        Args: { p_action: string; p_section: string }
        Returns: boolean
      }
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
    Enums: {},
  },
} as const
