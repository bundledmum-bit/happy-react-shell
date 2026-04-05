import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart, fmt, getBrandForBudget } from "@/lib/cart";
import { PRODUCTS, ALL_PRODUCTS } from "@/data/products";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

type QuizAnswers = Record<string, string>;

const ALL_QUESTIONS: Record<string, { id: string; title: string; sub: string; options: { id: string; emoji: string; label: string; sublabel: string; desc?: string; popular?: boolean }[] }> = {
  shopper: {
    id: "shopper", title: "Who are you shopping for today?", sub: "Help us personalise your bundle 💛",
    options: [
      { id: "self", emoji: "🤱", label: "For me — I'm expecting!", sublabel: "Shopping for myself" },
      { id: "gift", emoji: "🎁", label: "I'm buying as a gift", sublabel: "For someone special" },
    ]
  },
  gift_for: {
    id: "gift_for", title: "Who is this gift for?", sub: "We'll curate the perfect gift 🎁",
    options: [
      { id: "baby", emoji: "👶", label: "For the Baby", sublabel: "Newborn & baby essentials" },
      { id: "mum", emoji: "💛", label: "For the Mum", sublabel: "Postpartum care & comfort" },
      { id: "both", emoji: "🎀", label: "For Both — the full kit", sublabel: "Complete mum & baby bundle", popular: true },
    ]
  },
  gift_age: {
    id: "gift_age", title: "How old is the baby (or when is baby due)?", sub: "We'll match the right products",
    options: [
      { id: "newborn", emoji: "🐣", label: "Newborn", sublabel: "Just born or due soon — 0 to 4 weeks" },
      { id: "0_3", emoji: "🍼", label: "0 – 3 Months", sublabel: "Early newborn stage" },
      { id: "3_6", emoji: "🧸", label: "3 – 6 Months", sublabel: "Starting to interact & play" },
      { id: "6_12", emoji: "🚀", label: "6 – 12 Months", sublabel: "Growing fast, starting solids" },
    ]
  },
  gift_gender: {
    id: "gift_gender", title: "What's the baby's gender?", sub: "We'll pick the right colours and styles",
    options: [
      { id: "boy", emoji: "👦", label: "Boy", sublabel: "Blue & neutral tones" },
      { id: "girl", emoji: "👧", label: "Girl", sublabel: "Pink & neutral tones" },
      { id: "neutral", emoji: "🌈", label: "Don't know yet", sublabel: "Beautiful neutral options" },
    ]
  },
  self_gender: {
    id: "self_gender", title: "What's the baby's gender?", sub: "We'll include the right colours and styles",
    options: [
      { id: "boy", emoji: "👦", label: "Boy", sublabel: "Blue & neutral tones" },
      { id: "girl", emoji: "👧", label: "Girl", sublabel: "Pink & neutral tones" },
      { id: "neutral", emoji: "🌈", label: "We're waiting!", sublabel: "Beautiful neutral options" },
    ]
  },
  self_age: {
    id: "self_age", title: "When is your baby due (or how old now)?", sub: "We'll match products to your exact stage",
    options: [
      { id: "newborn", emoji: "🐣", label: "Baby is here! (Newborn)", sublabel: "0 – 4 weeks old" },
      { id: "0_3", emoji: "🍼", label: "0 – 3 Months", sublabel: "Early newborn stage" },
      { id: "expecting", emoji: "🤰", label: "Still Expecting", sublabel: "Getting ready for delivery" },
    ]
  },
  budget: {
    id: "budget", title: "What's your budget range?", sub: "Every tier covers the essentials — pick what feels right",
    options: [
      { id: "starter", emoji: "🌱", label: "Starter Bundle", sublabel: "₦15,000 – ₦35,000", desc: "The must-haves, nothing wasted. ~8 items." },
      { id: "standard", emoji: "🌿", label: "Standard Bundle", sublabel: "₦35,000 – ₦70,000", desc: "Comfortable and complete. ~14 items.", popular: true },
      { id: "premium", emoji: "✨", label: "Premium Bundle", sublabel: "₦70,000+", desc: "The full luxury bundle experience. ~22 items." },
    ]
  },
};

function getNextQ(currentQ: string, answer: string): string | null {
  switch (currentQ) {
    case "shopper": return answer === "gift" ? "gift_for" : "self_gender";
    case "gift_for": return "gift_age";
    case "gift_age": return "gift_gender";
    case "gift_gender": return "budget";
    case "self_gender": return "self_age";
    case "self_age": return "budget";
    case "budget": return null;
    default: return null;
  }
}

export default function QuizPage() {
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [history, setHistory] = useState<string[]>([]);
  const [currentQ, setCurrentQ] = useState("shopper");
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const totalSteps = answers.shopper === "gift" ? 5 : 4;
  const stepIndex = history.length;
  const progress = showResults ? 100 : ((stepIndex + 1) / totalSteps) * 100;

  const handleAnswer = (qid: string, oid: string) => {
    const newAnswers = { ...answers, [qid]: oid };
    setAnswers(newAnswers);
    const next = getNextQ(qid, oid);
    setTimeout(() => {
      if (!next) { setShowResults(true); }
      else { setHistory(h => [...h, currentQ]); setCurrentQ(next); }
    }, 320);
  };

  const handleBack = () => {
    if (showResults) { setShowResults(false); return; }
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setCurrentQ(prev);
  };

  const getResults = () => {
    const budget = answers.budget || "standard";
    const gender = answers.gift_gender || answers.self_gender || "neutral";
    const giftFor = answers.gift_for;
    const isGift = answers.shopper === "gift";
    let babyProducts: any[] = [], mumProducts: any[] = [];

    if (isGift) {
      const allGiftable = [...PRODUCTS.baby.map(p => ({ ...p, shop: "baby" })), ...PRODUCTS.mum.map(p => ({ ...p, shop: "mum" }))]
        .filter(p => p.tags.includes("gift:yes") && p.tags.includes(`bundle:${budget}`));
      if (giftFor === "baby" || giftFor === "both") {
        babyProducts = allGiftable.filter(p => p.shop === "baby" && (p.tags.includes(`gender:${gender}`) || p.tags.includes("gender:neutral"))).slice(0, 6);
      }
      if (giftFor === "mum" || giftFor === "both") {
        mumProducts = allGiftable.filter(p => p.shop === "mum").slice(0, giftFor === "mum" ? 6 : 4);
      }
    } else {
      babyProducts = PRODUCTS.baby.filter(p => p.tags.includes(`bundle:${budget}`) && (p.tags.includes(`gender:${gender}`) || p.tags.includes("gender:neutral"))).slice(0, 6);
      mumProducts = PRODUCTS.mum.filter(p => p.tags.includes(`bundle:${budget}`)).slice(0, 4);
    }
    return { baby: babyProducts, mum: mumProducts, budget, gender, giftFor, isGift };
  };

  const handleAddAll = () => {
    const { baby, mum, budget } = getResults();
    [...baby, ...mum].forEach(p => {
      const brand = getBrandForBudget(p, budget);
      addToCart({ ...p, selectedBrand: brand, price: brand.price, name: `${p.name} (${brand.label})` });
    });
    toast.success("✓ Your full kit has been added to cart!");
    navigate("/cart");
  };

  if (showResults) {
    const { baby, mum, budget, isGift } = getResults();
    const total = [...baby, ...mum].reduce((s, p) => s + getBrandForBudget(p, budget).price, 0);
    const bLabel: Record<string, string> = { starter: "Starter", standard: "Standard", premium: "Premium" };
    const sections: { label: string; items: any[] }[] = [];
    if (baby.length) sections.push({ label: isGift ? "🎁 Gift for Baby" : "👶 For Baby", items: baby });
    if (mum.length) sections.push({ label: isGift ? "🎁 Gift for Mum" : "💛 For Mum", items: mum });

    return (
      <div className="min-h-screen bg-background pt-[68px]">
        <div style={{ background: "linear-gradient(135deg, #2D6A4F, #1E5C44)" }} className="px-4 md:px-10 py-8 md:py-14">
          <div className="max-w-[880px] mx-auto text-center">
            <div className="animate-fade-in inline-flex items-center gap-2 bg-coral/20 border border-coral/40 rounded-pill px-4 py-1.5 mb-3.5">
              <span className="text-coral text-[13px] font-semibold">{isGift ? "🎁 Perfect Gift Bundle Ready!" : "✨ Your Personalised Bundle is Ready!"}</span>
            </div>
            <h1 className="pf text-2xl md:text-[40px] text-primary-foreground mb-3">{isGift ? "Gift Bundle Curated" : "Your Perfect Hospital Bag"}</h1>
            <p className="text-primary-foreground/70 text-sm md:text-base mb-5">{[...baby, ...mum].length} items · {bLabel[budget]} Budget · Total value: {fmt(total)}</p>
            <button onClick={handleAddAll} className="rounded-pill bg-coral px-8 py-3 font-body font-semibold text-primary-foreground hover:bg-coral-dark interactive text-[15px]">
              Add Entire Kit to Cart 🛍️
            </button>
          </div>
        </div>
        <div className="max-w-[1000px] mx-auto px-4 md:px-10 py-10">
          {sections.map(sec => (
            <div key={sec.label} className="mb-10">
              <h2 className="pf text-lg md:text-xl text-forest mb-4">{sec.label}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
                {sec.items.map((p: any) => {
                  const brand = getBrandForBudget(p, budget);
                  return (
                    <div key={p.id} className="bg-card rounded-card shadow-card p-4">
                      <div className="text-3xl mb-2">{brand.img}</div>
                      <h3 className="font-semibold text-sm">{p.name}</h3>
                      <p className="text-forest text-xs mt-0.5">{brand.label}</p>
                      <p className="font-bold text-coral mt-1">{fmt(brand.price)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const q = ALL_QUESTIONS[currentQ];
  if (!q) return null;

  return (
    <div className="min-h-screen bg-background pt-[68px] flex flex-col items-center px-4 md:px-10 py-8 md:py-12">
      {/* Progress bar */}
      <div className="w-full max-w-[660px] mb-8">
        <div className="w-full bg-border h-1 rounded-full overflow-hidden">
          <div className="bg-coral h-1 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-2">
          <div className="text-text-light text-xs">Step {stepIndex + 1} of {totalSteps}</div>
          {history.length > 0 && (
            <button onClick={handleBack} className="text-text-light text-xs flex items-center gap-1 font-body"><ArrowLeft className="h-3 w-3" /> Back</button>
          )}
        </div>
      </div>

      <div className="animate-fade-in bg-card rounded-[22px] p-7 md:p-12 shadow-card-hover w-full max-w-[660px]" key={currentQ}>
        <div className="text-center mb-7">
          <p className="text-text-light text-[11px] font-semibold uppercase tracking-widest mb-2">{q.sub}</p>
          <h2 className="pf text-xl md:text-[30px] leading-tight">{q.title}</h2>
        </div>
        <div className="flex flex-col gap-2.5">
          {q.options.map(opt => (
            <button key={opt.id} onClick={() => handleAnswer(q.id, opt.id)}
              className={`flex items-center gap-3 p-3 md:p-4 rounded-[14px] border-2 text-left transition-all font-body ${answers[q.id] === opt.id ? "border-forest bg-forest-light" : "border-border bg-card hover:border-forest hover:bg-forest-light"}`}>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-warm-cream rounded-[13px] flex items-center justify-center text-xl md:text-2xl flex-shrink-0">{opt.emoji}</div>
              <div className="flex-1">
                <div className="font-bold text-[13px] md:text-[15px] flex items-center gap-2 flex-wrap">
                  {opt.label}
                  {opt.popular && <span className="bg-coral text-primary-foreground text-[9px] px-2 py-0.5 rounded-pill font-semibold">Popular</span>}
                </div>
                <div className="text-text-med text-xs mt-0.5">{opt.sublabel}</div>
                {opt.desc && <div className="text-text-light text-[11px] mt-0.5">{opt.desc}</div>}
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${answers[q.id] === opt.id ? "border-forest bg-forest" : "border-border"}`}>
                {answers[q.id] === opt.id && <span className="text-primary-foreground text-[10px]">✓</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
      <p className="text-text-light text-xs mt-4 text-center">🔒 We never share your data · Results appear instantly</p>
    </div>
  );
}
