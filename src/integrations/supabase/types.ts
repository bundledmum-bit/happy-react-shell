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
          compare_at_price: number | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          is_default_for_tier: boolean | null
          logo_url: string | null
          price: number
          product_id: string
          size_variant: string | null
          stock_quantity: number | null
          thumbnail_url: string | null
          tier: string
        }
        Insert: {
          brand_name: string
          compare_at_price?: number | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          is_default_for_tier?: boolean | null
          logo_url?: string | null
          price: number
          product_id: string
          size_variant?: string | null
          stock_quantity?: number | null
          thumbnail_url?: string | null
          tier: string
        }
        Update: {
          brand_name?: string
          compare_at_price?: number | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          is_default_for_tier?: boolean | null
          logo_url?: string | null
          price?: number
          product_id?: string
          size_variant?: string | null
          stock_quantity?: number | null
          thumbnail_url?: string | null
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
          discount_percent: number | null
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
          price_mode: string | null
          slug: string
          tier: string
          updated_at: string | null
          upsell_bundle_id: string | null
          upsell_text: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          delivery_method?: string | null
          description?: string | null
          discount_percent?: number | null
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
          price_mode?: string | null
          slug: string
          tier: string
          updated_at?: string | null
          upsell_bundle_id?: string | null
          upsell_text?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          delivery_method?: string | null
          description?: string | null
          discount_percent?: number | null
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
          price_mode?: string | null
          slug?: string
          tier?: string
          updated_at?: string | null
          upsell_bundle_id?: string | null
          upsell_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bundles_upsell_bundle_id_fkey"
            columns: ["upsell_bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usage: {
        Row: {
          coupon_id: string | null
          created_at: string | null
          customer_email: string
          discount_applied: number
          id: string
          order_id: string | null
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string | null
          customer_email: string
          discount_applied: number
          id?: string
          order_id?: string | null
        }
        Update: {
          coupon_id?: string | null
          created_at?: string | null
          customer_email?: string
          discount_applied?: number
          id?: string
          order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applicable_ids: string[] | null
          applies_to: string | null
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number | null
          end_date: string | null
          id: string
          is_active: boolean | null
          maximum_discount_amount: number | null
          minimum_order_amount: number | null
          start_date: string | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
          usage_limit_per_customer: number | null
        }
        Insert: {
          applicable_ids?: string[] | null
          applies_to?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          maximum_discount_amount?: number | null
          minimum_order_amount?: number | null
          start_date?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          usage_limit_per_customer?: number | null
        }
        Update: {
          applicable_ids?: string[] | null
          applies_to?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          maximum_discount_amount?: number | null
          minimum_order_amount?: number | null
          start_date?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          usage_limit_per_customer?: number | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string | null
          delivery_address: string | null
          delivery_area: string | null
          delivery_state: string | null
          email: string
          full_name: string | null
          id: string
          last_order_at: string | null
          notes: string | null
          phone: string | null
          tags: string[] | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_address?: string | null
          delivery_area?: string | null
          delivery_state?: string | null
          email: string
          full_name?: string | null
          id?: string
          last_order_at?: string | null
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_address?: string | null
          delivery_area?: string | null
          delivery_state?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_order_at?: string | null
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
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
      homepage_sections: {
        Row: {
          custom_data: Json | null
          display_order: number | null
          id: string
          is_visible: boolean | null
          section_key: string
          section_label: string
          updated_at: string | null
        }
        Insert: {
          custom_data?: Json | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          section_key: string
          section_label: string
          updated_at?: string | null
        }
        Update: {
          custom_data?: Json | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          section_key?: string
          section_label?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      navigation_links: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          label: string
          location: string
          open_in_new_tab: boolean | null
          parent_id: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          label: string
          location: string
          open_in_new_tab?: boolean | null
          parent_id?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          label?: string
          location?: string
          open_in_new_tab?: boolean | null
          parent_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigation_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "navigation_links"
            referencedColumns: ["id"]
          },
        ]
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
      order_notes: {
        Row: {
          admin_user_id: string | null
          created_at: string | null
          id: string
          is_customer_note: boolean | null
          note: string
          order_id: string
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          is_customer_note?: boolean | null
          note: string
          order_id: string
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          is_customer_note?: boolean | null
          note?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notes_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          new_status: string
          note: string | null
          old_status: string | null
          order_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status: string
          note?: string | null
          old_status?: string | null
          order_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status?: string
          note?: string | null
          old_status?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          actual_delivery_date: string | null
          coupon_id: string | null
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
          discount_amount: number | null
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
          spend_discount_amount: number | null
          spend_discount_id: string | null
          spend_discount_percent: number | null
          subtotal: number
          total: number
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          coupon_id?: string | null
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
          discount_amount?: number | null
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
          spend_discount_amount?: number | null
          spend_discount_id?: string | null
          spend_discount_percent?: number | null
          subtotal: number
          total: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          coupon_id?: string | null
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
          discount_amount?: number | null
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
          spend_discount_amount?: number | null
          spend_discount_id?: string | null
          spend_discount_percent?: number | null
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: string
          created_at: string | null
          hero_text: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string
          created_at?: string | null
          hero_text?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          hero_text?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_category: string | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_category?: string | null
          slug: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_category?: string | null
          slug?: string
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
          brand_id: string | null
          created_at: string | null
          display_order: number | null
          file_size: number | null
          height: number | null
          id: string
          image_url: string
          is_primary: boolean | null
          medium_url: string | null
          product_id: string | null
          thumbnail_url: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          brand_id?: string | null
          created_at?: string | null
          display_order?: number | null
          file_size?: number | null
          height?: number | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          medium_url?: string | null
          product_id?: string | null
          thumbnail_url?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          brand_id?: string | null
          created_at?: string | null
          display_order?: number | null
          file_size?: number | null
          height?: number | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          medium_url?: string | null
          product_id?: string | null
          thumbnail_url?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
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
          subcategory: string | null
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
          subcategory?: string | null
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
          subcategory?: string | null
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
      shipping_zones: {
        Row: {
          areas: string[]
          created_at: string | null
          display_order: number | null
          estimated_days_max: number | null
          estimated_days_min: number | null
          express_available: boolean | null
          express_days_max: number | null
          express_days_min: number | null
          express_rate: number | null
          flat_rate: number
          free_delivery_threshold: number | null
          id: string
          is_active: boolean | null
          name: string
          states: string[] | null
        }
        Insert: {
          areas?: string[]
          created_at?: string | null
          display_order?: number | null
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          express_available?: boolean | null
          express_days_max?: number | null
          express_days_min?: number | null
          express_rate?: number | null
          flat_rate: number
          free_delivery_threshold?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          states?: string[] | null
        }
        Update: {
          areas?: string[]
          created_at?: string | null
          display_order?: number | null
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          express_available?: boolean | null
          express_days_max?: number | null
          express_days_min?: number | null
          express_rate?: number | null
          flat_rate?: number
          free_delivery_threshold?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          states?: string[] | null
        }
        Relationships: []
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
      spend_threshold_discounts: {
        Row: {
          created_at: string | null
          discount_percent: number
          display_order: number | null
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          name: string
          threshold_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discount_percent: number
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          name: string
          threshold_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discount_percent?: number
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          name?: string
          threshold_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      stock_notifications: {
        Row: {
          brand_id: string | null
          created_at: string | null
          email: string
          id: string
          notified: boolean | null
          product_id: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          notified?: boolean | null
          product_id: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          notified?: boolean | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_notifications_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_settings: {
        Row: {
          applicable_categories: string[] | null
          applies_to: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_included_in_price: boolean | null
          name: string
          rate: number
        }
        Insert: {
          applicable_categories?: string[] | null
          applies_to?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_included_in_price?: boolean | null
          name: string
          rate: number
        }
        Update: {
          applicable_categories?: string[] | null
          applies_to?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_included_in_price?: boolean | null
          name?: string
          rate?: number
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
