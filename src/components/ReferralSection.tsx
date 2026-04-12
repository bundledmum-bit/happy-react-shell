import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  customerName?: string;
}

function generateCode(name: string) {
  const clean = name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 8);
  return `${clean || "BUNDLED"}${new Date().getFullYear()}`;
}

export default function ReferralSection({ customerName }: Props) {
  const [copied, setCopied] = useState(false);
  const code = generateCode(customerName || "");
  const link = `https://bundledmum.com/?ref=${code}`;

  useEffect(() => {
    // Store referral code for this customer
    try { localStorage.setItem("bm-referral-code", code); } catch {}
  }, [code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = `I just packed my hospital bag with BundledMum and loved it! 🎁 Use my link to get ₦2,000 off your first bundle: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleInstagram = () => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied! Paste it in your Instagram bio or story.");
  };

  // Check referral stats from localStorage
  const referralCount = (() => { try { return parseInt(localStorage.getItem("bm-referral-count") || "0"); } catch { return 0; } })();

  return (
    <div className="bg-forest-light border-2 border-forest/20 rounded-card p-5 md:p-8">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🎁</span>
        <h3 className="pf text-lg md:text-xl text-forest font-bold">Share the Love</h3>
      </div>
      <p className="text-text-med text-sm mb-4">
        Give a friend <span className="font-bold text-forest">₦2,000 off</span> their first bundle — and get <span className="font-bold text-forest">₦2,000 off</span> your next order!
      </p>

      <div className="bg-card rounded-xl p-3 mb-3">
        <p className="text-text-light text-[11px] mb-1">Your referral link:</p>
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold truncate flex-1">{link}</p>
          <button onClick={handleCopy} className="flex-shrink-0 rounded-pill bg-forest px-3 py-1.5 text-[11px] font-semibold text-primary-foreground interactive flex items-center gap-1">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <button onClick={handleWhatsApp} className="flex-1 rounded-pill bg-[#25D366] text-primary-foreground py-2.5 text-xs font-semibold interactive">
          📱 Share on WhatsApp
        </button>
        <button onClick={handleInstagram} className="flex-1 rounded-pill bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-primary-foreground py-2.5 text-xs font-semibold interactive">
          📷 Share on Instagram
        </button>
      </div>

      <div className="text-center text-text-light text-xs">
        📊 {referralCount} friend{referralCount !== 1 ? "s" : ""} referred · ₦{(referralCount * 2000).toLocaleString()} earned
      </div>
    </div>
  );
}
