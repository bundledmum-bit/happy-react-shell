import { Link } from "react-router-dom";
import { useCart, fmt } from "@/lib/cart";
import { bundles } from "@/data/bundles";
import logoWhite from "@/assets/logos/BM-LOGO-WHITE.svg";
import { toast } from "sonner";

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1E5C44 55%, #1A4A33 100%)" }}>
      {/* Decorative circles */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary-foreground/[0.03]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-coral/[0.07]" />

      <div className="container mx-auto px-4 pt-24 pb-16 md:pt-32">
        <div className="grid gap-10 md:grid-cols-2 items-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-pill bg-coral/20 px-4 py-1.5 text-sm font-body font-bold text-coral mb-6">
              🎉 Nigeria's #1 Hospital Bag Curator
            </span>
            <img src={logoWhite} alt="BundledMum" className="h-14 md:h-[70px] mb-6" />
            <h1 className="font-display font-black text-3xl md:text-[50px] md:leading-tight text-primary-foreground mb-4">
              Your Hospital Bag,<br />
              <em className="text-coral not-italic">Perfectly Bundled.</em>
            </h1>
            <p className="font-body text-primary-foreground/70 text-base md:text-[17px] max-w-md mb-8 leading-relaxed">
              Take our 60-second quiz — we'll curate the exact items for your budget and your baby. No overwhelm. No guesswork.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <Link to="/quiz" className="rounded-pill bg-coral px-7 py-3 font-display font-bold text-primary-foreground hover:bg-coral-dark interactive">
                Build My Bundle →
              </Link>
              <Link to="/shop" className="rounded-pill border-2 border-primary-foreground/40 px-7 py-3 font-display font-bold text-primary-foreground hover:bg-primary-foreground/10 interactive">
                Browse All Products
              </Link>
            </div>
            <div className="flex gap-8 pt-6 border-t border-primary-foreground/10">
              {[
                { val: "200+", label: "Mums Served" },
                { val: "4.9★", label: "Average Rating" },
                { val: "48hr", label: "Lagos Delivery" },
              ].map(s => (
                <div key={s.label}>
                  <div className="font-display font-black text-xl text-primary-foreground">{s.val}</div>
                  <div className="font-body text-xs text-primary-foreground/50">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:block animate-float">
            <HeroCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroCard() {
  const { addToCart } = useCart();
  const featured = bundles.slice(0, 4);

  const handleAddKit = () => {
    const kit = bundles[0];
    kit.babyItems.concat(kit.mumItems).forEach(item => {
      addToCart({ id: kit.id, name: kit.name, brand: "Full Kit", price: kit.price, emoji: kit.icon, category: "bundle" });
    });
    toast.success("✓ Your full kit has been added to cart!");
  };

  return (
    <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-card border border-primary-foreground/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-primary-foreground text-lg">Pre-Packed Hospital Bags</h3>
        <span className="bg-coral/20 text-coral rounded-pill px-3 py-1 text-xs font-bold">{bundles.length} Bundles</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {featured.map(b => (
          <div key={b.id} className="bg-primary-foreground/10 rounded-lg p-3 text-center">
            <span className="text-2xl">{b.icon}</span>
            <p className="font-body text-xs text-primary-foreground/80 mt-1 truncate">{b.name.split("·")[1]?.trim()}</p>
            <p className="font-display font-bold text-coral text-sm">{fmt(b.price)}</p>
          </div>
        ))}
      </div>
      <div className="bg-primary-foreground/5 rounded-lg p-3 mb-4">
        <p className="font-body text-xs text-primary-foreground/60 mb-2">Standard Starter Kit includes:</p>
        <div className="flex flex-wrap gap-1.5">
          {["🧷", "🧴", "👶", "👕", "🧤", "👗"].map((e, i) => (
            <span key={i} className="bg-primary-foreground/10 rounded-full w-8 h-8 flex items-center justify-center text-sm">{e}</span>
          ))}
        </div>
      </div>
      <button
        onClick={handleAddKit}
        className="w-full rounded-pill bg-coral py-2.5 font-display font-bold text-sm text-primary-foreground hover:bg-coral-dark interactive"
      >
        Add Full Kit 🛍️
      </button>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { icon: "🧩", title: "Take the Quiz", desc: "Answer 4 quick questions about your budget and birth plan" },
    { icon: "📦", title: "We Bundle It", desc: "We curate the exact brands and quantities you need" },
    { icon: "🚚", title: "We Deliver", desc: "To your door in Lagos within 48 hours" },
  ];
  return (
    <section className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4">
        <h2 className="font-display font-black text-2xl md:text-4xl text-center text-foreground mb-12">How It Works</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="text-center animate-fade-up" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mint text-3xl">{s.icon}</div>
              <h3 className="font-display font-bold text-lg mb-2">{s.title}</h3>
              <p className="font-body text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BundleShowcase() {
  const { addToCart } = useCart();
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="font-display font-black text-2xl md:text-4xl text-center text-forest mb-3">Choose Your Bundle</h2>
        <p className="font-body text-muted-foreground text-center mb-12 max-w-lg mx-auto">Every bundle is packed, sealed, and ready to go — just order and relax.</p>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {bundles.slice(0, 6).map(b => (
            <div key={b.id} className="bg-card rounded-card shadow-card hover:shadow-card-hover interactive p-5 border-l-4" style={{ borderLeftColor: b.color }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{b.icon}</span>
                <span className="rounded-pill px-2 py-0.5 text-xs font-bold" style={{ background: b.lightColor, color: b.color }}>{b.tier}</span>
                {b.badge && <span className="bg-coral-blush text-coral rounded-pill px-2 py-0.5 text-xs font-bold">{b.badge}</span>}
              </div>
              <h3 className="font-display font-bold text-base mb-1">{b.name}</h3>
              <p className="font-body text-muted-foreground text-xs mb-3">{b.tagline}</p>
              <p className="font-display font-black text-xl text-coral mb-3">{fmt(b.price)}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    addToCart({ id: b.id, name: b.name, brand: b.tier, price: b.price, emoji: b.icon, category: "bundle" });
                    toast.success("✓ Added to cart");
                  }}
                  className="flex-1 rounded-pill bg-forest py-2 text-sm font-display font-bold text-primary-foreground hover:bg-forest-deep interactive"
                >
                  Add to Cart 🛍️
                </button>
                <Link to="/quiz" className="rounded-pill border border-forest text-forest px-4 py-2 text-sm font-display font-bold hover:bg-forest/5 interactive">
                  Customise
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/bundles" className="font-display font-bold text-coral hover:text-coral-dark interactive inline-block">
            View All Bundles →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { quote: "I was so overwhelmed until I found BundledMum. Everything was perfectly packed, down to the nipple cream. 10/10.", name: "Adaeze N., Lagos", sub: "First-time mum, private hospital" },
    { quote: "The C-Section bundle was exactly what I needed. The high-waist underwear alone was worth it!", name: "Funmi O., Abuja", sub: "Second baby, public hospital" },
    { quote: "Ordered the premium gift for my sister. She cried! The gift box was gorgeous.", name: "Titi A., Port Harcourt", sub: "Baby shower gift" },
  ];
  return (
    <section className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4">
        <h2 className="font-display font-black text-2xl md:text-4xl text-center text-foreground mb-12">What Mums Say</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <div key={i} className="bg-card rounded-card shadow-card p-6 border border-border animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="text-coral text-sm mb-3">⭐⭐⭐⭐⭐</div>
              <p className="font-body text-sm text-foreground/80 mb-4 italic leading-relaxed">"{t.quote}"</p>
              <p className="font-display font-bold text-sm">{t.name}</p>
              <p className="font-body text-xs text-muted-foreground">{t.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <BundleShowcase />
      <Testimonials />
    </>
  );
}
