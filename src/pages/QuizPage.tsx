import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCart, fmt } from "@/lib/cart";
import { useAllProducts } from "@/hooks/useSupabaseData";
import type { Product, Brand } from "@/lib/supabaseAdapters";
import { toast } from "sonner";
import { ArrowLeft, Check, Share2, ClipboardCopy, Loader2 } from "lucide-react";
import ShareModal from "@/components/ShareModal";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import ProductImage from "@/components/ProductImage";
import ProductDetailModal from "@/components/ProductDetailModal";
import { trackEvent, getSessionId, getReferralSource } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { useQuizQuestions, useQuizRoutingRules } from "@/hooks/useQuizConfig";
import { getNextStep, getStepSequence, getModifiedOptions } from "@/lib/quizEngine";
import type { QuizQuestion, QuizQuestionUiConfig } from "@/hooks/useQuizConfig";

type Answers = Record<string, string>;

interface RecommendedProduct {
  product_id: string;
  name: string;
  slug: string;
  priority: string;
  category: string;
  quantity: number;
  selected_color: string | null;
  why_included: string;
  emoji: string | null;
  image_url: string | null;
  brand: {
    id: string;
    brand_name: string;
    price: number;
    tier: string;
    image_url: string | null;
    in_stock: boolean;
    logo_url?: string | null;
  };
}

interface RecommendationResult {
  budget_tier: string;
  scope: string;
  stage: string;
  hospital_type: string;
  delivery_method: string;
  multiples: number;
  gender: string;
  first_baby: boolean;
  product_count: number;
  target_count: number;
  engine_version: string;
  products: RecommendedProduct[];
}

// ========= QUIZ SESSION TRACKING =========

let quizSessionId: string | null = null;

function getLocalSessionId(): string {
  let id = localStorage.getItem("bm_quiz_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("bm_quiz_session_id", id);
  }
  return id;
}

/** Generate a fresh session ID for a new quiz run */
function resetQuizSessionId(): string {
  const id = crypto.randomUUID();
  localStorage.setItem("bm_quiz_session_id", id);
  return id;
}

async function createQuizSession(shopperType: string) {
  // Reset session ID for each new quiz run so we don't overwrite old leads
  const sessionId = resetQuizSessionId();
  const { data } = await supabase
    .from("quiz_sessions")
    .insert({
      session_id: sessionId,
      shopper_type: shopperType,
      answers: {},
      steps_completed: [],
      current_step: "shopper",
    })
    .select("id")
    .single();
  if (data) quizSessionId = data.id;
}

async function updateQuizSession(answers: Answers, currentStep: string | null, stepsCompleted: string[]) {
  if (!quizSessionId) return;
  await supabase
    .from("quiz_sessions")
    .update({
      shopper_type: answers.shopper || null,
      answers: answers as any,
      current_step: currentStep,
      steps_completed: stepsCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quizSessionId);
}

async function completeQuizSession(answers: Answers, productCount: number, budgetTier: string) {
  if (!quizSessionId) return;
  await supabase
    .from("quiz_sessions")
    .update({
      is_completed: true,
      current_step: null,
      result_tier: budgetTier,
      result_product_count: productCount,
      dad_purpose: answers.dadPurpose || null,
      push_gift_category: answers.pushGiftCategory || null,
      push_gift_timing: answers.pushGiftTiming || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quizSessionId);
}

// ========= RESULT PRODUCT CARD =========

function ResultProductCard({ item, onAdd, onRemove, isInCart, fullProduct, onViewDetail }: {
  item: RecommendedProduct;
  onAdd: (overrideBrand?: any, overrideSize?: string) => void;
  onRemove: () => void;
  isInCart: boolean;
  fullProduct?: Product | null;
  onViewDetail?: () => void;
}) {
  const brands = fullProduct?.brands || [];
  const sizes = fullProduct?.sizes || [];

  // Default to the recommended brand, allow switching
  const recommendedBrandId = item.brand?.id;
  const [selectedBrandId, setSelectedBrandId] = useState(recommendedBrandId || "");
  const [selectedSize, setSelectedSize] = useState(sizes?.[0] || "");

  const selectedBrand = brands.find(b => b.id === selectedBrandId) || (brands.length > 0 ? brands[0] : null);
  const displayImage = selectedBrand?.imageUrl || item.brand?.image_url || item.image_url;
  const displayPrice = selectedBrand?.price ?? item.brand?.price ?? 0;
  const brandOos = selectedBrand ? (selectedBrand.inStock === false || selectedBrand.stockQuantity === 0) : false;
  const isLowStock = selectedBrand?.stockQuantity != null && selectedBrand.stockQuantity > 0 && selectedBrand.stockQuantity <= 5;
  const showSale = selectedBrand?.compareAtPrice && selectedBrand.compareAtPrice > (selectedBrand?.price || 0);

  const showAllBrands = brands.length <= 3;
  const visibleBrands = showAllBrands ? brands : brands.slice(0, 2);
  const hiddenCount = brands.length - visibleBrands.length;
  const [showMore, setShowMore] = useState(false);
  const displayBrands = showMore ? brands : visibleBrands;

  const handleAdd = () => {
    if (brandOos) return;
    onAdd(selectedBrand, selectedSize);
  };

  return (
    <div className={`bg-card rounded-card shadow-card overflow-hidden hover:shadow-card-hover transition-all group ${brandOos ? "opacity-60" : ""}`}>
      <div className="relative h-36 md:h-44 flex items-center justify-center overflow-hidden bg-muted/30 cursor-pointer" onClick={onViewDetail}>
        {item.priority === "essential" && (
          <span className="absolute top-2.5 left-2.5 bg-coral text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-pill uppercase tracking-wide z-10">Essential</span>
        )}
        {item.quantity > 1 && (
          <span className="absolute top-2.5 right-2.5 bg-forest text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-pill z-10">×{item.quantity}</span>
        )}
        {showSale && (
          <span className="absolute top-2.5 right-2.5 bg-destructive text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-pill z-10">
            Save {Math.round(((selectedBrand!.compareAtPrice! - selectedBrand!.price) / selectedBrand!.compareAtPrice!) * 100)}%
          </span>
        )}
        <ProductImage
          imageUrl={displayImage}
          emoji={item.emoji || "📦"}
          alt={item.name}
          className="w-full h-full group-hover:scale-110 transition-transform duration-300"
          emojiClassName="text-5xl md:text-6xl"
        />
      </div>
      <div className="p-3.5 md:p-4">
        <h3 className="pf text-sm md:text-[15px] font-bold leading-tight mb-1 cursor-pointer hover:text-forest transition-colors" onClick={onViewDetail}>{item.name}</h3>
        {item.selected_color && <p className="text-muted-foreground text-[10px] mb-1">Colour: {item.selected_color}</p>}
        <p className="text-forest bg-forest-light rounded-lg px-2 py-1.5 text-[10px] leading-relaxed italic mb-2 line-clamp-2">💡 {item.why_included}</p>
        {fullProduct && fullProduct.packInfo && <p className="text-muted-foreground text-[10px] mb-1">📦 {fullProduct.packInfo}</p>}

        {/* Brand selector */}
        {brands.length > 0 && (
          <div className="mb-2">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Brand</div>
            <div className="flex flex-wrap gap-1">
              {displayBrands.map(b => {
                const bOos = b.inStock === false || b.stockQuantity === 0;
                return (
                  <button key={b.id} onClick={() => setSelectedBrandId(b.id)}
                    className={`px-2 py-0.5 rounded-pill text-[10px] font-semibold border-[1.5px] transition-all font-body ${bOos ? "opacity-50" : ""} ${selectedBrandId === b.id ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-muted-foreground"}`}>
                    {b.label} {fmt(b.price)}
                    {b.id === recommendedBrandId && !bOos && <span className="text-coral ml-0.5">★</span>}
                  </button>
                );
              })}
              {hiddenCount > 0 && !showMore && (
                <button onClick={() => setShowMore(true)}
                  className="px-2 py-0.5 rounded-pill text-[10px] font-semibold border-[1.5px] border-border bg-card text-forest font-body hover:border-forest">
                  +{hiddenCount} more
                </button>
              )}
            </div>
          </div>
        )}

        {/* Size selector */}
        {sizes.length > 0 && (
          <div className="mb-2">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Size</div>
            <div className="flex flex-wrap gap-1">
              {sizes.map(s => (
                <button key={s} onClick={() => setSelectedSize(s)}
                  className={`px-2 py-0.5 rounded-pill text-[10px] font-semibold border-[1.5px] transition-all font-body ${selectedSize === s ? "border-forest bg-forest-light text-forest" : "border-border bg-card text-muted-foreground"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLowStock && <p className="text-[#E65100] text-[9px] font-semibold mb-1">🔥 Only {selectedBrand?.stockQuantity} left!</p>}

        <div className="flex items-end justify-between mt-1">
          <div>
            <p className="pf text-lg font-bold text-forest">{fmt(displayPrice * (item.quantity || 1))}</p>
            {showSale && <p className="text-muted-foreground text-[10px] line-through">{fmt(selectedBrand!.compareAtPrice!)}</p>}
            {!showSale && brands.length > 1 && <p className="text-muted-foreground text-[10px]">from {fmt(Math.min(...brands.map(b => b.price)))}</p>}
          </div>
          {brandOos ? (
            <span className="rounded-pill bg-border px-3 py-1.5 text-[10px] font-semibold text-muted-foreground font-body">Sold Out</span>
          ) : isInCart ? (
            <button onClick={onRemove} className="rounded-pill bg-forest-light border border-forest text-forest px-3 py-1.5 text-[11px] font-semibold font-body interactive flex items-center gap-1">
              ✓ Added <span className="text-destructive">×</span>
            </button>
          ) : (
            <button onClick={handleAdd} className="rounded-pill bg-forest px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-forest-deep font-body interactive">+ Add</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ========= OPTIONAL TEXT INPUT STEP (DB-driven) =========

function OptionalTextStep({
  question,
  progress,
  onSubmit,
  onSkip,
  onBack,
}: {
  question: QuizQuestion;
  progress: number;
  onSubmit: (value?: string) => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const [value, setValue] = useState("");
  const config: QuizQuestionUiConfig = question.ui_config || {};

  // For whatsapp step: no validation, accept all phone numbers
  const isWhatsappStep = question.step_id === "whatsapp";
  const regexStr = isWhatsappStep ? undefined : config.validation_regex;
  const isValid = (val: string) => {
    if (!regexStr) return true;
    const digits = val.replace(/\D/g, "");
    return new RegExp(regexStr).test(digits) || new RegExp(regexStr).test(val);
  };
  const error = value && regexStr && !isValid(value)
    ? (config.validation_error || "Invalid input")
    : "";

  // Dynamic placeholder & CTA for whatsapp step
  const placeholder = isWhatsappStep ? "Enter your Phone Number" : (config.placeholder || "");
  const ctaLabel = isWhatsappStep
    ? (value.trim() ? "Continue" : "Continue without WhatsApp")
    : (value ? (config.primary_button || "Continue →") : (config.skip_label || "Continue →"));

  return (
    <div className="min-h-screen bg-background pt-[68px] flex flex-col items-center px-4 md:px-10 py-10 md:py-14 pb-20 md:pb-12">
      <div className="w-full max-w-[660px] mb-6">
        <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
          <div className="bg-coral h-1.5 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-3">
          <div className="text-muted-foreground text-sm font-semibold">{config.page_title || ""}</div>
          <button onClick={onBack} className="text-muted-foreground text-sm flex items-center gap-1 font-body hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
        </div>
      </div>

      <div className="animate-fade-in bg-card rounded-[22px] p-7 md:p-12 shadow-card-hover w-full max-w-[660px]">
        <div className="text-center mb-7">
          {config.eyebrow && <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-widest mb-2">{config.eyebrow}</p>}
          <h2 className="pf text-xl md:text-[30px] leading-tight">{question.question_text}</h2>
          {question.sub_text && <p className="text-muted-foreground text-sm mt-2">{question.sub_text}</p>}
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <input
              type={isWhatsappStep ? "tel" : "text"}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={placeholder}
              className={`w-full rounded-[14px] border-2 px-4 py-3.5 text-sm bg-card font-body outline-none transition-colors ${error ? "border-destructive" : "border-border focus:border-forest"}`}
            />
            {error && <p className="text-destructive text-[11px]">{error}</p>}
            {!isWhatsappStep && config.helper_text && <p className="text-muted-foreground text-[11px]">{config.helper_text}</p>}
          </div>

          <button
            onClick={() => {
              if (value && regexStr && !isValid(value)) return;
              onSubmit(value || undefined);
            }}
            className="w-full rounded-pill bg-forest py-3.5 font-body font-semibold text-primary-foreground hover:bg-forest-deep interactive text-sm"
          >
            {ctaLabel}
          </button>

          {question.is_skippable && (
            <button onClick={onSkip} className="w-full text-muted-foreground text-xs hover:text-forest transition-colors font-body">
              ⏭️ {config.skip_label || "Skip"}
            </button>
          )}
        </div>
      </div>
      {config.footer_text && <p className="text-muted-foreground text-xs mt-4 text-center">{config.footer_text}</p>}
    </div>
  );
}

// ========= MAIN QUIZ PAGE =========

export default function QuizPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
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
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [quizStartTracked, setQuizStartTracked] = useState(false);
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [pushGiftRecommendation, setPushGiftRecommendation] = useState<RecommendedProduct[] | null>(null);
  const [story, setStory] = useState("");
  const [loadingResults, setLoadingResults] = useState(false);
  const [bothPhase, setBothPhase] = useState<"push-gift" | "family" | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const navigate = useNavigate();
  const { addToCart, cart, setCart } = useCart();

  // Fetch quiz config from Supabase
  const { data: questions = [], isLoading: questionsLoading } = useQuizQuestions();
  const { data: routingRules = [], isLoading: rulesLoading } = useQuizRoutingRules();
  const { data: allProducts } = useAllProducts();

  // Build a map from product_id → full Product for brand/size selectors
  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    (allProducts || []).forEach(p => map.set(p.id, p));
    return map;
  }, [allProducts]);

  const configLoading = questionsLoading || rulesLoading;

  // Set first step once config loads
  useEffect(() => {
    if (questions.length > 0 && !currentStep) {
      setCurrentStep(questions[0].step_id);
    }
  }, [questions, currentStep]);

  useEffect(() => { document.title = "Build My Bundle | BundledMum"; }, []);

  useEffect(() => {
    if (!quizStartTracked && currentStep) {
      trackEvent("quiz_started");
      setQuizStartTracked(true);
    }
  }, [quizStartTracked, currentStep]);

  // Subscribe to realtime changes — refetch on any quiz config change
  useEffect(() => {
    const channel = supabase.channel("quiz-config-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_questions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["quiz_questions"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_routing_rules" }, () => {
        queryClient.invalidateQueries({ queryKey: ["quiz_routing_rules"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const stepSequence = useMemo(
    () => getStepSequence(answers, routingRules, questions),
    [answers, routingRules, questions]
  );

  const currentIdx = currentStep ? stepSequence.indexOf(currentStep) : 0;
  const totalSteps = stepSequence.length;
  const progress = showResults ? 100 : totalSteps > 0 ? ((currentIdx + 1) / totalSteps) * 100 : 0;

  // Find current question from DB
  const currentQuestion: QuizQuestion | null = useMemo(() => {
    if (!currentStep || !questions.length) return null;
    const q = questions.find(q => q.step_id === currentStep);
    return q ? getModifiedOptions(q, answers) : null;
  }, [currentStep, questions, answers]);

  // Sort options by display_order
  const sortedOptions = useMemo(() => {
    if (!currentQuestion) return [];
    return [...currentQuestion.quiz_options]
      .filter(o => o.is_active !== false)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [currentQuestion]);

  // Determine path info
  const isDadPath = answers.shopper === "dad";
  const dadPurpose = answers.dadPurpose;
  const isBothPath = isDadPath && dadPurpose === "both";
  const isFamilyShoppingPath = isDadPath && (dadPurpose === "family-shopping" || (dadPurpose === "both" && bothPhase === "family"));

  // ========= SAVE QUIZ LEAD =========
  const saveQuizCustomer = useCallback(async (whatsappVal?: string) => {
    const sessionId = getLocalSessionId();
    const whatsapp = whatsappVal || answers.whatsapp || null;
    await supabase.rpc("save_quiz_lead", {
      p_session_id: sessionId,
      p_shopper_type: answers.shopper || null,
      p_whatsapp_number: whatsapp === "skip" ? null : whatsapp,
      p_hospital_type: answers.hospitalType || null,
      p_delivery_method: answers.deliveryMethod || null,
      p_baby_gender: answers.gender || null,
      p_budget_tier: answers.budget || answers.pushGiftBudget || null,
      p_scope: answers.scope || null,
      p_stage: answers.stage || answers.wifeStage || answers.giftAge || null,
      p_multiples: answers.multiples || "1",
      p_first_baby: answers.firstBaby === "yes",
      p_gift_wrap: answers.giftWrap === "yes",
      p_gift_message: answers.giftMessage || null,
      p_dad_purpose: answers.dadPurpose || null,
      p_push_gift_category: answers.pushGiftCategory || null,
      p_push_gift_timing: answers.pushGiftTiming || null,
      p_push_gift_budget: answers.pushGiftBudget || null,
      p_full_answers: answers as any,
      p_referral_source: document.referrer || "direct",
      p_page_url: window.location.href,
    });
  }, [answers]);

  // Save WhatsApp number separately (called from whatsapp step)
  const saveWhatsAppNumber = useCallback(async (phoneNumber: string | null) => {
    const sessionId = getLocalSessionId();
    await supabase.rpc("save_quiz_lead", {
      p_session_id: sessionId,
      p_whatsapp_number: phoneNumber,
    });
  }, []);

  // ========= PUSH GIFT RECOMMENDATION =========
  const fetchPushGiftResults = useCallback(async () => {
    const { data, error } = await supabase.rpc("run_push_gift_recommendation", {
      p_budget_tier: answers.pushGiftBudget || "push-standard",
      p_category: answers.pushGiftCategory || null,
      p_timing: answers.pushGiftTiming || null,
    });
    if (error) throw error;
    return (data as any)?.products || data || [];
  }, [answers]);

  // ========= FAMILY SHOPPING RECOMMENDATION =========
  const fetchFamilyResults = useCallback(async () => {
    const { data, error } = await supabase.rpc("run_quiz_recommendation", {
      p_budget_tier: answers.budget || "standard",
      p_scope: answers.scope || "hospital-bag+general",
      p_stage: answers.wifeStage || answers.stage || answers.giftAge || "expecting",
      p_hospital_type: answers.hospitalType || "both",
      p_delivery_method: answers.deliveryMethod || "both",
      p_multiples: parseInt(answers.multiples || "1"),
      p_gender: answers.gender || "neutral",
      p_first_baby: answers.firstBaby === "yes",
      p_shopper_type: isDadPath ? "dad" : (answers.shopper || "self"),
      p_gift_for: answers.giftFor || null,
    });
    if (error) throw error;
    return data as unknown as RecommendationResult;
  }, [answers, isDadPath]);

  const finishQuiz = useCallback(async (whatsapp?: string) => {
    setLoadingResults(true);
    trackEvent("quiz_completed", {
      hospital_type: answers.hospitalType,
      delivery_method: answers.deliveryMethod,
      baby_gender: answers.gender,
      budget_tier: answers.budget,
      dad_purpose: dadPurpose,
    });

    await saveQuizCustomer(whatsapp);

    try {
      if (isBothPath && bothPhase !== "family") {
        const pushProducts = await fetchPushGiftResults();
        setPushGiftRecommendation(pushProducts as RecommendedProduct[]);
        setBothPhase("push-gift");
        setShowResults(true);
        setLoadingResults(false);
        return;
      }

      const rec = await fetchFamilyResults();
      setRecommendation(rec);

      const { data: storyData } = await supabase.rpc("generate_quiz_story", {
        p_shopper_type: isDadPath ? "dad" : (answers.shopper || "self"),
        p_budget_tier: answers.budget || "standard",
        p_gender: answers.gender || "neutral",
        p_multiples: parseInt(answers.multiples || "1"),
        p_delivery_method: answers.deliveryMethod || "vaginal",
        p_hospital_type: answers.hospitalType || "public",
        p_first_baby: answers.firstBaby === "yes",
        p_gift_relationship: answers.giftRelationship || null,
        p_gift_occasion: answers.giftOccasion || null,
        p_gift_wrap: answers.giftWrap === "yes",
        p_product_count: rec.product_count,
        p_stage: answers.stage || answers.wifeStage || answers.giftAge || "expecting",
        p_scope: answers.scope || "hospital-bag",
      });
      setStory((storyData as string) || "Your personalised bundle is ready!");

      await completeQuizSession(answers, rec.product_count, rec.budget_tier);
    } catch (err) {
      console.error("Recommendation engine error:", err);
      toast.error("Something went wrong generating your bundle. Please try again.");
    }

    setShowResults(true);
    setLoadingResults(false);
  }, [answers, saveQuizCustomer, dadPurpose, isBothPath, bothPhase, fetchPushGiftResults, fetchFamilyResults, isDadPath]);

  // Continue to family shopping from push gift results (both path)
  const continueToBothFamilyShopping = useCallback(() => {
    setBothPhase("family");
    setShowResults(false);
    setCurrentStep("budget");
    setHistory(prev => [...prev, "pushGiftResults"]);
  }, []);

  // Finish the family portion of the both path
  const finishBothFamilyPath = useCallback(async (whatsapp?: string) => {
    setLoadingResults(true);
    try {
      const rec = await fetchFamilyResults();
      setRecommendation(rec);

      const { data: storyData } = await supabase.rpc("generate_quiz_story", {
        p_shopper_type: "dad",
        p_budget_tier: answers.budget || "standard",
        p_gender: answers.gender || "neutral",
        p_multiples: parseInt(answers.multiples || "1"),
        p_delivery_method: answers.deliveryMethod || "vaginal",
        p_hospital_type: answers.hospitalType || "public",
        p_first_baby: answers.firstBaby === "yes",
        p_gift_relationship: null,
        p_gift_occasion: null,
        p_gift_wrap: false,
        p_product_count: rec.product_count,
        p_stage: answers.stage || answers.wifeStage || "expecting",
        p_scope: answers.scope || "hospital-bag",
      });
      setStory((storyData as string) || "Your personalised bundle is ready!");
      await completeQuizSession(answers, rec.product_count, rec.budget_tier);
    } catch (err) {
      console.error("Family recommendation error:", err);
      toast.error("Something went wrong. Please try again.");
    }
    setShowResults(true);
    setLoadingResults(false);
  }, [answers, fetchFamilyResults]);

  // ========= ANSWER HANDLER (fully DB-driven) =========
  const handleAnswer = useCallback((stepId: string, optionId: string) => {
    const newAnswers = { ...answers, [stepId]: optionId };
    setAnswers(newAnswers);

    // Create session on first answer
    if (stepId === "shopper" && !quizSessionId) {
      createQuizSession(optionId);
    }

    setTimeout(() => {
      const next = getNextStep(stepId, optionId, newAnswers, routingRules, questions);
      const newSteps = [...history, stepId];

      if (!next) {
        setHistory(newSteps);
        if (isBothPath && bothPhase === "family") {
          finishBothFamilyPath();
        } else {
          finishQuiz();
        }
      } else {
        setHistory(newSteps);
        setCurrentStep(next);
      }

      updateQuizSession(newAnswers, next || null, newSteps);
    }, 320);
  }, [answers, routingRules, questions, history, isBothPath, bothPhase, finishQuiz, finishBothFamilyPath]);

  const handleOptionalTextSubmit = useCallback((stepId: string, value?: string) => {
    const newAnswers = { ...answers, [stepId]: value || "skip" };
    setAnswers(newAnswers);

    // Save WhatsApp number separately when on whatsapp step
    if (stepId === "whatsapp") {
      saveWhatsAppNumber(value || null);
    }

    const next = getNextStep(stepId, value || "skip", newAnswers, routingRules, questions);
    if (!next) {
      setHistory(h => [...h, stepId]);
      if (isBothPath && bothPhase === "family") {
        finishBothFamilyPath(value);
      } else {
        finishQuiz(value);
      }
    } else {
      setHistory(h => [...h, stepId]);
      setCurrentStep(next);
    }
    updateQuizSession(newAnswers, next || null, [...history, stepId]);
  }, [answers, routingRules, questions, history, isBothPath, bothPhase, finishQuiz, finishBothFamilyPath, saveWhatsAppNumber]);

  const handleSkip = useCallback((stepId: string) => {
    const newAnswers = { ...answers, [stepId]: "skip" };
    setAnswers(newAnswers);

    // Save WhatsApp as null when skipped
    if (stepId === "whatsapp") {
      saveWhatsAppNumber(null);
    }

    const next = getNextStep(stepId, "skip", newAnswers, routingRules, questions);
    if (!next) {
      setHistory(h => [...h, currentStep!]);
      if (isBothPath && bothPhase === "family") {
        finishBothFamilyPath();
      } else {
        finishQuiz();
      }
    } else {
      setHistory(h => [...h, currentStep!]);
      setCurrentStep(next);
    }
    updateQuizSession(newAnswers, next || null, [...history, currentStep!]);
  }, [answers, routingRules, questions, currentStep, history, isBothPath, bothPhase, finishQuiz, finishBothFamilyPath, saveWhatsAppNumber]);

  const handleBack = useCallback(() => {
    if (showResults) { setShowResults(false); return; }
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setCurrentStep(prev);
  }, [showResults, history]);

  const goToStep = useCallback((stepId: string) => {
    const idx = history.indexOf(stepId);
    if (idx === -1) return;
    setHistory(h => h.slice(0, idx));
    setCurrentStep(stepId);
    setShowResults(false);
  }, [history]);

  // ========= LOADING =========
  if (configLoading || !currentStep) {
    return (
      <div className="min-h-screen bg-background pt-[68px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-forest mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // ========= HELPER: Add product to cart =========
  const handleAddProduct = (item: RecommendedProduct, overrideBrand?: Brand | null, overrideSize?: string) => {
    const brandName = overrideBrand?.label || item.brand?.brand_name || "Standard";
    const brandPrice = overrideBrand?.price ?? item.brand?.price ?? 0;
    const brandId = overrideBrand?.id || item.brand?.id || item.product_id;
    const brandImage = overrideBrand?.imageUrl || item.brand?.image_url || item.image_url || undefined;
    addToCart({
      id: item.product_id,
      name: `${item.name} (${brandName})`,
      baseImg: item.emoji || "📦",
      imageUrl: brandImage,
      price: brandPrice,
      selectedBrand: { id: brandId, label: brandName, price: brandPrice, img: item.emoji || "📦", imageUrl: brandImage || null, tier: overrideBrand?.tier || 1, color: overrideBrand?.color || "#E8F5E9" },
      selectedSize: overrideSize || "",
      brands: [],
      category: item.category as any,
      rating: 4.5,
      reviews: 0,
      tags: [],
      badge: null,
      stage: [],
      priority: item.priority as any,
      tier: [],
      hospitalType: [],
      deliveryMethod: [],
      genderRelevant: false,
      multiplesBump: 1,
      scope: [],
      firstBaby: null,
      description: "",
      whyIncluded: item.why_included,
    });
    toast.success(`✓ ${item.name} added to cart`);
  };

  const handleRemoveProduct = (item: RecommendedProduct) => {
    setCart(prev => prev.filter(c => c.id !== item.product_id));
    toast("Removed from cart");
  };

  const addedIds = new Set(cart.map(c => c.id));

  // ========= PUSH GIFT ONLY RESULTS (both path phase 1) =========
  if (showResults && bothPhase === "push-gift" && pushGiftRecommendation && !recommendation) {
    const pushProducts = pushGiftRecommendation;
    const pushTotal = pushProducts.reduce((s, r) => s + (r.brand?.price || 0) * (r.quantity || 1), 0);
    const budgetLabel = answers.pushGiftBudget === "push-starter" ? "Thoughtful" : answers.pushGiftBudget === "push-premium" ? "Go All Out" : "Generous";

    return (
      <div className="min-h-screen bg-background pt-[68px] pb-16 md:pb-0">
        <div style={{ background: "linear-gradient(135deg, #F4845F, #D4613C)" }} className="px-4 md:px-10 py-8 md:py-14">
          <div className="max-w-[880px] mx-auto text-center">
            <div className="animate-fade-in inline-flex items-center gap-2 bg-primary-foreground/20 border border-primary-foreground/40 rounded-pill px-4 py-1.5 mb-3.5">
              <span className="text-primary-foreground text-[13px] font-semibold">💝 Her Perfect Push Gift</span>
            </div>
            <h1 className="pf text-2xl md:text-[40px] text-primary-foreground mb-3">She Deserves This</h1>
            <p className="text-primary-foreground/80 text-sm md:text-[15px] leading-[1.8] mb-4 max-w-[660px] mx-auto">
              You picked a {budgetLabel} push gift — here's what we recommend for her.
            </p>
            <div className="flex flex-wrap gap-3 justify-center text-primary-foreground/60 text-xs mb-5">
              <span>💝 {pushProducts.length} items</span><span>·</span>
              <span className="text-primary-foreground font-bold">{fmt(pushTotal)}</span>
            </div>
          </div>
        </div>

        <div className="max-w-[1000px] mx-auto px-4 md:px-10 py-8 md:py-10">
          <h2 className="pf text-lg md:text-xl text-coral mb-4">💝 Push Gift for Her</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 mb-10">
            {pushProducts.map(item => (
              <ResultProductCard
                key={item.product_id}
                item={item}
                isInCart={addedIds.has(item.product_id)}
                onAdd={(brand, size) => handleAddProduct(item, brand, size)}
                onRemove={() => handleRemoveProduct(item)}
                fullProduct={productMap.get(item.product_id)}
              />
            ))}
          </div>

          <div className="bg-forest rounded-card p-6 md:p-8 text-center">
            <h3 className="pf text-xl text-primary-foreground mb-2">Now Shop the Family Essentials</h3>
            <p className="text-primary-foreground/70 text-sm mb-4 max-w-[400px] mx-auto">
              You've picked her push gift — now let's build the family's hospital bag bundle.
            </p>
            <button
              onClick={continueToBothFamilyShopping}
              className="rounded-pill bg-coral px-8 py-3 font-body font-semibold text-primary-foreground hover:bg-coral-dark interactive text-sm md:text-[15px]"
            >
              Now Shop the Family Essentials →
            </button>
          </div>
        </div>

        <div className="fixed bottom-14 left-0 right-0 z-[80] bg-card border-t border-border p-3 md:hidden">
          <button onClick={continueToBothFamilyShopping} className="w-full rounded-pill bg-forest py-3 font-body font-semibold text-primary-foreground text-sm">
            Now Shop the Family Essentials →
          </button>
        </div>
      </div>
    );
  }

  // ========= RESULTS =========
  if (showResults && recommendation) {
    const results = recommendation.products;
    const babyItems = results.filter(r => r.category === "baby");
    const mumItems = results.filter(r => r.category === "mum");
    const totalValue = results.reduce((s, r) => s + (r.brand?.price || 0) * (r.quantity || 1), 0);
    const pushTotal = pushGiftRecommendation ? pushGiftRecommendation.reduce((s, r) => s + (r.brand?.price || 0) * (r.quantity || 1), 0) : 0;
    const grandTotal = totalValue + pushTotal;
    const isGift = answers.shopper === "gift";
    const budget = answers.budget || "standard";
    const multiples = parseInt(answers.multiples || "1");
    const budgetLabel = budget === "starter" ? "Starter" : budget === "premium" ? "Premium" : "Standard";
    const isFallback = recommendation.engine_version?.includes("fallback");

    const recScope = recommendation.scope || answers.scope || "";
    let heading: string;
    if (isBothPath && pushGiftRecommendation) {
      heading = "Your Complete Order 💙💝";
    } else if (isFamilyShoppingPath || (isDadPath && dadPurpose === "family-shopping")) {
      heading = "Here's What Your Family Needs 💙";
    } else if (isGift) {
      heading = "Your Perfect Gift Bundle 🎁";
    } else if (recScope === "hospital-bag") {
      heading = "Your Perfect Hospital Bag 🏥";
    } else if (recScope === "general-baby-prep") {
      heading = "Your Baby Prep Bundle 👶";
    } else if (recScope === "hospital-bag+general") {
      heading = "Your Hospital Bag & Baby Prep Bundle";
    } else {
      heading = "Your Perfect Bundle";
    }

    let subHeading = story;
    if (isDadPath && dadPurpose === "family-shopping") {
      subHeading = "You're doing a great thing — here's the full bundle based on what you told us.";
    }

    const curationSaving = Math.round(grandTotal * 0.15);

    const pillData = [
      answers.gender && answers.gender !== "neutral" ? { emoji: answers.gender === "boy" ? "👦" : "👧", label: answers.gender === "boy" ? "Boy" : "Girl", step: "gender" } : { emoji: "🌈", label: "Neutral", step: "gender" },
      answers.stage || answers.wifeStage ? { emoji: "🤰", label: (answers.wifeStage || answers.stage) === "expecting" ? "Still Expecting" : (answers.wifeStage || answers.stage) === "newborn" ? "Newborn" : (answers.wifeStage || answers.stage), step: "wifeStage" } : null,
      answers.giftAge ? { emoji: "🤰", label: answers.giftAge, step: "giftAge" } : null,
      answers.hospitalType ? { emoji: "🏥", label: answers.hospitalType === "public" ? "Public Hospital" : answers.hospitalType === "private" ? "Private Hospital" : "Any Hospital", step: "hospitalType" } : null,
      answers.deliveryMethod ? { emoji: "🤱", label: answers.deliveryMethod === "vaginal" ? "Vaginal" : answers.deliveryMethod === "csection" ? "C-Section" : "Either", step: "deliveryMethod" } : null,
      { emoji: budget === "starter" ? "🌱" : budget === "premium" ? "✨" : "🌿", label: budgetLabel, step: "budget" },
      { emoji: "👶", label: multiples === 1 ? "One Baby" : multiples === 2 ? "Twins" : "Triplets", step: "multiples" },
      isGift && answers.giftWrap === "yes" ? { emoji: "🎀", label: "Gift Wrapped", step: "giftWrap" } : null,
    ].filter(Boolean) as { emoji: string; label: string; step: string }[];

    const handleAddAll = () => {
      const allProducts = [...results, ...(pushGiftRecommendation || [])];
      allProducts.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
          handleAddProduct(item);
        }
      });
      toast.success("✓ Your full bundle has been added to cart!");
      navigate("/cart");
    };

    const handleShare = () => setShowShareModal(true);
    const handleCopyChecklist = () => {
      const allProducts = [...(pushGiftRecommendation || []), ...results];
      const list = allProducts.map(r => `${r.quantity > 1 ? `×${r.quantity} ` : ""}${r.name} (${r.brand?.brand_name || "Standard"}) — ${fmt((r.brand?.price || 0) * (r.quantity || 1))}`).join("\n");
      const text = `My BundledMum ${budgetLabel} Bundle\n${"=".repeat(30)}\n\n${list}\n\nTotal: ${fmt(grandTotal)}\n\nBuild yours: https://bundledmum.lovable.app/quiz`;
      navigator.clipboard.writeText(text).then(() => toast.success("Checklist copied to clipboard!"));
    };

    const shareItems = [...(pushGiftRecommendation || []), ...results].map(r => ({ name: r.name, price: (r.brand?.price || 0) * (r.quantity || 1) }));

    return (
      <div className="min-h-screen bg-background pt-[68px] pb-16 md:pb-0">
        <div style={{ background: "linear-gradient(135deg, #2D6A4F, #1E5C44)" }} className="px-4 md:px-10 py-8 md:py-14">
          <div className="max-w-[880px] mx-auto text-center">
            {isFallback && (
              <div className="bg-amber-500/20 border border-amber-500/40 rounded-lg px-4 py-2 mb-4 inline-block">
                <p className="text-amber-200 text-xs">We widened your results to ensure a complete bundle — all items are relevant to your stage.</p>
              </div>
            )}
            <div className="animate-fade-in inline-flex items-center gap-2 bg-coral/20 border border-coral/40 rounded-pill px-4 py-1.5 mb-3.5">
              <span className="text-coral text-[13px] font-semibold">{isGift ? "🎁 Perfect Gift Bundle Ready!" : isDadPath ? "💙 Your Bundle is Ready!" : "✨ Your Personalised Bundle is Ready!"}</span>
            </div>
            <h1 className="pf text-2xl md:text-[40px] text-primary-foreground mb-3">{heading}</h1>
            <p className="text-primary-foreground/80 text-sm md:text-[15px] leading-[1.8] mb-4 max-w-[660px] mx-auto">{subHeading}</p>

            <div className="flex flex-wrap gap-2 justify-center mb-5">
              {pillData.map(p => (
                <button key={p.step} onClick={() => goToStep(p.step)} className="bg-primary-foreground/10 border border-primary-foreground/20 rounded-pill px-3 py-1 text-primary-foreground/80 text-[11px] font-semibold hover:bg-primary-foreground/20 transition-colors">
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 justify-center text-primary-foreground/60 text-xs mb-5">
              {pushGiftRecommendation && <><span>💝 {pushGiftRecommendation.length} push gift items</span><span>·</span></>}
              <span>👶 {babyItems.length} baby items</span><span>·</span>
              <span>💛 {mumItems.length} mum items</span><span>·</span>
              <span>Total: {results.length + (pushGiftRecommendation?.length || 0)} items</span><span>·</span>
              <span className="text-coral font-bold">{fmt(grandTotal)}</span>
              {multiples > 1 && <><span>·</span><span>👶👶 Quantities adjusted for your {multiples === 2 ? "twins" : "triplets"}!</span></>}
            </div>

            <div className="bg-primary-foreground/[0.08] rounded-xl p-3 max-w-[400px] mx-auto mb-5">
              <div className="text-primary-foreground text-xs space-y-1">
                <div className="flex justify-between"><span>Your bundle:</span><span className="font-bold">{fmt(grandTotal)}</span></div>
                <div className="flex justify-between"><span>Free curation value:</span><span className="text-coral font-bold">~{fmt(curationSaving)}</span></div>
                <div className="flex justify-between text-primary-foreground/50"><span>+ Free delivery on qualifying orders</span><span>🚚</span></div>
              </div>
              <p className="text-coral text-[11px] font-bold mt-1.5">You save time AND money with BundledMum 🎉</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center px-4 sm:px-0">
              <button onClick={() => document.getElementById("quiz-results-items")?.scrollIntoView({ behavior: "smooth" })} className="rounded-pill bg-primary-foreground/20 border border-primary-foreground/30 px-6 py-3 font-body font-semibold text-primary-foreground hover:bg-primary-foreground/30 interactive text-sm w-full sm:hidden">
                👇 See Your Items Below
              </button>
              <button onClick={handleAddAll} className="rounded-pill bg-coral px-6 sm:px-8 py-3 font-body font-semibold text-primary-foreground hover:bg-coral-dark interactive text-sm sm:text-[15px] w-full sm:w-auto">
                {isGift ? "🎁 Get Gift Bundle" : "Get Complete Bundle"} — {fmt(grandTotal)} →
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
            </div>
          </div>
        </div>

        <div id="quiz-results-items" className="max-w-[1000px] mx-auto px-4 md:px-10 py-8 md:py-10">
          {pushGiftRecommendation && pushGiftRecommendation.length > 0 && (
            <div className="mb-10">
              <h2 className="pf text-lg md:text-xl text-coral mb-4">💝 Push Gift for Her</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                {pushGiftRecommendation.map(item => (
                  <ResultProductCard
                    key={item.product_id}
                    item={item}
                    isInCart={addedIds.has(item.product_id)}
                    onAdd={(brand, size) => handleAddProduct(item, brand, size)}
                    onRemove={() => handleRemoveProduct(item)}
                    fullProduct={productMap.get(item.product_id)}
                  />
                ))}
              </div>
            </div>
          )}

          {babyItems.length > 0 && (
            <div className="mb-10">
              <h2 className="pf text-lg md:text-xl text-forest mb-4">{isGift ? "🎁 Gift for Baby" : isBothPath ? "👶 Family Bundle — Baby" : "👶 For Baby"}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                {babyItems.map(item => (
                  <ResultProductCard
                    key={item.product_id}
                    item={item}
                    isInCart={addedIds.has(item.product_id)}
                    onAdd={(brand, size) => handleAddProduct(item, brand, size)}
                    onRemove={() => handleRemoveProduct(item)}
                    fullProduct={productMap.get(item.product_id)}
                  />
                ))}
              </div>
            </div>
          )}
          {mumItems.length > 0 && (
            <div className="mb-10">
              <h2 className="pf text-lg md:text-xl text-forest mb-4">{isGift ? "🎁 Gift for Mum" : isBothPath ? "💛 Family Bundle — Mum" : "💛 For Mum"}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                {mumItems.map(item => (
                  <ResultProductCard
                    key={item.product_id}
                    item={item}
                    isInCart={addedIds.has(item.product_id)}
                    onAdd={(brand, size) => handleAddProduct(item, brand, size)}
                    onRemove={() => handleRemoveProduct(item)}
                    fullProduct={productMap.get(item.product_id)}
                  />
                ))}
              </div>
            </div>
          )}

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
          </div>

          <div className="bg-warm-cream rounded-card p-6 md:p-10 text-center mt-6 mb-10">
            <h3 className="pf text-xl text-forest mb-2">Want to add more items?</h3>
            <p className="text-muted-foreground text-sm mb-5 max-w-[480px] mx-auto">Your bundle covers the essentials — but every mum is different. Browse our full shop to add anything else you need.</p>
            <Link to="/shop" className="rounded-pill bg-forest px-8 py-3 font-body font-semibold text-primary-foreground hover:bg-forest-deep interactive text-sm inline-block mb-4">
              Browse All Products →
            </Link>
          </div>
        </div>

        {showShareModal && (
          <ShareModal
            onClose={() => setShowShareModal(false)}
            title="My Perfect Hospital Bag"
            subtitle={`${budgetLabel} Bundle · ${results.length} items`}
            items={shareItems}
            totalPrice={grandTotal}
            badge={isGift ? "GIFT BUNDLE" : undefined}
            shareUrl="https://bundledmum.lovable.app/quiz?ref=share"
            shareText={`Check out my BundledMum ${budgetLabel} bundle! ${results.length + (pushGiftRecommendation?.length || 0)} items for ${fmt(grandTotal)}. Build yours FREE!`}
            gender={answers.gender}
            hospitalType={answers.hospitalType === "public" ? "Public Hospital" : answers.hospitalType === "private" ? "Private Hospital" : undefined}
            budgetLabel={budgetLabel}
            itemCount={results.length + (pushGiftRecommendation?.length || 0)}
          />
        )}

        <div className="fixed bottom-14 left-0 right-0 z-[80] bg-card border-t border-border p-3 md:hidden">
          <button onClick={handleAddAll} className="w-full rounded-pill bg-coral py-3 font-body font-semibold text-primary-foreground text-sm">
            Get Complete Bundle — {fmt(grandTotal)} →
          </button>
        </div>
      </div>
    );
  }

  // ========= LOADING RESULTS =========
  if (loadingResults) {
    return (
      <div className="min-h-screen bg-background pt-[68px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-coral mx-auto mb-4" />
          <h2 className="pf text-xl text-foreground mb-2">Building your perfect bundle...</h2>
          <p className="text-muted-foreground text-sm">Our engine is picking the best items for you ✨</p>
        </div>
      </div>
    );
  }

  // ========= OPTIONAL TEXT INPUT STEP (DB-driven: whatsapp, giftMessage, etc.) =========
  if (currentQuestion && currentQuestion.input_type === "optional_text") {
    return (
      <OptionalTextStep
        question={currentQuestion}
        progress={progress}
        onSubmit={(val) => handleOptionalTextSubmit(currentQuestion.step_id, val)}
        onSkip={() => handleSkip(currentQuestion.step_id)}
        onBack={handleBack}
      />
    );
  }

  // ========= QUIZ STEP VIEW =========
  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-background pt-[68px] flex flex-col items-center px-4 md:px-10 py-8 md:py-12 pb-20 md:pb-12">
      <ExitIntentPopup stepsCompleted={history.length} totalSteps={totalSteps} onContinue={() => {}} />

      <div className="w-full max-w-[660px] mb-6">
        <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
          <div className="bg-coral h-1.5 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {history.map(h => {
            const q = questions.find(q => q.step_id === h);
            return (
              <button key={h} onClick={() => goToStep(h)}
                className="flex items-center gap-1 bg-forest-light text-forest rounded-pill px-2.5 py-1 text-[10px] font-semibold hover:bg-forest/20 transition-colors">
                <Check className="h-3 w-3" /> {q?.step_label || h}
              </button>
            );
          })}
          <span className="flex items-center gap-1 bg-coral/15 text-coral rounded-pill px-2.5 py-1 text-[10px] font-semibold">
            {currentQuestion.step_label}
          </span>
        </div>
        <div className="flex justify-between mt-2">
          <div className="text-muted-foreground text-xs">Step {currentIdx + 1} of {totalSteps}</div>
          {history.length > 0 && (
            <button onClick={handleBack} className="text-muted-foreground text-xs flex items-center gap-1 font-body hover:text-foreground"><ArrowLeft className="h-3 w-3" /> Back</button>
          )}
        </div>
      </div>

      <div className="animate-fade-in bg-card rounded-[22px] p-7 md:p-12 shadow-card-hover w-full max-w-[660px]" key={currentStep}>
        <div className="text-center mb-7">
          <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-widest mb-2">{currentQuestion.sub_text || ""}</p>
          <h2 className="pf text-xl md:text-[30px] leading-tight">{currentQuestion.question_text}</h2>
        </div>
        <div className="flex flex-col gap-2.5">
          {sortedOptions.map(opt => (
            <button key={opt.option_value} onClick={() => handleAnswer(currentQuestion.step_id, opt.option_value)}
              className="flex items-center gap-3 p-3 md:p-4 rounded-[14px] border-2 text-left transition-all font-body border-border bg-card hover:border-forest hover:bg-forest-light">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-warm-cream rounded-[13px] flex items-center justify-center text-xl md:text-2xl flex-shrink-0">{opt.option_emoji || "📋"}</div>
              <div className="flex-1">
                <div className="font-bold text-[13px] md:text-[15px] flex items-center gap-2 flex-wrap">
                  {opt.option_label}
                  {opt.price_modifier != null && opt.price_modifier > 0 && (
                    <span className="text-coral text-[10px] font-semibold">+{fmt(opt.price_modifier)}</span>
                  )}
                </div>
                {opt.option_description && <div className="text-muted-foreground text-xs mt-0.5">{opt.option_description}</div>}
              </div>
              <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />
            </button>
          ))}
        </div>
        {currentQuestion.is_skippable && (
          <button onClick={() => handleSkip(currentQuestion.step_id)} className="w-full mt-3 text-muted-foreground text-xs hover:text-forest transition-colors font-body">
            ⏭️ Skip this question
          </button>
        )}
      </div>
      <p className="text-muted-foreground text-xs mt-4 text-center">🔒 No login needed · Free forever</p>
    </div>
  );
}
