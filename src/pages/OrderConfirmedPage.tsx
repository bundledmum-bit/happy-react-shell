import { Link, useLocation } from "react-router-dom";
import { fmt } from "@/lib/cart";
import { useEffect } from "react";
import { toast } from "sonner";

export default function OrderConfirmedPage() {
  const { state } = useLocation();
  const order = state as Record<string, any> | null;

  useEffect(() => { document.title = "Order Confirmed | BundledMum"; }, []);

  const isBankTransfer = order?.paymentType === "transfer";
  const orderId = (order?.orderId as string) || "ORD-XXXX";
  const form = order?.form || {};
  const items = order?.items || [];
  const payLabels: Record<string, string> = { card: "Card Payment via Paystack", transfer: "Bank Transfer", ussd: "USSD / Mobile Money" };

  const deliveryDate = () => {
    const now = new Date();
    const isLagos = (form.state || "").toLowerCase() === "lagos";
    const min = isLagos ? 1 : 3;
    const max = isLagos ? 2 : 5;
    const from = new Date(now); from.setDate(from.getDate() + min);
    const to = new Date(now); to.setDate(to.getDate() + max);
    const f = (d: Date) => d.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" });
    return `${f(from)} – ${f(to)}`;
  };

  const handleDownload = () => {
    const lines = [
      `BundledMum Order Summary`,
      `Order #${orderId}`,
      `Date: ${new Date().toLocaleDateString("en-NG")}`,
      ``,
      `Customer: ${form.firstName || ""} ${form.lastName || ""}`,
      `Email: ${form.email || ""}`,
      `Phone: ${form.phone || ""}`,
      `Address: ${form.address || ""}, ${form.city || ""}, ${form.state || ""}`,
      ``,
      `Items:`,
      ...items.map((i: any) => `  ${i.name} × ${i.qty} — ${fmt(i.price * i.qty)}${i.selectedBrand ? ` (${i.selectedBrand.label})` : ""}${i.selectedSize ? ` Size: ${i.selectedSize}` : ""}`),
      ``,
      `Subtotal: ${order?.subtotal ? fmt(order.subtotal) : ""}`,
      `Delivery: ${order?.deliveryFee === 0 ? "FREE" : order?.deliveryFee ? fmt(order.deliveryFee) : ""}`,
      `Service & Packaging: ${order?.serviceFee ? fmt(order.serviceFee) : ""}`,
      order?.giftWrapFee > 0 ? `Gift Wrapping: ${fmt(order.giftWrapFee)}` : "",
      `Total: ${order?.total ? fmt(order.total) : ""}`,
      ``,
      `Payment: ${payLabels[order?.paymentMethod] || ""}`,
    ].filter(Boolean);

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `BundledMum-${orderId}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleWhatsAppShare = () => {
    const text = `My BundledMum Order #${orderId}\n${items.map((i: any) => `${i.name} ×${i.qty}`).join("\n")}\nTotal: ${order?.total ? fmt(order.total) : ""}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1E5C44 100%)" }}>
        <div className="absolute top-[-60px] left-[10%] w-[200px] h-[200px] rounded-full bg-coral/[0.07]" />
        <div className="absolute bottom-[-40px] right-[8%] w-[160px] h-[160px] rounded-full bg-primary-foreground/[0.04]" />
        <div className="max-w-[860px] mx-auto px-4 md:px-10 py-12 md:py-20 text-center">
          <div className="w-[72px] h-[72px] bg-primary-foreground/[0.12] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl animate-pulse-scale">✅</div>
          <h1 className="pf text-3xl md:text-5xl text-primary-foreground mb-2.5">Order Confirmed! 🎉</h1>
          <p className="text-primary-foreground/70 text-sm md:text-[17px] mb-1.5">Thank you, {form.firstName || ""}! Your bundle is on its way.</p>
          <div className="inline-flex items-center gap-2 bg-coral/20 border border-coral/40 rounded-pill px-5 py-2 mt-2.5">
            <span className="text-coral font-bold text-sm">Order #{orderId}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[860px] mx-auto px-4 md:px-10 py-8 md:py-14">
        {/* Your Details */}
        {(form.firstName || form.email) && (
          <div className="bg-card rounded-card shadow-card p-5 md:p-8 mb-4">
            <h3 className="pf text-lg md:text-xl text-forest mb-4">📋 Your Details</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm font-body">
              <div><span className="text-text-light">Name:</span> <span className="font-semibold">{form.firstName} {form.lastName}</span></div>
              <div><span className="text-text-light">Email:</span> <span className="font-semibold">{form.email}</span></div>
              <div><span className="text-text-light">Phone:</span> <span className="font-semibold">{form.phone}</span></div>
              <div><span className="text-text-light">Payment:</span> <span className="font-semibold">{payLabels[order?.paymentMethod] || ""}</span></div>
              <div className="md:col-span-2"><span className="text-text-light">Address:</span> <span className="font-semibold">{form.address}, {form.city}, {form.state}</span></div>
            </div>
          </div>
        )}

        {/* Order Summary with full details */}
        {items.length > 0 && (
          <div className="bg-card rounded-card shadow-card p-5 md:p-8 mb-4">
            <h3 className="pf text-lg md:text-xl text-forest mb-4">🛒 Your Order</h3>
            <div className="space-y-2.5 mb-4">
              {items.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-3 pb-2.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-warm-cream rounded-lg flex items-center justify-center text-lg flex-shrink-0">{item.img || item.baseImg}</div>
                    <div>
                      <div className="text-sm font-semibold">{item.name}</div>
                      <div className="text-text-light text-xs flex flex-wrap gap-2">
                        {item.selectedBrand && <span>Brand: {item.selectedBrand.label}</span>}
                        {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                        <span>Qty: {item.qty}</span>
                        <span>@ {fmt(item.price)} each</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-bold flex-shrink-0">{fmt(item.price * item.qty)}</div>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 text-sm font-body border-t border-border pt-3">
              {order?.subtotal && <div className="flex justify-between"><span className="text-text-med">Subtotal</span><span>{fmt(order.subtotal)}</span></div>}
              {order?.deliveryFee !== undefined && <div className="flex justify-between"><span className="text-text-med">Delivery</span><span className={order.deliveryFee === 0 ? "text-forest" : ""}>{order.deliveryFee === 0 ? "FREE" : fmt(order.deliveryFee)}</span></div>}
              {order?.serviceFee && <div className="flex justify-between"><span className="text-text-med">Service & Packaging</span><span>{fmt(order.serviceFee)}</span></div>}
              {order?.giftWrapFee > 0 && <div className="flex justify-between"><span className="text-text-med">Gift Wrapping</span><span>{fmt(order.giftWrapFee)}</span></div>}
              {order?.total && <div className="flex justify-between pt-2 border-t border-border font-bold text-base"><span>Total</span><span className="text-forest">{fmt(order.total)}</span></div>}
            </div>
          </div>
        )}

        {/* Download / Share */}
        <div className="flex gap-3 flex-wrap mb-4">
          <button onClick={handleDownload} className="rounded-pill border-2 border-forest text-forest px-5 py-2.5 font-body font-semibold text-sm hover:bg-forest/5 interactive">
            📥 Download Order Summary
          </button>
          <button onClick={handleWhatsAppShare} className="rounded-pill bg-[#25D366] text-primary-foreground px-5 py-2.5 font-body font-semibold text-sm interactive">
            📱 Share via WhatsApp
          </button>
        </div>

        {/* What Happens Next */}
        <div className="bg-card rounded-card shadow-card p-5 md:p-8 mb-4">
          <h3 className="pf text-lg md:text-xl text-forest mb-4">What Happens Next</h3>
          <div className="flex flex-col">
            {[
              { icon: "📧", title: "Confirmation Email Sent", desc: `We've sent order details to ${form.email || "your email"}. Check your spam folder if you don't see it.`, done: true },
              { icon: "🔍", title: "Order Being Processed", desc: "Our team is picking and packing your items", done: true },
              { icon: "📦", title: "Dispatched for Delivery", desc: `To ${form.address || ""}, ${form.city || ""}, ${form.state || ""}`, done: false },
              { icon: "🏠", title: "Delivered to Your Door", desc: `Expected delivery: ${deliveryDate()}`, done: false },
            ].map((s, i, arr) => (
              <div key={i} className="flex gap-3 pb-3">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg flex-shrink-0 ${s.done ? "bg-forest-light border-forest" : "bg-warm-cream border-border"}`}>{s.icon}</div>
                  {i < arr.length - 1 && <div className={`w-0.5 h-4 my-0.5 ${s.done ? "bg-forest" : "bg-border"}`} />}
                </div>
                <div className="pb-3">
                  <div className={`font-bold text-sm ${s.done ? "text-forest" : ""}`}>{s.title}</div>
                  <div className="text-text-med text-[13px] mt-0.5">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-warm-cream rounded-lg p-3 mt-2 text-center">
            <p className="text-text-med text-xs font-body">📲 We'll send tracking updates to {form.email || "your email"} and WhatsApp ({form.phone || "your phone"}).</p>
          </div>
          <p className="text-text-light text-xs mt-2 text-center">Didn't get a confirmation email? Check your spam folder or <a href={`https://wa.me/2348012345678?text=Hi! My order number is ${orderId}`} target="_blank" className="text-forest underline">contact us on WhatsApp</a>.</p>
        </div>

        {/* Payment status */}
        {isBankTransfer && (
          <div className="bg-[#FFF8E1] border border-[#FFD54F] rounded-card p-5 mb-4">
            <h3 className="font-bold text-base mb-2">⏳ Awaiting Payment</h3>
            {[["Bank", "GTBank"], ["Account Name", "BundledMum Nigeria Ltd"], ["Account Number", "0123456789"]].map(([k, v]) => (
              <div key={k} className="flex gap-2 mb-1 text-sm"><span className="text-text-light min-w-[120px]">{k}:</span><span className="font-semibold">{v}</span></div>
            ))}
            {order?.total && <div className="flex gap-2 mt-2 text-sm"><span className="text-text-light min-w-[120px]">Amount:</span><span className="font-bold text-coral">{fmt(order.total)}</span></div>}
          </div>
        )}

        {/* WhatsApp CTA */}
        <div className="bg-forest rounded-card p-5 md:p-8 flex flex-col md:flex-row justify-between items-center gap-3.5 mb-4 text-center md:text-left">
          <div>
            <h4 className="pf text-primary-foreground text-lg mb-1">💬 Questions About Your Order?</h4>
            <p className="text-primary-foreground/65 text-[13px]">Chat with us on WhatsApp — we reply within minutes.</p>
          </div>
          <a href={`https://wa.me/2348012345678?text=Hi! My order number is ${orderId}`} target="_blank" rel="noopener noreferrer"
            className="bg-[#25D366] text-primary-foreground px-5 py-3 rounded-pill font-semibold text-sm whitespace-nowrap w-full md:w-auto text-center">
            Chat on WhatsApp 💬
          </a>
        </div>

        <div className="flex gap-3 justify-center flex-col md:flex-row">
          <Link to="/" className="rounded-pill bg-forest px-7 py-3.5 font-body font-semibold text-primary-foreground hover:bg-forest-deep interactive text-center text-[15px]">
            Continue Shopping →
          </Link>
          <Link to="/quiz" className="rounded-pill border-2 border-forest text-forest px-7 py-3.5 font-body font-semibold hover:bg-forest/5 interactive text-center text-[15px]">
            Build Another Bundle
          </Link>
        </div>
      </div>
    </div>
  );
}
