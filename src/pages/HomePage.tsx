import { Link } from "react-router-dom";
import { useCart, fmt, getBrandForBudget } from "@/lib/cart";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import BudgetCalculator from "@/components/BudgetCalculator";
import { useAllProducts, useTestimonials, useSiteSettings, useBundles } from "@/hooks/useSupabaseData";
import type { Product } from "@/lib/supabaseAdapters";
import ProductImage from "@/components/ProductImage";

function HeroSection() {
  const { data: bundles } = useBundles();
  const topBundles = (bundles || []).slice(0, 3);

  return (
    <section className="min-h-screen flex items-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1E5C44 55%, #163D2E 100%)" }}>
      <div className="absolute w-[700px] h-[700px] rounded-full bg-primary-foreground/[0.025] -top-[250px] -right-[250px]" />
      <div className="absolute w-[350px] h-[350px] rounded-full bg-coral/[0.07] -bottom-[80px] -left-[80px]" />

      <div className="max-w-[1200px] mx-auto px-5 md:px-10 pt-24 md:pt-32 pb-16 md:pb-20 grid md:grid-cols-2 gap-10 md:gap-[72px] items-center w-full">
        <div>
          <div className="animate-fade-up inline-flex items-center gap-2 bg-coral/[0.18] border border-coral/40 rounded-pill px-4 py-1.5 mb-5">
            <span className="text-coral text-xs font-semibold">🎉 Nigeria's #1 Hospital Bag Curator</span>
          </div>
          <h1 className="pf animate-fade-up-2 text-[32px] md:text-[50px] font-bold text-primary-foreground leading-[1.15] mb-4">
            Everything You Need for Baby & Mum,<br />
            <span className="text-coral italic">Perfectly Bundled.</span>
          </h1>
          <p className="animate-fade-up-3 text-primary-foreground/70 text-[15px] md:text-[17px] leading-[1.75] mb-7 max-w-[480px] font-body">
            Hospital bag essentials, newborn must-haves, and mum recovery items — all curated by real Nigerian mums. Take our 60-second quiz and we'll build your perfect bundle.
          </p>
          <div className="animate-fade-up-4 flex gap-3 flex-wrap">
            <Link to="/quiz" className="rounded-pill bg-coral px-7 py-3.5 font-body font-semibold text-primary-foreground hover:bg-coral-dark interactive text-sm md:text-[15px] w-full md:w-auto text-center">Build My Bundle →</Link>
            <Link to="/shop" className="rounded-pill border-2 border-primary-foreground/30 px-7 py-3.5 font-body font-semibold text-primary-foreground/80 hover:bg-primary-foreground/10 interactive w-full md:w-auto text-center">Browse All Products</Link>
          </div>
          <p className="animate-fade-up-4 text-primary-foreground/50 text-xs mt-3 font-body">⭐ 4.9/5 from 347+ mums this month</p>
          <div className="animate-fade-up-4 flex gap-6 md:gap-9 mt-8 md:mt-12 pt-6 md:pt-9 border-t border-primary-foreground/10">
            {[["347+", "Mums This Month"], ["4.9★", "Average Rating"], ["48hr", "Lagos Delivery"]].map(([v, l]) => (
              <div key={l}><div className="pf text-xl md:text-[26px] font-bold text-coral">{v}</div><div className="text-primary-foreground/50 text-[11px]">{l}</div></div>
            ))}
          </div>
        </div>

        {/* Desktop: Budget Calculator */}
        <div className="hidden md:block">
          <BudgetCalculator />
        </div>

        {/* Mobile bundle preview */}
        <div className="md:hidden overflow-x-auto -mx-5 px-5">
          <div className="flex gap-3" style={{ minWidth: "max-content" }}>
            {topBundles.length > 0
              ? topBundles.map(c => (
                  <Link to="/bundles" key={c.id} className="rounded-xl p-3 text-center min-w-[130px]" style={{ background: `${c.color}26` }}>
                    <div className="text-2xl">{c.icon}</div>
                    <div className="text-primary-foreground text-[10px] font-semibold mt-1">{c.name.split("·").slice(0, 2).join("·").trim()}</div>
                    <div className="text-coral font-bold text-[11px] mt-0.5">{fmt(c.price)}</div>
                  </Link>
                ))
              : [
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
    "⭐ 4.9/5 · 347+ Mums",
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
  const { addToCart, cart, setCart } = useCart();
  const { data: allProducts, isLoading } = useAllProducts();

  const featured = (allProducts || []).filter(p => p.badge || p.rating >= 4.8).slice(0, 4);

  if (isLoading || featured.length === 0) {
    return (
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10">
          <div className="text-center mb-10">
            <span className="text-coral text-xs font-semibold uppercase tracking-widest">Shop</span>
            <h2 className="pf text-2xl md:text-[42px] text-forest mt-2">Our Most Loved Items</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card rounded-card shadow-card h-[320px] animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

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
            if (!brand) return null;
            const isInCart = cart.some(c => c.id === p.id);
            return (
              <div key={p.id} className="bg-card rounded-card shadow-card card-hover overflow-hidden relative">
                <div className="h-[170px] flex items-center justify-center relative overflow-hidden" style={{ background: p.imageUrl ? '#f5f5f5' : `linear-gradient(135deg, ${brand.color}, #fff)` }}>
                  {p.badge && (
                    <div className="absolute top-2.5 left-2.5 text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-pill uppercase bg-coral z-10">{p.badge}</div>
                  )}
                  <ProductImage imageUrl={p.imageUrl} emoji={brand.img} alt={p.name} className="w-full h-full" emojiClassName="text-6xl" />
                </div>
                <div className="p-4">
                  <h3 className="text-[13px] font-semibold mb-2 leading-tight min-h-[36px]">{p.name}</h3>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-coral text-xs">⭐ {p.rating}</span>
                    <span className="text-text-light text-[11px]">({p.reviews})</span>
                  </div>
                  <p className="text-text-light text-[9px] mb-2">🚚 Lagos: 1-2 days · Others: 3-5 days</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-forest font-bold text-[17px]">{fmt(brand.price)}</span>
                      {p.brands.length > 1 && <div className="text-text-light text-[10px]">from {fmt(Math.min(...p.brands.map(b => b.price)))}</div>}
                    </div>
                    {isInCart ? (
                      <button onClick={() => { setCart(prev => prev.filter(c => c.id !== p.id)); toast("Removed from cart"); }}
                        className="rounded-pill bg-forest-light border border-forest text-forest px-3 py-1.5 text-[11px] font-semibold font-body interactive flex items-center gap-1">
                        ✓ Added <span className="text-destructive ml-1">×</span>
                      </button>
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
  const { data: testimonials } = useTestimonials(true);
  const items = testimonials && testimonials.length > 0
    ? testimonials.map(t => ({ name: t.customer_name, loc: t.customer_city.replace(", Nigeria", ""), stars: t.rating || 5, text: t.quote }))
    : [
        { name: "Adaeze O.", loc: "Lagos", stars: 5, text: "I was so overwhelmed before finding BundledMum. The quiz took 2 minutes and I had the perfect list. My Standard Boy Bundle arrived in 2 days — absolutely everything I needed!" },
        { name: "Ngozi T.", loc: "Abuja", stars: 5, text: "As a first-time mum in Nigeria, I had no idea where to start. BundledMum made it so easy. The products are actually good quality, not cheap imports. 10/10 recommend." },
        { name: "Kemi A.", loc: "Port Harcourt", stars: 5, text: "Bought the Premium Bundle as a baby shower gift. My friend cried when she saw everything. The presentation alone was worth it. Will always shop here for baby gifts." },
      ];

  return (
    <section className="py-16 md:py-24" style={{ background: "#2D6A4F" }}>
      <div className="max-w-[1100px] mx-auto px-5 md:px-10">
        <div className="text-center mb-10 md:mb-14">
          <span className="text-coral text-xs font-semibold uppercase tracking-widest">Real Stories</span>
          <h2 className="pf text-2xl md:text-[42px] text-primary-foreground mt-2">Mums Who Bundled With Us</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-3.5 md:gap-6">
          {items.map((t, i) => (
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
        <div className="text-center mt-8 space-y-3">
          <p className="text-primary-foreground/50 text-sm">Know someone expecting? Tell them about BundledMum</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => {
              const text = "Hey! I found this amazing site that curates hospital bags for Nigerian mums. Check it out: https://bundledmum.lovable.app/?ref=testimonial_share";
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
            }} className="rounded-pill bg-[#25D366] text-primary-foreground px-5 py-2.5 text-xs font-semibold interactive">
              📱 Share on WhatsApp
            </button>
            <a href="https://wa.me/2348012345678?text=Hi! I want to share my BundledMum experience" target="_blank" rel="noopener noreferrer"
              className="rounded-pill border border-primary-foreground/30 text-primary-foreground/70 px-5 py-2.5 text-xs font-semibold interactive">
              ✍️ Share Your Story
            </a>
          </div>
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
    <div className="fixed bottom-14 left-0 right-0 z-[80] bg-card border-t border-border p-3 md:hidden animate-slide-up">
      <Link to="/quiz" className="block w-full rounded-pill bg-coral py-3.5 text-center font-body font-semibold text-primary-foreground text-sm">Build My Bundle →</Link>
    </div>
  );
}

export default function HomePage() {
  useEffect(() => { document.title = "BundledMum — Nigeria's Hospital Bag Curator"; }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      try { localStorage.setItem("bm-referral-from", ref); } catch {}
    }
  }, []);

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
