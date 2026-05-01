/**
 * Helpers for the diaper-style brand attributes (weight_range_kg,
 * pack_count, diaper_type, sku). Reusable across ShopPage,
 * ProductPage, ProductDetailDrawer, and the brand picker.
 */
import type { Brand } from "@/lib/supabaseAdapters";

/** "₦122/nappy" — chooses unit by diaper_type. Returns null when there's no pack count. */
export function pricePerUnitLabel(brand: Pick<Brand, "price" | "packCount" | "diaperType">): string | null {
  if (!brand.packCount || brand.packCount <= 0) return null;
  const per = Math.round(Number(brand.price) / brand.packCount);
  if (!isFinite(per)) return null;
  const unit = brand.diaperType === "Pant" ? "pant"
    : brand.diaperType === "Underlay" ? "sheet"
    : "nappy";
  return `₦${per.toLocaleString("en-NG")}/${unit}`;
}

/** Numeric price-per-unit, used for sort comparators. Falls back to brand.price. */
export function pricePerUnit(brand: Pick<Brand, "price" | "packCount">): number {
  if (!brand.packCount || brand.packCount <= 0) return Number(brand.price) || 0;
  return Number(brand.price) / brand.packCount;
}

/** Pill badges to render under a product name on cards (Type / pack / weight). */
export function diaperBadges(brand: Pick<Brand, "diaperType" | "packCount" | "weightRangeKg">): string[] {
  const out: string[] = [];
  if (brand.diaperType) out.push(brand.diaperType);
  if (brand.packCount && brand.packCount > 0) out.push(`${brand.packCount} in pack`);
  if (brand.weightRangeKg) out.push(brand.weightRangeKg);
  return out;
}
