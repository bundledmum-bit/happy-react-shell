import { X } from "lucide-react";

interface Props {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function BundleImageZoom({ src, alt, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[210] bg-card rounded-full p-2.5 shadow-lg hover:bg-muted transition-colors"
        aria-label="Close zoom"
      >
        <X className="h-6 w-6 text-foreground" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}
