/**
 * Helpers for the pack-based brand attributes (weight_range_kg,
 * pack_count, diaper_type, sku). Per-unit price calculations were
 * removed by product direction — only context badges remain.
 */
import type { Brand } from "@/lib/supabaseAdapters";

/** Pill badges to render under a product name on cards (Type / pack / weight). */
export function diaperBadges(brand: Pick<Brand, "diaperType" | "packCount" | "weightRangeKg">): string[] {
  const out: string[] = [];
  if (brand.diaperType) out.push(brand.diaperType);
  if (brand.packCount && brand.packCount > 0) out.push(`${brand.packCount} in pack`);
  if (brand.weightRangeKg) out.push(brand.weightRangeKg);
  return out;
}

/** "(106pcs)" microtext beside the brand label in the brand selector,
 *  or null when the brand has no pack count. Always 'pcs' regardless
 *  of diaper_type — keep it neutral and short. */
export function packCountLabel(brand: Pick<Brand, "packCount">): string | null {
  if (!brand.packCount || brand.packCount <= 0) return null;
  return `(${brand.packCount}pcs)`;
}
