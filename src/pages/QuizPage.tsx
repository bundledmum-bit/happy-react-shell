import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useCart, fmt, getBrandForBudget } from "@/lib/cart";
import { useAllProducts } from "@/hooks/useSupabaseData";
import type { Product } from "@/lib/supabaseAdapters";
import { toast } from "sonner";
import { ArrowLeft, Check, Share2, ClipboardCopy } from "lucide-react";
import ShareModal from "@/components/ShareModal";
import ExitIntentPopup from "@/components/ExitIntentPopup";

type Answers = Record<string, string>;

interface StepDef {
  id: string;
  title: string;
  sub: string;
  label: string;
  options: { id: string; emoji: string; label: string; sublabel: string; desc?: string; popular?: boolean }[];
  skippable?: boolean;
}

const STEPS: Record<string, StepDef> = {
  shopper: {
    id: "shopper", label: "Who", title: "Who are you shopping for today?", sub: "HELP US PERSONALISE YOUR BUNDLE 💛",
    options: [
      { id: "self", emoji: "🤱", label: "For me — I'm expecting!", sublabel: "Shopping for myself" },
      { id: "gift", emoji: "🎁", label: "I'm buying as a gift", sublabel: "For someone special" },
    ]
  },
  budget: {
    id: "budget", label: "Budget", title: "What's your budget range?", sub: "EVERY TIER COVERS THE ESSENTIALS — PICK WHAT FEELS RIGHT",
    options: [
      { id: "starter", emoji: "🌱", label: "Starter Bundle", sublabel: "₦15,000 – ₦35,000", desc: "The must-haves, nothing wasted. ~8 items." },
      { id: "standard", emoji: "🌿", label: "Standard Bundle", sublabel: "₦35,000 – ₦70,000", desc: "Comfortable and complete. ~12-14 items.", popular: true },
      { id: "premium", emoji: "✨", label: "Premium Bundle", sublabel: "₦70,000+", desc: "The full luxury bundle experience. ~18-22 items." },
    ]
  },
  giftFor: {
    id: "giftFor", label: "Gift For", title: "Who is this gift for?", sub: "WE'LL CURATE THE PERFECT GIFT 🎁",
    options: [
      { id: "expecting", emoji: "🤰", label: "An expecting mum", sublabel: "She hasn't delivered yet" },
      { id: "new_mum", emoji: "🤱", label: "A new mum", sublabel: "Baby is already here!" },
      { id: "both", emoji: "🎀", label: "Mum & baby together", sublabel: "Complete gift for both", popular: true },
    ]
  },
  giftRelationship: {
    id: "giftRelationship", label: "Relationship", title: "What's your relationship to the mum?", sub: "THIS HELPS US SET THE RIGHT TONE 💛",
    options: [
      { id: "partner", emoji: "💑", label: "Partner / Husband", sublabel: "Shopping for my wife/partner" },
      { id: "friend", emoji: "👯‍♀️", label: "Friend / Colleague", sublabel: "A gift from a friend" },
      { id: "family", emoji: "👪", label: "Family member", sublabel: "Sister, mum, in-law, etc." },
      { id: "other", emoji: "🎁", label: "Other", sublabel: "Just want to give a lovely gift" },
    ]
  },
  giftOccasion: {
    id: "giftOccasion", label: "Occasion", title: "What's the occasion?", sub: "WE'LL MAKE IT EXTRA SPECIAL ✨",
    options: [
      { id: "baby_shower", emoji: "🎊", label: "Baby Shower", sublabel: "Pre-birth celebration" },
      { id: "hospital_visit", emoji: "🏥", label: "Hospital Visit", sublabel: "Meeting the new baby" },
      { id: "just_because", emoji: "💛", label: "Just Because", sublabel: "No reason needed", popular: true },
      { id: "holiday", emoji: "🎄", label: "Holiday / Birthday", sublabel: "Special occasion" },
    ]
  },
  giftKnowledge: {
    id: "giftKnowledge", label: "Details", title: "How much do you know about the mum?", sub: "DON'T WORRY — WE'LL GUIDE YOU EITHER WAY",
    options: [
      { id: "lots", emoji: "📋", label: "I know her preferences", sublabel: "Gender, hospital, due date, etc." },
      { id: "some", emoji: "🤔", label: "I know some details", sublabel: "Gender or due date but not everything" },
      { id: "nothing", emoji: "🤷‍♀️", label: "Not much — surprise me!", sublabel: "I'll trust BundledMum's picks" },
    ]
  },
  scope: {
    id: "scope", label: "What You Need", title: "What would you like us to help you with?", sub: "WE'LL TAILOR YOUR RESULTS TO EXACTLY WHAT YOU NEED",
    options: [
      { id: "hospital-bag", emoji: "🏥", label: "Hospital bag essentials", sublabel: "Everything for delivery day" },
      { id: "hospital-bag+general", emoji: "🏥👶", label: "Hospital bag + general baby items", sublabel: "Delivery day + beyond" },
      { id: "general", emoji: "👶", label: "General baby & mum shopping", sublabel: "Everyday essentials" },
    ]
  },
  multiples: {
    id: "multiples", label: "How Many", title: "How many little ones?", sub: "WE'LL ADJUST QUANTITIES FOR THE FAMILY",
    options: [
      { id: "1", emoji: "👶", label: "One baby", sublabel: "Single bundle of joy" },
      { id: "2", emoji: "👶👶", label: "Twins!", sublabel: "Double the love, double the prep" },
      { id: "3", emoji: "👶👶👶", label: "Triplets or more", sublabel: "We'll make sure they're covered!" },
    ]
  },
  gender: {
    id: "gender", label: "Gender", title: "What's the baby's gender?", sub: "WE'LL PICK THE RIGHT COLOURS AND STYLES",
    options: [
      { id: "boy", emoji: "👦", label: "Boy", sublabel: "Blue & neutral tones" },
      { id: "girl", emoji: "👧", label: "Girl", sublabel: "Pink & neutral tones" },
      { id: "neutral", emoji: "🌈", label: "Don't know / Surprise!", sublabel: "Beautiful neutral options" },
    ]
  },
  stage: {
    id: "stage", label: "Stage", title: "When is your baby due (or how old now)?", sub: "WE'LL MATCH PRODUCTS TO YOUR EXACT STAGE",
    options: [
      { id: "expecting", emoji: "🤰", label: "Still Expecting", sublabel: "Getting ready for delivery" },
      { id: "newborn", emoji: "🐣", label: "Baby is here! (Newborn)", sublabel: "0 – 4 weeks old" },
      { id: "0-3m", emoji: "🍼", label: "0 – 3 Months", sublabel: "Early newborn stage" },
    ]
  },
  giftAge: {
    id: "giftAge", label: "Age", title: "How old is the baby (or when is baby due)?", sub: "WE'LL MATCH THE RIGHT PRODUCTS",
    options: [
      { id: "expecting", emoji: "🤰", label: "Still Expecting", sublabel: "Due soon" },
      { id: "newborn", emoji: "🐣", label: "Newborn", sublabel: "0 – 4 weeks" },
      { id: "0-3m", emoji: "🍼", label: "0 – 3 Months", sublabel: "Early newborn stage" },
      { id: "3-6m", emoji: "🧸", label: "3 – 6 Months", sublabel: "Starting to interact" },
      { id: "6-12m", emoji: "🚀", label: "6 – 12 Months", sublabel: "Growing fast" },
    ]
  },
  firstBaby: {
    id: "firstBaby", label: "Experience", title: "Is this her first baby?", sub: "WE'LL ADD HELPFUL EXTRAS FOR FIRST-TIME MUMS",
    skippable: true,
    options: [
      { id: "yes", emoji: "👶", label: "Yes — first time!", sublabel: "We'll include beginner-friendly extras" },
      { id: "no", emoji: "🤱", label: "Nope — experienced mum!", sublabel: "We'll skip the basics she already has" },
    ]
  },
  hospitalType: {
    id: "hospitalType", label: "Hospital", title: "What type of hospital?", sub: "WE'LL PACK ITEMS SPECIFIC TO THE HOSPITAL EXPERIENCE",
    options: [
      { id: "public", emoji: "🏥", label: "Public / General Hospital", sublabel: "Government hospital" },
      { id: "private", emoji: "🏨", label: "Private Hospital / Clinic", sublabel: "Private facility" },
      { id: "both", emoji: "🤷‍♀️", label: "Not sure", sublabel: "We'll cover both" },
    ]
  },
  deliveryMethod: {
    id: "deliveryMethod", label: "Delivery", title: "What's the delivery plan?", sub: "C-SECTION AND VAGINAL DELIVERIES NEED DIFFERENT ITEMS",
    options: [
      { id: "vaginal", emoji: "🤱", label: "Vaginal delivery", sublabel: "Natural birth" },
      { id: "csection", emoji: "🏥", label: "C-section (planned)", sublabel: "Surgical delivery" },
      { id: "both", emoji: "🤷‍♀️", label: "Not sure / could be either", sublabel: "We'll prepare for both" },
    ]
  },
  giftWrap: {
    id: "giftWrap", label: "Gift Wrap", title: "Add BundledMum Gift Wrapping?", sub: "PREMIUM PACKAGING FOR A SPECIAL TOUCH 🎀",
    options: [
      { id: "yes", emoji: "🎀", label: "Yes — add gift wrapping!", sublabel: "Premium gift box · satin ribbon · card", desc: "+₦3,500" },
      { id: "no", emoji: "📦", label: "No wrapping needed", sublabel: "Standard packaging" },
    ]
  },
  giftMessage: {
    id: "giftMessage", label: "Message", title: "Would you like to add a personal message?", sub: "WE'LL INCLUDE A HANDWRITTEN CARD IN THE BOX 💌",
    skippable: true,
    options: [
      { id: "yes", emoji: "💌", label: "Yes — I'll write one at checkout", sublabel: "Free handwritten card included" },
      { id: "no", emoji: "👍", label: "No message needed", sublabel: "The gift speaks for itself!" },
    ]
  },
};

function getGenderOptions(answers: Answers): StepDef {
  const base = { ...STEPS.gender };
  const multiples = parseInt(answers.multiples || "1");
  if (multiples >= 2) {
    base.options = [...base.options, { id: "mixed", emoji: "👦👧", label: "One of each", sublabel: "Mixed colours" }];
  }
  return base;
}

// #2: Budget is now step 2 (right after shopper for self, after giftKnowledge for gift)
function getNextStep(current: string, answer: string, answers: Answers): string | null {
  const isGift = answers.shopper === "gift";
  const scopeIncludesHospital = (answers.scope || "").includes("hospital");
  const stageVal = answers.stage || answers.giftAge || "";
  const stageIsEarlyEnough = ["expecting", "newborn"].includes(stageVal);
  const giftKnowledge = answers.giftKnowledge || "lots";

  switch (current) {
    case "shopper": return answer === "gift" ? "giftFor" : "budget"; // Self → budget immediately
    case "giftFor": return "giftRelationship";
    case "giftRelationship": return "giftOccasion";
    case "giftOccasion": return "giftKnowledge";
    case "giftKnowledge":
      if (answer === "nothing") return "budget"; // skip details, trust us
      return "budget"; // Budget after gift knowledge
    case "budget":
      if (isGift && giftKnowledge === "nothing") return "giftWrap";
      return "scope";
    case "scope": return "multiples";
    case "multiples": return "gender";
    case "gender": return isGift ? "giftAge" : "stage";
    case "giftAge":
      if (giftKnowledge === "lots") return "firstBaby";
      return "giftWrap";
    case "stage": return "firstBaby";
    case "firstBaby":
      if (scopeIncludesHospital) return "hospitalType";
      return isGift ? "giftWrap" : null;
    case "hospitalType":
      if (stageIsEarlyEnough) return "deliveryMethod";
      return isGift ? "giftWrap" : null;
    case "deliveryMethod": return isGift ? "giftWrap" : null;
    case "giftWrap": return "giftMessage";
    case "giftMessage": return null;
    default: return null;
  }
}

function getStepSequence(answers: Answers): string[] {
  const steps: string[] = ["shopper"];
  let current = "shopper";
  while (true) {
    const ans = answers[current] || "";
    const next = getNextStep(current, ans, answers);
    if (!next) break;
    steps.push(next);
    current = next;
  }
  return steps;
}

// ========= RECOMMENDATION ENGINE =========

interface RecommendedItem {
  product: Product;
  brand: any;
  quantity: number;
  color: string;
  whyIncluded: string;
}

function runRecommendationEngine(answers: Answers): RecommendedItem[] {
  const budget = answers.budget || "standard";
  const scope = answers.scope || "hospital-bag+general";
  const stageVal = answers.stage || answers.giftAge || "expecting";
  const hospitalType = answers.hospitalType || "both";
  const delivery = answers.deliveryMethod || "both";
  const gender = answers.gender || "neutral";
  const multiples = parseInt(answers.multiples || "1");
  const firstBaby = answers.firstBaby === "yes" ? true : answers.firstBaby === "no" ? false : null;

  const priorityMap: Record<string, string[]> = {
    starter: ["essential"],
    standard: ["essential", "recommended"],
    premium: ["essential", "recommended", "nice-to-have"],
  };
  const allowedPriorities = priorityMap[budget] || priorityMap.standard;

  let candidates = ALL_PRODUCTS.filter(p => allowedPriorities.includes(p.priority));

  if (scope === "hospital-bag") candidates = candidates.filter(p => p.scope.includes("hospital-bag"));
  else if (scope === "general") candidates = candidates.filter(p => p.scope.includes("general-baby-prep"));

  candidates = candidates.filter(p => p.stage.includes(stageVal));

  if (hospitalType === "public" || hospitalType === "both") {
    candidates = candidates.map(p => {
      if ([16, 19].includes(p.id) && !allowedPriorities.includes(p.priority)) return { ...p, priority: "recommended" as const };
      return p;
    });
  }
  if (hospitalType === "private" || hospitalType === "both") {
    candidates = candidates.map(p => {
      if (p.id === 18 && !allowedPriorities.includes(p.priority)) return { ...p, priority: "recommended" as const };
      return p;
    });
  }

  if (delivery === "csection" || delivery === "both") {
    candidates = candidates.map(p => {
      if ([14, 17, 20].includes(p.id)) return { ...p, priority: "essential" as const };
      return p;
    });
    const ids = new Set(candidates.map(p => p.id));
    ALL_PRODUCTS.filter(p => [14, 17, 20].includes(p.id) && !ids.has(p.id) && p.stage.includes(stageVal))
      .forEach(p => candidates.push({ ...p, priority: "essential" as const }));
  }

  candidates = candidates.filter(p => p.hospitalType.includes(hospitalType) || p.hospitalType.includes("both"));
  candidates = candidates.filter(p => p.deliveryMethod.includes(delivery) || p.deliveryMethod.includes("both"));

  const seen = new Set<number>();
  candidates = candidates.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });

  if (firstBaby === true) {
    ALL_PRODUCTS.filter(p => p.firstBaby === true && !seen.has(p.id) && p.stage.includes(stageVal))
      .forEach(p => { if (allowedPriorities.includes(p.priority) || budget === "premium") { candidates.push(p); seen.add(p.id); } });
  }

  const targetCounts: Record<string, number> = { starter: 8, standard: 14, premium: 22 };
  const target = targetCounts[budget] || 14;

  const priorityOrder = { essential: 0, recommended: 1, "nice-to-have": 2 };
  candidates.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));
  candidates = candidates.slice(0, target);

  return candidates.map(product => {
    const brand = getBrandForBudget(product, budget);
    const qty = product.category === "baby" ? Math.ceil(product.multiplesBump * (multiples - 1) + 1) : 1;
    let colorStr = "";
    if (product.genderRelevant && product.genderColors) {
      const gKey = gender === "mixed" ? "neutral" : gender;
      colorStr = (product.genderColors as any)[gKey] || product.genderColors.neutral;
    }
    let why = "";
    if (typeof product.whyIncluded === "string") why = product.whyIncluded;
    else {
      const ctx = delivery === "csection" ? "csection" : delivery === "vaginal" ? "vaginal" : hospitalType;
      why = (product.whyIncluded as any)[ctx] || (product.whyIncluded as any).public || (product.whyIncluded as any).vaginal || Object.values(product.whyIncluded)[0] || "";
    }
    return { product, brand, quantity: qty, color: colorStr, whyIncluded: why };
  });
}

// ========= PERSONALIZED STORY GENERATOR =========

function generateStory(answers: Answers, results: RecommendedItem[]): string {
  const isGift = answers.shopper === "gift";
  const gender = answers.gender || "neutral";
  const stage = answers.stage || answers.giftAge || "expecting";
  const multiples = parseInt(answers.multiples || "1");
  const hospitalType = answers.hospitalType || "";
  const delivery = answers.deliveryMethod || "";
  const firstBaby = answers.firstBaby;
  const budget = answers.budget || "standard";
  const relationship = answers.giftRelationship || "";
  const occasion = answers.giftOccasion || "";

  const genderEmoji = gender === "boy" ? "💙" : gender === "girl" ? "💗" : "💛";
  const babyWord = gender === "boy" ? "baby boy" : gender === "girl" ? "baby girl" : "little one";
  const babiesWord = multiples > 1 ? (multiples === 2 ? "twins" : "triplets") : babyWord;

  if (isGift) {
    const giftFor = answers.giftFor || "both";
    const forWho = giftFor === "expecting" ? "an expecting mum" : giftFor === "new_mum" ? `a new mum with a ${babyWord}` : `a mum and her ${babyWord}`;
    const relText = relationship === "partner" ? "Your partner" : relationship === "family" ? "Your family member" : "She";
    const occasionText = occasion === "baby_shower" ? " for her baby shower" : occasion === "hospital_visit" ? " for your hospital visit" : "";

    let story = `What a thoughtful gift${occasionText}! 🎁 This bundle is curated for ${forWho}. `;
    story += `We've included the essentials ${relText.toLowerCase()} will need right now. `;
    if (gender !== "neutral") {
      story += `Everything comes in beautiful ${gender === "boy" ? "blue and neutral" : "pink and neutral"} tones. `;
    } else {
      story += "We've chosen beautiful neutral tones that work for any baby. ";
    }
    if (answers.giftWrap === "yes") story += "Your gift will arrive in premium BundledMum packaging with a satin ribbon and handwritten card. 🎀 ";
    story += `${relText}'s going to love this.`;
    return story;
  }

  let story = "";
  if (multiples > 1) {
    story += `${multiples === 2 ? "Two babies" : "Three babies"}! Double the love, double the preparation 👶👶 We've ${multiples === 2 ? "doubled" : "tripled"} the quantities on all baby items. `;
    if (gender === "neutral") story += "Since you haven't found out the genders, everything comes in beautiful neutral tones of cream and sage. ";
    story += `You're going to be an amazing ${multiples === 2 ? "twin" : "triplet"} mum.`;
    return story;
  }

  if (stage === "expecting") story += `Congratulations, mama — you're getting ready to meet your ${babyWord}! ${genderEmoji} `;
  else story += `Welcome to motherhood${firstBaby === "no" ? " again" : ""}, mama — your ${babyWord} is here! ${genderEmoji} `;

  if (delivery === "csection") {
    story += "Since you've had a C-section, we've included extra recovery support: a belly band, compression socks, and comfortable underwear. ";
  } else if (hospitalType === "public") {
    story += "Since you're delivering at a public hospital, we've packed extra snacks and an organised records folder. ";
  } else if (hospitalType === "private") {
    story += "For your private hospital stay, we've included comfort items that'll make recovery smoother. ";
  }

  const budgetLabel = budget === "starter" ? "Starter" : budget === "premium" ? "Premium" : "Standard";
  story += `Every item in your ${budgetLabel} bundle has been hand-picked for ${stage === "expecting" ? "delivery day and beyond" : "the newborn stage"}. `;
  if (firstBaby === "yes") story += "As a first-time mum, we've added extra tools that experienced mums swear by. ";
  story += "You've got this. 💪";
  return story;
}

// ========= COMPONENTS =========

function ResultProductCard({ item, onAdd, onRemove, isInCart }: { item: RecommendedItem; onAdd: () => void; onRemove: () => void; isInCart: boolean }) {
  const { product, brand, quantity, color, whyIncluded } = item;
  const [selectedBrand, setSelectedBrand] = useState(brand);
  const lowestPrice = Math.min(...product.brands.map(b => b.price));

  return (
    <div className="bg-card rounded-card shadow-card overflow-hidden hover:shadow-card-hover transition-all group">
      <div className="relative h-36 md:h-44 flex items-center justify-center" style={{ backgroundColor: selectedBrand.color || "#F0F7F4" }}>
        {product.badge && <span className="absolute top-2.5 left-2.5 bg-coral text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-pill uppercase tracking-wide">{product.badge}</span>}
        {quantity > 1 && <span className="absolute top-2.5 right-2.5 bg-forest text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-pill">×{quantity}</span>}
        <span className="text-5xl md:text-6xl group-hover:scale-110 transition-transform duration-300">{selectedBrand.img || product.baseImg}</span>
      </div>
      <div className="p-3.5 md:p-4">
        <h3 className="pf text-sm md:text-[15px] font-bold leading-tight mb-1">{product.name}</h3>
        {color && <p className="text-text-light text-[10px] mb-1">Colour: {color}</p>}
        <p className="text-text-med text-[11px] leading-relaxed italic mb-2 line-clamp-2">{whyIncluded}</p>

        {product.packInfo && <p className="text-text-light text-[9px] mb-0.5">📦 {product.packInfo}</p>}
        {product.material && <p className="text-text-light text-[9px] mb-0.5">🧵 {product.material}</p>}

        {/* Delivery estimate */}
        <p className="text-text-light text-[9px] mb-1">🚚 Lagos: 1-2 days · Others: 3-5 days</p>

        <div className="mb-2.5">
          <p className="text-text-light text-[10px] font-semibold uppercase tracking-wider mb-1.5">Brand</p>
          <div className="flex flex-wrap gap-1.5">
            {product.brands.map(b => (
              <button key={b.id} onClick={() => setSelectedBrand(b)}
                className={`px-2 py-0.5 rounded-pill text-[10px] font-semibold border transition-all ${selectedBrand.id === b.id ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-text-med hover:border-forest/50"}`}>
                {b.label} {fmt(b.price)} {brand.id === b.id && "★"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="pf text-lg font-bold text-foreground">{fmt(selectedBrand.price * quantity)}</p>
            {product.brands.length > 1 && <p className="text-text-light text-[10px]">from {fmt(lowestPrice)}</p>}
          </div>
          {isInCart ? (
            <button onClick={onRemove} className="rounded-pill bg-forest-light border border-forest text-forest px-3 py-1.5 text-[11px] font-semibold font-body interactive flex items-center gap-1">
              ✓ Added <span className="text-destructive hover:text-destructive">×</span>
            </button>
          ) : (
            <button onClick={onAdd} className="rounded-pill bg-forest px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-forest-deep font-body interactive">+ Add</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ========= MAIN QUIZ PAGE =========

export default function QuizPage() {
  const [searchParams] = useSearchParams();
  const [answers, setAnswers] = useState<Answers>(() => {
    const initial: Answers = {};
    const scope = searchParams.get("scope");
    const multiples = searchParams.get("multiples");
    const delivery = searchParams.get("delivery");
    if (scope) initial.scope = scope;
    if (multiples) initial.multiples = multiples;
    if (delivery) initial.deliveryMethod = delivery;
    return initial;
  });
  const [history, setHistory] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState("shopper");
  const [showResults, setShowResults] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const navigate = useNavigate();
  const { addToCart, cart, setCart } = useCart();
  const { data: supabaseProducts } = useAllProducts();
  const ALL_PRODUCTS_DATA = supabaseProducts || [];

  useEffect(() => { document.title = "Build My Bundle | BundledMum"; }, []);

  const stepSequence = useMemo(() => getStepSequence(answers), [answers]);
  const currentIdx = stepSequence.indexOf(currentStep);
  const totalSteps = stepSequence.length;
  const progress = showResults ? 100 : totalSteps > 0 ? ((currentIdx + 1) / totalSteps) * 100 : 0;

  const handleAnswer = (stepId: string, optionId: string) => {
    const newAnswers = { ...answers, [stepId]: optionId };
    setAnswers(newAnswers);
    setTimeout(() => {
      const next = getNextStep(stepId, optionId, newAnswers);
      if (!next) setShowResults(true);
      else { setHistory(h => [...h, currentStep]); setCurrentStep(next); }
    }, 320);
  };

  const handleSkip = (stepId: string) => {
    const newAnswers = { ...answers, [stepId]: "skip" };
    setAnswers(newAnswers);
    const next = getNextStep(stepId, "skip", newAnswers);
    if (!next) setShowResults(true);
    else { setHistory(h => [...h, currentStep]); setCurrentStep(next); }
  };

  const handleBack = () => {
    if (showResults) { setShowResults(false); return; }
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setCurrentStep(prev);
  };

  const goToStep = (stepId: string) => {
    const idx = history.indexOf(stepId);
    if (idx === -1) return;
    setHistory(h => h.slice(0, idx));
    setCurrentStep(stepId);
    setShowResults(false);
  };

  // ========= RESULTS =========

  if (showResults) {
    const results = runRecommendationEngine(answers);
    const babyItems = results.filter(r => r.product.category === "baby");
    const mumItems = results.filter(r => r.product.category === "mum");
    const totalValue = results.reduce((s, r) => s + r.brand.price * r.quantity, 0);
    const isGift = answers.shopper === "gift";
    const budget = answers.budget || "standard";
    const multiples = parseInt(answers.multiples || "1");
    const budgetLabel = budget === "starter" ? "Starter" : budget === "premium" ? "Premium" : "Standard";

    const scope = answers.scope || "";
    const heading = isGift ? "Your Perfect Gift Bundle 🎁" : scope === "hospital-bag" ? "Your Perfect Hospital Bag" : scope.includes("general") && scope.includes("hospital") ? "Your Hospital Bag + Baby Essentials" : scope === "general" ? "Your Baby Essentials Bundle" : "Your Perfect Bundle";

    const story = generateStory(answers, results);

    // #28 Bundle savings comparison
    const separateTotal = results.reduce((s, r) => s + r.brand.price * r.quantity, 0);
    const curationSaving = Math.round(separateTotal * 0.15); // estimate ~15% curation value
    const effectiveTotal = separateTotal;

    const pillData = [
      answers.gender && answers.gender !== "neutral" ? { emoji: answers.gender === "boy" ? "👦" : "👧", label: answers.gender === "boy" ? "Boy" : "Girl", step: "gender" } : { emoji: "🌈", label: "Neutral", step: "gender" },
      answers.stage ? { emoji: "🤰", label: answers.stage === "expecting" ? "Still Expecting" : answers.stage === "newborn" ? "Newborn" : answers.stage, step: "stage" } : null,
      answers.giftAge ? { emoji: "🤰", label: answers.giftAge, step: "giftAge" } : null,
      answers.hospitalType ? { emoji: "🏥", label: answers.hospitalType === "public" ? "Public Hospital" : answers.hospitalType === "private" ? "Private Hospital" : "Any Hospital", step: "hospitalType" } : null,
      answers.deliveryMethod ? { emoji: "🤱", label: answers.deliveryMethod === "vaginal" ? "Vaginal" : answers.deliveryMethod === "csection" ? "C-Section" : "Either", step: "deliveryMethod" } : null,
      { emoji: budget === "starter" ? "🌱" : budget === "premium" ? "✨" : "🌿", label: budgetLabel, step: "budget" },
      { emoji: "👶", label: multiples === 1 ? "One Baby" : multiples === 2 ? "Twins" : "Triplets", step: "multiples" },
      isGift && answers.giftWrap === "yes" ? { emoji: "🎀", label: "Gift Wrapped", step: "giftWrap" } : null,
    ].filter(Boolean) as { emoji: string; label: string; step: string }[];

    const handleAddProduct = (item: RecommendedItem) => {
      addToCart({ ...item.product, selectedBrand: item.brand, price: item.brand.price, name: `${item.product.name} (${item.brand.label})`, img: item.brand.img || item.product.baseImg, baseImg: item.product.baseImg });
      toast.success(`✓ ${item.product.name} added to cart`);
    };

    const handleRemoveProduct = (item: RecommendedItem) => {
      setCart(prev => prev.filter(c => c.id !== item.product.id));
      toast("Removed from cart");
    };

    const handleAddAll = () => {
      results.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
          addToCart({ ...item.product, selectedBrand: item.brand, price: item.brand.price, name: `${item.product.name} (${item.brand.label})`, img: item.brand.img || item.product.baseImg, baseImg: item.product.baseImg });
        }
      });
      toast.success("✓ Your full bundle has been added to cart!");
      navigate("/cart");
    };

    // #19 Save bundle
    const handleSaveBundle = () => {
      try {
        localStorage.setItem("bm-saved-bundle", JSON.stringify({ answers, timestamp: Date.now() }));
        toast.success("💾 Bundle saved! We'll remember it when you come back.");
      } catch {}
    };

    const handleShare = () => setShowShareModal(true);

    const handleCopyChecklist = () => {
      const list = results.map(r => `${r.quantity > 1 ? `×${r.quantity} ` : ""}${r.product.name} (${r.brand.label}) — ${fmt(r.brand.price * r.quantity)}`).join("\n");
      const text = `My BundledMum ${budgetLabel} Bundle\n${"=".repeat(30)}\n\n${list}\n\nTotal: ${fmt(totalValue)}\n\nBuild yours: https://bundledmum.lovable.app/quiz`;
      navigator.clipboard.writeText(text).then(() => toast.success("Checklist copied to clipboard!"));
    };

    const shareItems = results.map(r => ({ name: r.product.name, price: r.brand.price * r.quantity }));

    return (
      <div className="min-h-screen bg-background pt-[68px] pb-16 md:pb-0">
        <div style={{ background: "linear-gradient(135deg, #2D6A4F, #1E5C44)" }} className="px-4 md:px-10 py-8 md:py-14">
          <div className="max-w-[880px] mx-auto text-center">
            <div className="animate-fade-in inline-flex items-center gap-2 bg-coral/20 border border-coral/40 rounded-pill px-4 py-1.5 mb-3.5">
              <span className="text-coral text-[13px] font-semibold">{isGift ? "🎁 Perfect Gift Bundle Ready!" : "✨ Your Personalised Bundle is Ready!"}</span>
            </div>
            <h1 className="pf text-2xl md:text-[40px] text-primary-foreground mb-3">{heading}</h1>
            <p className="text-primary-foreground/80 text-sm md:text-[15px] leading-[1.8] mb-4 max-w-[660px] mx-auto">{story}</p>

            <div className="flex flex-wrap gap-2 justify-center mb-5">
              {pillData.map(p => (
                <button key={p.step} onClick={() => goToStep(p.step)} className="bg-primary-foreground/10 border border-primary-foreground/20 rounded-pill px-3 py-1 text-primary-foreground/80 text-[11px] font-semibold hover:bg-primary-foreground/20 transition-colors">
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 justify-center text-primary-foreground/60 text-xs mb-5">
              <span>👶 {babyItems.length} baby items</span><span>·</span>
              <span>💛 {mumItems.length} mum items</span><span>·</span>
              <span>Total: {results.length} items</span><span>·</span>
              <span className="text-coral font-bold">{fmt(totalValue)}</span>
              {multiples > 1 && <><span>·</span><span>👶👶 Quantities adjusted for your {multiples === 2 ? "twins" : "triplets"}!</span></>}
            </div>

            {/* #28 Bundle savings */}
            <div className="bg-primary-foreground/[0.08] rounded-xl p-3 max-w-[400px] mx-auto mb-5">
              <div className="text-primary-foreground text-xs space-y-1">
                <div className="flex justify-between"><span>Your bundle:</span><span className="font-bold">{fmt(totalValue)}</span></div>
                <div className="flex justify-between"><span>Free curation value:</span><span className="text-coral font-bold">~{fmt(curationSaving)}</span></div>
                <div className="flex justify-between text-primary-foreground/50"><span>+ Free delivery over ₦30,000</span><span>🚚</span></div>
              </div>
              <p className="text-coral text-[11px] font-bold mt-1.5">You save time AND money with BundledMum 🎉</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center px-4 sm:px-0">
              <button onClick={() => document.getElementById("quiz-results-items")?.scrollIntoView({ behavior: "smooth" })} className="rounded-pill bg-primary-foreground/20 border border-primary-foreground/30 px-6 py-3 font-body font-semibold text-primary-foreground hover:bg-primary-foreground/30 interactive text-sm w-full sm:hidden">
                👇 See Your Items Below
              </button>
              <button onClick={handleAddAll} className="rounded-pill bg-coral px-6 sm:px-8 py-3 font-body font-semibold text-primary-foreground hover:bg-coral-dark interactive text-sm sm:text-[15px] w-full sm:w-auto">
                {isGift ? "🎁 Get Gift Bundle" : "Get Complete Bundle"} — {fmt(totalValue)} →
              </button>
              <button onClick={handleBack} className="rounded-pill border-2 border-primary-foreground/30 px-6 py-3 font-body font-semibold text-primary-foreground/80 hover:bg-primary-foreground/10 interactive text-sm sm:text-[15px] w-full sm:w-auto">
                ← Retake Quiz
              </button>
            </div>

            <div className="flex gap-3 justify-center mt-4 flex-wrap">
              <button onClick={handleShare} className="flex items-center gap-1.5 text-primary-foreground/50 text-xs hover:text-primary-foreground/80 transition-colors">
                <Share2 className="h-3.5 w-3.5" /> Share Bundle
              </button>
              <button onClick={handleCopyChecklist} className="flex items-center gap-1.5 text-primary-foreground/50 text-xs hover:text-primary-foreground/80 transition-colors">
                <ClipboardCopy className="h-3.5 w-3.5" /> Copy checklist
              </button>
              <button onClick={handleSaveBundle} className="flex items-center gap-1.5 text-primary-foreground/50 text-xs hover:text-primary-foreground/80 transition-colors">
                💾 Save My Bundle
              </button>
            </div>
          </div>
        </div>

        <div id="quiz-results-items" className="max-w-[1000px] mx-auto px-4 md:px-10 py-8 md:py-10">
          {babyItems.length > 0 && (
            <div className="mb-10">
              <h2 className="pf text-lg md:text-xl text-forest mb-4">{isGift ? "🎁 Gift for Baby" : "👶 For Baby"}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                {babyItems.map(item => (
                  <ResultProductCard
                    key={item.product.id}
                    item={item}
                    isInCart={cart.some(c => c.id === item.product.id)}
                    onAdd={() => handleAddProduct(item)}
                    onRemove={() => handleRemoveProduct(item)}
                  />
                ))}
              </div>
            </div>
          )}
          {mumItems.length > 0 && (
            <div className="mb-10">
              <h2 className="pf text-lg md:text-xl text-forest mb-4">{isGift ? "🎁 Gift for Mum" : "💛 For Mum"}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                {mumItems.map(item => (
                  <ResultProductCard
                    key={item.product.id}
                    item={item}
                    isInCart={cart.some(c => c.id === item.product.id)}
                    onAdd={() => handleAddProduct(item)}
                    onRemove={() => handleRemoveProduct(item)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* #8 Window-shopper virality share prompt */}
          <div className="bg-forest rounded-card p-6 md:p-8 text-center mb-8">
            <h3 className="pf text-xl text-primary-foreground mb-2">💬 Know Another Expecting Mum?</h3>
            <p className="text-primary-foreground/70 text-sm mb-4 max-w-[400px] mx-auto">Share BundledMum with her — she'll thank you later!</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => {
                const text = "Hey mama! 🤰 I just found this site that builds your hospital bag for you based on your budget and hospital type. Try the free quiz: https://bundledmum.lovable.app/quiz?ref=friend_share";
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
              }} className="rounded-pill bg-[#25D366] px-6 py-2.5 font-body font-semibold text-primary-foreground text-sm interactive">
                📱 Share on WhatsApp
              </button>
              <button onClick={() => {
                navigator.clipboard.writeText("https://bundledmum.lovable.app/quiz?ref=friend_share");
                toast.success("Quiz link copied!");
              }} className="rounded-pill border-2 border-primary-foreground/30 px-6 py-2.5 font-body font-semibold text-primary-foreground/80 text-sm interactive">
                📋 Copy Quiz Link
              </button>
            </div>
            <p className="text-primary-foreground/40 text-[11px] mt-3 italic">"I was so overwhelmed before finding BundledMum..." — Adaeze O., Lagos</p>
          </div>

          <div className="bg-warm-cream rounded-card p-6 md:p-10 text-center mt-6 mb-10">
            <h3 className="pf text-xl text-forest mb-2">Want to add more items?</h3>
            <p className="text-text-med text-sm mb-5 max-w-[480px] mx-auto">Your bundle covers the essentials — but every mum is different. Browse our full shop to add anything else you need.</p>
            <Link to="/shop" className="rounded-pill bg-forest px-8 py-3 font-body font-semibold text-primary-foreground hover:bg-forest-deep interactive text-sm inline-block mb-4">
              Browse All Products →
            </Link>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/shop?tab=baby" className="text-forest text-xs font-semibold hover:underline">👶 Baby Items</Link>
              <Link to="/shop?tab=mum" className="text-forest text-xs font-semibold hover:underline">💛 Mum Items</Link>
              <Link to="/bundles" className="text-forest text-xs font-semibold hover:underline">🏥 Hospital Bag Bundles</Link>
            </div>
          </div>
        </div>

        {/* Share modal */}
        {showShareModal && (
          <ShareModal
            onClose={() => setShowShareModal(false)}
            title="My Perfect Hospital Bag"
            subtitle={`${budgetLabel} Bundle · ${results.length} items`}
            items={shareItems}
            totalPrice={totalValue}
            badge={isGift ? "GIFT BUNDLE" : undefined}
            shareUrl={`https://bundledmum.lovable.app/quiz?ref=share`}
            shareText={`Check out my BundledMum ${budgetLabel} bundle! ${results.length} items for ${fmt(totalValue)}. Build yours FREE!`}
            gender={answers.gender}
            hospitalType={answers.hospitalType === "public" ? "Public Hospital" : answers.hospitalType === "private" ? "Private Hospital" : undefined}
            budgetLabel={budgetLabel}
            itemCount={results.length}
          />
        )}

        {/* Sticky mobile Add All */}
        <div className="fixed bottom-14 left-0 right-0 z-[80] bg-card border-t border-border p-3 md:hidden">
          <button onClick={handleAddAll} className="w-full rounded-pill bg-coral py-3 font-body font-semibold text-primary-foreground text-sm">
            Get Complete Bundle — {fmt(totalValue)} →
          </button>
        </div>
      </div>
    );
  }

  // ========= QUIZ STEP VIEW =========

  const stepDef = currentStep === "gender" ? getGenderOptions(answers) : STEPS[currentStep];
  if (!stepDef) return null;

  return (
    <div className="min-h-screen bg-background pt-[68px] flex flex-col items-center px-4 md:px-10 py-8 md:py-12 pb-20 md:pb-12">
      {/* Exit intent */}
      <ExitIntentPopup stepsCompleted={history.length} totalSteps={totalSteps} onContinue={() => {}} />

      <div className="w-full max-w-[660px] mb-6">
        <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
          <div className="bg-coral h-1.5 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {history.map(h => (
            <button key={h} onClick={() => goToStep(h)}
              className="flex items-center gap-1 bg-forest-light text-forest rounded-pill px-2.5 py-1 text-[10px] font-semibold hover:bg-forest/20 transition-colors">
              <Check className="h-3 w-3" /> {STEPS[h]?.label || h}
            </button>
          ))}
          <span className="flex items-center gap-1 bg-coral/15 text-coral rounded-pill px-2.5 py-1 text-[10px] font-semibold">
            {stepDef.label}
          </span>
        </div>
        <div className="flex justify-between mt-2">
          <div className="text-text-light text-xs">Step {currentIdx + 1} of {totalSteps}</div>
          {history.length > 0 && (
            <button onClick={handleBack} className="text-text-light text-xs flex items-center gap-1 font-body hover:text-foreground"><ArrowLeft className="h-3 w-3" /> Back</button>
          )}
        </div>
      </div>

      <div className="animate-fade-in bg-card rounded-[22px] p-7 md:p-12 shadow-card-hover w-full max-w-[660px]" key={currentStep}>
        <div className="text-center mb-7">
          <p className="text-text-light text-[11px] font-semibold uppercase tracking-widest mb-2">{stepDef.sub}</p>
          <h2 className="pf text-xl md:text-[30px] leading-tight">{stepDef.title}</h2>
        </div>
        <div className="flex flex-col gap-2.5">
          {stepDef.options.map(opt => (
            <button key={opt.id} onClick={() => handleAnswer(stepDef.id, opt.id)}
              className="flex items-center gap-3 p-3 md:p-4 rounded-[14px] border-2 text-left transition-all font-body border-border bg-card hover:border-forest hover:bg-forest-light">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-warm-cream rounded-[13px] flex items-center justify-center text-xl md:text-2xl flex-shrink-0">{opt.emoji}</div>
              <div className="flex-1">
                <div className="font-bold text-[13px] md:text-[15px] flex items-center gap-2 flex-wrap">
                  {opt.label}
                  {opt.popular && <span className="bg-coral text-primary-foreground text-[9px] px-2 py-0.5 rounded-pill font-semibold">Popular</span>}
                </div>
                <div className="text-text-med text-xs mt-0.5">{opt.sublabel}</div>
                {opt.desc && <div className="text-text-light text-[11px] mt-0.5">{opt.desc}</div>}
              </div>
              <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />
            </button>
          ))}
        </div>
        {stepDef.skippable && (
          <button onClick={() => handleSkip(stepDef.id)} className="w-full mt-3 text-text-light text-xs hover:text-forest transition-colors font-body">
            ⏭️ Skip this question
          </button>
        )}
      </div>
      <p className="text-text-light text-xs mt-4 text-center">🔒 We never share your data · Results appear instantly</p>
    </div>
  );
}
