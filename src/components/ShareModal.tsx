import { useState, useRef, useEffect } from "react";
import { X, Copy, Download, Check } from "lucide-react";
import { toast } from "sonner";

interface ShareModalProps {
  onClose: () => void;
  title: string;
  subtitle: string;
  items: { name: string; price: number }[];
  totalPrice: number;
  badge?: string;
  shareUrl: string;
  shareText: string;
  gender?: string;
  hospitalType?: string;
  budgetLabel?: string;
  itemCount?: number;
}

export default function ShareModal({ onClose, title, subtitle, items, totalPrice, badge, shareUrl, shareText, gender, hospitalType, budgetLabel, itemCount }: ShareModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1080;

    // Background
    ctx.fillStyle = "#2D5016";
    ctx.fillRect(0, 0, 1080, 1080);

    // Subtle pattern
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.beginPath();
    ctx.arc(900, 200, 300, 0, Math.PI * 2);
    ctx.fill();

    // Logo text
    ctx.fillStyle = "#FFF8F4";
    ctx.font = "bold 28px 'DM Sans', sans-serif";
    ctx.fillText("BundledMum", 60, 80);

    // Badge
    if (badge) {
      ctx.fillStyle = "#F4845F";
      ctx.font = "bold 20px 'DM Sans', sans-serif";
      ctx.fillText(badge, 60, 120);
    }

    // Title
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 48px 'DM Sans', sans-serif";
    ctx.fillText(title, 60, 220);

    // Subtitle info
    ctx.fillStyle = "#FFF8F4";
    ctx.font = "24px 'DM Sans', sans-serif";
    const infoLine = [
      gender === "boy" ? "👶 Boy" : gender === "girl" ? "👧 Girl" : "🌈 Neutral",
      hospitalType ? `🏥 ${hospitalType}` : "",
      budgetLabel ? `${budgetLabel} Bundle` : "",
      itemCount ? `${itemCount} items` : "",
    ].filter(Boolean).join(" · ");
    ctx.fillText(infoLine, 60, 280);

    // Price
    ctx.fillStyle = "#F4845F";
    ctx.font = "bold 64px 'DM Sans', sans-serif";
    ctx.fillText(`₦${totalPrice.toLocaleString()}`, 60, 380);

    // Items
    ctx.fillStyle = "#FFF8F4";
    ctx.font = "22px 'DM Sans', sans-serif";
    const displayItems = items.slice(0, 8);
    displayItems.forEach((item, i) => {
      const y = 440 + i * 40;
      ctx.fillText(`✅ ${item.name}`, 60, y);
    });
    if (items.length > 8) {
      ctx.fillStyle = "rgba(255,248,244,0.6)";
      ctx.fillText(`+ ${items.length - 8} more items`, 60, 440 + 8 * 40);
    }

    // Footer
    ctx.fillStyle = "rgba(255,248,244,0.5)";
    ctx.font = "20px 'DM Sans', sans-serif";
    ctx.fillText("Build yours FREE at", 60, 940);
    ctx.fillStyle = "#F4845F";
    ctx.font = "bold 22px 'DM Sans', sans-serif";
    ctx.fillText("bundledmum.lovable.app/quiz", 60, 970);

    ctx.fillStyle = "rgba(255,248,244,0.4)";
    ctx.font = "18px 'DM Sans', sans-serif";
    ctx.fillText("⭐ 4.9/5 · 200+ mums served", 60, 1020);

    setImageUrl(canvas.toDataURL("image/png"));
  }, [title, items, totalPrice, badge, gender, hospitalType, budgetLabel, itemCount]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`, "_blank");
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "BundledMum-Bundle.png";
    a.click();
    toast.success("Image saved!");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
      <div className="relative bg-card rounded-[20px] shadow-2xl max-w-[420px] w-full max-h-[90vh] overflow-y-auto animate-fade-in p-5" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center hover:bg-foreground/20">
          <X className="h-4 w-4" />
        </button>

        <h2 className="pf text-xl font-bold mb-3">Share Your Bundle</h2>

        {/* Preview */}
        {imageUrl && (
          <div className="rounded-xl overflow-hidden mb-4 border border-border">
            <img src={imageUrl} alt="Share card" className="w-full" />
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={handleWhatsApp} className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-primary-foreground py-2.5 text-sm font-semibold interactive">
            📱 WhatsApp
          </button>
          <button onClick={handleDownload} className="flex items-center justify-center gap-2 rounded-xl bg-forest text-primary-foreground py-2.5 text-sm font-semibold interactive">
            <Download className="h-4 w-4" /> Save Image
          </button>
          <button onClick={handleTwitter} className="flex items-center justify-center gap-2 rounded-xl bg-foreground text-primary-foreground py-2.5 text-sm font-semibold interactive">
            🐦 Twitter/X
          </button>
          <button onClick={handleFacebook} className="flex items-center justify-center gap-2 rounded-xl bg-[#1877F2] text-primary-foreground py-2.5 text-sm font-semibold interactive">
            📘 Facebook
          </button>
        </div>

        {/* Copy link */}
        <div className="bg-warm-cream rounded-xl p-3">
          <p className="text-text-light text-[11px] mb-1.5">Your unique link:</p>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold truncate flex-1">{shareUrl}</p>
            <button onClick={handleCopyLink} className="flex-shrink-0 rounded-pill bg-forest px-3 py-1.5 text-[11px] font-semibold text-primary-foreground interactive flex items-center gap-1">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
