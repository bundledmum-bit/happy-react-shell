import { Link } from "react-router-dom";
import logoWhite from "@/assets/logos/BM-LOGO-WHITE.svg";

export default function Footer() {
  return (
    <footer className="bg-forest-deep text-primary-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <img src={logoWhite} alt="BundledMum" className="h-10 mb-4" />
            <p className="text-sm text-primary-foreground/70 font-body leading-relaxed mb-4">
              Everything ready. Nothing forgotten.
            </p>
            <div className="flex gap-4 text-xl">
              <a href="#" aria-label="Instagram">📷</a>
              <a href="#" aria-label="Facebook">📘</a>
              <a href="#" aria-label="TikTok">🎵</a>
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold text-sm uppercase tracking-wide mb-4 text-primary-foreground/60">Quick Links</h4>
            <ul className="space-y-2 font-body text-sm">
              {[
                { to: "/bundles", label: "Bundles" },
                { to: "/shop?tab=baby", label: "Shop Baby" },
                { to: "/shop?tab=mum", label: "Shop Mum" },
                { to: "/quiz", label: "How It Works" },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-sm uppercase tracking-wide mb-4 text-primary-foreground/60">Contact</h4>
            <ul className="space-y-2 font-body text-sm text-primary-foreground/70">
              <li>hello@bundledmum.ng</li>
              <li>+234 (0) 800 BUNDLED</li>
              <li>Lagos deliveries within 48 hours</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-primary-foreground/50 font-body">
          <p>© 2025 BundledMum Nigeria Ltd. All rights reserved.</p>
          <p>Secured by Paystack</p>
        </div>
      </div>
    </footer>
  );
}
