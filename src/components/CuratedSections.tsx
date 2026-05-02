import { Link } from "react-router-dom";
import { useShopSections, useSectionProducts, useFallbackSectionProducts, type ShopVariant } from "@/hooks/useMerchandising";
import { fmt } from "@/lib/cart";
import ProductImage from "@/components/ProductImage";
import type { Product } from "@/lib/supabaseAdapters";

const TOP_LIMITS: Record<ShopVariant, number> = { all: 7, baby: 5, mum: 5 };

// Soft pastel rotation so adjacent sections look distinct without being stark.
// Uses brand tints where available, with safe Tailwind fallbacks.
const SECTION_BG_PALETTE = [
  "bg-warm-cream",
  "bg-coral-blush/70",
  "bg-mint/60",
  "bg-forest-light/70",
];

export default function CuratedSections({
  shop,
  onOpenDetail,
}: {
  shop: ShopVariant;
  onOpenDetail: (product: Product) => void;
}) {
  const { data: sections, isLoading } = useShopSections(shop);
  const limit = TOP_LIMITS[shop] ?? 7;
  const visible = (sections || []).slice(0, limit);

  if (isLoading) {
    return (
      <div className="space-y-8 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i}>
            <div className="h-5 w-48 bg-muted rounded mb-3 animate-pulse" />
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="w-[180px] md:w-[220px] h-[260px] bg-card rounded-card animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!visible.length) return null;

  return (
    <div className="space-y-5 md:space-y-6 mb-10">
      {visible.map((section, idx) => (
        <CuratedSection
          key={section.id}
          shop={shop}
          slug={section.category_slug}
          label={section.section_label || section.category?.name || section.category_slug}
          icon={section.category?.icon || null}
          bgClass={SECTION_BG_PALETTE[idx % SECTION_BG_PALETTE.length]}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </div>
  );
}

function CuratedSection({
  shop,
  slug,
  label,
  icon,
  bgClass,
  onOpenDetail,
}: {
  shop: ShopVariant;
  slug: string;
  label: string;
  icon: string | null;
  bgClass: string;
  onOpenDetail: (product: Product) => void;
}) {
  const { data: curated, isLoading: curatedLoading } = useSectionProducts(shop, slug);
  const needsFallback = !curatedLoading && (!curated || curated.length === 0);
  const { data: fallback, isLoading: fallbackLoading } = useFallbackSectionProducts(needsFallback ? slug : "");
  const products = (curated && curated.length > 0 ? curated : fallback) || [];
  const loading = curatedLoading || (needsFallback && fallbackLoading);

  if (loading) {
    return (
      <section className={`${bgClass} rounded-2xl shadow-sm p-4 md:p-6`}>
        <div className="h-5 w-48 bg-muted rounded mb-3 animate-pulse" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map(j => (
            <div key={j} className="w-[180px] md:w-[220px] h-[260px] bg-card rounded-card animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!products.length) return null;

  return (
    <section className={`${bgClass} rounded-2xl shadow-sm p-4 md:p-6`}>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="pf text-base md:text-lg font-bold flex items-center gap-2">
          {icon && <span>{icon}</span>}
          <span>{label}</span>
        </h2>
        <Link to={`/shop/${slug}`} className="text-xs md:text-sm text-forest font-semibold hover:underline whitespace-nowrap">
          See all →
        </Link>
      </div>
      <div className="flex gap-3 snap-x snap-mandatory overflow-x-auto pb-2 -mx-4 md:-mx-6 px-4 md:px-6 scroll-pl-4 md:scroll-pl-6 scrollbar-hide">
        {products.map(p => (
          <CuratedCard key={p.id} product={p} onOpenDetail={() => onOpenDetail(p)} />
        ))}
      </div>
    </section>
  );
}

function CuratedCard({ product, onOpenDetail }: { product: Product; onOpenDetail: () => void }) {
  // Use cheapest in-stock brand as the surface price, then default brand.
  const brands = product.brands.slice().sort((a, b) => a.tier - b.tier);
  const inStock = brands.filter(b => b.inStock !== false);
  const surfaceBrand = inStock[0] || brands[0];
  const minPrice = brands.length > 0 ? Math.min(...brands.map(b => b.price)) : surfaceBrand?.price || 0;
  const showFrom = brands.length > 1;
  const image = surfaceBrand?.imageUrl || product.imageUrl || null;
  const showSale = surfaceBrand?.compareAtPrice && surfaceBrand.compareAtPrice > surfaceBrand.price;
  const isOutOfStock = brands.every(b => b.inStock === false);

  const handleChoose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    onOpenDetail();
  };

  return (
    <div className={`snap-start shrink-0 w-[180px] md:w-[220px] bg-card rounded-card shadow-card overflow-hidden flex flex-col ${isOutOfStock ? "opacity-60" : ""}`}>
      <button type="button" onClick={onOpenDetail} className="block w-full text-left">
        <div className="relative aspect-square w-full bg-[#f5f5f5] flex items-center justify-center overflow-hidden">
          {showSale && (
            <span className="absolute top-1.5 right-1.5 bg-destructive text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-pill z-10">
              Sale
            </span>
          )}
          <ProductImage
            imageUrl={image}
            emoji={surfaceBrand?.img || product.baseImg}
            alt={product.name}
            className="w-full h-full"
            emojiClassName="text-5xl"
          />
        </div>
      </button>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <div className="text-[13px] font-semibold leading-tight line-clamp-2 cursor-pointer min-h-[34px]" onClick={onOpenDetail}>
          {product.name}
        </div>
        <div className="flex items-baseline gap-1.5 mt-auto">
          <span className="text-[15px] font-bold text-forest">
            {showFrom ? `from ${fmt(minPrice)}` : fmt(surfaceBrand?.price || 0)}
          </span>
        </div>
        <button
          onClick={handleChoose}
          disabled={isOutOfStock}
          className="mt-1.5 w-full rounded-pill text-primary-foreground text-xs font-semibold py-2 min-h-[36px] disabled:cursor-not-allowed"
          style={{ backgroundColor: isOutOfStock ? "#bbb" : "#F4845F" }}
        >
          {isOutOfStock ? "Sold Out" : "Choose Brand"}
        </button>
      </div>
    </div>
  );
}
