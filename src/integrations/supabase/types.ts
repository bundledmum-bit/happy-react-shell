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
      admin_permission_definitions: {
        Row: {
          action: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          label: string
          module: string
        }
        Insert: {
          action: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          label: string
          module: string
        }
        Update: {
          action?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          label?: string
          module?: string
        }
        Relationships: []
      }
      admin_role_defaults: {
        Row: {
          action: string
          granted: boolean
          id: string
          module: string
          role: string
        }
        Insert: {
          action: string
          granted?: boolean
          id?: string
          module: string
          role: string
        }
        Update: {
          action?: string
          granted?: boolean
          id?: string
          module?: string
          role?: string
        }
        Relationships: []
      }
      admin_user_permissions: {
        Row: {
          action: string
          admin_user_id: string
          granted: boolean
          granted_at: string | null
          granted_by: string | null
          id: string
          module: string
          notes: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          granted?: boolean
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          module: string
          notes?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          granted?: boolean
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          module?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_user_permissions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_user_permissions_granted_by_fkey"
            columns: ["granted_by"]
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
          browser: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          os: string | null
          page_url: string | null
          referral_source: string | null
          referrer: string | null
          session_id: string | null
          traffic_medium: string | null
          traffic_source: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          os?: string | null
          page_url?: string | null
          referral_source?: string | null
          referrer?: string | null
          session_id?: string | null
          traffic_medium?: string | null
          traffic_source?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          os?: string | null
          page_url?: string | null
          referral_source?: string | null
          referrer?: string | null
          session_id?: string | null
          traffic_medium?: string | null
          traffic_source?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
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
          cogs_percent: number | null
          compare_at_price: number | null
          cost_price: number | null
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
          cogs_percent?: number | null
          compare_at_price?: number | null
          cost_price?: number | null
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
          cogs_percent?: number | null
          compare_at_price?: number | null
          cost_price?: number | null
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
            referencedRelation: "order_lines_report"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_report"
            referencedColumns: ["order_uuid"]
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
      custom_reports: {
        Row: {
          comparison_enabled: boolean | null
          comparison_type: string | null
          created_at: string | null
          created_by: string | null
          date_range_type: string | null
          description: string | null
          dimensions: Json
          filters: Json | null
          id: string
          is_pinned: boolean | null
          is_shared: boolean | null
          last_run_at: string | null
          metrics: Json
          name: string
          report_type: string | null
          sort_by: string | null
          sort_direction: string | null
          updated_at: string | null
        }
        Insert: {
          comparison_enabled?: boolean | null
          comparison_type?: string | null
          created_at?: string | null
          created_by?: string | null
          date_range_type?: string | null
          description?: string | null
          dimensions?: Json
          filters?: Json | null
          id?: string
          is_pinned?: boolean | null
          is_shared?: boolean | null
          last_run_at?: string | null
          metrics?: Json
          name: string
          report_type?: string | null
          sort_by?: string | null
          sort_direction?: string | null
          updated_at?: string | null
        }
        Update: {
          comparison_enabled?: boolean | null
          comparison_type?: string | null
          created_at?: string | null
          created_by?: string | null
          date_range_type?: string | null
          description?: string | null
          dimensions?: Json
          filters?: Json | null
          id?: string
          is_pinned?: boolean | null
          is_shared?: boolean | null
          last_run_at?: string | null
          metrics?: Json
          name?: string
          report_type?: string | null
          sort_by?: string | null
          sort_direction?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          acquisition_channel: string | null
          created_at: string | null
          customer_ref: string | null
          delivery_address: string | null
          delivery_area: string | null
          delivery_state: string | null
          email: string
          first_purchase_date: string | null
          full_name: string | null
          id: string
          last_order_at: string | null
          last_purchase_date: string | null
          notes: string | null
          phone: string | null
          primary_country: string | null
          primary_device: string | null
          tags: string[] | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          acquisition_channel?: string | null
          created_at?: string | null
          customer_ref?: string | null
          delivery_address?: string | null
          delivery_area?: string | null
          delivery_state?: string | null
          email: string
          first_purchase_date?: string | null
          full_name?: string | null
          id?: string
          last_order_at?: string | null
          last_purchase_date?: string | null
          notes?: string | null
          phone?: string | null
          primary_country?: string | null
          primary_device?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          acquisition_channel?: string | null
          created_at?: string | null
          customer_ref?: string | null
          delivery_address?: string | null
          delivery_area?: string | null
          delivery_state?: string | null
          email?: string
          first_purchase_date?: string | null
          full_name?: string | null
          id?: string
          last_order_at?: string | null
          last_purchase_date?: string | null
          notes?: string | null
          phone?: string | null
          primary_country?: string | null
          primary_device?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          whatsapp_number?: string | null
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
      invoices: {
        Row: {
          billing_address: string | null
          billing_city: string | null
          billing_country: string | null
          billing_state: string | null
          coupon_code: string | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          delivery_fee: number
          discount_amount: number
          due_date: string | null
          generated_by: string | null
          gift_message: string | null
          gift_wrap: boolean | null
          id: string
          invoice_date: string
          invoice_number: string
          is_gift: boolean | null
          line_items: Json
          notes: string | null
          order_id: string
          order_number: string
          paid_at: string | null
          payment_method: string | null
          payment_status: string | null
          paystack_reference: string | null
          service_fee: number
          status: string
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_state?: string | null
          coupon_code?: string | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          delivery_fee?: number
          discount_amount?: number
          due_date?: string | null
          generated_by?: string | null
          gift_message?: string | null
          gift_wrap?: boolean | null
          id?: string
          invoice_date?: string
          invoice_number: string
          is_gift?: boolean | null
          line_items?: Json
          notes?: string | null
          order_id: string
          order_number: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          paystack_reference?: string | null
          service_fee?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_state?: string | null
          coupon_code?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          delivery_fee?: number
          discount_amount?: number
          due_date?: string | null
          generated_by?: string | null
          gift_message?: string | null
          gift_wrap?: boolean | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          is_gift?: boolean | null
          line_items?: Json
          notes?: string | null
          order_id?: string
          order_number?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          paystack_reference?: string | null
          service_fee?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_lines_report"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_report"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "invoices_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
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
          cogs_amount: number | null
          color: string | null
          created_at: string | null
          discount_amount: number | null
          gross_sales: number | null
          id: string
          line_total: number
          net_sales: number | null
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          returns_amount: number | null
          shipping_alloc: number | null
          size: string | null
          tax_amount: number | null
          unit_price: number
        }
        Insert: {
          brand_id?: string | null
          brand_name: string
          cogs_amount?: number | null
          color?: string | null
          created_at?: string | null
          discount_amount?: number | null
          gross_sales?: number | null
          id?: string
          line_total: number
          net_sales?: number | null
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          returns_amount?: number | null
          shipping_alloc?: number | null
          size?: string | null
          tax_amount?: number | null
          unit_price: number
        }
        Update: {
          brand_id?: string | null
          brand_name?: string
          cogs_amount?: number | null
          color?: string | null
          created_at?: string | null
          discount_amount?: number | null
          gross_sales?: number | null
          id?: string
          line_total?: number
          net_sales?: number | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          returns_amount?: number | null
          shipping_alloc?: number | null
          size?: string | null
          tax_amount?: number | null
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
            referencedRelation: "order_lines_report"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_report"
            referencedColumns: ["order_uuid"]
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
            referencedRelation: "order_lines_report"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_report"
            referencedColumns: ["order_uuid"]
          },
        ]
      }
      order_returns: {
        Row: {
          created_at: string | null
          handled_by: string | null
          id: string
          items_returned: Json | null
          order_id: string
          refund_amount: number | null
          refund_issued: boolean | null
          refunded_at: string | null
          return_date: string
          return_reason: string
          return_reason_notes: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          handled_by?: string | null
          id?: string
          items_returned?: Json | null
          order_id: string
          refund_amount?: number | null
          refund_issued?: boolean | null
          refunded_at?: string | null
          return_date: string
          return_reason: string
          return_reason_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          handled_by?: string | null
          id?: string
          items_returned?: Json | null
          order_id?: string
          refund_amount?: number | null
          refund_issued?: boolean | null
          refunded_at?: string | null
          return_date?: string
          return_reason?: string
          return_reason_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_returns_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_lines_report"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "order_returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_report"
            referencedColumns: ["order_uuid"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          is_payment_update: boolean | null
          new_payment_status: string | null
          new_status: string
          note: string | null
          old_payment_status: string | null
          old_status: string | null
          order_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          is_payment_update?: boolean | null
          new_payment_status?: string | null
          new_status: string
          note?: string | null
          old_payment_status?: string | null
          old_status?: string | null
          order_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          is_payment_update?: boolean | null
          new_payment_status?: string | null
          new_status?: string
          note?: string | null
          old_payment_status?: string | null
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
            referencedRelation: "order_lines_report"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_report"
            referencedColumns: ["order_uuid"]
          },
        ]
      }
      orders: {
        Row: {
          actual_delivery_date: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          coupon_id: string | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          delivered_at: string | null
          delivery_address: string
          delivery_city: string
          delivery_fee: number
          delivery_notes: string | null
          delivery_state: string
          discount: number | null
          discount_amount: number | null
          estimated_delivery_end: string | null
          estimated_delivery_start: string | null
          fulfillment_notes: string | null
          gift_message: string | null
          gift_wrapping: boolean | null
          id: string
          is_quiz_order: boolean | null
          landing_page: string | null
          order_number: string | null
          order_status: string | null
          packed_at: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          paystack_transaction_id: string | null
          quiz_answers: Json | null
          referral_code_used: string | null
          referrer: string | null
          refund_amount: number | null
          refunded_at: string | null
          return_reason: string | null
          returned_at: string | null
          service_fee: number
          shipped_at: string | null
          spend_discount_amount: number | null
          spend_discount_id: string | null
          spend_discount_percent: number | null
          subtotal: number
          total: number
          tracking_number: string | null
          traffic_source: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          coupon_id?: string | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          delivered_at?: string | null
          delivery_address: string
          delivery_city: string
          delivery_fee?: number
          delivery_notes?: string | null
          delivery_state: string
          discount?: number | null
          discount_amount?: number | null
          estimated_delivery_end?: string | null
          estimated_delivery_start?: string | null
          fulfillment_notes?: string | null
          gift_message?: string | null
          gift_wrapping?: boolean | null
          id?: string
          is_quiz_order?: boolean | null
          landing_page?: string | null
          order_number?: string | null
          order_status?: string | null
          packed_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          paystack_transaction_id?: string | null
          quiz_answers?: Json | null
          referral_code_used?: string | null
          referrer?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          return_reason?: string | null
          returned_at?: string | null
          service_fee?: number
          shipped_at?: string | null
          spend_discount_amount?: number | null
          spend_discount_id?: string | null
          spend_discount_percent?: number | null
          subtotal: number
          total: number
          tracking_number?: string | null
          traffic_source?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          coupon_id?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          delivered_at?: string | null
          delivery_address?: string
          delivery_city?: string
          delivery_fee?: number
          delivery_notes?: string | null
          delivery_state?: string
          discount?: number | null
          discount_amount?: number | null
          estimated_delivery_end?: string | null
          estimated_delivery_start?: string | null
          fulfillment_notes?: string | null
          gift_message?: string | null
          gift_wrapping?: boolean | null
          id?: string
          is_quiz_order?: boolean | null
          landing_page?: string | null
          order_number?: string | null
          order_status?: string | null
          packed_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          paystack_transaction_id?: string | null
          quiz_answers?: Json | null
          referral_code_used?: string | null
          referrer?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          return_reason?: string | null
          returned_at?: string | null
          service_fee?: number
          shipped_at?: string | null
          spend_discount_amount?: number | null
          spend_discount_id?: string | null
          spend_discount_percent?: number | null
          subtotal?: number
          total?: number
          tracking_number?: string | null
          traffic_source?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          created_at: string | null
          id: string
          page_title: string | null
          page_url: string
          referrer: string | null
          scroll_depth_percent: number | null
          session_id: string
          time_on_page_seconds: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          page_title?: string | null
          page_url: string
          referrer?: string | null
          scroll_depth_percent?: number | null
          session_id: string
          time_on_page_seconds?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          page_title?: string | null
          page_url?: string
          referrer?: string | null
          scroll_depth_percent?: number | null
          session_id?: string
          time_on_page_seconds?: number | null
        }
        Relationships: []
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
          normalised_value: string | null
          product_id: string
          tag_type: string
          tag_value: string
        }
        Insert: {
          id?: string
          normalised_value?: string | null
          product_id: string
          tag_type: string
          tag_value: string
        }
        Update: {
          id?: string
          normalised_value?: string | null
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
          category_label: string | null
          contents: string | null
          created_at: string | null
          deleted_at: string | null
          delivery_methods: string[] | null
          description: string
          display_order: number | null
          emoji: string | null
          first_baby: boolean | null
          gender_colors: Json | null
          gender_relevant: boolean | null
          hospital_types: string[] | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_push_gift_eligible: boolean | null
          material: string | null
          meta_description: string | null
          meta_title: string | null
          multiples_bump: number | null
          name: string
          og_image_url: string | null
          pack_count: string | null
          priority: string
          push_gift_categories: string[] | null
          quiz_priority: string | null
          rating: number | null
          review_count: number | null
          safety_info: string | null
          scheduled_for: string | null
          scopes: string[] | null
          sku: string | null
          slug: string
          stages: string[] | null
          subcategory: string | null
          updated_at: string | null
          why_included: string | null
          why_included_variants: Json | null
        }
        Insert: {
          allergen_info?: string | null
          badge?: string | null
          category: string
          category_label?: string | null
          contents?: string | null
          created_at?: string | null
          deleted_at?: string | null
          delivery_methods?: string[] | null
          description: string
          display_order?: number | null
          emoji?: string | null
          first_baby?: boolean | null
          gender_colors?: Json | null
          gender_relevant?: boolean | null
          hospital_types?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_push_gift_eligible?: boolean | null
          material?: string | null
          meta_description?: string | null
          meta_title?: string | null
          multiples_bump?: number | null
          name: string
          og_image_url?: string | null
          pack_count?: string | null
          priority: string
          push_gift_categories?: string[] | null
          quiz_priority?: string | null
          rating?: number | null
          review_count?: number | null
          safety_info?: string | null
          scheduled_for?: string | null
          scopes?: string[] | null
          sku?: string | null
          slug: string
          stages?: string[] | null
          subcategory?: string | null
          updated_at?: string | null
          why_included?: string | null
          why_included_variants?: Json | null
        }
        Update: {
          allergen_info?: string | null
          badge?: string | null
          category?: string
          category_label?: string | null
          contents?: string | null
          created_at?: string | null
          deleted_at?: string | null
          delivery_methods?: string[] | null
          description?: string
          display_order?: number | null
          emoji?: string | null
          first_baby?: boolean | null
          gender_colors?: Json | null
          gender_relevant?: boolean | null
          hospital_types?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_push_gift_eligible?: boolean | null
          material?: string | null
          meta_description?: string | null
          meta_title?: string | null
          multiples_bump?: number | null
          name?: string
          og_image_url?: string | null
          pack_count?: string | null
          priority?: string
          push_gift_categories?: string[] | null
          quiz_priority?: string | null
          rating?: number | null
          review_count?: number | null
          safety_info?: string | null
          scheduled_for?: string | null
          scopes?: string[] | null
          sku?: string | null
          slug?: string
          stages?: string[] | null
          subcategory?: string | null
          updated_at?: string | null
          why_included?: string | null
          why_included_variants?: Json | null
        }
        Relationships: []
      }
      quiz_adjustment_rules: {
        Row: {
          action: string
          action_value: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          rule_name: string
          target_product_slug: string
          trigger_operator: string | null
          trigger_step_id: string
          trigger_value: string
        }
        Insert: {
          action: string
          action_value?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_name: string
          target_product_slug: string
          trigger_operator?: string | null
          trigger_step_id: string
          trigger_value: string
        }
        Update: {
          action?: string
          action_value?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_name?: string
          target_product_slug?: string
          trigger_operator?: string | null
          trigger_step_id?: string
          trigger_value?: string
        }
        Relationships: []
      }
      quiz_customers: {
        Row: {
          baby_gender: string | null
          budget_tier: string | null
          created_at: string | null
          delivery_method: string | null
          has_purchased: boolean | null
          hospital_type: string | null
          id: string
          order_id: string | null
          page_url: string | null
          referral_source: string | null
          session_id: string | null
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          baby_gender?: string | null
          budget_tier?: string | null
          created_at?: string | null
          delivery_method?: string | null
          has_purchased?: boolean | null
          hospital_type?: string | null
          id?: string
          order_id?: string | null
          page_url?: string | null
          referral_source?: string | null
          session_id?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          baby_gender?: string | null
          budget_tier?: string | null
          created_at?: string | null
          delivery_method?: string | null
          has_purchased?: boolean | null
          hospital_type?: string | null
          id?: string
          order_id?: string | null
          page_url?: string | null
          referral_source?: string | null
          session_id?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_customers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_lines_report"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "quiz_customers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_customers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_report"
            referencedColumns: ["order_uuid"]
          },
        ]
      }
      quiz_options: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          option_description: string | null
          option_emoji: string | null
          option_label: string
          option_value: string
          price_modifier: number | null
          question_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          option_description?: string | null
          option_emoji?: string | null
          option_label: string
          option_value: string
          price_modifier?: number | null
          question_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          option_description?: string | null
          option_emoji?: string | null
          option_label?: string
          option_value?: string
          price_modifier?: number | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          applies_to_path: string[] | null
          created_at: string | null
          id: string
          input_type: string
          is_active: boolean | null
          is_skippable: boolean | null
          question_text: string
          step_id: string
          step_label: string
          step_order: number
          sub_text: string | null
          ui_config: Json | null
          updated_at: string | null
        }
        Insert: {
          applies_to_path?: string[] | null
          created_at?: string | null
          id?: string
          input_type?: string
          is_active?: boolean | null
          is_skippable?: boolean | null
          question_text: string
          step_id: string
          step_label: string
          step_order: number
          sub_text?: string | null
          ui_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          applies_to_path?: string[] | null
          created_at?: string | null
          id?: string
          input_type?: string
          is_active?: boolean | null
          is_skippable?: boolean | null
          question_text?: string
          step_id?: string
          step_label?: string
          step_order?: number
          sub_text?: string | null
          ui_config?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_routing_rules: {
        Row: {
          condition_answer: string | null
          condition_operator: string | null
          created_at: string | null
          from_step_id: string
          id: string
          is_active: boolean | null
          next_step_id: string
          priority: number | null
        }
        Insert: {
          condition_answer?: string | null
          condition_operator?: string | null
          created_at?: string | null
          from_step_id: string
          id?: string
          is_active?: boolean | null
          next_step_id: string
          priority?: number | null
        }
        Update: {
          condition_answer?: string | null
          condition_operator?: string | null
          created_at?: string | null
          from_step_id?: string
          id?: string
          is_active?: boolean | null
          next_step_id?: string
          priority?: number | null
        }
        Relationships: []
      }
      quiz_sessions: {
        Row: {
          answers: Json
          converted_to_order: boolean | null
          created_at: string | null
          current_step: string | null
          dad_purpose: string | null
          engine_version: string | null
          id: string
          is_completed: boolean | null
          order_id: string | null
          push_gift_category: string | null
          push_gift_timing: string | null
          result_bundle_slug: string | null
          result_product_count: number | null
          result_product_ids: string[] | null
          result_tier: string | null
          session_id: string
          shopper_type: string | null
          steps_completed: string[] | null
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          answers?: Json
          converted_to_order?: boolean | null
          created_at?: string | null
          current_step?: string | null
          dad_purpose?: string | null
          engine_version?: string | null
          id?: string
          is_completed?: boolean | null
          order_id?: string | null
          push_gift_category?: string | null
          push_gift_timing?: string | null
          result_bundle_slug?: string | null
          result_product_count?: number | null
          result_product_ids?: string[] | null
          result_tier?: string | null
          session_id: string
          shopper_type?: string | null
          steps_completed?: string[] | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          answers?: Json
          converted_to_order?: boolean | null
          created_at?: string | null
          current_step?: string | null
          dad_purpose?: string | null
          engine_version?: string | null
          id?: string
          is_completed?: boolean | null
          order_id?: string | null
          push_gift_category?: string | null
          push_gift_timing?: string | null
          result_bundle_slug?: string | null
          result_product_count?: number | null
          result_product_ids?: string[] | null
          result_tier?: string | null
          session_id?: string
          shopper_type?: string | null
          steps_completed?: string[] | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_sessions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_lines_report"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "quiz_sessions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_sessions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_report"
            referencedColumns: ["order_uuid"]
          },
        ]
      }
      quiz_target_counts: {
        Row: {
          budget_tier: string
          id: string
          is_active: boolean | null
          max_count: number
          min_count: number
          priority_order: string[] | null
          target_count: number
          updated_at: string | null
        }
        Insert: {
          budget_tier: string
          id?: string
          is_active?: boolean | null
          max_count: number
          min_count: number
          priority_order?: string[] | null
          target_count: number
          updated_at?: string | null
        }
        Update: {
          budget_tier?: string
          id?: string
          is_active?: boolean | null
          max_count?: number
          min_count?: number
          priority_order?: string[] | null
          target_count?: number
          updated_at?: string | null
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
            referencedRelation: "order_lines_report"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "referral_codes_referrer_order_id_fkey"
            columns: ["referrer_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_codes_referrer_order_id_fkey"
            columns: ["referrer_order_id"]
            isOneToOne: false
            referencedRelation: "orders_report"
            referencedColumns: ["order_uuid"]
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
            referencedRelation: "order_lines_report"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "referral_redemptions_referred_order_id_fkey"
            columns: ["referred_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_redemptions_referred_order_id_fkey"
            columns: ["referred_order_id"]
            isOneToOne: false
            referencedRelation: "orders_report"
            referencedColumns: ["order_uuid"]
          },
        ]
      }
      report_dimensions: {
        Row: {
          aggregation: string | null
          category: string
          data_type: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          is_dimension: boolean | null
          is_metric: boolean | null
          name: string
          source_column: string | null
          source_table: string | null
        }
        Insert: {
          aggregation?: string | null
          category: string
          data_type?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          is_dimension?: boolean | null
          is_metric?: boolean | null
          name: string
          source_column?: string | null
          source_table?: string | null
        }
        Update: {
          aggregation?: string | null
          category?: string
          data_type?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          is_dimension?: boolean | null
          is_metric?: boolean | null
          name?: string
          source_column?: string | null
          source_table?: string | null
        }
        Relationships: []
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
      sessions: {
        Row: {
          browser: string | null
          city: string | null
          conversion_order_id: string | null
          converted: boolean | null
          country: string | null
          created_at: string | null
          device_type: string | null
          duration_seconds: number | null
          event_count: number | null
          exit_page: string | null
          first_seen_at: string | null
          id: string
          is_bounce: boolean | null
          landing_page: string | null
          last_seen_at: string | null
          os: string | null
          page_count: number | null
          referrer: string | null
          session_id: string
          traffic_campaign: string | null
          traffic_medium: string | null
          traffic_source: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          conversion_order_id?: string | null
          converted?: boolean | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          event_count?: number | null
          exit_page?: string | null
          first_seen_at?: string | null
          id?: string
          is_bounce?: boolean | null
          landing_page?: string | null
          last_seen_at?: string | null
          os?: string | null
          page_count?: number | null
          referrer?: string | null
          session_id: string
          traffic_campaign?: string | null
          traffic_medium?: string | null
          traffic_source?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          conversion_order_id?: string | null
          converted?: boolean | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          event_count?: number | null
          exit_page?: string | null
          first_seen_at?: string | null
          id?: string
          is_bounce?: boolean | null
          landing_page?: string | null
          last_seen_at?: string | null
          os?: string | null
          page_count?: number | null
          referrer?: string | null
          session_id?: string
          traffic_campaign?: string | null
          traffic_medium?: string | null
          traffic_source?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_conversion_order_id_fkey"
            columns: ["conversion_order_id"]
            isOneToOne: false
            referencedRelation: "order_lines_report"
            referencedColumns: ["order_uuid"]
          },
          {
            foreignKeyName: "sessions_conversion_order_id_fkey"
            columns: ["conversion_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_conversion_order_id_fkey"
            columns: ["conversion_order_id"]
            isOneToOne: false
            referencedRelation: "orders_report"
            referencedColumns: ["order_uuid"]
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
      traffic_sources: {
        Row: {
          campaign: string | null
          channel_group: string | null
          created_at: string | null
          date: string
          id: string
          medium: string | null
          order_count: number | null
          revenue: number | null
          session_count: number | null
          source: string
        }
        Insert: {
          campaign?: string | null
          channel_group?: string | null
          created_at?: string | null
          date: string
          id?: string
          medium?: string | null
          order_count?: number | null
          revenue?: number | null
          session_count?: number | null
          source: string
        }
        Update: {
          campaign?: string | null
          channel_group?: string | null
          created_at?: string | null
          date?: string
          id?: string
          medium?: string | null
          order_count?: number | null
          revenue?: number | null
          session_count?: number | null
          source?: string
        }
        Relationships: []
      }
    }
    Views: {
      customer_report: {
        Row: {
          Acquisition_Channel: string | null
          Customer_ID: string | null
          Customer_Since: string | null
          Email: string | null
          First_Purchase_Date: string | null
          Last_Order_Date: string | null
          Phone: string | null
          Primary_Country: string | null
          Primary_Device: string | null
          State: string | null
          Total_Orders: number | null
          Total_Spent: number | null
        }
        Insert: {
          Acquisition_Channel?: never
          Customer_ID?: string | null
          Customer_Since?: string | null
          Email?: string | null
          First_Purchase_Date?: never
          Last_Order_Date?: string | null
          Phone?: string | null
          Primary_Country?: never
          Primary_Device?: never
          State?: string | null
          Total_Orders?: number | null
          Total_Spent?: number | null
        }
        Update: {
          Acquisition_Channel?: never
          Customer_ID?: string | null
          Customer_Since?: string | null
          Email?: string | null
          First_Purchase_Date?: never
          Last_Order_Date?: string | null
          Phone?: string | null
          Primary_Country?: never
          Primary_Device?: never
          State?: string | null
          Total_Orders?: number | null
          Total_Spent?: number | null
        }
        Relationships: []
      }
      order_lines_report: {
        Row: {
          Attributed_Channel: string | null
          Brand_Name: string | null
          Category: string | null
          COGS_Net_NGN: number | null
          Customer_Email: string | null
          Customer_ID: string | null
          Discount_NGN: number | null
          Gross_Sales_NGN: number | null
          Net_Sales_NGN: number | null
          New_vs_Returning: string | null
          Order_Date: string | null
          Order_ID: string | null
          order_item_uuid: string | null
          Order_Status: string | null
          order_uuid: string | null
          Payment_Method: string | null
          Payment_Status: string | null
          Product_Name: string | null
          Qty: number | null
          Returns_NGN: number | null
          Shipping_Alloc_NGN: number | null
          SKU: string | null
          State: string | null
          Tax_NGN: number | null
          Unit_Price_NGN: number | null
        }
        Relationships: []
      }
      order_lines_summary: {
        Row: {
          attributed_channel: string | null
          gross_profit: number | null
          product_category: string | null
          report_date: string | null
          total_cogs: number | null
          total_discounts: number | null
          total_gross_sales: number | null
          total_line_items: number | null
          total_net_sales: number | null
          total_returns: number | null
          total_shipping_alloc: number | null
          total_tax: number | null
          total_units: number | null
          unique_customers: number | null
        }
        Relationships: []
      }
      orders_report: {
        Row: {
          AOV_NGN: number | null
          Attributed_Channel: string | null
          COGS_Net_NGN: number | null
          Customer_Email: string | null
          Customer_ID: string | null
          Customer_Name: string | null
          Customer_Phone: string | null
          Delivery_Fee_NGN: number | null
          Discount_NGN: number | null
          Gift_Wrapping: boolean | null
          Gross_Margin_Pct: number | null
          Gross_Profit_NGN: number | null
          Gross_Sales_NGN: number | null
          Is_Quiz_Order: boolean | null
          Items: number | null
          Net_Sales_NGN: number | null
          New_vs_Returning: string | null
          Order_Date: string | null
          Order_Discount_NGN: number | null
          Order_ID: string | null
          Order_Status: string | null
          Order_Subtotal_NGN: number | null
          Order_Total_NGN: number | null
          order_uuid: string | null
          Payment_Method: string | null
          Payment_Status: string | null
          Refund_NGN: number | null
          Returns_NGN: number | null
          Service_Fee_NGN: number | null
          Shipping_NGN: number | null
          State: string | null
          Tax_NGN: number | null
          Total_Units: number | null
        }
        Relationships: []
      }
      orders_report_summary: {
        Row: {
          attributed_channel: string | null
          avg_order_value: number | null
          delivery_state: string | null
          gross_margin_pct: number | null
          payment_method: string | null
          report_date: string | null
          total_cogs: number | null
          total_discounts: number | null
          total_gross_profit: number | null
          total_gross_sales: number | null
          total_line_items: number | null
          total_net_sales: number | null
          total_orders: number | null
          total_returns: number | null
          total_shipping: number | null
          total_tax: number | null
          total_units: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_realtime_access: {
        Args: { channel_name: string }
        Returns: boolean
      }
      generate_invoice_from_order: {
        Args: { p_generated_by?: string; p_order_id: string }
        Returns: Json
      }
      generate_invoice_number: { Args: never; Returns: string }
      generate_order_number: { Args: never; Returns: string }
      generate_quiz_story: {
        Args: {
          p_budget_tier: string
          p_delivery_method?: string
          p_first_baby?: boolean
          p_gender: string
          p_gift_occasion?: string
          p_gift_relationship?: string
          p_gift_wrap?: boolean
          p_hospital_type?: string
          p_multiples?: number
          p_product_count?: number
          p_shopper_type: string
        }
        Returns: string
      }
      get_admin_orders: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_payment_status?: string
          p_search?: string
          p_status?: string
        }
        Returns: Json
      }
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
      is_admin: { Args: never; Returns: boolean }
      is_admin_user: { Args: never; Returns: boolean }
      is_sensitive_realtime_topic: { Args: { topic: string }; Returns: boolean }
      orders_paid_only_restricted: { Args: never; Returns: boolean }
      run_push_gift_recommendation: {
        Args: { p_budget_tier: string; p_category: string; p_timing: string }
        Returns: Json
      }
      run_quiz_recommendation: {
        Args: {
          p_budget_tier: string
          p_delivery_method: string
          p_first_baby?: boolean
          p_gender?: string
          p_gift_for?: string
          p_hospital_type: string
          p_multiples?: number
          p_scope: string
          p_shopper_type?: string
          p_stage: string
        }
        Returns: Json
      }
      set_session_context: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      validate_coupon: {
        Args: { coupon_code: string; order_amount: number }
        Returns: Json
      }
      validate_referral_code: {
        Args: { p_code: string }
        Returns: {
          code: string
          id: string
          is_active: boolean
        }[]
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
