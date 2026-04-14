import { useState } from "react";
import { Link } from "react-router-dom";
import { X, ChevronRight } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSupabaseData";

export default function AnnouncementBar() {
  const { data: settings } = useSiteSettings();
  const [dismissed, setDismissed] = useState(false);

  const enabled = settings?.announcement_enabled === true || settings?.announcement_enabled === "true" || settings?.announcement_enabled === "1";
  const text = settings?.announcement_text || "";
  const link = settings?.announcement_link || "";
  const bgColor = typeof settings?.announcement_bg_color === "string"
    ? settings.announcement_bg_color.replace(/^"|"$/g, "")
    : "#2D6A4F";
  const textColor = typeof settings?.announcement_text_color === "string"
    ? settings.announcement_text_color.replace(/^"|"$/g, "")
    : "#FFFFFF";

  if (!enabled || !text || dismissed) return null;

  const content = (
    <span className="text-[12px] sm:text-[13px] font-semibold tracking-wide font-body flex items-center gap-1.5">
      {text}
      {link && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
    </span>
  );

  return (
    <div
      className="relative z-[60] flex items-center justify-center px-10 py-2 text-center transition-all"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {link ? (
        <Link to={link} className="hover:opacity-80 transition-opacity">
          {content}
        </Link>
      ) : (
        content
      )}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/15 transition-colors"
        aria-label="Dismiss announcement"
      >
        <X className="w-3.5 h-3.5" style={{ color: textColor }} />
      </button>
    </div>
  );
}
