import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart, fmt, generateOrderId } from "@/lib/cart";
import { toast } from "sonner";

const NIGERIAN_STATES = ["Lagos", "Abuja", "Rivers", "Ogun", "Oyo", "Kano", "Kaduna", "Anambra", "Enugu", "Delta", "Edo", "Imo", "Osun", "Kwara", "Benue"];
const SERVICE_FEE = 1500;
const GIFT_WRAP_FEE = 3500;

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  notes: string;
}

async function logOrderToSheets(orderData: Record<string, unknown>) {
  const url = import.meta.env.VITE_SHEETS_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(orderData), mode: "no-cors" });
  } catch (err) {
    console.error("Sheet logging failed:", err);
  }
}

export default function CheckoutPage() {
  const { cart, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>({ firstName: "", lastName: "", phone: "", email: "", address: "", city: "", state: "", notes: "" });
  const [payment, setPayment] = useState<"card" | "bank_transfer" | "ussd">("card");
  const [giftWrap, setGiftWrap] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const deliveryFee = subtotal >= 30000 ? 0 : 2500;
  const giftWrapFee = giftWrap ? GIFT_WRAP_FEE : 0;
  const grand = subtotal + deliveryFee + SERVICE_FEE + giftWrapFee;

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
    if (!form.state) e.state = "Required";
    setErrors(e);
    if (Object.keys(e).length) toast.error("Please fill all required fields before proceeding");
    return !Object.keys(e).length;
  };

  const buildOrderData = (paystackRef?: string, paystackStatus?: string) => {
    const orderId = generateOrderId();
    return {
      orderId,
      timestamp: new Date().toISOString(),
      customerName: `${form.firstName} ${form.lastName}`,
      email: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      state: form.state,
      deliveryNotes: form.notes,
      items: cart,
      itemsSummary: cart.map(i => `${i.name} x${i.qty}`).join(", "),
      subtotal,
      deliveryFee,
      serviceFee: SERVICE_FEE,
      giftWrapFee,
      total: grand,
      paymentMethod: payment,
      paymentStatus: payment === "bank_transfer" ? "PENDING_TRANSFER" : "PAID",
      paystackRef: paystackRef || null,
      paystackStatus: paystackStatus || null,
      giftWrap,
      notes: "",
    };
  };

  const placeOrder = async () => {
    if (!validate()) return;
    setProcessing(true);

    if (payment === "bank_transfer") {
      const orderData = buildOrderData();
      await logOrderToSheets(orderData);
      clearCart();
      navigate("/order-confirmed", { state: { ...orderData, paymentType: "bank_transfer" } });
      return;
    }

    // Paystack card/ussd
    try {
      const PaystackPop = (await import("@paystack/inline-js")).default;
      const popup = new PaystackPop();
      popup.newTransaction({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_xxxxx",
        email: form.email,
        amount: grand * 100,
        currency: "NGN",
        ref: `BM-${Date.now()}`,
        firstname: form.firstName,
        lastname: form.lastName,
        channels: payment === "ussd" ? ["ussd"] : ["card", "bank_transfer", "ussd", "qr", "mobile_money", "bank"],
        metadata: { custom_fields: [{ display_name: "Order Reference", variable_name: "order_ref", value: generateOrderId() }] },
        onSuccess: async (transaction: { reference: string; status: string }) => {
          const orderData = buildOrderData(transaction.reference, transaction.status);
          await logOrderToSheets(orderData);
          clearCart();
          navigate("/order-confirmed", { state: { ...orderData, paymentType: "card" } });
        },
        onCancel: () => {
          setProcessing(false);
          toast.error("Payment cancelled");
        },
      });
    } catch {
      // Fallback if Paystack not available
      const orderData = buildOrderData("DEMO-" + Date.now(), "success");
      await logOrderToSheets(orderData);
      clearCart();
      navigate("/order-confirmed", { state: { ...orderData, paymentType: "card" } });
    }
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-up">
          <div className="mx-auto h-12 w-12 border-4 border-forest border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-display font-bold text-lg text-forest">Confirming your order...</p>
          <p className="font-body text-sm text-muted-foreground mt-1">Please don't close this page 🔒</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20" style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1A4A33 100%)" }}>
        <div className="container mx-auto px-4 py-10 text-center">
          <h1 className="font-display font-black text-2xl md:text-4xl text-primary-foreground">🔒 Secure Checkout</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {/* Delivery Details */}
            <div className="bg-card rounded-card shadow-card p-6">
              <h2 className="font-display font-bold text-lg mb-4">Delivery Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <InputField label="First Name" value={form.firstName} onChange={v => update("firstName", v)} error={errors.firstName} />
                <InputField label="Last Name" value={form.lastName} onChange={v => update("lastName", v)} error={errors.lastName} />
                <InputField label="Phone Number" value={form.phone} onChange={v => update("phone", v)} error={errors.phone} />
                <InputField label="Email Address" value={form.email} onChange={v => update("email", v)} error={errors.email} type="email" />
              </div>
              <div className="mt-4">
                <InputField label="Street Address" value={form.address} onChange={v => update("address", v)} error={errors.address} />
              </div>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <InputField label="City / Town" value={form.city} onChange={v => update("city", v)} error={errors.city} />
                <div>
                  <label className="font-body text-sm font-bold mb-1 block">State</label>
                  <select
                    value={form.state}
                    onChange={e => update("state", e.target.value)}
                    className={`w-full rounded-[10px] border px-3 py-2.5 font-body text-sm bg-card ${errors.state ? "border-destructive" : "border-border"}`}
                  >
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.state && <p className="text-destructive text-xs mt-1">{errors.state}</p>}
                </div>
              </div>
              <div className="mt-4">
                <label className="font-body text-sm font-bold mb-1 block">Delivery Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => update("notes", e.target.value)}
                  className="w-full rounded-[10px] border border-border px-3 py-2.5 font-body text-sm bg-card resize-none h-20"
                  placeholder="Any special instructions..."
                />
              </div>
            </div>

            {/* Gift Wrapping */}
            <label className={`flex items-center gap-4 p-4 rounded-card border-2 cursor-pointer interactive ${giftWrap ? "border-[#FFD54F] bg-[#FFFDE7]" : "border-border bg-card"}`}>
              <input type="checkbox" checked={giftWrap} onChange={e => setGiftWrap(e.target.checked)} className="sr-only" />
              <span className="text-2xl">🎀</span>
              <div className="flex-1">
                <p className="font-display font-bold text-sm">Add Gift Wrapping</p>
                <p className="font-body text-xs text-muted-foreground">Premium gift box · satin ribbon · handwritten card · branded tissue paper</p>
              </div>
              <span className="rounded-pill bg-coral-blush text-coral px-3 py-1 text-xs font-bold">+{fmt(GIFT_WRAP_FEE)}</span>
              <div className={`h-5 w-5 rounded-sm border-2 flex items-center justify-center ${giftWrap ? "bg-coral border-coral text-primary-foreground" : "border-border"}`}>
                {giftWrap && "✓"}
              </div>
            </label>

            {/* Payment Method */}
            <div className="bg-card rounded-card shadow-card p-6">
              <h2 className="font-display font-bold text-lg mb-4">Payment Method</h2>
              <div className="space-y-3">
                <PaymentOption
                  selected={payment === "card"}
                  onClick={() => setPayment("card")}
                  icon="💳"
                  label="Card Payment"
                  sub="Visa, Mastercard, Verve — instant"
                >
                  <p className="font-body text-xs text-muted-foreground mt-2">You'll be redirected to Paystack's secure checkout</p>
                </PaymentOption>

                <PaymentOption
                  selected={payment === "bank_transfer"}
                  onClick={() => setPayment("bank_transfer")}
                  icon="🏦"
                  label="Bank Transfer"
                  sub="Pay directly to our account"
                >
                  <div className="mt-2 bg-warm-cream rounded-lg p-3 font-body text-sm space-y-1">
                    <p><span className="text-muted-foreground">Bank:</span> GTBank</p>
                    <p><span className="text-muted-foreground">Account Name:</span> BundledMum Nigeria Ltd</p>
                    <p><span className="text-muted-foreground">Account Number:</span> 0123456789</p>
                    <p className="text-xs text-coral mt-2">⚠️ Send exact amount, use your phone number as reference.</p>
                  </div>
                </PaymentOption>

                <PaymentOption
                  selected={payment === "ussd"}
                  onClick={() => setPayment("ussd")}
                  icon="📱"
                  label="USSD / Mobile Money"
                  sub="*737#, *901# and more"
                >
                  <div className="mt-2 font-body text-xs text-muted-foreground space-y-0.5">
                    <p>GTBank *737# · Access *901# · Zenith *966# · First Bank *894#</p>
                  </div>
                </PaymentOption>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-card rounded-card shadow-card p-6">
              <h2 className="font-display font-bold text-lg mb-4">Order Summary</h2>
              <div className="max-h-[260px] overflow-y-auto space-y-2 mb-4">
                {cart.map(item => (
                  <div key={`${item.id}-${item.brand}`} className="flex items-center gap-2 font-body text-sm">
                    <span>{item.emoji}</span>
                    <span className="flex-1 truncate">{item.name} ×{item.qty}</span>
                    <span className="font-bold">{fmt(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 font-body text-sm border-t border-border pt-3">
                <div className="flex justify-between"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span>{deliveryFee ? fmt(deliveryFee) : "FREE"}</span></div>
                <div className="flex justify-between"><span>Service & Packaging</span><span>{fmt(SERVICE_FEE)}</span></div>
                {giftWrap && <div className="flex justify-between"><span>Gift Wrapping</span><span>{fmt(GIFT_WRAP_FEE)}</span></div>}
                <div className="border-t border-border pt-3 flex justify-between font-display font-bold text-lg">
                  <span>Grand Total</span>
                  <span className="text-forest">{fmt(grand)}</span>
                </div>
              </div>
              <button
                onClick={placeOrder}
                className="mt-5 w-full rounded-pill bg-forest py-3 font-display font-bold text-primary-foreground hover:bg-forest-deep interactive"
              >
                Place Order — {fmt(grand)} 🔒
              </button>
              <p className="text-center font-body text-[10px] text-muted-foreground mt-3">
                By placing your order, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, error, type = "text" }: { label: string; value: string; onChange: (v: string) => void; error?: string; type?: string }) {
  return (
    <div>
      <label className="font-body text-sm font-bold mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full rounded-[10px] border px-3 py-2.5 font-body text-sm bg-card ${error ? "border-destructive" : "border-border"}`}
      />
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
}

function PaymentOption({ selected, onClick, icon, label, sub, children }: { selected: boolean; onClick: () => void; icon: string; label: string; sub: string; children?: React.ReactNode }) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-card border-2 cursor-pointer interactive ${selected ? "border-coral bg-coral-blush/30" : "border-border bg-card"}`}
    >
      <div className="flex items-center gap-3">
        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${selected ? "border-coral" : "border-muted-foreground/30"}`}>
          {selected && <div className="h-2.5 w-2.5 rounded-full bg-coral" />}
        </div>
        <span className="text-xl">{icon}</span>
        <div>
          <p className="font-display font-bold text-sm">{label}</p>
          <p className="font-body text-xs text-muted-foreground">{sub}</p>
        </div>
      </div>
      {selected && children}
    </div>
  );
}
