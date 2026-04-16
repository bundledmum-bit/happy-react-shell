import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSupabaseData";
import { fmt } from "@/lib/cart";

interface Props {
  customerName?: string;
  orderId?: string;
}

export default function ReferralSection({ customerName, orderId }: Props) {
  const [copied, setCopied] = useState(false);
  const { data: settings } = useSiteSettings();
  const referralAmount = parseInt(settings?.referral_credit_amount || settings?.referral_amount) || 2000;

  // Fetch real referral code generated for this order
  const { data: referralCode } = useQuery({
    queryKey: ["referral-code", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("referrer_order_id", orderId)
        .maybeSingle();
      if (error) throw error;
      return data?.code || null;
    },
  });

  // Fallback code from name if DB code isn't available yet
  const fallbackCode = (() => {
    const clean = (customerName || "").replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 8);
    return `${clean || "BUNDLED"}${new Date().getFullYear()}`;
  })();

  const code = referralCode || fallbackCode;
  const link = `https://bundledmum.com/?ref=${code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = `I just packed my hospital bag with BundledMum and loved it! 🎁 Use my referral code ${code} to get ${fmt(referralAmount)} off your first bundle: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleInstagram = () => {
    navigator.clipboard.writeText(`Use my BundledMum referral code: ${code} — Get ${fmt(referralAmount)} off! ${link}`);
    toast.success("Link copied! Paste it in your Instagram bio or story.");
  };

  return (
    <div className="bg-forest-light border-2 border-forest/20 rounded-card p-5 md:p-8">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🎁</span>
        <h3 className="pf text-lg md:text-xl text-forest font-bold">Share & Earn</h3>
      </div>
      <p className="text-text-med text-sm mb-4">
        Share your code and earn <span className="font-bold text-forest">{fmt(referralAmount)} credit</span> when a friend places their first order!
      </p>

      <div className="bg-card rounded-xl p-4 mb-3 text-center">
        <p className="text-text-light text-[11px] mb-1.5">Your referral code:</p>
        <div className="flex items-center justify-center gap-3">
          <span className="font-mono font-bold text-xl tracking-wider text-forest">{code}</span>
          <button onClick={handleCopy} className="flex-shrink-0 rounded-pill bg-forest px-3 py-1.5 text-[11px] font-semibold text-primary-foreground interactive flex items-center gap-1">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <button onClick={handleWhatsApp} className="flex-1 rounded-pill bg-[#25D366] text-primary-foreground py-2.5 text-xs font-semibold interactive">
          📱 Share on WhatsApp
        </button>
        <button onClick={handleInstagram} className="flex-1 rounded-pill bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-primary-foreground py-2.5 text-xs font-semibold interactive">
          📷 Share on Instagram
        </button>
      </div>
    </div>
  );
}
