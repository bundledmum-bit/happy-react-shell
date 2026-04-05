import { Link, useLocation } from "react-router-dom";
import { fmt } from "@/lib/cart";

export default function OrderConfirmedPage() {
  const { state } = useLocation();
  const order = state as Record<string, unknown> | null;

  const isBankTransfer = order?.paymentType === "bank_transfer";
  const orderId = (order?.orderId as string) || "BM-2025-XXXX";
  const email = (order?.email as string) || "your email";

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20" style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1A4A33 100%)" }}>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4 animate-fade-up">✅</div>
          <h1 className="font-display font-black text-2xl md:text-4xl text-primary-foreground mb-2 animate-fade-up">Order Confirmed! 🎉</h1>
          <p className="font-body text-primary-foreground/70 animate-fade-up">Order ID: <span className="font-bold">{orderId}</span></p>
          <p className="font-body text-primary-foreground/50 text-sm animate-fade-up">We'll send your confirmation to {email}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-xl">
        {isBankTransfer ? (
          <div className="bg-[#FFF8E1] border border-[#FFD54F] rounded-card p-5 mb-6 animate-fade-up">
            <h2 className="font-display font-bold text-lg mb-2">⏳ Awaiting Payment Confirmation</h2>
            <div className="font-body text-sm space-y-1 mb-3">
              <p><span className="text-muted-foreground">Bank:</span> GTBank</p>
              <p><span className="text-muted-foreground">Account Name:</span> BundledMum Nigeria Ltd</p>
              <p><span className="text-muted-foreground">Account Number:</span> 0123456789</p>
              {order?.total && <p><span className="text-muted-foreground">Amount:</span> <span className="font-bold text-coral">{fmt(order.total as number)}</span></p>}
            </div>
            <p className="font-body text-xs text-muted-foreground">Once we confirm your transfer, we'll start packing your order</p>
          </div>
        ) : (
          <div className="bg-mint border border-forest/20 rounded-card p-5 mb-6 animate-fade-up">
            <h2 className="font-display font-bold text-lg text-forest">✅ Payment Confirmed</h2>
            <p className="font-body text-sm text-forest/70">Your order is now being packed</p>
          </div>
        )}

        <div className="bg-card rounded-card shadow-card p-6 mb-8 animate-fade-up">
          <h3 className="font-display font-bold mb-4">Order Timeline</h3>
          <div className="space-y-4">
            {[
              { icon: "✅", label: "Order Received", active: true },
              { icon: "⏳", label: "Packing (24 hours)", active: false },
              { icon: "🚚", label: "Out for Delivery (48 hours — Lagos)", active: false },
              { icon: "📦", label: "Delivered", active: false },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl">{s.icon}</span>
                <span className={`font-body text-sm ${s.active ? "font-bold text-forest" : "text-muted-foreground"}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-center animate-fade-up">
          <Link to="/" className="rounded-pill bg-forest px-6 py-3 font-display font-bold text-primary-foreground hover:bg-forest-deep interactive">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
