import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProductImages(productId?: string) {
  return useQuery({
    queryKey: ["product-images", productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("display_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllProductImages() {
  return useQuery({
    queryKey: ["product-images-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .order("display_order");
      if (error) throw error;
      // Group by product_id
      const map: Record<string, any[]> = {};
      (data || []).forEach((img: any) => {
        if (!map[img.product_id]) map[img.product_id] = [];
        map[img.product_id].push(img);
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function getPrimaryImage(images: any[]): string | null {
  if (!images?.length) return null;
  const primary = images.find((img: any) => img.is_primary);
  return (primary || images[0])?.image_url || null;
}

export function getThumbnail(images: any[]): string | null {
  if (!images?.length) return null;
  const primary = images.find((img: any) => img.is_primary);
  return (primary || images[0])?.thumbnail_url || (primary || images[0])?.image_url || null;
}
