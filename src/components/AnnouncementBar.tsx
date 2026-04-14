import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Announcement {
  id: string;
  title: string;
  message: string;
  link_url: string | null;
  link_text: string | null;
  bg_color: string;
  text_color: string;
  emoji: string | null;
  priority: number;
  target_pages: string[] | null;
}

function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("announcements")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .order("display_order");
      if (error) throw error;
      return (data || []) as Announcement[];
    },
    staleTime: 60_000,
  });
}

export default function AnnouncementBar() {
  const { data: announcements } = useAnnouncements();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const location = useLocation();

  const active = (announcements || []).filter(a => {
    if (dismissed.has(a.id)) return false;
    if (a.target_pages && a.target_pages.length > 0) {
      return a.target_pages.some(p => location.pathname === p || location.pathname.startsWith(p + "/"));
    }
    return true;
  });

  // Auto-rotate every 5 seconds when multiple announcements
  useEffect(() => {
    if (active.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % active.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [active.length]);

  // Reset index if it's out of bounds
  useEffect(() => {
    if (currentIndex >= active.length) setCurrentIndex(0);
  }, [active.length, currentIndex]);

  if (active.length === 0) return null;

  const current = active[currentIndex % active.length];
  if (!current) return null;

  const bgColor = (current.bg_color || "#2D6A4F").replace(/^"|"$/g, "");
  const textColor = (current.text_color || "#FFFFFF").replace(/^"|"$/g, "");

  const content = (
    <span className="text-[12px] sm:text-[13px] font-semibold tracking-wide font-body flex items-center gap-1.5 justify-center">
      {current.emoji && <span className="text-sm">{current.emoji}</span>}
      <span>{current.message}</span>
      {current.link_url && (
        <span className="underline underline-offset-2 opacity-80 flex items-center gap-0.5">
          {current.link_text || "Shop now"}
          <ChevronRight className="w-3 h-3" />
        </span>
      )}
    </span>
  );

  return (
    <div
      className="relative z-[60] flex items-center justify-center px-10 py-2 text-center transition-all"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {current.link_url ? (
        <Link to={current.link_url} className="hover:opacity-80 transition-opacity">
          {content}
        </Link>
      ) : (
        content
      )}

      {/* Dots indicator for multiple announcements */}
      {active.length > 1 && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0.5 flex gap-1">
          {active.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className="w-1 h-1 rounded-full transition-opacity"
              style={{ backgroundColor: textColor, opacity: i === (currentIndex % active.length) ? 1 : 0.3 }}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setDismissed(prev => new Set(prev).add(current.id))}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/15 transition-colors"
        aria-label="Dismiss announcement"
      >
        <X className="w-3.5 h-3.5" style={{ color: textColor }} />
      </button>
    </div>
  );
}
