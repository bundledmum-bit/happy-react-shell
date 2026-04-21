import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductImage from "@/components/ProductImage";
import { fmt } from "@/lib/cart";
import { getRecentlyViewed } from "@/hooks/useRecentlyViewed";

interface Props { title?: string | null }

export default function RecentlyViewedStrip({ title }: Props) {
  // Track the ids in local state so we can re-render when the custom
  // "bm-recently-viewed-changed" event fires (from addRecentlyViewed).
  const [ids, setIds] = useState<string[]>(() => getRecentlyViewed());
  useEffect(() => {
    const h = () => setIds(getRecentlyViewed());
    window.addEventListener("bm-recently-viewed-changed", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("bm-recently-viewed-changed", h);
      window.removeEventListener("storage", h);
    };
  }, []);

  const { data: products } = useQuery({
    queryKey: ["recently-viewed-products", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("products")
        .select("id, name, slug, brands(id, price, brand_name, image_url, thumbnail_url)")
        .in("id", ids);
      if (error) throw error;
      return (data || []) as any[];
    },
    staleTime: 60_000,
  });

  // Preserve the LRU order from localStorage
  const ordered = useMemo(() => {
    if (!products) return [];
    const map = new Map<string, any>();
    products.forEach(p => map.set(p.id, p));
    return ids.map(id => map.get(id)).filter(Boolean);
  }, [products, ids]);

  if (ordered.length === 0) return null;

  return (
    <section className="px-4 md:px-10 py-6 md:py-8">
      <div className="max-w-[1200px] mx-auto">
        <h2 className="pf text-lg md:text-xl font-bold mb-3">{title || "Recently Viewed"}</h2>
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 md:mx-0 px-4 md:px-0 scrollbar-none">
          {ordered.map((p: any) => {
            const brand = (p.brands || [])[0];
            const cheapest = (p.brands || []).length > 0
              ? Math.min(...p.brands.map((b: any) => Number(b.price) || 0).filter(Boolean))
              : 0;
            return (
              <Link
                key={p.id}
                to={`/shop?q=${encodeURIComponent(p.name)}`}
                className="snap-start flex-shrink-0 w-[120px] bg-card rounded-card shadow-card overflow-hidden"
              >
                <div className="aspect-square bg-warm-cream">
                  <ProductImage
                    imageUrl={brand?.image_url || brand?.thumbnail_url || null}
                    emoji="📦"
                    alt={p.name}
                    className="w-full h-full"
                    emojiClassName="text-2xl"
                  />
                </div>
                <div className="p-2">
                  <div className="text-[11px] font-semibold line-clamp-2 leading-tight">{p.name}</div>
                  {cheapest > 0 && <div className="text-forest font-bold text-xs mt-0.5 tabular-nums">{fmt(cheapest)}</div>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
