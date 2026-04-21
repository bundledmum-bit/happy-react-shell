import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart, fmt } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";
import BMLoadingAnimation from "@/components/BMLoadingAnimation";
import { useShippingZones, calculateDeliveryFee, type ShippingZone } from "@/hooks/useShippingZones";
import { useDeliverableStates } from "@/hooks/useDeliverableStates";
import { useSiteSettings, useAllProducts } from "@/hooks/useSupabaseData";
import { useSpendThresholds, getSpendPrompt } from "@/hooks/useSpendThresholds";
import { trackEvent, getSessionId, getAttribution, markSessionConverted } from "@/lib/analytics";
import { syncOrderToSheets } from "@/lib/googleSheets";

interface FormData {
  firstName: string; lastName: string; phone: string; email: string;
  address: string; city: string; state: string; notes: string;
  lga?: string;
}

type SavedOrderResult = { id: string; orderNumber: string | null };

export default function CheckoutPage() {
  const { cart, subtotal, clearCart, totalItems } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>({ firstName: "", lastName: "", phone: "", email: "", address: "", city: "", state: "Lagos", notes: "", lga: "" });
  const [payment, setPayment] = useState<"card" | "transfer" | "ussd">("card");
  const [giftWrap, setGiftWrap] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [mobileOrderOpen, setMobileOrderOpen] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; discount_type: string; discount_value: number; discount_amount: number } | null>(null);

  // Referral state
  const [referralCode, setReferralCode] = useState("");
  const [referralLoading, setReferralLoading] = useState(false);
  const [appliedReferral, setAppliedReferral] = useState<{ id: string; code: string; discount_amount: number } | null>(null);

  // Dynamic settings from DB
  const { data: settings } = useSiteSettings();
  const { data: zones } = useShippingZones();
  const { data: thresholds } = useSpendThresholds();
  const { data: deliverableStates, isLoading: statesLoading } = useDeliverableStates(true);
  const { data: allProducts } = useAllProducts();

  // Currently-selected delivery zone (null when the selected state has
  // no zones, or the user hasn't picked a zone yet).
  const [selectedZone, setSelectedZone] = useState<ShippingZone | null>(null);
  // Name of the currently-selected LGA within the zone. Empty until the
  // user picks one (or auto-selected when the zone has only one LGA).
  const [selectedLga, setSelectedLga] = useState<string>("");
  const zonesForState = (zones || []).filter(z => (z.states || []).includes(form.state));
  // Zone availability is now driven by the DB's deliverable_states
  // table: a state only shows the zone cascade when admins have flagged
  // has_zones = true AND an active ShippingZone row references it.
  const activeState = (deliverableStates || []).find(s => s.name === form.state);
  const stateHasZones = activeState?.has_zones === true && zonesForState.length > 0;
  const lgasForZone = selectedZone?.lgas || [];
  const areasForLga = selectedZone?.lgas?.find(l => l.lga === selectedLga)?.areas || [];

  // Once deliverable states load, set the form's state to the first
  // active state if the current form.state isn't in the list.
  useEffect(() => {
    if (!deliverableStates || deliverableStates.length === 0) return;
    const stillValid = deliverableStates.some(s => s.name === form.state);
    if (!stillValid) {
      setForm(p => ({ ...p, state: deliverableStates[0].name }));
      setSelectedZone(null);
      setSelectedLga("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliverableStates]);

  // When a zone with exactly one LGA is selected, auto-fill the LGA.
  useEffect(() => {
    if (selectedZone && selectedZone.lgas && selectedZone.lgas.length === 1 && !selectedLga) {
      setSelectedLga(selectedZone.lgas[0].lga);
    }
  }, [selectedZone, selectedLga]);

  // When the chosen LGA has exactly one area, auto-fill form.city.
  useEffect(() => {
    if (!selectedLga || !selectedZone) return;
    const lga = selectedZone.lgas?.find(l => l.lga === selectedLga);
    if (lga && lga.areas.length === 1 && form.city !== lga.areas[0]) {
      setForm(p => ({ ...p, city: lga.areas[0] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLga, selectedZone]);

  // Payment method toggles from site_settings
  const [enabledPayments, setEnabledPayments] = useState<Record<string, boolean>>({ card: true, transfer: true, ussd: true });
  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["payment_method_card_enabled", "payment_method_transfer_enabled", "payment_method_ussd_enabled"])
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, boolean> = { card: true, transfer: true, ussd: true };
        for (const row of data) {
          const val = row.value === true || row.value === "true" || row.value === "1";
          if (row.key === "payment_method_card_enabled") map.card = val;
          if (row.key === "payment_method_transfer_enabled") map.transfer = val;
          if (row.key === "payment_method_ussd_enabled") map.ussd = val;
        }
        setEnabledPayments(map);
        const enabled = Object.entries(map).filter(([, v]) => v).map(([k]) => k);
        if (enabled.length === 1) setPayment(enabled[0] as any);
        else if (enabled.length > 0 && !map[payment]) setPayment(enabled[0] as any);
      });
  }, []);

  useEffect(() => {
    document.title = "Secure Checkout | BundledMum";
    trackEvent("checkout_started", { item_count: totalItems, subtotal });
  }, []);

  useEffect(() => {
    if (cart.length === 0 && !processing) navigate("/cart");
  }, [cart, processing]);

  // Returning customer recognition: pre-fill from existing customer data
  const [customerLookedUp, setCustomerLookedUp] = useState(false);
  useEffect(() => {
    const phone = form.phone.replace(/\D/g, "");
    if (phone.length >= 10 && !customerLookedUp) {
      setCustomerLookedUp(true);
      supabase.functions.invoke("get-order-confirmation", {
        body: { lookup_customer_phone: form.phone },
      }).then(({ data }) => {
        if (data?.customer) {
          const c = data.customer;
          const [first, ...rest] = (c.full_name || "").split(" ");
          setForm(prev => ({
            ...prev,
            firstName: prev.firstName || first || "",
            lastName: prev.lastName || rest.join(" ") || "",
            address: prev.address || c.delivery_address || "",
            city: prev.city || c.delivery_area || "",
            state: prev.state || c.delivery_state || prev.state,
          }));
          toast.success("Welcome back! We've pre-filled your details.");
        }
      }).catch(() => {});
    }
  }, [form.phone]);

  const serviceFeeEnabled = settings?.service_fee_enabled !== false;
  const serviceFee = serviceFeeEnabled ? (parseInt(settings?.service_fee) || 0) : 0;
  const serviceFeeLabel = settings?.service_fee_label || "Service & Packaging";

  const defaultDeliveryFee = parseInt(settings?.default_delivery_fee) || 0;
  const defaultFreeThreshold = parseInt(settings?.default_free_threshold) || 0;
  const giftWrapPrice = parseInt(settings?.gift_wrapping_price) || 0;

  const bankName = settings?.bank_name || "";
  const bankAccountName = settings?.bank_account_name || "";
  const bankAccountNumber = settings?.bank_account_number || "";

  // Total cart weight (kg) — used for weight-based interstate delivery
  // pricing. Look up each cart item's weight_kg on the live product record;
  // fall back to a conservative 0.5 kg per item when a product has no
  // weight set so the interstate fee is never 0.
  const cartWeightKg = (() => {
    if (!cart?.length) return 0;
    const byId = new Map<string, number>();
    (allProducts || []).forEach((p: any) => {
      const w = Number(p?.weight_kg);
      if (p?.id != null && isFinite(w) && w > 0) byId.set(String(p.id), w);
    });
    return cart.reduce((sum, item) => {
      const w = byId.get(String(item.id)) ?? 0.5;
      return sum + w * (item.qty || 0);
    }, 0);
  })();

  // Delivery fee from DB zones
  const deliveryCalc = zones?.length
    ? calculateDeliveryFee(subtotal, form.city, form.state, zones, serviceFee, defaultDeliveryFee, defaultFreeThreshold, cartWeightKg)
    : { fee: defaultFreeThreshold && subtotal >= defaultFreeThreshold ? 0 : defaultDeliveryFee, isFree: defaultFreeThreshold > 0 && subtotal >= defaultFreeThreshold, zoneName: "Standard", daysMin: 1, daysMax: 3, freeThreshold: defaultFreeThreshold, isInterstate: false as const };
  const delivery = deliveryCalc.fee;

  // Spend threshold discount
  const spendPrompt = thresholds?.length ? getSpendPrompt(subtotal, thresholds) : null;
  const spendDiscount = spendPrompt?.appliedDiscount || 0;

  // Coupon discount — already calculated server-side by validate_coupon RPC
  const couponDiscount = appliedCoupon?.discount_amount || 0;
  // Referral discount
  const referralDiscount = appliedReferral?.discount_amount || 0;

  const giftWrapFee = giftWrap ? giftWrapPrice : 0;
  const grand = Math.max(0, subtotal + delivery + serviceFee + giftWrapFee - couponDiscount - referralDiscount - spendDiscount);

  // Delivery date estimate
  const now = new Date();
  const fromDate = new Date(now); fromDate.setDate(fromDate.getDate() + deliveryCalc.daysMin);
  const toDate = new Date(now); toDate.setDate(toDate.getDate() + deliveryCalc.daysMax);
  const fmtDate = (d: Date) => d.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" });

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) { toast.error("Enter a coupon code"); return; }
    setCouponLoading(true);
    try {
      const { data, error } = await supabase.rpc("validate_coupon", {
        coupon_code: code,
        order_amount: subtotal,
      });
      if (error) throw error;
      const result = typeof data === "string" ? JSON.parse(data) : data;
      if (!result?.valid) {
        toast.error(result?.message || "Invalid coupon code");
        setCouponLoading(false);
        return;
      }
      setAppliedCoupon({
        id: result.coupon_id,
        code,
        discount_type: result.discount_type,
        discount_value: result.discount_value || 0,
        discount_amount: result.discount_amount || 0,
      });
      toast.success(result.message || `Coupon "${code}" applied!`);
    } catch {
      toast.error("Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const applyReferral = async () => {
    const code = referralCode.trim().toUpperCase();
    if (!code) { toast.error("Enter a referral code"); return; }
    if (!form.email) { toast.error("Enter your email first — we need it to validate the referral"); return; }
    setReferralLoading(true);
    try {
      const { data, error } = await supabase.rpc("validate_referral_code", {
        p_code: code,
        p_order_amount: subtotal,
        p_redeemer_email: form.email,
        p_redeemer_phone: form.phone,
      });
      if (error) throw error;
      const result = typeof data === "string" ? JSON.parse(data) : data;
      if (!result?.valid) {
        toast.error(result?.message || "Invalid referral code");
        setReferralLoading(false);
        return;
      }
      setAppliedReferral({
        id: result.referral_code_id,
        code,
        discount_amount: result.discount_amount || 0,
      });
      toast.success(result.message || `Referral code "${code}" applied — saving ${fmt(result.discount_amount)}!`);
    } catch {
      toast.error("Failed to validate referral code");
    } finally {
      setReferralLoading(false);
    }
  };

  const update = (key: keyof FormData, val: string) => {
    setForm(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: undefined }));
  };

  const validateField = (key: keyof FormData): string | undefined => {
    const val = form[key].trim();
    if (key === "firstName" && !val) return "First name is required";
    if (key === "lastName" && !val) return "Last name is required";
    if (key === "phone") {
      const digits = val.replace(/\D/g, "");
      if (!digits || digits.length < 10) return "Valid phone required";
      if (!/^0[789][01]\d{8}$/.test(digits) && digits.length < 10) return "Enter a valid Nigerian phone (e.g. 08012345678)";
    }
    if (key === "email") {
      if (!val) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Enter a valid email address";
    }
    if (key === "address" && !val) return "Street address is required";
    // City is only required when the selected state has mapped zones
    // (today: Lagos). Other states can leave city blank since there's
    // no zone-backed list to pick from.
    if (key === "city" && !val && stateHasZones) return "City is required";
    return undefined;
  };

  const handleBlur = (key: keyof FormData) => {
    const error = validateField(key);
    setErrors(p => ({ ...p, [key]: error }));
  };

  const saveAbandonedCart = async () => {
    if (!form.email?.includes("@") || cart.length === 0) return;
    try {
      await (supabase as any).from("abandoned_carts").upsert(
        {
          email: form.email.toLowerCase().trim(),
          phone: form.phone || null,
          cart_items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
          cart_total: subtotal,
          recovered: false,
        },
        { onConflict: "email" }
      );
    } catch (e) {
      // Silent fail — never block checkout
    }
  };

  const validate = () => {
    const fields: (keyof FormData)[] = ["firstName", "lastName", "phone", "email", "address", "city"];
    const e: Partial<FormData> = {};
    fields.forEach(key => { const err = validateField(key); if (err) e[key] = err; });
    setErrors(e);
    if (Object.keys(e).length) toast.error("Please fill all required fields correctly");
    return !Object.keys(e).length;
  };

  const buildOrderData = (cartItems: typeof cart, paystackRef?: string, paystackStatus?: string) => ({
    timestamp: new Date().toISOString(),
    customerName: `${form.firstName} ${form.lastName}`,
    email: form.email, phone: form.phone, address: form.address, city: form.city, state: form.state,
    deliveryNotes: form.notes,
    items: cartItems,
    itemsSummary: cartItems.map(i => `${i.name} x${i.qty}`).join(", "),
    subtotal, deliveryFee: delivery, serviceFee, giftWrapFee,
    total: grand,
    paymentMethod: payment,
    paymentStatus: payment === "transfer" ? "PENDING_TRANSFER" : "PAID",
    paystackRef: paystackRef || null,
    paystackStatus: paystackStatus || null,
    giftWrap, notes: "",
  });

  const saveOrderToDb = async (orderData: ReturnType<typeof buildOrderData>, cartItems: typeof cart): Promise<SavedOrderResult | null> => {
    try {
      // Get quiz answers from localStorage saved bundle if available
      let quizAnswers: any = null;
      try {
        const savedBundle = localStorage.getItem("bm-saved-bundle");
        if (savedBundle) {
          const parsed = JSON.parse(savedBundle);
          if (parsed.answers) {
            quizAnswers = {
              hospital_type: parsed.answers.hospitalType || null,
              delivery_method: parsed.answers.deliveryMethod || null,
              baby_gender: parsed.answers.gender || null,
              budget_tier: parsed.answers.budget || null,
            };
          }
        }
      } catch {}

      // Check if this is a quiz order
      const sessionId = getSessionId();
      let isQuizOrder = false;
      try {
        const { data: quizMatch } = await supabase
          .from("quiz_customers")
          .select("id")
          .eq("session_id", sessionId)
          .limit(1)
          .maybeSingle();
        isQuizOrder = !!quizMatch;
      } catch {}

      // Get traffic attribution
      const attribution = getAttribution();

      // Use edge function to place order (bypasses RLS SELECT restriction)
      const quizSessionId = localStorage.getItem("bm_quiz_session_id");

      // Build items array and validate before sending
      const orderItemsPayload = (orderData.items?.length ? orderData.items : cartItems).map(item => ({
        name: item.name,
        brandName: item.selectedBrand?.label || "Standard",
        brandId: item.selectedBrand?.id || null,
        productId: item.id || null,
        qty: item.qty,
        price: item.price,
        size: item.selectedSize || null,
        color: item.selectedColor || null,
        bundleName: item.bundleName || null,
      }));

      if (!orderItemsPayload.length) {
        console.error("[checkout] items array is empty — cart:", cartItems);
        toast.error("Your cart appears to be empty. Please add items before checking out.");
        return null;
      }

      console.log(`[checkout] sending ${orderItemsPayload.length} items to place-order`);

      const { data: result, error: fnError } = await supabase.functions.invoke("place-order", {
        body: {
          order: {
            customer_name: `${form.firstName} ${form.lastName}`,
            customer_email: form.email,
            customer_phone: form.phone,
            delivery_address: form.address,
            delivery_city: form.city,
            delivery_state: form.state,
            delivery_notes: form.notes || null,
            subtotal: orderData.subtotal,
            delivery_fee: orderData.deliveryFee,
            service_fee: orderData.serviceFee,
            total: orderData.total,
            discount: 0,
            discount_amount: couponDiscount > 0 ? couponDiscount : 0,
            coupon_id: appliedCoupon?.id || null,
            referral_code_used: appliedReferral?.code || null,
            spend_discount_amount: spendDiscount > 0 ? spendDiscount : 0,
            spend_discount_percent: spendPrompt?.currentDiscount?.discount_percent || null,
            payment_reference: orderData.paystackRef,
            payment_status: orderData.paymentStatus === "PAID" ? "paid" : "pending",
            payment_method: orderData.paymentMethod,
            order_status: "confirmed",
            gift_wrapping: orderData.giftWrap,
            estimated_delivery_start: fromDate.toISOString().split("T")[0],
            estimated_delivery_end: toDate.toISOString().split("T")[0],
            quiz_answers: quizAnswers,
            is_quiz_order: isQuizOrder,
            is_bundle_order: cart.some(i => !!i.bundleName),
            utm_source: attribution.utm_source,
            utm_medium: attribution.utm_medium,
            utm_campaign: attribution.utm_campaign,
            utm_content: attribution.utm_content,
            utm_term: attribution.utm_term,
            traffic_source: attribution.traffic_source,
            referrer: attribution.referrer,
            landing_page: attribution.landing_page,
          },
          items: orderItemsPayload,
          customer: {
            email: form.email,
            name: `${form.firstName} ${form.lastName}`,
            phone: form.phone,
            address: form.address,
            city: form.city,
            state: form.state,
          },
          quiz: {
            sessionId: quizSessionId || sessionId,
          },
          referral: appliedReferral ? {
            referral_code_id: appliedReferral.id,
            discount_amount: appliedReferral.discount_amount,
            redeemer_email: form.email,
            redeemer_phone: form.phone,
          } : null,
        },
      });

      if (fnError || !result?.id) {
        console.error("place-order failed:", fnError, result);
        toast.error(`Order failed: ${fnError?.message || result?.error || "Unknown error"}`);
        return null;
      }

      // Mark session as converted
      markSessionConverted();

      // Track order_placed event
      trackEvent("order_placed", {
        order_id: result.id,
        order_number: result.order_number,
        total: orderData.total,
        item_count: cart.length,
      });

      // Auto-assign a courier (silent — never blocks checkout).
      // The bundle tier comes from the quiz answers stored with the
      // order; falls back to "standard" when no quiz context exists.
      try {
        const budgetTier = quizAnswers?.budget_tier || "standard";
        const { data: courier } = await (supabase.rpc as any)("get_courier_assignment", {
          p_delivery_city: form.city,
          p_delivery_state: form.state,
          p_bundle_tier: budgetTier,
          p_order_day: new Date().toLocaleDateString("en-US", { weekday: "long" }),
        });
        if (courier) {
          await (supabase.from("orders") as any).update({
            delivery_partner: courier.partner,
            courier_note: courier.note,
          }).eq("id", result.id);
        }
      } catch (err) {
        console.warn("Courier assignment skipped:", err);
      }

      return { id: result.id, orderNumber: result.order_number };
    } catch (e) {
      console.error("DB save failed:", e);
      return null;
    }
  };

  const placeOrder = async () => {
    if (!cart.length) {
      toast.error("Your cart is empty. Please add items before checking out.");
      navigate("/cart");
      return;
    }
    if (!validate()) return;

    const cartSnapshot = [...cart];
    setProcessing(true);

    if (payment === "transfer") {
      const orderData = buildOrderData(cartSnapshot);
      const savedOrder = await saveOrderToDb(orderData, cartSnapshot);
      if (!savedOrder) {
        setProcessing(false);
        toast.error("We couldn't place your order. Please try again.");
        return;
      }
      await syncOrderToSheets({
        orderId: savedOrder.id,
        orderNumber: savedOrder.orderNumber,
        fallbackData: orderData,
      });
      clearCart();
      navigate(`/order-confirmed?order=${encodeURIComponent(savedOrder.orderNumber || "")}`);
      return;
    }

    try {
      const PaystackPop = (await import("@paystack/inline-js")).default;
      const popup = new PaystackPop();
      const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_ee6db593cdee9f92b4114a9b15f4a2a72e71ee20";
      popup.newTransaction({
        key: paystackKey,
        email: form.email, amount: grand * 100, currency: "NGN",
        ref: `BM-${Date.now()}`, firstname: form.firstName, lastname: form.lastName,
        channels: payment === "ussd" ? ["ussd"] : ["card", "bank_transfer", "ussd", "qr", "mobile_money", "bank"],
        onSuccess: async (transaction: { reference: string; status: string }) => {
          const orderData = buildOrderData(cartSnapshot, transaction.reference, "pending");
          const savedOrder = await saveOrderToDb(orderData, cartSnapshot);
          if (!savedOrder) {
            setProcessing(false);
            toast.error("We couldn't place your order. Please try again.");
            return;
          }

          const { data: verification, error: verifyError } = await supabase.functions.invoke("process-payment", {
            body: { reference: transaction.reference, order_id: savedOrder.orderNumber },
          });

          if (verifyError || !verification?.verified) {
            setProcessing(false);
            toast.error("Payment verification failed. Please contact support.");
            return;
          }

          await syncOrderToSheets({
            orderId: savedOrder.id,
            orderNumber: savedOrder.orderNumber,
            fallbackData: orderData,
          });
          clearCart();
          navigate(`/order-confirmed?order=${encodeURIComponent(savedOrder.orderNumber || "")}`);
        },
        onCancel: () => { setProcessing(false); toast.error("Payment cancelled"); },
      });
    } catch {
      const orderData = buildOrderData(cartSnapshot, "DEMO-" + Date.now(), "success");
      const savedOrder = await saveOrderToDb(orderData, cartSnapshot);
      if (!savedOrder) {
        setProcessing(false);
        toast.error("We couldn't place your order. Please try again.");
        return;
      }
      await syncOrderToSheets({
        orderId: savedOrder.id,
        orderNumber: savedOrder.orderNumber,
        fallbackData: orderData,
      });
      clearCart();
      navigate(`/order-confirmed?order=${encodeURIComponent(savedOrder.orderNumber || "")}`);
    }
  };

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "transparent" }}>
        <div className="text-center animate-fade-up">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <BMLoadingAnimation size={180} />
          </div>
          <p className="pf text-lg text-forest">Confirming your order...</p>
          <p className="font-body text-sm text-text-med mt-1">Please don't close this page 🔒</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20" style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1E5C44 100%)" }}>
        <div className="max-w-[1100px] mx-auto px-4 md:px-10 py-8 md:py-10">
          <Link to="/cart" className="text-primary-foreground/50 text-xs hover:text-primary-foreground/70 transition-colors">← Back to Cart</Link>
          <h1 className="pf text-2xl md:text-4xl text-primary-foreground mt-2">🔒 Secure Checkout</h1>
          <p className="text-primary-foreground/50 text-xs mt-2 font-body">Guest Checkout — no account needed. We only use your details to deliver your order.</p>
          <div className="flex items-center gap-2 mt-3">
            {["Delivery Details", "Payment"].map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground ${i === 0 ? "bg-coral" : "bg-primary-foreground/25"}`}>{i + 1}</div>
                <span className="text-primary-foreground/75 text-xs">{s}</span>
                {i < 1 && <span className="text-primary-foreground/30 ml-1">›</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 md:px-10 py-6 md:py-10">
        {/* Mobile order summary toggle */}
        <div className="lg:hidden mb-4">
          <button onClick={() => setMobileOrderOpen(!mobileOrderOpen)} className="w-full bg-card rounded-card shadow-card p-4 flex justify-between items-center">
            <span className="font-body font-semibold text-sm">{totalItems} items · {fmt(grand)}</span>
            <span className="flex items-center gap-1 text-forest text-xs font-semibold">
              {mobileOrderOpen ? "Hide" : "View details"} {mobileOrderOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </span>
          </button>
          {mobileOrderOpen && (
            <div className="bg-card rounded-b-card shadow-card p-4 -mt-1 animate-fade-in space-y-2">
              {cart.map(item => (
                <div key={item._key} className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {(item.img && item.img.startsWith("http")) ? <img src={item.img} alt={item.name} className="w-6 h-6 rounded object-cover flex-shrink-0" /> : <span className="text-lg">{item.img || "📦"}</span>}
                    <span className="truncate max-w-[180px]">{item.bundleName ? `[${item.bundleName}] ` : ""}{item.name} ×{item.qty}</span>
                  </div>
                  <span className="font-bold">{fmt(item.price * item.qty)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-text-med">Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between">
                  <span className="text-text-med">
                    Delivery ({deliveryCalc.zoneName})
                    {deliveryCalc.isInterstate && (deliveryCalc as any).bookingsNeeded ? (
                      <span className="block text-[10px] text-text-light mt-0.5">
                        ~{Number((deliveryCalc as any).weightKg).toFixed(1)}kg · {(deliveryCalc as any).bookingsNeeded} eFTD booking{(deliveryCalc as any).bookingsNeeded === 1 ? "" : "s"} · final fee confirmed at dispatch
                      </span>
                    ) : null}
                  </span>
                  <span className={delivery === 0 ? "text-forest" : ""}>{delivery === 0 ? "FREE 🎉" : fmt(delivery)}</span>
                </div>
                <div className="flex justify-between"><span className="text-text-med">{serviceFeeLabel}</span><span>{fmt(serviceFee)}</span></div>
                {giftWrap && <div className="flex justify-between"><span className="text-text-med">Gift Wrapping</span><span>{fmt(giftWrapPrice)}</span></div>}
                {couponDiscount > 0 && <div className="flex justify-between text-forest"><span>🏷️ Coupon ({appliedCoupon?.code})</span><span>-{fmt(couponDiscount)}</span></div>}
                {referralDiscount > 0 && <div className="flex justify-between text-forest"><span>🎁 Referral ({appliedReferral?.code})</span><span>-{fmt(referralDiscount)}</span></div>}
                {spendDiscount > 0 && <div className="flex justify-between text-forest"><span>🎉 Spend Discount</span><span>-{fmt(spendDiscount)}</span></div>}
                <div className="flex justify-between font-bold text-sm pt-1"><span>Total</span><span className="text-forest">{fmt(grand)}</span></div>
                <div className="text-[10px] text-text-light mt-1">🚚 Est. {fmtDate(fromDate)} – {fmtDate(toDate)}</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {/* Delivery Details */}
            <div className="bg-card rounded-card shadow-card p-4 md:p-8">
              <h2 className="pf text-lg mb-4">📍 Delivery Details</h2>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col md:flex-row gap-3">
                  <InputField label="First Name" value={form.firstName} onChange={v => update("firstName", v)} onBlur={() => handleBlur("firstName")} error={errors.firstName} />
                  <InputField label="Last Name" value={form.lastName} onChange={v => update("lastName", v)} onBlur={() => handleBlur("lastName")} error={errors.lastName} />
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <InputField label="Phone Number" value={form.phone} onChange={v => update("phone", v)} onBlur={() => handleBlur("phone")} error={errors.phone} type="tel" placeholder="08012345678" />
                  <InputField label="Email Address" value={form.email} onChange={v => update("email", v)} onBlur={() => { handleBlur("email"); saveAbandonedCart(); }} error={errors.email} type="email" placeholder="you@example.com" />
                </div>
                <InputField label="Street Address" value={form.address} onChange={v => update("address", v)} onBlur={() => handleBlur("address")} error={errors.address} />

                {/* State → Zone → LGA → City cascade */}
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-xs font-semibold text-text-med uppercase tracking-wide">State</label>
                    {statesLoading ? (
                      <div className="w-full h-[42px] rounded-[10px] border-[1.5px] border-border bg-muted/40 animate-pulse" aria-label="Loading states" />
                    ) : (
                      <select
                        value={form.state}
                        onChange={e => {
                          const nextState = e.target.value;
                          update("state", nextState);
                          setSelectedZone(null);
                          setSelectedLga("");
                          update("city", "");
                          setForm(p => ({ ...p, lga: "" }));
                        }}
                        className="w-full rounded-[10px] border-[1.5px] border-border px-3 py-2.5 text-sm bg-card font-body focus:border-forest outline-none transition-colors"
                      >
                        {(deliverableStates || []).map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {stateHasZones && (
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-xs font-semibold text-text-med uppercase tracking-wide">Delivery Zone</label>
                      <select
                        value={selectedZone?.id || ""}
                        onChange={e => {
                          const zone = zonesForState.find(z => z.id === e.target.value) || null;
                          setSelectedZone(zone);
                          setSelectedLga("");
                          update("city", "");
                          setForm(p => ({ ...p, lga: "" }));
                        }}
                        className="w-full rounded-[10px] border-[1.5px] border-border px-3 py-2.5 text-sm bg-card font-body focus:border-forest outline-none transition-colors"
                      >
                        <option value="">Select your delivery zone</option>
                        {zonesForState.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {/* LGA — only when a zone is selected */}
                {stateHasZones && selectedZone && lgasForZone.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-text-med uppercase tracking-wide">Local Government Area</label>
                    <select
                      value={selectedLga}
                      onChange={e => {
                        const next = e.target.value;
                        setSelectedLga(next);
                        update("city", "");
                        setForm(p => ({ ...p, lga: next }));
                      }}
                      className="w-full rounded-[10px] border-[1.5px] border-border px-3 py-2.5 text-sm bg-card font-body focus:border-forest outline-none transition-colors"
                    >
                      <option value="">Select your LGA</option>
                      {lgasForZone.map(l => <option key={l.lga} value={l.lga}>{l.lga}</option>)}
                    </select>
                  </div>
                )}

                {/* City / Town — only when an LGA is selected */}
                {stateHasZones && selectedZone && selectedLga && (
                  areasForLga.length === 1 ? (
                    <InputField label="City / Town" value={form.city} onChange={() => {}} disabled />
                  ) : (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-text-med uppercase tracking-wide">City / Town</label>
                      <select
                        value={form.city}
                        onChange={e => update("city", e.target.value)}
                        onBlur={() => handleBlur("city")}
                        className={`w-full rounded-[10px] border-[1.5px] px-3 py-2.5 text-sm bg-card font-body focus:border-forest outline-none transition-colors ${errors.city ? "border-destructive" : "border-border"}`}
                      >
                        <option value="">Select your area</option>
                        {areasForLga.map(area => <option key={area} value={area}>{area}</option>)}
                      </select>
                      {errors.city && <p className="text-destructive text-[11px]">{errors.city}</p>}
                    </div>
                  )
                )}

                {/* Non-Lagos states — free-text city/town fallback */}
                {!stateHasZones && (
                  <InputField label="City / Town" value={form.city} onChange={v => update("city", v)} onBlur={() => handleBlur("city")} error={errors.city} />
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-med uppercase tracking-wide">Delivery Notes (Optional)</label>
                  <textarea value={form.notes} onChange={e => update("notes", e.target.value)} className="w-full rounded-[10px] border-[1.5px] border-border px-3 py-2.5 text-sm bg-card font-body resize-y h-20 focus:border-forest outline-none" placeholder="E.g. Landmark, gate colour..." />
                </div>

                {/* Gift Wrapping */}
                <div onClick={() => setGiftWrap(g => !g)} className={`mt-1 flex items-center gap-3.5 p-4 rounded-[14px] border-2 cursor-pointer transition-all ${giftWrap ? "border-[#FFD54F] bg-[#FFF8E1]" : "border-border bg-warm-cream"}`}>
                  <span className="text-3xl flex-shrink-0">🎀</span>
                  <div className="flex-1">
                    <div className="font-bold text-sm flex items-center gap-2 flex-wrap">
                      Add Gift Wrapping
                      <span className="bg-[#FFD54F] text-[#7B5E00] text-[10px] px-2 py-0.5 rounded-[10px] font-bold">+{fmt(giftWrapPrice)}</span>
                    </div>
                    <div className="text-text-med text-xs mt-0.5">Premium gift box · satin ribbon · handwritten card · branded tissue paper</div>
                  </div>
                  <div className={`w-5 h-5 rounded-md flex-shrink-0 border-2 flex items-center justify-center transition-all ${giftWrap ? "border-[#F9A825] bg-[#F9A825]" : "border-border bg-card"}`}>
                    {giftWrap && <span className="text-primary-foreground text-xs font-bold">✓</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Coupon Code */}
            <div className="bg-card rounded-card shadow-card p-4 md:p-8">
              <h2 className="pf text-lg mb-4">🏷️ Have a Coupon?</h2>
              {appliedReferral ? (
                <div className="text-text-light text-xs">Cannot combine with referral code. Remove your referral code to use a coupon.</div>
              ) : appliedCoupon ? (
                <div className="flex items-center justify-between bg-forest-light rounded-[10px] p-3">
                  <div>
                    <span className="text-forest font-bold text-sm">{appliedCoupon.code}</span>
                    <span className="text-forest text-xs ml-2">— saving {fmt(couponDiscount)}</span>
                  </div>
                  <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="text-destructive text-xs font-semibold hover:underline">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter coupon code"
                    className="flex-1 rounded-[10px] border-[1.5px] border-border px-3 py-2.5 text-sm bg-card font-body focus:border-forest outline-none uppercase" />
                  <button onClick={applyCoupon} disabled={couponLoading}
                    className="rounded-[10px] bg-forest px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-forest-deep disabled:opacity-50 font-body">
                    {couponLoading ? "..." : "Apply"}
                  </button>
                </div>
              )}
            </div>

            {/* Referral Code */}
            <div className="bg-card rounded-card shadow-card p-4 md:p-8">
              <h2 className="pf text-lg mb-4">🎁 Referral Code</h2>
              {appliedCoupon ? (
                <div className="text-text-light text-xs">Cannot combine with coupon. Remove your coupon to use a referral code.</div>
              ) : appliedReferral ? (
                <div className="flex items-center justify-between bg-forest-light rounded-[10px] p-3">
                  <div>
                    <span className="text-forest font-bold text-sm">{appliedReferral.code}</span>
                    <span className="text-forest text-xs ml-2">— saving {fmt(referralDiscount)}</span>
                  </div>
                  <button onClick={() => { setAppliedReferral(null); setReferralCode(""); }} className="text-destructive text-xs font-semibold hover:underline">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())} placeholder="Enter referral code"
                    className="flex-1 rounded-[10px] border-[1.5px] border-border px-3 py-2.5 text-sm bg-card font-body focus:border-forest outline-none uppercase" />
                  <button onClick={applyReferral} disabled={referralLoading}
                    className="rounded-[10px] bg-forest px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-forest-deep disabled:opacity-50 font-body">
                    {referralLoading ? "..." : "Apply"}
                  </button>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-card rounded-card shadow-card p-4 md:p-8">
              <h2 className="pf text-lg mb-4">💳 Payment Method</h2>
              <div className="flex flex-col gap-2.5">
                {(() => {
                  const allMethods = [
                    { id: "card" as const, icon: "💳", label: "Card Payment", sub: "Visa, Mastercard, Verve — instant" },
                    { id: "transfer" as const, icon: "🏦", label: "Bank Transfer", sub: "Pay directly to our account" },
                    { id: "ussd" as const, icon: "📱", label: "USSD / Mobile Money", sub: "*737#, *901# and more" },
                  ];
                  const visible = allMethods.filter(m => enabledPayments[m.id]);
                  if (visible.length === 0) return (
                    <div className="bg-[#FFF4D6] border border-[#F59E0B]/40 rounded-xl p-4 text-center text-sm text-[#78350F]">
                      Payment is temporarily unavailable. Please contact us on <a href={`https://wa.me/${settings?.whatsapp_number || "2348001234567"}`} target="_blank" rel="noopener noreferrer" className="font-bold underline">WhatsApp</a>.
                    </div>
                  );
                  return visible.map(m => (
                    <button key={m.id} onClick={() => setPayment(m.id)} className={`flex items-center gap-3.5 p-4 rounded-[14px] border-2 text-left transition-all font-body ${payment === m.id ? "border-forest bg-forest-light" : "border-border bg-card"}`}>
                      <span className="text-xl">{m.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{m.label}</div>
                        <div className="text-text-med text-xs mt-0.5">{m.sub}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${payment === m.id ? "border-forest" : "border-border"}`}>
                        {payment === m.id && <div className="w-2 h-2 rounded-full bg-forest" />}
                      </div>
                    </button>
                  ));
                })()}
              </div>
              {payment === "card" && (
                <div className="mt-3 bg-warm-cream rounded-lg p-3.5 animate-fade-in">
                  <div className="text-text-med text-[13px] flex items-center gap-1.5 mb-2"><span>🔒</span> You'll be redirected to Paystack's secure checkout.</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {["Visa", "Mastercard", "Verve"].map(c => (
                      <span key={c} className="bg-card border border-border px-2 py-0.5 rounded-md text-[11px] text-text-med">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {payment === "transfer" && bankName && bankAccountNumber && (
                <div className="mt-3 bg-warm-cream rounded-lg p-3.5 animate-fade-in">
                  <div className="font-semibold text-[13px] mb-2">Bank Transfer Details</div>
                  {[["Bank", bankName], ["Account Name", bankAccountName], ["Account Number", bankAccountNumber]].map(([k, v]) => (
                    <div key={k} className="flex gap-2 mb-1"><span className="text-text-light text-xs min-w-[90px]">{k}:</span><span className="text-xs font-semibold">{v}</span></div>
                  ))}
                  <div className="mt-2.5 text-coral text-xs">⚠️ Send exact amount, use your phone number as reference.</div>
                </div>
              )}
            </div>

            <button onClick={placeOrder} className="w-full rounded-pill bg-forest py-4 text-center font-body font-semibold text-primary-foreground hover:bg-forest-deep interactive text-base">
              Place Order — {fmt(grand)} 🔒
            </button>
            <div className="text-center text-text-light text-[11px]">By placing your order, you agree to our <Link to="/terms" className="underline">Terms of Service</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link></div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="hidden lg:block">
            <div className="bg-card rounded-card shadow-card p-6 sticky top-24">
              <h2 className="pf text-lg mb-4">Order Summary</h2>
              <div className="max-h-[260px] overflow-y-auto mb-4 space-y-3">
                {cart.map(item => (
                  <div key={item._key} className="flex items-center gap-3 pb-3 border-b border-border/50">
                    <div className="w-11 h-11 bg-warm-cream rounded-lg flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">{(item.img && item.img.startsWith("http")) ? <img src={item.img} alt={item.name} className="w-full h-full object-cover" /> : (item.img || "📦")}</div>
                    <div className="flex-1 min-w-0">
                      {item.bundleName && <div className="text-[9px] font-bold text-coral mb-0.5 truncate">📦 {item.bundleName}</div>}
                      <div className="text-xs font-semibold leading-tight truncate">{item.name}</div>
                      {item.selectedBrand && <div className="text-forest text-[10px] mt-0.5">{item.selectedBrand.label} · Qty {item.qty}</div>}
                    </div>
                    <div className="font-bold text-[13px] flex-shrink-0">{fmt(item.price * item.qty)}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 font-body text-[13px]">
                <div className="flex justify-between"><span className="text-text-med">Subtotal ({totalItems} items)</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between">
                  <span className="text-text-med">
                    Delivery ({deliveryCalc.zoneName})
                    {deliveryCalc.isInterstate && (deliveryCalc as any).bookingsNeeded ? (
                      <span className="block text-[10px] text-text-light mt-0.5">
                        ~{Number((deliveryCalc as any).weightKg).toFixed(1)}kg · {(deliveryCalc as any).bookingsNeeded} eFTD booking{(deliveryCalc as any).bookingsNeeded === 1 ? "" : "s"} · final fee confirmed at dispatch
                      </span>
                    ) : null}
                  </span>
                  <span className={delivery === 0 ? "text-forest" : ""}>{delivery === 0 ? "FREE 🎉" : fmt(delivery)}</span>
                </div>
                <div className="flex justify-between"><span className="text-text-med flex items-center gap-1">📦 {serviceFeeLabel}</span><span>{fmt(serviceFee)}</span></div>
                {giftWrap && <div className="flex justify-between"><span className="text-text-med">🎀 Gift Wrapping</span><span className="text-[#7B5E00]">{fmt(giftWrapPrice)}</span></div>}
                {couponDiscount > 0 && <div className="flex justify-between text-forest"><span className="font-semibold">🏷️ Coupon ({appliedCoupon?.code})</span><span className="font-bold">-{fmt(couponDiscount)}</span></div>}
                {referralDiscount > 0 && <div className="flex justify-between text-forest"><span className="font-semibold">🎁 Referral ({appliedReferral?.code})</span><span className="font-bold">-{fmt(referralDiscount)}</span></div>}
                {spendDiscount > 0 && <div className="flex justify-between text-forest"><span className="font-semibold">🎉 Spend Discount ({spendPrompt?.currentDiscount?.discount_percent}%)</span><span className="font-bold">-{fmt(spendDiscount)}</span></div>}
                <div className="flex justify-between pt-2.5 border-t-2 border-border mt-0.5">
                  <span className="pf font-semibold">Total</span>
                  <span className="pf font-bold text-lg text-forest">{fmt(grand)}</span>
                </div>
                <div className="mt-2 bg-forest-light rounded-lg p-2.5">
                  <p className="text-forest text-xs font-body font-semibold">🚚 Est. delivery: {fmtDate(fromDate)} – {fmtDate(toDate)} ({deliveryCalc.daysMin}–{deliveryCalc.daysMax} days)</p>
                </div>
                {!deliveryCalc.isFree && deliveryCalc.freeThreshold && (
                  <div className="mt-2 bg-warm-cream rounded-lg p-2 text-center">
                    <p className="text-text-med text-[11px]">Add {fmt(deliveryCalc.freeThreshold - subtotal)} more for <span className="font-bold text-forest">FREE delivery</span></p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, onBlur, error, type = "text", placeholder, disabled }: { label: string; value: string; onChange: (v: string) => void; onBlur?: () => void; error?: string; type?: string; placeholder?: string; disabled?: boolean }) {
  return (
    <div className="flex-1 flex flex-col gap-1">
      <label className="text-xs font-semibold text-text-med uppercase tracking-wide">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} disabled={disabled}
        className={`w-full rounded-[10px] border-[1.5px] px-3 py-2.5 text-sm bg-card font-body outline-none transition-colors ${error ? "border-destructive" : "border-border focus:border-forest"} ${disabled ? "opacity-70 cursor-not-allowed bg-muted/40" : ""}`} />
      {error && <p className="text-destructive text-[11px]">{error}</p>}
    </div>
  );
}
