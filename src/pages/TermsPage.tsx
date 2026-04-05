import { Link } from "react-router-dom";
import { useEffect } from "react";

export default function TermsPage() {
  useEffect(() => { document.title = "Terms & Conditions | BundledMum"; }, []);

  return (
    <div className="min-h-screen pt-[68px]">
      <div style={{ background: "linear-gradient(135deg, #2D6A4F, #1E5C44)" }} className="px-5 md:px-10 py-10 md:py-16">
        <div className="max-w-[780px] mx-auto text-center">
          <h1 className="pf text-3xl md:text-[46px] text-primary-foreground">Terms & Conditions</h1>
          <p className="text-primary-foreground/70 text-sm mt-2">Last updated: April 2026</p>
        </div>
      </div>
      <div className="max-w-[780px] mx-auto px-5 md:px-10 py-10 md:py-16 prose prose-sm text-text-med font-body">
        <h2 className="pf text-forest text-xl mb-3">1. General</h2>
        <p className="mb-4 leading-relaxed">By using bundledmum.ng, you agree to these terms. BundledMum is operated by BundledMum Nigeria Ltd, registered in Lagos, Nigeria.</p>

        <h2 className="pf text-forest text-xl mb-3">2. Products & Pricing</h2>
        <p className="mb-4 leading-relaxed">All prices are in Nigerian Naira (₦) and include applicable taxes. Prices may change without prior notice. A ₦1,500 service and packaging fee applies to all orders.</p>

        <h2 className="pf text-forest text-xl mb-3">3. Orders & Payment</h2>
        <p className="mb-4 leading-relaxed">Orders are confirmed once payment is received. We accept card payments (Visa, Mastercard, Verve), bank transfers, and USSD via Paystack. Bank transfer orders must be completed within 24 hours.</p>

        <h2 className="pf text-forest text-xl mb-3">4. Delivery</h2>
        <p className="mb-4 leading-relaxed">Lagos delivery: 1–2 business days. Other states: 2–4 business days. Free delivery on orders over ₦30,000. A delivery fee of ₦2,500 applies to orders under ₦30,000.</p>

        <h2 className="pf text-forest text-xl mb-3">5. Returns & Exchanges</h2>
        <p className="mb-4 leading-relaxed">Unused, sealed items may be returned within 7 days of delivery. Contact us on WhatsApp to arrange a return. Refunds are processed within 5–7 business days. Opened or used items cannot be returned for hygiene reasons.</p>

        <h2 className="pf text-forest text-xl mb-3">6. Limitation of Liability</h2>
        <p className="mb-4 leading-relaxed">BundledMum is not liable for delays caused by courier services or events outside our control. Our maximum liability is limited to the order value.</p>

        <h2 className="pf text-forest text-xl mb-3">7. Contact</h2>
        <p className="mb-4 leading-relaxed">Questions about these terms? Email <a href="mailto:hello@bundledmum.ng" className="text-forest underline">hello@bundledmum.ng</a>.</p>

        <div className="mt-8 text-center">
          <Link to="/" className="text-forest font-semibold underline">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
