import { useState } from "react";
import { Link } from "react-router-dom";
import { bundles } from "@/data/bundles";
import { useCart, fmt } from "@/lib/cart";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function BundlesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20" style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1A4A33 100%)" }}>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display font-black text-3xl md:text-5xl text-primary-foreground mb-3">Hospital Bag Bundles</h1>
          <p className="font-body text-primary-foreground/70 max-w-lg mx-auto">Every bundle is packed, sealed, and ready to go — just order and relax.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          {bundles.map(b => <BundleCard key={b.id} bundle={b} />)}
        </div>
      </div>
    </div>
  );
}

function BundleCard({ bundle: b }: { bundle: typeof bundles[0] }) {
  const [expanded, setExpanded] = useState(false);
  const { addToCart } = useCart();
  const totalItems = b.babyItems.length + b.mumItems.length;

  return (
    <div className="bg-card rounded-card shadow-card hover:shadow-card-hover interactive p-6 border-l-4" style={{ borderLeftColor: b.color }}>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-2xl">{b.icon}</span>
        <span className="rounded-pill px-3 py-0.5 text-xs font-bold" style={{ background: b.lightColor, color: b.color }}>{b.tier}</span>
        {b.badge && <span className="bg-coral-blush text-coral rounded-pill px-3 py-0.5 text-xs font-bold">{b.badge}</span>}
      </div>
      <h3 className="font-display font-bold text-lg mb-1">{b.name}</h3>
      <p className="font-body text-muted-foreground text-sm mb-3">{b.tagline}</p>
      <p className="font-display font-black text-2xl text-coral mb-4">{fmt(b.price)}</p>

      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-sm text-forest font-body font-bold mb-3">
        View all {totalItems} items {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="mb-4 space-y-3 animate-fade-in">
          <div>
            <p className="font-display font-bold text-xs uppercase text-muted-foreground mb-1">For Baby 👶</p>
            <ul className="space-y-1">
              {b.babyItems.map((item, i) => (
                <li key={i} className="font-body text-sm flex justify-between">
                  <span>{item.name}</span>
                  <span className="text-muted-foreground text-xs">{item.brand}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-display font-bold text-xs uppercase text-muted-foreground mb-1">For Mum 💛</p>
            <ul className="space-y-1">
              {b.mumItems.map((item, i) => (
                <li key={i} className="font-body text-sm flex justify-between">
                  <span>{item.name}</span>
                  <span className="text-muted-foreground text-xs">{item.brand}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => {
            addToCart({ id: b.id, name: b.name, brand: b.tier, price: b.price, emoji: b.icon, category: "bundle" });
            toast.success("✓ Added to cart");
          }}
          className="flex-1 rounded-pill bg-forest py-2.5 text-sm font-display font-bold text-primary-foreground hover:bg-forest-deep interactive"
        >
          Add to Cart 🛍️
        </button>
        <Link to="/quiz" className="rounded-pill border border-forest text-forest px-5 py-2.5 text-sm font-display font-bold hover:bg-forest/5 interactive">
          Customise Bundle
        </Link>
      </div>
    </div>
  );
}
