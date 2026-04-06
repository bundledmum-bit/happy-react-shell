import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function FloatingScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      className="fixed bottom-5 right-5 z-[900] w-12 h-12 bg-forest rounded-full flex items-center justify-center shadow-lg hover:bg-forest-deep transition-all hover:scale-110"
    >
      <ArrowUp className="w-5 h-5 text-primary-foreground" />
    </button>
  );
}
