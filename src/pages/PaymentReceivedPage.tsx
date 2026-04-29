import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, MessageCircle, Receipt, Copy, Check, Mail, ChevronRight } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSupabaseData";
import bmLogoCoral from "@/assets/logos/BM-LOGO-CORAL.svg";
import { trackOnce as pixelTrackOnce, moneyPayload as pixelMoney } from "@/lib/metaPixel";

/**
 * Thank-you page for customers who paid via a customer-service-issued
 * payment link (Instagram / WhatsApp chats, NOT the regular site
 * checkout). Tells them payment was received and asks them to share
 * the bank receipt with the rep they were chatting with so the order
 * can be processed immediately.
 *
 * Optional URL params (any combination):
 *   ?ref=<paystack_reference>   — surfaced as a copyable line for the
 *                                 rep so they can match the payment.
 *   ?amount=<naira>             — shows the paid amount in the hero.
 *   ?name=<first_name>          — personalises the greeting.
 */
export default function PaymentReceivedPage() {
  const [params] = useSearchParams();
  const ref = params.get("ref") || params.get("reference") || "";
  const amountParam = params.get("amount");
  const firstName = params.get("name") || "";
  const amount = amountParam ? Number(amountParam) : null;

  const { data: site } = useSiteSettings();
  const whatsapp: string = (site as any)?.whatsapp_number || "";
  const supportEmail: string = (site as any)?.contact_email || "hr@bundledmum.com";

  const waMessage = useMemo(() => {
    const lines = [
      "Hi BundledMum! I've just paid via your payment link.",
      ref ? `Reference: ${ref}` : null,
      amount != null && !Number.isNaN(amount) ? `Amount: ₦${Math.round(amount).toLocaleString("en-NG")}` : null,
      "I'm attaching my bank receipt now.",
    ].filter(Boolean) as string[];
    return lines.join("\n");
  }, [ref, amount]);

  const waUrl = whatsapp ? `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(waMessage)}` : "";

  const [copied, setCopied] = useState(false);
  const copyRef = async () => {
    if (!ref) return;
    try {
      await navigator.clipboard.writeText(ref);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable */ }
  };

  // Title + Pixel Purchase event (idempotent per reference) — the rep flow
  // is still a Paystack purchase, just outside the normal checkout funnel.
  useEffect(() => {
    document.title = "Payment Received | BundledMum";
    if (ref) {
      pixelTrackOnce(`pl_purchase_${ref}`, "Purchase", pixelMoney(amount || 0, {
        content_name: "Payment-link purchase",
      }));
    }
  }, [ref, amount]);

  return (
    <div className="min-h-screen bg-[#FFF8F4] pt-20 md:pt-24 pb-16">
      {/* Hero */}
      <header
        className="relative px-4 md:px-8 py-10 md:py-14 text-white"
        style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1E5C44 100%)" }}
      >
        <div className="max-w-[640px] mx-auto text-center space-y-3">
          <img src={bmLogoCoral} alt="BundledMum" className="h-9 mx-auto" />
          <div className="w-14 h-14 mx-auto rounded-full bg-white/15 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="pf text-2xl md:text-3xl font-black leading-tight">
            {firstName ? `Thank you, ${firstName}!` : "Thank you!"}<br />Payment received.
          </h1>
          {amount != null && !Number.isNaN(amount) && (
            <p className="text-sm md:text-base text-white/85">
              We've received <b className="text-white">₦{Math.round(amount).toLocaleString("en-NG")}</b>.
            </p>
          )}
          {!amount && <p className="text-sm md:text-base text-white/85">Your payment has been confirmed by Paystack.</p>}
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-4 md:px-8 py-6 space-y-4">
        {/* Action card — the one thing we want them to do */}
        <section className="bg-white border-2 border-coral rounded-card p-5 space-y-3" style={{ borderColor: "#F4845F" }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-coral/15 flex-shrink-0 flex items-center justify-center" style={{ color: "#F4845F" }}>
              <Receipt className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="pf text-lg font-bold mb-1">One last step — share your receipt</h2>
              <p className="text-sm text-text-med leading-relaxed">
                Open your bank app, screenshot the payment receipt, and send it back to the BundledMum rep you were chatting with on WhatsApp or Instagram.
              </p>
              <p className="text-sm text-text-med leading-relaxed mt-1">
                Once we have the receipt we can process your order immediately.
              </p>
            </div>
          </div>

          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 rounded-pill py-3 text-sm font-semibold text-white min-h-[48px] hover:opacity-90"
              style={{ backgroundColor: "#25D366" }}
            >
              <MessageCircle className="w-4 h-4" /> Send receipt on WhatsApp
            </a>
          )}
          <p className="text-[11px] text-text-light text-center">
            If you've been chatting on Instagram, just send the receipt back in that DM. Either channel works.
          </p>
        </section>

        {/* Reference card — surfaced so the rep can match the payment fast */}
        {ref && (
          <section className="bg-card border border-border rounded-card p-4 space-y-2 text-sm">
            <div className="text-[10px] uppercase tracking-widest font-bold text-text-med">Payment reference</div>
            <div className="flex items-center justify-between gap-2 bg-muted/40 rounded-lg px-3 py-2 font-mono text-xs break-all">
              <span>{ref}</span>
              <button
                onClick={copyRef}
                className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-[11px] font-semibold hover:bg-muted flex-shrink-0"
                aria-label="Copy reference"
              >
                {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
            </div>
            <p className="text-[11px] text-text-light">
              Share this reference with your rep if asked — it helps us match the payment instantly.
            </p>
          </section>
        )}

        {/* What happens next */}
        <section className="bg-card border border-border rounded-card p-4 space-y-1.5 text-sm">
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-text-med">What happens next</h3>
          <ul className="text-xs space-y-1.5 mt-1">
            <Step n={1}>You share the bank receipt with your rep.</Step>
            <Step n={2}>We confirm the funds and lock in your order.</Step>
            <Step n={3}>You'll receive an order confirmation by WhatsApp / email.</Step>
            <Step n={4}>Delivery follows the timeline your rep agreed with you.</Step>
          </ul>
        </section>

        {/* Fallback contact */}
        <section className="bg-card border border-border rounded-card p-4 text-xs text-text-med space-y-1">
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-text-med mb-1">Need help?</h3>
          <p>
            Lost the chat? Reach out fresh on <a className="font-semibold text-forest hover:underline" href={whatsapp ? `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}` : "#"} target="_blank" rel="noreferrer">WhatsApp</a>{supportEmail ? <> or email <a className="font-semibold text-forest hover:underline" href={`mailto:${supportEmail}`}>{supportEmail}</a></> : null} and reference your payment.
          </p>
          <p className="inline-flex items-center gap-1.5 text-text-light mt-1">
            <Mail className="w-3 h-3" /> We reply within working hours, Mon–Sat.
          </p>
        </section>

        <Link
          to="/"
          className="block text-center text-xs font-semibold text-forest hover:underline pt-1"
        >
          <span className="inline-flex items-center gap-1">Continue browsing BundledMum <ChevronRight className="w-3 h-3" /></span>
        </Link>
      </main>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-forest text-white text-[10px] font-bold flex items-center justify-center mt-0.5">{n}</span>
      <span>{children}</span>
    </li>
  );
}
