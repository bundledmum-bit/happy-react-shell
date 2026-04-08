import { useState } from "react";

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
 * Renders a product image with emoji fallback.
 * Chain: imageUrl → emoji → 📦
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

  const fallbackEmoji = emoji || "📦";

  if (!imageUrl || broken) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={bgColor ? { backgroundColor: bgColor } : undefined}
      >
        <span className={emojiClassName}>{fallbackEmoji}</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`object-cover ${className}`}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}
