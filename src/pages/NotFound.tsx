import { Link } from "react-router-dom";
import { useEffect } from "react";
import logoGreen from "@/assets/logos/BM-LOGO-GREEN.svg";

export default function NotFound() {
  useEffect(() => {
    document.title = "Page Not Found | BundledMum";
  }, []);

  return (
    <div className="min-h-screen bg-background pt-[68px] flex items-center justify-center px-5">
      <div className="text-center max-w-[480px] animate-fade-up">
        <img src={logoGreen} alt="BundledMum" className="h-10 w-auto mx-auto mb-6" />
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="pf text-3xl md:text-4xl text-forest mb-3">Oops! This page doesn't exist.</h1>
        <p className="font-body text-text-med text-sm mb-8">The page you're looking for may have been moved or doesn't exist. Let's get you back on track.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/quiz" className="rounded-pill bg-coral px-6 py-3 font-body font-semibold text-primary-foreground hover:bg-coral-dark interactive text-sm">Build My Bundle →</Link>
          <Link to="/shop" className="rounded-pill bg-forest px-6 py-3 font-body font-semibold text-primary-foreground hover:bg-forest-deep interactive text-sm">Browse All Products →</Link>
          <Link to="/" className="rounded-pill border-2 border-forest text-forest px-6 py-3 font-body font-semibold hover:bg-forest/5 interactive text-sm">Go Home →</Link>
        </div>
      </div>
    </div>
  );
}
