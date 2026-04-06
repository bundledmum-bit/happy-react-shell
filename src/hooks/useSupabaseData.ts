import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adaptProducts, adaptBundles, adaptBundle, getBrowserId, getSessionId, type Product, type Bundle } from "@/lib/supabaseAdapters";

const STALE_5MIN = 5 * 60 * 1000;

export function useProducts(category?: string) {
  return useQuery({
    queryKey: ["products", category],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, brands(*), product_sizes(*), product_colors(*), product_tags(*)")
        .eq("is_active", true)
        .order("display_order");

      if (category && category !== "all") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return adaptProducts(data);
    },
    staleTime: STALE_5MIN,
  });
}

export function useAllProducts() {
  return useQuery({
    queryKey: ["products", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, brands(*), product_sizes(*), product_colors(*), product_tags(*)")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return adaptProducts(data);
    },
    staleTime: STALE_5MIN,
  });
}

export function useBundles() {
  return useQuery({
    queryKey: ["bundles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bundles")
        .select("*, bundle_items(*, products(*), brands(*))")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return adaptBundles(data);
    },
    staleTime: STALE_5MIN,
  });
}

export function useBundle(slug: string) {
  return useQuery({
    queryKey: ["bundle", slug],
    queryFn: async () => {
      // Try slug first, then id
      let { data, error } = await supabase
        .from("bundles")
        .select("*, bundle_items(*, products(*, brands(*), product_sizes(*), product_colors(*)), brands(*))")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (!data) {
        const res = await supabase
          .from("bundles")
          .select("*, bundle_items(*, products(*, brands(*), product_sizes(*), product_colors(*)), brands(*))")
          .eq("id", slug)
          .eq("is_active", true)
          .maybeSingle();
        data = res.data;
        error = res.error;
      }

      if (error) throw error;
      if (!data) return null;
      return adaptBundle(data);
    },
    staleTime: STALE_5MIN,
    enabled: !!slug,
  });
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");
      if (error) throw error;
      const map: Record<string, any> = {};
      data?.forEach((row: any) => {
        map[row.key] = row.value;
      });
      return map;
    },
    staleTime: STALE_5MIN,
  });
}

export function useTestimonials(featuredOnly = false) {
  return useQuery({
    queryKey: ["testimonials", featuredOnly],
    queryFn: async () => {
      let query = supabase
        .from("testimonials")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (featuredOnly) query = query.eq("is_featured", true);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: STALE_5MIN,
  });
}

export function useDeliverySettings() {
  return useQuery({
    queryKey: ["delivery_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_settings")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    staleTime: STALE_5MIN,
  });
}

export function useFaqItems() {
  return useQuery({
    queryKey: ["faq_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faq_items")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    staleTime: STALE_5MIN,
  });
}

export function useBlogPosts() {
  return useQuery({
    queryKey: ["blog_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: STALE_5MIN,
  });
}

export function useReferralCode(code: string) {
  return useQuery({
    queryKey: ["referral_code", code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!code,
  });
}

// Analytics event tracking
export async function trackEvent(eventType: string, eventData?: Record<string, any>) {
  try {
    await supabase.from("analytics_events").insert({
      event_type: eventType,
      event_data: eventData || {},
      session_id: getSessionId(),
      page_url: window.location.pathname,
      referral_source: new URLSearchParams(window.location.search).get("ref") || undefined,
    });
  } catch (e) {
    console.error("Analytics tracking failed:", e);
  }
}

// Re-export types for convenience
export type { Product, Bundle };
