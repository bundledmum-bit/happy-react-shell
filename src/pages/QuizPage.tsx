import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart, fmt } from "@/lib/cart";
import { allProducts } from "@/data/products";
import { bundles } from "@/data/bundles";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

type Step = 1 | 2 | 3 | 4;
type ShopFor = "self" | "gift";
type Delivery = "vaginal" | "csection";
type GiftFor = "baby" | "mum" | "both";
type Hospital = "public" | "private";
type BabyAge = "expecting" | "newborn" | "0-3" | "3-6" | "6-12";
type Budget = "starter" | "standard" | "premium";

interface QuizState {
  shopFor?: ShopFor;
  delivery?: Delivery;
  giftFor?: GiftFor;
  hospital?: Hospital;
  babyAge?: BabyAge;
  budget?: Budget;
}

export default function QuizPage() {
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<QuizState>({});
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const progress = showResults ? 100 : (step / 4) * 100;

  const goNext = () => {
    if (step < 4) setStep((step + 1) as Step);
    else setShowResults(true);
  };

  const goBack = () => {
    if (showResults) { setShowResults(false); return; }
    if (step > 1) setStep((step - 1) as Step);
  };

  const select = (key: keyof QuizState, value: string) => {
    setState(p => ({ ...p, [key]: value }));
    setTimeout(goNext, 300);
  };

  const tierNum = state.budget === "starter" ? 1 : state.budget === "premium" ? 3 : 2;

  const resultProducts = allProducts.filter(p => {
    if (state.shopFor === "gift") {
      if (state.giftFor === "baby") return p.category === "baby";
      if (state.giftFor === "mum") return p.category === "mum";
      return true;
    }
    return true;
  }).map(p => {
    const brand = p.brands.find(b => b.tier === tierNum) || p.brands[p.brands.length - 1];
    return { ...p, selectedBrand: brand };
  });

  const totalValue = resultProducts.reduce((s, p) => s + p.selectedBrand.price, 0);

  const matchedBundle = bundles.find(b => {
    if (state.shopFor === "gift") return b.hospitalType === "gift" && (state.budget === "premium" ? b.tier === "Premium" : b.tier === "Basic");
    return b.hospitalType === (state.hospital || "public") && b.deliveryType === (state.delivery || "vaginal") && (state.budget === "premium" ? b.tier === "Premium" : b.tier === "Basic");
  });

  const addAllToCart = () => {
    if (matchedBundle) {
      addToCart({ id: matchedBundle.id, name: matchedBundle.name, brand: matchedBundle.tier, price: matchedBundle.price, emoji: matchedBundle.icon, category: "bundle" });
    } else {
      resultProducts.forEach(p => {
        addToCart({ id: p.id, name: p.name, brand: p.selectedBrand.brand, price: p.selectedBrand.price, emoji: p.emoji, category: p.category });
      });
    }
    toast.success("✓ Your full kit has been added to cart!");
    navigate("/cart");
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-background">
        <div className="pt-20" style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1A4A33 100%)" }}>
          <div className="container mx-auto px-4 py-12 text-center">
            <button onClick={goBack} className="absolute left-4 top-24 text-primary-foreground/70"><ArrowLeft /></button>
            <h1 className="font-display font-black text-2xl md:text-4xl text-primary-foreground mb-2">
              {state.shopFor === "gift" ? "Gift Bundle Curated 🎁" : "Your Personalised Bundle is Ready! 🎉"}
            </h1>
            <p className="font-body text-primary-foreground/70 mb-4">{resultProducts.length} items · Total value: {fmt(matchedBundle?.price || totalValue)}</p>
            <button onClick={addAllToCart} className="rounded-pill bg-coral px-8 py-3 font-display font-bold text-primary-foreground hover:bg-coral-dark interactive">
              Add Entire Kit to Cart 🛍️
            </button>
          </div>
        </div>
        <div className="container mx-auto px-4 py-10">
          {["baby", "mum"].map(cat => {
            const items = resultProducts.filter(p => p.category === cat);
            if (!items.length) return null;
            return (
              <div key={cat} className="mb-10">
                <h2 className="font-display font-bold text-lg mb-4">{cat === "baby" ? "For Baby 👶" : "For Mum 💛"}</h2>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  {items.map(p => (
                    <div key={p.id} className="bg-card rounded-card shadow-card p-4">
                      <span className="text-3xl">{p.emoji}</span>
                      <h3 className="font-display font-bold text-sm mt-2">{p.name}</h3>
                      <p className="font-body text-xs text-muted-foreground">{p.selectedBrand.brand}</p>
                      <p className="font-display font-bold text-coral mt-1">{fmt(p.selectedBrand.price)}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Progress bar */}
      <div className="w-full bg-forest/10 h-1.5">
        <div className="bg-coral h-1.5 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="container mx-auto px-4 py-12 max-w-lg">
        {step > 1 && (
          <button onClick={goBack} className="flex items-center gap-1 text-sm text-muted-foreground mb-6 font-body">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}

        {step === 1 && (
          <QuizStep title="Who are you shopping for?">
            <QuizOption emoji="🛍️" label="Myself" sub="I'm expecting / just had a baby" onClick={() => select("shopFor", "self")} selected={state.shopFor === "self"} />
            <QuizOption emoji="🎁" label="As a Gift" sub="Shopping for someone else" onClick={() => select("shopFor", "gift")} selected={state.shopFor === "gift"} />
          </QuizStep>
        )}

        {step === 2 && state.shopFor === "self" && (
          <QuizStep title="What's your delivery type?">
            <QuizOption emoji="🏥" label="Vaginal Birth" onClick={() => select("delivery", "vaginal")} selected={state.delivery === "vaginal"} />
            <QuizOption emoji="🔪" label="C-Section" sub="Planned or Emergency" onClick={() => select("delivery", "csection")} selected={state.delivery === "csection"} />
          </QuizStep>
        )}

        {step === 2 && state.shopFor === "gift" && (
          <QuizStep title="Who is the gift for?">
            <QuizOption emoji="👶" label="The Baby" onClick={() => select("giftFor", "baby")} selected={state.giftFor === "baby"} />
            <QuizOption emoji="💛" label="The Mum" onClick={() => select("giftFor", "mum")} selected={state.giftFor === "mum"} />
            <QuizOption emoji="🎀" label="Both (Full Kit Gift)" onClick={() => select("giftFor", "both")} selected={state.giftFor === "both"} />
          </QuizStep>
        )}

        {step === 3 && state.shopFor === "self" && (
          <QuizStep title="Where are you delivering?">
            <QuizOption emoji="🏥" label="Public / Government Hospital" onClick={() => select("hospital", "public")} selected={state.hospital === "public"} />
            <QuizOption emoji="🏨" label="Private Hospital / Clinic" onClick={() => select("hospital", "private")} selected={state.hospital === "private"} />
          </QuizStep>
        )}

        {step === 3 && state.shopFor === "gift" && (
          <QuizStep title="Baby's age?">
            <QuizOption emoji="🤰" label="Not yet born" onClick={() => select("babyAge", "expecting")} selected={state.babyAge === "expecting"} />
            <QuizOption emoji="👶" label="Newborn (0–4 weeks)" onClick={() => select("babyAge", "newborn")} selected={state.babyAge === "newborn"} />
            <QuizOption emoji="🍼" label="0–3 Months" onClick={() => select("babyAge", "0-3")} selected={state.babyAge === "0-3"} />
            <QuizOption emoji="🌱" label="3–6 Months" onClick={() => select("babyAge", "3-6")} selected={state.babyAge === "3-6"} />
            <QuizOption emoji="🧸" label="6–12 Months" onClick={() => select("babyAge", "6-12")} selected={state.babyAge === "6-12"} />
          </QuizStep>
        )}

        {step === 4 && (
          <QuizStep title="What's your budget?">
            <QuizOption emoji="💚" label="Starter" sub="₦25,000–₦45,000 (essentials only)" onClick={() => select("budget", "starter")} selected={state.budget === "starter"} />
            <QuizOption emoji="⭐" label="Standard" sub="₦45,000–₦70,000 (well-stocked)" onClick={() => select("budget", "standard")} selected={state.budget === "standard"} />
            <QuizOption emoji="👑" label="Premium" sub="₦70,000+ (best brands)" onClick={() => select("budget", "premium")} selected={state.budget === "premium"} />
          </QuizStep>
        )}
      </div>
    </div>
  );
}

function QuizStep({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="animate-fade-up">
      <h2 className="font-display font-black text-xl md:text-2xl mb-6 text-center">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function QuizOption({ emoji, label, sub, onClick, selected }: { emoji: string; label: string; sub?: string; onClick: () => void; selected?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-card border-2 text-left interactive ${
        selected ? "border-coral bg-coral-blush" : "border-border bg-card hover:border-coral/30"
      }`}
    >
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className="font-display font-bold">{label}</p>
        {sub && <p className="font-body text-sm text-muted-foreground">{sub}</p>}
      </div>
    </button>
  );
}
