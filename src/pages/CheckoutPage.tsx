import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart, fmt, generateOrderId } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NIGERIAN_STATES = ["Lagos", "Abuja", "Rivers", "Ogun", "Oyo", "Kano", "Kaduna", "Anambra", "Enugu", "Delta", "Edo", "Imo", "Osun", "Kwara", "Benue"];
const SERVICE_FEE = 1500;
const GIFT_WRAP_FEE = 3500;

interface FormData {
  firstName: string; lastName: string; phone: string; email: string;
  address: string; city: string; state: string; notes: string;
}

async function logOrderToSheets(orderData: Record<string, unknown>) {
  const url = import.meta.env.VITE_SHEETS_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(orderData), mode: "no-cors" });
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

  const delivery = subtotal >= 30000 ? 0 : 2500;
  const giftWrapFee = giftWrap ? GIFT_WRAP_FEE : 0;
  const grand = subtotal + delivery + SERVICE_FEE + giftWrapFee;

  const update = (key: keyof FormData, val: string) => {
    setForm(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: undefined }));
  };

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 10) e.phone = "Valid phone required";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email required";
    if (!form.address.trim()) e.address = "Required";
    if (!form.city.trim()) e.city = "Required";
    setErrors(e);
    if (Object.keys(e).length) toast.error("Please fill all required fields");
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
    subtotal, deliveryFee: delivery, serviceFee: SERVICE_FEE, giftWrapFee,
    total: grand,
    paymentMethod: payment,
    paymentStatus: payment === "transfer" ? "PENDING_TRANSFER" : "PAID",
    paystackRef: paystackRef || null,
    paystackStatus: paystackStatus || null,
    giftWrap, notes: "",
  });

  const placeOrder = async () => {
    if (!validate()) return;
    setProcessing(true);

    if (payment === "transfer") {
      const orderData = buildOrderData();
      await logOrderToSheets(orderData);
      clearCart();
      navigate("/order-confirmed", { state: { ...orderData, paymentType: "transfer", form } });
      return;
    }

    try {
      const PaystackPop = (await import("@paystack/inline-js")).default;
      const popup = new PaystackPop();
      popup.newTransaction({
        key: "pk_test_0386076a090eb41da40767c1eb8e845fcef932f6",
        email: form.email, amount: grand * 100, currency: "NGN",
        ref: `BM-${Date.now()}`, firstname: form.firstName, lastname: form.lastName,
        channels: payment === "ussd" ? ["ussd"] : ["card", "bank_transfer", "ussd", "qr", "mobile_money", "bank"],
        onSuccess: async (transaction: { reference: string; status: string }) => {
          const orderData = buildOrderData(transaction.reference, transaction.status);
          await logOrderToSheets(orderData);
          clearCart();
          navigate("/order-confirmed", { state: { ...orderData, paymentType: "card", form } });
        },
        onCancel: () => { setProcessing(false); toast.error("Payment cancelled"); },
      });
    } catch {
      const orderData = buildOrderData("DEMO-" + Date.now(), "success");
      await logOrderToSheets(orderData);
      clearCart();
      navigate("/order-confirmed", { state: { ...orderData, paymentType: "card", form } });
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
          <div className="text-primary-foreground/50 text-xs mb-2 cursor-pointer" onClick={() => window.history.back()}>← Back to Cart</div>
          <h1 className="pf text-2xl md:text-4xl text-primary-foreground">🔒 Secure Checkout</h1>
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
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {/* Delivery Details */}
            <div className="bg-card rounded-card shadow-card p-4 md:p-8">
              <h3 className="pf text-lg mb-4">📍 Delivery Details</h3>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col md:flex-row gap-3">
                  <InputField label="First Name" value={form.firstName} onChange={v => update("firstName", v)} error={errors.firstName} />
                  <InputField label="Last Name" value={form.lastName} onChange={v => update("lastName", v)} error={errors.lastName} />
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <InputField label="Phone Number" value={form.phone} onChange={v => update("phone", v)} error={errors.phone} type="tel" />
                  <InputField label="Email Address" value={form.email} onChange={v => update("email", v)} error={errors.email} type="email" />
                </div>
                <InputField label="Street Address" value={form.address} onChange={v => update("address", v)} error={errors.address} />
                <div className="flex flex-col md:flex-row gap-3">
                  <InputField label="City / Town" value={form.city} onChange={v => update("city", v)} error={errors.city} />
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

            {/* Payment Method */}
            <div className="bg-card rounded-card shadow-card p-4 md:p-8">
              <h3 className="pf text-lg mb-4">💳 Payment Method</h3>
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
            <div className="text-center text-text-light text-[11px]">By placing your order, you agree to our Terms of Service and Privacy Policy</div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="hidden lg:block">
            <div className="bg-card rounded-card shadow-card p-6 sticky top-24">
              <h4 className="pf text-lg mb-4">Order Summary</h4>
              <div className="max-h-[260px] overflow-y-auto mb-4 space-y-3">
                {cart.map(item => (
                  <div key={item._key} className="flex items-center gap-3 pb-3 border-b border-border/50">
                    <div className="w-11 h-11 bg-warm-cream rounded-lg flex items-center justify-center text-xl flex-shrink-0">{item.img || item.baseImg}</div>
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
                <div className="flex justify-between"><span className="text-text-med">Delivery</span><span className={delivery === 0 ? "text-forest" : ""}>{delivery === 0 ? "FREE 🎉" : fmt(delivery)}</span></div>
                <div className="flex justify-between"><span className="text-text-med flex items-center gap-1">📦 Service & Packaging <span className="bg-forest-light text-forest text-[9px] px-1.5 py-0.5 rounded-[10px] font-bold">INCL.</span></span><span>{fmt(SERVICE_FEE)}</span></div>
                {giftWrap && <div className="flex justify-between"><span className="text-text-med">🎀 Gift Wrapping</span><span className="text-[#7B5E00]">{fmt(GIFT_WRAP_FEE)}</span></div>}
                <div className="flex justify-between pt-2.5 border-t-2 border-border mt-0.5">
                  <span className="pf font-semibold">Total</span>
                  <span className="pf font-bold text-lg text-forest">{fmt(grand)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, error, type = "text" }: { label: string; value: string; onChange: (v: string) => void; error?: string; type?: string }) {
  return (
    <div className="flex-1 flex flex-col gap-1">
      <label className="text-xs font-semibold text-text-med uppercase tracking-wide">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className={`w-full rounded-[10px] border-[1.5px] px-3 py-2.5 text-sm bg-card font-body outline-none transition-colors ${error ? "border-destructive" : "border-border focus:border-forest"}`} />
      {error && <p className="text-destructive text-[11px]">{error}</p>}
    </div>
  );
}
