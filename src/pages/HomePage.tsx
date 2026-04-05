import { Link } from "react-router-dom";
import { useCart, fmt, getBrandForBudget } from "@/lib/cart";
import { PRODUCTS, HERO_KIT, TESTIMONIALS } from "@/data/products";
import { bundles } from "@/data/bundles";
import { toast } from "sonner";
import logoWhite from "@/assets/logos/BM-LOGO-WHITE.svg";
import { useEffect, useState } from "react";

function HeroSection() {
  const { addToCart } = useCart();

  const handleAddKit = () => {
    HERO_KIT.forEach(item => {
      addToCart({ ...item, brands: [{ id: "default", label: item.name, price: item.price, img: item.img, tier: 1 }], selectedBrand: { id: "default", label: item.name, price: item.price, img: item.img, tier: 1 } });
    });
    toast.success("✓ Standard Kit added to cart!", { description: "6 items added", action: { label: "View Cart →", onClick: () => window.location.href = "/cart" } });
  };

  const kitTotal = HERO_KIT.reduce((s, i) => s + i.price, 0);

  return (
    <section className="min-h-screen flex items-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1E5C44 55%, #163D2E 100%)" }}>
      <div className="absolute w-[700px] h-[700px] rounded-full bg-primary-foreground/[0.025] -top-[250px] -right-[250px]" />
      <div className="absolute w-[350px] h-[350px] rounded-full bg-coral/[0.07] -bottom-[80px] -left-[80px]" />

      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pt-24 md:pt-32 pb-16 md:pb-20 grid md:grid-cols-2 gap-10 md:gap-[72px] items-center w-full">
        <div>
          <div className="animate-fade-up inline-flex items-center gap-2 bg-coral/[0.18] border border-coral/40 rounded-pill px-4 py-1.5 mb-5">
            <span className="text-coral text-xs font-semibold">🎉 Nigeria's #1 Hospital Bag Curator</span>
          </div>
          <img src={logoWhite} alt="BundledMum" className="h-[54px] md:h-[70px] w-auto mb-3.5 block" />
          <h1 className="pf animate-fade-up-2 text-[32px] md:text-[50px] font-bold text-primary-foreground leading-[1.15] mb-4">
            Your Hospital Bag,<br />
            <span className="text-coral italic">Perfectly Bundled.</span>
          </h1>
          <p className="animate-fade-up-3 text-primary-foreground/70 text-[15px] md:text-[17px] leading-[1.75] mb-7 max-w-[480px] font-body">
            Take our 60-second quiz — we'll curate the exact items for your budget and your baby. No overwhelm. No guesswork.
          </p>
          <div className="animate-fade-up-4 flex gap-3 flex-wrap">
            <Link to="/quiz" className="rounded-pill bg-coral px-7 py-3.5 font-body font-semibold text-primary-foreground hover:bg-coral-dark interactive text-sm md:text-[15px] w-full md:w-auto text-center">Build My Bundle →</Link>
            <Link to="/shop" className="rounded-pill border-2 border-primary-foreground/30 px-7 py-3.5 font-body font-semibold text-primary-foreground/80 hover:bg-primary-foreground/10 interactive w-full md:w-auto text-center">Browse All Products</Link>
          </div>
          <p className="animate-fade-up-4 text-primary-foreground/50 text-xs mt-3 font-body">⭐ 4.9/5 from 200+ mums</p>
          <div className="animate-fade-up-4 flex gap-6 md:gap-9 mt-8 md:mt-12 pt-6 md:pt-9 border-t border-primary-foreground/10">
            {[["200+", "Mums Served"], ["4.9★", "Average Rating"], ["48hr", "Lagos Delivery"]].map(([v, l]) => (
              <div key={l}><div className="pf text-xl md:text-[26px] font-bold text-coral">{v}</div><div className="text-primary-foreground/50 text-[11px]">{l}</div></div>
            ))}
          </div>
        </div>

        {/* Desktop hero card */}
        <div className="hidden md:block">
          <div className="animate-float bg-primary-foreground/[0.07] backdrop-blur-lg border border-primary-foreground/[0.11] rounded-[24px] p-5 md:p-7 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-primary-foreground/50 text-[10px] uppercase tracking-widest mb-1">Ready to order</div>
                <div className="pf text-primary-foreground text-[17px] font-semibold">Pre-Packed Hospital Bags</div>
              </div>
              <span className="bg-coral/20 border border-coral/40 rounded-pill px-2.5 py-1 text-[10px] font-bold text-coral">{bundles.length} Bundles</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {[
                { icon: "🏥", name: "Public Hospital", sub: "Vaginal · Basic", price: "₦42,500", bg: "rgba(21,101,192,0.15)" },
                { icon: "🏥", name: "Public Hospital", sub: "C-Section · Basic", price: "₦54,000", bg: "rgba(30,125,32,0.15)" },
                { icon: "🏨", name: "Private Hospital", sub: "C-Section · Premium", price: "₦88,000", bg: "rgba(136,14,79,0.15)" },
                { icon: "🎁", name: "Gift Bundle", sub: "Premium", price: "₦82,000", bg: "rgba(198,40,40,0.15)" },
              ].map(c => (
                <Link to="/bundles" key={c.sub} className="rounded-xl p-3 text-center hover:scale-105 transition-transform" style={{ background: c.bg }}>
                  <div className="text-2xl">{c.icon}</div>
                  <div className="text-primary-foreground text-[10px] font-semibold mt-1">{c.name}</div>
                  <div className="text-primary-foreground/50 text-[9px]">{c.sub}</div>
                  <div className="text-coral font-bold text-[11px] mt-0.5">{c.price}</div>
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-2 mb-4 justify-center">
              {HERO_KIT.slice(0, 4).map(item => (
                <div key={item.id} className="w-8 h-8 bg-primary-foreground/10 rounded-lg flex items-center justify-center text-sm">{item.img}</div>
              ))}
              <div className="text-primary-foreground/40 text-[10px] font-semibold">+{bundles.length - 4} more bundles</div>
            </div>
            <Link to="/bundles" className="block w-full rounded-pill bg-coral py-2.5 font-body font-semibold text-sm text-primary-foreground hover:bg-coral-dark interactive text-center">
              Shop Pre-Packed Bags →
            </Link>
            <div className="text-primary-foreground/30 text-[10px] text-center mt-2">Public · Private · Vaginal · C-Section · Gift</div>
          </div>
        </div>

        {/* Mobile bundle preview */}
        <div className="md:hidden overflow-x-auto -mx-5 px-5">
          <div className="flex gap-3" style={{ minWidth: "max-content" }}>
            {[
              { icon: "🏥", name: "Public · Vaginal", price: "₦42,500", bg: "rgba(21,101,192,0.15)" },
              { icon: "🏨", name: "Private · C-Section", price: "₦88,000", bg: "rgba(136,14,79,0.15)" },
              { icon: "🎁", name: "Gift Bundle", price: "₦82,000", bg: "rgba(198,40,40,0.15)" },
            ].map(c => (
              <Link to="/bundles" key={c.name} className="rounded-xl p-3 text-center min-w-[130px]" style={{ background: c.bg }}>
                <div className="text-2xl">{c.icon}</div>
                <div className="text-primary-foreground text-[10px] font-semibold mt-1">{c.name}</div>
                <div className="text-coral font-bold text-[11px] mt-0.5">{c.price}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    "🌿 100% Curated for Nigeria",
    "📦 Free Delivery over ₦30,000",
    "⭐ 4.9/5 · 200+ Mums",
    "💬 WhatsApp Support 7 Days",
    "🔒 Secure Paystack Checkout",
  ];
  return (
    <section className="bg-warm-cream border-y border-border py-4 overflow-x-auto">
      <div className="flex gap-6 md:gap-10 justify-center items-center px-5 min-w-max mx-auto">
        {items.map(item => (
          <span key={item} className="text-text-med text-xs md:text-sm font-semibold font-body whitespace-nowrap">{item}</span>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: "01", icon: "🧩", title: "Take the Quiz", desc: "Answer 3 quick questions about your budget, hospital type, and baby's gender — takes 60 seconds." },
    { num: "02", icon: "📦", title: "Get Your Bundle", desc: "We curate the exact brands and quantities matched to your answers — no guesswork." },
    { num: "03", icon: "🚚", title: "Add & Order", desc: "Add individual items or the full kit, checkout securely, and we deliver within 48 hours in Lagos." },
  ];
  return (
    <section className="py-16 md:py-24 bg-card">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10">
        <div className="text-center mb-10 md:mb-14">
          <span className="text-coral text-xs font-semibold uppercase tracking-widest">Simple Process</span>
          <h2 className="pf text-2xl md:text-[42px] text-forest mt-2">How BundledMum Works</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.num} className="relative bg-card border border-border rounded-[20px] p-6 md:p-8 text-center">
              <div className="absolute top-3 left-4 text-[56px] font-bold text-forest/[0.06] pf leading-none">{s.num}</div>
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-forest-light flex items-center justify-center text-3xl relative z-10">{s.icon}</div>
              <h3 className="font-bold text-lg mb-2 relative z-10">{s.title}</h3>
              <p className="text-text-med text-sm leading-relaxed relative z-10">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/quiz" className="rounded-pill bg-coral px-8 py-3.5 font-body font-semibold text-primary-foreground hover:bg-coral-dark interactive text-sm inline-block">Start the Quiz →</Link>
        </div>
      </div>
    </section>
  );
}

function BundleTiers() {
  const tiers = [
    { icon: "🌱", name: "Starter Kit", range: "₦15,000 – ₦35,000", tagline: "The must-haves, nothing wasted", items: "~8 items", popular: false },
    { icon: "🌿", name: "Standard Kit", range: "₦35,000 – ₦70,000", tagline: "Comfortable and complete", items: "~14 items", popular: true },
    { icon: "✨", name: "Premium Kit", range: "₦70,000+", tagline: "The full luxury experience", items: "~22 items", popular: false },
  ];
  return (
    <section className="py-16 md:py-24" style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1E5C44 100%)" }}>
      <div className="max-w-[1100px] mx-auto px-5 md:px-10">
        <div className="text-center mb-10 md:mb-14">
          <span className="text-coral text-xs font-semibold uppercase tracking-widest">Our Kits</span>
          <h2 className="pf text-2xl md:text-[42px] text-primary-foreground mt-2">Choose Your Bundle Tier</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3 items-end">
          {tiers.map(t => (
            <div key={t.name} className={`rounded-[20px] p-6 md:p-8 text-center relative ${t.popular ? "bg-forest-light md:scale-105 md:-my-2 border-2 border-forest" : "bg-primary-foreground/[0.07] border border-primary-foreground/10"}`}>
              {t.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-coral text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-pill">✦ Most Popular</div>
              )}
              <div className="text-4xl mb-3">{t.icon}</div>
              <h3 className={`pf text-xl font-bold mb-1 ${t.popular ? "text-forest" : "text-primary-foreground"}`}>{t.name}</h3>
              <div className={`text-2xl font-bold pf mb-2 ${t.popular ? "text-forest" : "text-coral"}`}>{t.range}</div>
              <p className={`text-sm mb-1 ${t.popular ? "text-text-med" : "text-primary-foreground/60"}`}>{t.tagline}</p>
              <p className={`text-xs mb-4 ${t.popular ? "text-text-light" : "text-primary-foreground/40"}`}>{t.items}</p>
              <Link to="/quiz" className={`inline-block rounded-pill px-6 py-2.5 font-body font-semibold text-sm interactive ${t.popular ? "bg-forest text-primary-foreground hover:bg-forest-deep" : "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"}`}>
                Build This Bundle →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedProducts() {
  const { addToCart, cart } = useCart();
  const featured = [PRODUCTS.baby[0], PRODUCTS.baby[2], PRODUCTS.baby[3], PRODUCTS.mum[0]];
  const badges: Record<number, { label: string; color: string }> = {
    1: { label: "BEST SELLER", color: "#2D6A4F" },
    3: { label: "ESSENTIAL", color: "#F4845F" },
    4: { label: "TOP PICK", color: "#E67E22" },
    11: { label: "ESSENTIAL", color: "#F4845F" },
  };

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10">
        <div className="flex justify-between items-end mb-10 flex-col md:flex-row gap-3">
          <div>
            <span className="text-coral text-xs font-semibold uppercase tracking-widest">Shop</span>
            <h2 className="pf text-2xl md:text-[42px] text-forest mt-2">Our Most Loved Items</h2>
          </div>
          <Link to="/shop" className="rounded-pill border-2 border-forest text-forest px-5 py-2.5 font-body font-semibold text-sm hover:bg-forest/5 interactive w-full md:w-auto text-center">See All Products →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {featured.map(p => {
            const brand = getBrandForBudget(p, "standard");
            const isInCart = cart.some(c => c.id === p.id);
            const badge = badges[p.id];
            return (
              <div key={p.id} className="bg-card rounded-card shadow-card card-hover overflow-hidden relative">
                <div className="h-[170px] flex items-center justify-center text-6xl relative" style={{ background: `linear-gradient(135deg, ${brand.color}, #fff)` }}>
                  {badge && (
                    <div className="absolute top-2.5 left-2.5 text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-pill uppercase" style={{ background: badge.color }}>{badge.label}</div>
                  )}
                  {brand.img}
                </div>
                <div className="p-4">
                  <h3 className="text-[13px] font-semibold mb-2 leading-tight min-h-[36px]">{p.name}</h3>
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-coral text-xs">⭐ {p.rating}</span>
                    <span className="text-text-light text-[11px]">({p.reviews})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-forest font-bold text-[17px]">{fmt(brand.price)}</span>
                      {p.brands.length > 1 && <div className="text-text-light text-[10px]">from {fmt(Math.min(...p.brands.map(b => b.price)))}</div>}
                    </div>
                    {isInCart ? (
                      <Link to="/cart" className="rounded-pill bg-forest-light border border-forest text-forest px-4 py-2 text-xs font-semibold font-body interactive">In Cart ✓</Link>
                    ) : (
                      <button onClick={() => {
                        addToCart({ ...p, selectedBrand: brand, price: brand.price, name: `${p.name} (${brand.label})` });
                        toast.success(`✓ ${p.name} added to cart`, { action: { label: "View Cart →", onClick: () => window.location.href = "/cart" } });
                      }}
                        className="rounded-pill bg-forest px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-forest-deep font-body interactive">+ Add</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24" style={{ background: "#2D6A4F" }}>
      <div className="max-w-[1100px] mx-auto px-5 md:px-10">
        <div className="text-center mb-10 md:mb-14">
          <span className="text-coral text-xs font-semibold uppercase tracking-widest">Real Stories</span>
          <h2 className="pf text-2xl md:text-[42px] text-primary-foreground mt-2">Mums Who Bundled With Us</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-3.5 md:gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-primary-foreground/[0.09] border border-primary-foreground/[0.11] rounded-[20px] p-5 md:p-8">
              <div className="text-coral text-base mb-3">{"⭐".repeat(t.stars)}</div>
              <p className="text-primary-foreground/80 leading-[1.8] text-sm mb-4 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-coral rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">{t.name[0]}</div>
                <div>
                  <div className="text-primary-foreground font-semibold text-sm">{t.name}</div>
                  <div className="text-primary-foreground/45 text-xs">— {t.loc}, Nigeria</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTABanner() {
  return (
    <section className="py-16 md:py-24 bg-background text-center">
      <div className="max-w-[640px] mx-auto px-5">
        <div className="text-4xl md:text-6xl mb-4">🌿</div>
        <h2 className="pf text-2xl md:text-[46px] text-forest mb-3.5">Ready to Build Your Perfect Bundle?</h2>
        <p className="text-text-med text-sm md:text-[17px] mb-6 leading-[1.75]">Join hundreds of Nigerian mums who've taken the stress out of hospital bag prep. Your quiz takes 60 seconds.</p>
        <Link to="/quiz" className="rounded-pill bg-forest px-8 md:px-12 py-4 font-body font-semibold text-primary-foreground hover:bg-forest-deep interactive text-[15px] md:text-base inline-block">Start the Quiz — It's Free →</Link>
        <div className="text-text-light text-xs mt-3.5">🔒 No account needed · Results appear instantly</div>
      </div>
    </section>
  );
}

function StickyMobileCTA() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const handler = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  if (!show) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[800] bg-card border-t border-border p-3 md:hidden animate-slide-up">
      <Link to="/quiz" className="block w-full rounded-pill bg-coral py-3.5 text-center font-body font-semibold text-primary-foreground text-sm">Build My Bundle →</Link>
    </div>
  );
}

export default function HomePage() {
  useEffect(() => { document.title = "BundledMum — Nigeria's Hospital Bag Curator"; }, []);

  return (
    <>
      <HeroSection />
      <TrustBar />
      <HowItWorks />
      <BundleTiers />
      <FeaturedProducts />
      <TestimonialsSection />
      <CTABanner />
      <StickyMobileCTA />
    </>
  );
}
