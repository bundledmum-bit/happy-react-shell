import { useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";

const MESSAGES: Record<string, string> = {
  "/": "Hi! I'd like help choosing my hospital bag bundle 💚",
  "/shop": "Hi! I have a question about a product I'm looking at 💚",
  "/quiz": "Hi! I just got my quiz results and have a question 💚",
  "/checkout": "Hi! I need help completing my order 💚",
  "/cart": "Hi! I have a question about my cart 💚",
  "/bundles": "Hi! I'd like help choosing a bundle 💚",
};

const PHONE = "2348012345678";

export default function FloatingWhatsAppButton() {
  const { pathname } = useLocation();

  // Don't show on checkout to avoid distraction
  if (pathname === "/checkout" || pathname === "/order-confirmed") return null;

  const message = MESSAGES[pathname] || MESSAGES["/"];
  const url = `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="fixed bottom-20 right-4 md:bottom-6 md:right-20 z-[85] w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:bg-[#20bd5a] transition-colors interactive"
      aria-label="Chat on WhatsApp">
      <MessageCircle className="h-5 w-5 text-primary-foreground" />
    </a>
  );
}
