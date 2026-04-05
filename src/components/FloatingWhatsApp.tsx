import { MessageCircle } from "lucide-react";

export default function FloatingWhatsApp() {
  return (
    <a
      href="https://wa.me/2348012345678?text=Hi%20BundledMum!%20I%20have%20a%20question."
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-[900] w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:bg-[#20bd5a] transition-all hover:scale-110"
    >
      <MessageCircle className="w-7 h-7 text-primary-foreground" />
    </a>
  );
}
