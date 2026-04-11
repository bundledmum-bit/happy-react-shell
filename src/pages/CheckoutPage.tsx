import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart, fmt, generateOrderId } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useShippingZones, calculateDeliveryFee } from "@/hooks/useShippingZones";
import { useSiteSettings } from "@/hooks/useSupabaseData";
import { useSpendThresholds, getSpendPrompt } from "@/hooks/useSpendThresholds";
import { trackEvent, getSessionId } from "@/lib/analytics";

const NIGERIAN_STATES = ["Lagos", "Abuja", "Rivers", "Ogun", "Oyo", "Kano", "Kaduna", "Anambra", "Enugu", "Delta", "Edo", "Imo", "Osun", "Kwara", "Benue"];
const GIFT_WRAP_FEE = 3500;

interface FormData {
  firstName: string; lastName: string; phone: string; email: string;
  address: string; city: string; state: string; notes: string;
}

async function logOrderToSheets(orderData: Record<string, unknown>) {
  const url = import.meta.env.VITE_SHEETS_WEBHOOK_URL || "https://script.google.com/macros/s/AKfycby3mFQQ9oORQeiCKyd1hWaxx0m9n6T4mSQl3hb1DgyD--0UrKiUE_Qvnh0pV4Jp_janXw/exec";
  if (!url) return;
  try {
    await fetch(url, { method: "POST", body: JSON.stringify(orderData) });
  } catch (err) { console.error("Sheet logging failed:", err); }
}

export default function CheckoutPage() {
  const { cart, subtotal, clearCart, totalItems } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>({ firstName: "", lastName: "", phone: "", email: "", address: "", city: "", state: "Lagos", notes: "" });
  const [payment, setPayment] = useState<"card" | "transfer" | "ussd">("card");
  const [giftWrap, setGiftWrap] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [mobileOrderOpen, setMobileOrderOpen] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; discount_type: string; discount_value: number; maximum_discount_amount: number | null } | null>(null);

  // Dynamic settings from DB
  const { data: settings } = useSiteSettings();
  const { data: zones } = useShippingZones();
  const { data: thresholds } = useSpendThresholds();

  useEffect(() => {
    document.title = "Secure Checkout | BundledMum";
    trackEvent("checkout_started", { item_count: totalItems, subtotal });
  }, []);

  // Returning customer recognition: pre-fill from existing customer data
  const [customerLookedUp, setCustomerLookedUp] = useState(false);
  useEffect(() => {
    const phone = form.phone.replace(/\D/g, "");
    if (phone.length >= 10 && !customerLookedUp) {
      setCustomerLookedUp(true);
      supabase
        .from("customers")
        .select("full_name, delivery_address, delivery_area, delivery_state")
        .eq("phone", form.phone)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            const [first, ...rest] = (data.full_name || "").split(" ");
            setForm(prev => ({
              ...prev,
              firstName: prev.firstName || first || "",
              lastName: prev.lastName || rest.join(" ") || "",
              address: prev.address || data.delivery_address || "",
              city: prev.city || data.delivery_area || "",
              state: prev.state || data.delivery_state || prev.state,
            }));
            toast.success("Welcome back! We've pre-filled your details.");
          }
        });
    }
  }, [form.phone]);

  const serviceFeeEnabled = settings?.service_fee_enabled !== false;
  const serviceFee = serviceFeeEnabled ? (parseInt(settings?.service_fee) || 1500) : 0;
  const serviceFeeLabel = settings?.service_fee_label || "Service & Packaging";

  // Delivery fee from DB zones
  const deliveryCalc = zones?.length
    ? calculateDeliveryFee(subtotal, form.city, form.state, zones, serviceFee, parseInt(settings?.default_delivery_fee) || 2500, parseInt(settings?.default_free_threshold) || 30000)
    : { fee: subtotal >= 30000 ? 0 : 2500, isFree: subtotal >= 30000, zoneName: "Standard", daysMin: 1, daysMax: 3, freeThreshold: 30000 };
  const delivery = deliveryCalc.fee;

  // Spend threshold discount
  const spendPrompt = thresholds?.length ? getSpendPrompt(subtotal, thresholds) : null;
  const spendDiscount = spendPrompt?.appliedDiscount || 0;

  // Coupon discount calculation
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === "percentage") {
      couponDiscount = Math.round(subtotal * appliedCoupon.discount_value / 100);
      if (appliedCoupon.maximum_discount_amount) couponDiscount = Math.min(couponDiscount, appliedCoupon.maximum_discount_amount);
    } else {
      couponDiscount = Math.min(appliedCoupon.discount_value, subtotal);
    }
  }

  const giftWrapFee = giftWrap ? GIFT_WRAP_FEE : 0;
  const grand = Math.max(0, subtotal + delivery + serviceFee + giftWrapFee - couponDiscount - spendDiscount);

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
      const { data, error } = await supabase
        .from("coupons")
        .select("id, code, discount_type, discount_value, maximum_discount_amount, minimum_order_amount, is_active, start_date, end_date, usage_limit, usage_count")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) { toast.error("Invalid coupon code"); setCouponLoading(false); return; }
      if (data.start_date && new Date() < new Date(data.start_date)) { toast.error("Coupon not yet valid"); setCouponLoading(false); return; }
      if (data.end_date && new Date() > new Date(data.end_date)) { toast.error("Coupon has expired"); setCouponLoading(false); return; }
      if (data.usage_limit && data.usage_count >= data.usage_limit) { toast.error("Coupon usage limit reached"); setCouponLoading(false); return; }
      if (data.minimum_order_amount && subtotal < data.minimum_order_amount) { toast.error(`Minimum order of ${fmt(data.minimum_order_amount)} required`); setCouponLoading(false); return; }
      setAppliedCoupon({ id: data.id, code: data.code, discount_type: data.discount_type, discount_value: data.discount_value || 0, maximum_discount_amount: data.maximum_discount_amount });
      toast.success(`Coupon "${data.code}" applied!`);
    } catch {
      toast.error("Failed to validate coupon");
    } finally {
      setCouponLoading(false);
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
    if (key === "city" && !val) return "City is required";
    return undefined;
  };

  const handleBlur = (key: keyof FormData) => {
    const error = validateField(key);
    setErrors(p => ({ ...p, [key]: error }));
  };

  const validate = () => {
    const fields: (keyof FormData)[] = ["firstName", "lastName", "phone", "email", "address", "city"];
    const e: Partial<FormData> = {};
    fields.forEach(key => { const err = validateField(key); if (err) e[key] = err; });
    setErrors(e);
    if (Object.keys(e).length) toast.error("Please fill all required fields correctly");
    return !Object.keys(e).length;
  };

  const buildOrderData = (paystackRef?: string, paystackStatus?: string) => ({
    orderId: generateOrderId(),
    timestamp: new Date().toISOString(),
    customerName: `${form.firstName} ${form.lastName}`,
    email: form.email, phone: form.phone, address: form.address, city: form.city, state: form.state,
    deliveryNotes: form.notes,
    items: cart,
    itemsSummary: cart.map(i => `${i.name} x${i.qty}`).join(", "),
    subtotal, deliveryFee: delivery, serviceFee, giftWrapFee,
    total: grand,
    paymentMethod: payment,
    paymentStatus: payment === "transfer" ? "PENDING_TRANSFER" : "PAID",
    paystackRef: paystackRef || null,
    paystackStatus: paystackStatus || null,
    giftWrap, notes: "",
  });

  const saveOrderToDb = async (orderData: ReturnType<typeof buildOrderData>) => {
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

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
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
          spend_discount_amount: spendDiscount > 0 ? spendDiscount : 0,
          spend_discount_percent: spendPrompt?.currentDiscount?.discount_percent || null,
          referral_code_used: null,
          payment_reference: orderData.paystackRef,
          payment_status: orderData.paymentStatus === "PAID" ? "paid" : "pending",
          payment_method: orderData.paymentMethod,
          order_status: "confirmed",
          gift_wrapping: orderData.giftWrap,
          estimated_delivery_start: fromDate.toISOString().split("T")[0],
          estimated_delivery_end: toDate.toISOString().split("T")[0],
          quiz_answers: quizAnswers,
        })
        .select("id, order_number")
        .single();

      if (orderError) {
        console.error("Order insert failed:", orderError);
        return orderData.orderId;
      }

      // Insert order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_name: item.name,
        brand_name: item.selectedBrand?.label || "Standard",
        quantity: item.qty,
        unit_price: item.price,
        line_total: item.price * item.qty,
        size: item.selectedSize || null,
      }));

      await supabase.from("order_items").insert(orderItems);

      // Upsert customer record
      try {
        const customerName = `${form.firstName} ${form.lastName}`;
        const { data: existing } = await supabase.from("customers").select("id, total_orders, total_spent").eq("email", form.email).maybeSingle();
        if (existing) {
          await supabase.from("customers").update({
            full_name: customerName,
            phone: form.phone,
            delivery_address: form.address,
            delivery_area: form.city,
            delivery_state: form.state,
            total_orders: (existing.total_orders || 0) + 1,
            total_spent: (existing.total_spent || 0) + orderData.total,
            last_order_at: new Date().toISOString(),
          }).eq("id", existing.id);
        } else {
          await supabase.from("customers").insert({
            email: form.email,
            full_name: customerName,
            phone: form.phone,
            delivery_address: form.address,
            delivery_area: form.city,
            delivery_state: form.state,
            total_orders: 1,
            total_spent: orderData.total,
            last_order_at: new Date().toISOString(),
          });
        }
      } catch (e) { console.error("Customer upsert failed:", e); }

      // Mark quiz_customers as purchased — session_id match first, then whatsapp fallback
      try {
        const sessionId = getSessionId();
        const { data: sessionMatch } = await supabase
          .from("quiz_customers")
          .select("id")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sessionMatch) {
          await supabase.from("quiz_customers")
            .update({ has_purchased: true, order_id: order.id } as any)
            .eq("id", sessionMatch.id);
        } else {
          // Fallback: match by whatsapp_number using customer phone
          const phone = form.phone.replace(/\D/g, "");
          if (phone) {
            const { data: waMatch } = await supabase
              .from("quiz_customers")
              .select("id")
              .or(`whatsapp_number.eq.${form.phone},whatsapp_number.eq.0${phone.slice(-10)},whatsapp_number.eq.+234${phone.slice(-10)}`)
              .eq("has_purchased", false)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (waMatch) {
              await supabase.from("quiz_customers")
                .update({ has_purchased: true, order_id: order.id } as any)
                .eq("id", waMatch.id);
            }
          }
        }
      } catch (e) { console.error("Quiz customer update failed:", e); }

      // Track order_placed event
      trackEvent("order_placed", {
        order_id: order.id,
        order_number: order.order_number,
        total: orderData.total,
        item_count: cart.length,
      });

      return order.order_number || orderData.orderId;
    } catch (e) {
      console.error("DB save failed:", e);
      return orderData.orderId;
    }
  };

  const placeOrder = async () => {
    if (!validate()) return;
    setProcessing(true);

    if (payment === "transfer") {
      const orderData = buildOrderData();
      const dbOrderNumber = await saveOrderToDb(orderData);
      await logOrderToSheets(orderData);
      clearCart();
      navigate("/order-confirmed", { state: { ...orderData, orderId: dbOrderNumber, paymentType: "transfer", form } });
      return;
    }

    try {
      const PaystackPop = (await import("@paystack/inline-js")).default;
      const popup = new PaystackPop();
      popup.newTransaction({
        key: "pk_test_ee6db593cdee9f92b4114a9b15f4a2a72e71ee20",
        email: form.email, amount: grand * 100, currency: "NGN",
        ref: `BM-${Date.now()}`, firstname: form.firstName, lastname: form.lastName,
        channels: payment === "ussd" ? ["ussd"] : ["card", "bank_transfer", "ussd", "qr", "mobile_money", "bank"],
        onSuccess: async (transaction: { reference: string; status: string }) => {
          const { data: verification, error: verifyError } = await supabase.functions.invoke("verify-payment", {
            body: { reference: transaction.reference },
          });

          if (verifyError || !verification?.verified) {
            setProcessing(false);
            toast.error("Payment verification failed. Please contact support.");
            return;
          }

          const orderData = buildOrderData(transaction.reference, verification.status);
          const dbOrderNumber = await saveOrderToDb(orderData);
          await logOrderToSheets(orderData);
          clearCart();
          navigate("/order-confirmed", { state: { ...orderData, orderId: dbOrderNumber, paymentType: "card", form } });
        },
        onCancel: () => { setProcessing(false); toast.error("Payment cancelled"); },
      });
    } catch {
      const orderData = buildOrderData("DEMO-" + Date.now(), "success");
      const dbOrderNumber = await saveOrderToDb(orderData);
      await logOrderToSheets(orderData);
      clearCart();
      navigate("/order-confirmed", { state: { ...orderData, orderId: dbOrderNumber, paymentType: "card", form } });
    }
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-up">
          <div className="mx-auto h-14 w-14 border-4 border-border border-t-forest rounded-full animate-spin mb-4" />
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
                    <span className="text-lg">{item.img || item.baseImg || "📦"}</span>
                    <span className="truncate max-w-[180px]">{item.name} ×{item.qty}</span>
                  </div>
                  <span className="font-bold">{fmt(item.price * item.qty)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-text-med">Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-text-med">Delivery ({deliveryCalc.zoneName})</span><span className={delivery === 0 ? "text-forest" : ""}>{delivery === 0 ? "FREE 🎉" : fmt(delivery)}</span></div>
                <div className="flex justify-between"><span className="text-text-med">{serviceFeeLabel}</span><span>{fmt(serviceFee)}</span></div>
                {giftWrap && <div className="flex justify-between"><span className="text-text-med">Gift Wrapping</span><span>{fmt(GIFT_WRAP_FEE)}</span></div>}
                {couponDiscount > 0 && <div className="flex justify-between text-forest"><span>🏷️ Coupon ({appliedCoupon?.code})</span><span>-{fmt(couponDiscount)}</span></div>}
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
                  <InputField label="Email Address" value={form.email} onChange={v => update("email", v)} onBlur={() => handleBlur("email")} error={errors.email} type="email" placeholder="you@example.com" />
                </div>
                <InputField label="Street Address" value={form.address} onChange={v => update("address", v)} onBlur={() => handleBlur("address")} error={errors.address} />
                <div className="flex flex-col md:flex-row gap-3">
                  <InputField label="City / Town" value={form.city} onChange={v => update("city", v)} onBlur={() => handleBlur("city")} error={errors.city} />
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-xs font-semibold text-text-med uppercase tracking-wide">State</label>
                    <select value={form.state} onChange={e => update("state", e.target.value)} className="w-full rounded-[10px] border-[1.5px] border-border px-3 py-2.5 text-sm bg-card font-body focus:border-forest outline-none transition-colors">
                      {NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
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
                      <span className="bg-[#FFD54F] text-[#7B5E00] text-[10px] px-2 py-0.5 rounded-[10px] font-bold">+{fmt(GIFT_WRAP_FEE)}</span>
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
              {appliedCoupon ? (
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

            {/* Payment Method */}
            <div className="bg-card rounded-card shadow-card p-4 md:p-8">
              <h2 className="pf text-lg mb-4">💳 Payment Method</h2>
              <div className="flex flex-col gap-2.5">
                {([
                  { id: "card" as const, icon: "💳", label: "Card Payment", sub: "Visa, Mastercard, Verve — instant" },
                  { id: "transfer" as const, icon: "🏦", label: "Bank Transfer", sub: "Pay directly to our account" },
                  { id: "ussd" as const, icon: "📱", label: "USSD / Mobile Money", sub: "*737#, *901# and more" },
                ]).map(m => (
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
                ))}
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
              {payment === "transfer" && (
                <div className="mt-3 bg-warm-cream rounded-lg p-3.5 animate-fade-in">
                  <div className="font-semibold text-[13px] mb-2">Bank Transfer Details</div>
                  {[["Bank", "GTBank"], ["Account Name", "BundledMum Nigeria Ltd"], ["Account Number", "0123456789"]].map(([k, v]) => (
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
                    <div className="w-11 h-11 bg-warm-cream rounded-lg flex items-center justify-center text-xl flex-shrink-0">{item.img || item.baseImg || "📦"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold leading-tight truncate">{item.name}</div>
                      {item.selectedBrand && <div className="text-forest text-[10px] mt-0.5">{item.selectedBrand.label} · Qty {item.qty}</div>}
                    </div>
                    <div className="font-bold text-[13px] flex-shrink-0">{fmt(item.price * item.qty)}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 font-body text-[13px]">
                <div className="flex justify-between"><span className="text-text-med">Subtotal ({totalItems} items)</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-text-med">Delivery ({deliveryCalc.zoneName})</span><span className={delivery === 0 ? "text-forest" : ""}>{delivery === 0 ? "FREE 🎉" : fmt(delivery)}</span></div>
                <div className="flex justify-between"><span className="text-text-med flex items-center gap-1">📦 {serviceFeeLabel}</span><span>{fmt(serviceFee)}</span></div>
                {giftWrap && <div className="flex justify-between"><span className="text-text-med">🎀 Gift Wrapping</span><span className="text-[#7B5E00]">{fmt(GIFT_WRAP_FEE)}</span></div>}
                {couponDiscount > 0 && <div className="flex justify-between text-forest"><span className="font-semibold">🏷️ Coupon ({appliedCoupon?.code})</span><span className="font-bold">-{fmt(couponDiscount)}</span></div>}
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

function InputField({ label, value, onChange, onBlur, error, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; onBlur?: () => void; error?: string; type?: string; placeholder?: string }) {
  return (
    <div className="flex-1 flex flex-col gap-1">
      <label className="text-xs font-semibold text-text-med uppercase tracking-wide">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder}
        className={`w-full rounded-[10px] border-[1.5px] px-3 py-2.5 text-sm bg-card font-body outline-none transition-colors ${error ? "border-destructive" : "border-border focus:border-forest"}`} />
      {error && <p className="text-destructive text-[11px]">{error}</p>}
    </div>
  );
}
