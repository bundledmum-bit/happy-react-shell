import { useState, useMemo } from "react";
import { X, Search, ArrowLeftRight, Plus } from "lucide-react";
import { useAllProducts } from "@/hooks/useSupabaseData";
import { fmt } from "@/lib/cart";
import ProductImage from "@/components/ProductImage";
import type { Product } from "@/lib/supabaseAdapters";
import type { BundleItem } from "@/lib/supabaseAdapters";

interface Props {
  open: boolean;
  onClose: () => void;
  /** If swapping an existing item, pass the item being replaced */
  swappingItem?: BundleItem | null;
  /** "baby" | "mum" | "hospital" | "convenience" – filters relevant products */
  section: "baby" | "mum" | "hospital" | "convenience";
  /** Called when a product+brand is selected */
  onSelect: (item: BundleItem) => void;
  /** Items already in the bundle (to grey them out) */
  existingItemNames?: string[];
}

export default function BundleItemSwapPopup({ open, onClose, swappingItem, section, onSelect, existingItemNames = [] }: Props) {
  const { data: products, isLoading } = useAllProducts();
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    if (!products) return [];
    let list = products;
    // Filter by category matching section
    if (section === "convenience") {
      // Convenience Extras can be anything — no category filter.
    } else if (section === "hospital") {
      list = list.filter(p => p.subcategory === "delivery-consumables");
    } else if (section === "mum") {
      list = list.filter(p => p.category === "mum" && p.subcategory !== "delivery-consumables");
    } else {
      list = list.filter(p => p.category !== "mum");
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return list.slice(0, 50);
  }, [products, section, search]);

  if (!open) return null;

  const handleSelectProduct = (product: Product) => {
    if (product.brands.length <= 1) {
      // Auto-select first brand
      const brand = product.brands[0];
      onSelect({
        name: product.name,
        brand: brand?.label || "Standard",
        forWhom: section === "baby" ? "baby" : "mum",
        price: brand?.price || 0,
        emoji: product.baseImg,
        imageUrl: brand?.imageUrl || product.imageUrl || null,
      });
      onClose();
    } else {
      setSelectedProduct(product);
    }
  };

  const handleSelectBrand = (product: Product, brand: any) => {
    onSelect({
      name: product.name,
      brand: brand.label,
      forWhom: section === "baby" ? "baby" : "mum",
      price: brand.price,
      emoji: product.baseImg,
      imageUrl: brand.imageUrl || product.imageUrl || null,
    });
    setSelectedProduct(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
      <div
        className="relative bg-card rounded-t-[20px] sm:rounded-[20px] shadow-2xl w-full sm:max-w-[480px] max-h-[85vh] flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="pf text-lg font-bold">
              {swappingItem ? (
                <span className="flex items-center gap-2"><ArrowLeftRight className="h-4 w-4 text-coral" /> Swap: {swappingItem.name}</span>
              ) : (
                <span className="flex items-center gap-2"><Plus className="h-4 w-4 text-forest" /> Add Product</span>
              )}
            </h3>
            <p className="text-muted-foreground text-xs mt-0.5">
              {section === "mum" ? "For Mum" : section === "hospital" ? "Hospital Consumables" : section === "convenience" ? "Convenience Extras" : "For Baby"} · {swappingItem ? "Choose a replacement" : "Search & add any product"}
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center hover:bg-foreground/20">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
              autoFocus
            />
          </div>
        </div>

        {/* Brand selection sub-view */}
        {selectedProduct ? (
          <div className="flex-1 overflow-y-auto p-4">
            <button onClick={() => setSelectedProduct(null)} className="text-forest text-xs font-semibold mb-3 hover:underline">
              ← Back to products
            </button>
            <p className="text-sm font-semibold mb-3">Choose brand for {selectedProduct.name}:</p>
            <div className="space-y-2">
              {selectedProduct.brands.map(b => (
                <button
                  key={b.id}
                  onClick={() => handleSelectBrand(selectedProduct, b)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-forest hover:bg-forest-light transition-colors text-left"
                >
                  <ProductImage
                    imageUrl={b.imageUrl || selectedProduct.imageUrl}
                    emoji={selectedProduct.baseImg}
                    alt={b.label}
                    className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0"
                    emojiClassName="text-2xl"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{b.label}</p>
                    {b.sizeVariant && <p className="text-muted-foreground text-[11px]">{b.sizeVariant}</p>}
                  </div>
                  <span className="text-sm font-bold text-forest">{fmt(b.price)}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Product list */
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 border-3 border-border border-t-forest rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No products found</div>
            ) : (
              <div className="divide-y divide-border/40">
                {filtered.map(product => {
                  const isExisting = existingItemNames.includes(product.name);
                  const defaultBrand = product.brands[0];
                  const displayPrice = defaultBrand?.price || 0;
                  const displayImage = defaultBrand?.imageUrl || product.imageUrl;
                  return (
                    <button
                      key={product.id}
                      onClick={() => !isExisting && handleSelectProduct(product)}
                      disabled={isExisting}
                      className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left ${isExisting ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <ProductImage
                        imageUrl={displayImage}
                        emoji={product.baseImg}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted"
                        emojiClassName="text-2xl"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{product.name}</p>
                        <p className="text-muted-foreground text-[11px]">
                          {product.brands.length > 1 ? `${product.brands.length} brands` : defaultBrand?.label || "Standard"}
                          {isExisting && " · Already added"}
                        </p>
                      </div>
                      <span className="text-sm font-bold flex-shrink-0">{fmt(displayPrice)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
