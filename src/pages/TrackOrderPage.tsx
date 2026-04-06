import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  useEffect(() => { document.title = "Track Order | BundledMum"; }, []);

  const handleTrack = () => {
    if (!orderId.trim()) return;
    const text = `Hi! I'd like to track my order. My order number is: ${orderId}`;
    window.open(`https://wa.me/2348012345678?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20" style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1E5C44 100%)" }}>
        <div className="max-w-[700px] mx-auto px-4 md:px-10 py-10 md:py-16">
          <h1 className="pf text-3xl md:text-[46px] text-primary-foreground mb-2">📦 Track Your Order</h1>
          <p className="text-primary-foreground/65 text-sm md:text-base">Enter your order number and we'll check the status for you.</p>
        </div>
      </div>
      <div className="max-w-[500px] mx-auto px-4 md:px-10 py-10">
        <div className="bg-card rounded-card shadow-card p-6 md:p-8">
          <label className="text-xs font-semibold text-text-med uppercase tracking-wide mb-2 block">Order Number</label>
          <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="e.g. ORD-ABC123"
            className="w-full rounded-[10px] border-[1.5px] border-border px-4 py-3 text-sm bg-card font-body focus:border-forest outline-none mb-4" />
          <button onClick={handleTrack}
            className="w-full rounded-pill bg-forest py-3 font-body font-semibold text-primary-foreground hover:bg-forest-deep interactive text-sm">
            Track on WhatsApp 💬
          </button>
          <p className="text-text-light text-xs text-center mt-3">We'll respond within minutes during business hours.</p>
        </div>
        <div className="text-center mt-8">
          <p className="text-text-med text-sm mb-2">Can't find your order number?</p>
          <p className="text-text-light text-xs">Check your email for an order confirmation from BundledMum, or <a href="https://wa.me/2348012345678?text=Hi! I need help finding my order number." target="_blank" rel="noopener noreferrer" className="text-forest font-semibold hover:underline">chat with us</a>.</p>
        </div>
      </div>
    </div>
  );
}
