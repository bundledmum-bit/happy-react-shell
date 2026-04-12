import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  imageUrl?: string | null;
  emoji?: string;
  alt?: string;
  size?: "thumbnail" | "medium" | "large";
  className?: string;
  emojiClassName?: string;
  bgColor?: string;
}

/**
 * Renders a product image with skeleton loading and emoji fallback.
 * Chain: imageUrl (with skeleton) → emoji → 📦
 */
export default function ProductImage({
  imageUrl,
  emoji,
  alt = "Product",
  size = "medium",
  className = "",
  emojiClassName = "text-4xl",
  bgColor,
}: ProductImageProps) {
  const [broken, setBroken] = useState(false);
  const [loading, setLoading] = useState(!!imageUrl);

  const fallbackEmoji = emoji || "📦";

  if (!imageUrl || broken) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={bgColor ? { backgroundColor: bgColor } : undefined}
      >
        <span className={emojiClassName}>{fallbackEmoji}</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} style={bgColor ? { backgroundColor: bgColor } : undefined}>
      {loading && (
        <div className="absolute inset-0 animate-pulse bg-muted rounded-md" />
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={cn("object-cover w-full h-full", loading ? "opacity-0" : "opacity-100 transition-opacity duration-300")}
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={() => { setBroken(true); setLoading(false); }}
      />
    </div>
  );
}