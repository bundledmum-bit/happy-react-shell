import { useState } from "react";
import { X } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSupabaseData";

const BAR_HEIGHT = 40;

export function useAnnouncementHeight() {
  const { data: settings } = useSiteSettings();
  const [dismissed, setDismissed] = useState(false);
  const visible = !dismissed && settings?.announcement_enabled === true && !!settings?.announcement_text;
  return { height: visible ? BAR_HEIGHT : 0, dismissed, setDismissed };
}

export default function AnnouncementBar({
  dismissed,
  onDismiss,
}: {
  dismissed: boolean;
  onDismiss: () => void;
}) {
  const { data: settings, isLoading } = useSiteSettings();

  if (
    isLoading ||
    dismissed ||
    settings?.announcement_enabled !== true ||
    !settings?.announcement_text
  ) {
    return null;
  }

  const bgColor = settings.announcement_bg_color || "#1a2e1a";
  const textColor = settings.announcement_text_color || "#ffffff";
  const text = settings.announcement_text;
  const link = settings.announcement_link;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[1001] flex items-center justify-center px-10 transition-all duration-300"
      style={{ backgroundColor: bgColor, color: textColor, height: BAR_HEIGHT }}
    >
      {link ? (
        <a
          href={link}
          className="text-[13px] font-medium font-body hover:underline truncate"
          style={{ color: textColor }}
        >
          {text}
        </a>
      ) : (
        <span className="text-[13px] font-medium font-body truncate">{text}</span>
      )}
      <button
        onClick={onDismiss}
        className="absolute right-3 p-1 rounded-full hover:opacity-70 transition-opacity"
        aria-label="Dismiss announcement"
      >
        <X size={14} style={{ color: textColor }} />
      </button>
    </div>
  );
}
