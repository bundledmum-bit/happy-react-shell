/**
 * Adapters to transform Supabase query results into the existing
 * component-friendly types used throughout the storefront.
 */

// ─── Legacy types used by components ───────────────────────────

export interface Brand {
  id: string;
  label: string;
  price: number;
  img: string;
  tier: number;
  color: string;
}

export interface Product {
  id: string;
  name: string;
  baseImg: string;
  rating: number;
  reviews: number;
  tags: string[];
  badge: string | null;
  brands: Brand[];
  category: "baby" | "mum";
  stage: string[];
  priority: "essential" | "recommended" | "nice-to-have";
  tier: string[];
  hospitalType: string[];
  deliveryMethod: string[];
  genderRelevant: boolean;
  genderColors?: { boy: string; girl: string; neutral: string };
  multiplesBump: number;
  scope: string[];
  firstBaby: boolean | null;
  description: string;
  whyIncluded: string | Record<string, string>;
  sizes?: string[];
  contents?: string[];
  material?: string;
  allergenInfo?: string;
  packInfo?: string;
  stock?: number;
  slug?: string;
}

export interface BundleItem {
  name: string;
  brand: string;
  forWhom: "baby" | "mum";
  price: number;
  emoji?: string;
}

export interface Bundle {
  id: string;
  name: string;
  price: number;
  separateTotal: number;
  icon: string;
  color: string;
  lightColor: string;
  tagline: string;
  badge?: string;
  tier: "Basic" | "Premium";
  hospitalType: "public" | "private" | "gift";
  deliveryType?: "vaginal" | "csection";
  babyItems: BundleItem[];
  mumItems: BundleItem[];
}

// ─── Tier mapping ──────────────────────────────────────────────

const TIER_MAP: Record<string, number> = { starter: 0, standard: 1, premium: 2 };
const TIER_COLORS: Record<string, string> = {
  starter: "#E3F2FD",
  standard: "#E8F5E9",
  premium: "#FCE4EC",
};

// ─── Product adapter ───────────────────────────────────────────

export function adaptProduct(row: any): Product {
  const tags = (row.product_tags || []) as any[];
  const tierTags = tags.filter((t: any) => t.tag_type === "tier").map((t: any) => t.tag_value);
  const hospitalTags = tags.filter((t: any) => t.tag_type === "hospital_type").map((t: any) => t.tag_value);
  const deliveryTags = tags.filter((t: any) => t.tag_type === "delivery_method").map((t: any) => t.tag_value);
  const scopeTags = tags.filter((t: any) => t.tag_type === "scope").map((t: any) => t.tag_value);
  const stageTags = tags.filter((t: any) => t.tag_type === "stage").map((t: any) => t.tag_value);

  const brands: Brand[] = ((row.brands || []) as any[])
    .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
    .map((b: any) => ({
      id: b.id,
      label: b.brand_name,
      price: b.price,
      img: row.emoji || "📦",
      tier: TIER_MAP[b.tier] ?? 1,
      color: TIER_COLORS[b.tier] || "#E8F5E9",
    }));

  const sizes = ((row.product_sizes || []) as any[])
    .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
    .map((s: any) => s.size_label);

  const genderColors = row.gender_colors as any;

  const contentsArr = row.contents
    ? row.contents.split(",").map((c: string) => c.trim()).filter(Boolean)
    : undefined;

  return {
    id: row.id,
    name: row.name,
    baseImg: row.emoji || "📦",
    rating: Number(row.rating) || 4.5,
    reviews: row.review_count || 0,
    tags: tags.map((t: any) => `${t.tag_type}:${t.tag_value}`),
    badge: row.badge || null,
    brands,
    category: row.category as "baby" | "mum",
    stage: stageTags.length ? stageTags : ["expecting", "newborn", "0-3m"],
    priority: row.priority as any,
    tier: tierTags,
    hospitalType: hospitalTags.length ? hospitalTags : ["both"],
    deliveryMethod: deliveryTags.length ? deliveryTags : ["both"],
    genderRelevant: row.gender_relevant || false,
    genderColors: genderColors || undefined,
    multiplesBump: Number(row.multiples_bump) || 1,
    scope: scopeTags.length ? scopeTags : ["hospital-bag", "general-baby-prep"],
    firstBaby: row.first_baby,
    description: row.description || "",
    whyIncluded: row.why_included_variants || row.why_included || "",
    sizes: sizes.length ? sizes : undefined,
    contents: contentsArr,
    material: row.material || undefined,
    allergenInfo: row.allergen_info || undefined,
    packInfo: row.pack_count || undefined,
    stock: undefined, // managed via brands.in_stock in future
    slug: row.slug,
  };
}

export function adaptProducts(rows: any[]): Product[] {
  return (rows || []).map(adaptProduct);
}

// ─── Bundle adapter ────────────────────────────────────────────

const HOSPITAL_COLORS: Record<string, { color: string; light: string }> = {
  public: { color: "#1565C0", light: "#E3F2FD" },
  private: { color: "#880E4F", light: "#FCE4EC" },
  gift: { color: "#C62828", light: "#FFEBEE" },
};

export function adaptBundle(row: any): Bundle {
  const items = ((row.bundle_items || []) as any[])
    .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));

  const babyItems: BundleItem[] = [];
  const mumItems: BundleItem[] = [];

  items.forEach((bi: any) => {
    const prod = bi.products;
    const brand = bi.brands;
    const item: BundleItem = {
      name: prod?.name || "Unknown",
      brand: brand?.brand_name || "Standard",
      forWhom: (prod?.category === "mum" ? "mum" : "baby") as "baby" | "mum",
      price: brand?.price || 0,
      emoji: prod?.emoji || "📦",
    };
    if (item.forWhom === "mum") mumItems.push(item);
    else babyItems.push(item);
  });

  const separateTotal = [...babyItems, ...mumItems].reduce((s, i) => s + i.price, 0);
  const colors = HOSPITAL_COLORS[row.hospital_type] || HOSPITAL_COLORS.public;

  return {
    id: row.slug || row.id,
    name: row.name,
    price: row.price,
    separateTotal: separateTotal || Math.round(row.price * 1.2),
    icon: row.emoji || "📦",
    color: colors.color,
    lightColor: colors.light,
    tagline: row.description || "",
    tier: row.tier === "premium" ? "Premium" : "Basic",
    hospitalType: row.hospital_type as any,
    deliveryType: row.delivery_method as any || undefined,
    babyItems,
    mumItems,
  };
}

export function adaptBundles(rows: any[]): Bundle[] {
  return (rows || []).map(adaptBundle);
}

// ─── Browser ID ────────────────────────────────────────────────

export function getBrowserId(): string {
  const KEY = "bm-browser-id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function getSessionId(): string {
  let sid = sessionStorage.getItem("bm-session-id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("bm-session-id", sid);
  }
  return sid;
}
