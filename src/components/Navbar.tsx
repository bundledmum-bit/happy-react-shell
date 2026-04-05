import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import logoWhite from "@/assets/logos/BM-LOGO-WHITE.svg";
import logoCoral from "@/assets/logos/BM-LOGO-CORAL.svg";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems, justAdded } = useCart();
  const location = useLocation();

  const isHome = location.pathname === "/";

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  const showWhite = isHome && !scrolled;

  const navLinks = [
    { to: "/bundles", label: "Bundles" },
    { to: "/shop?tab=baby", label: "Shop Baby" },
    { to: "/shop?tab=mum", label: "Shop Mum" },
    { to: "/quiz", label: "How It Works" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || !isHome
            ? "bg-card shadow-card"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between px-4 py-3 md:py-4">
          <Link to="/" className="flex-shrink-0">
            <img
              src={showWhite ? logoWhite : logoCoral}
              alt="BundledMum"
              className="h-9 md:h-11"
            />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-sm font-body font-bold transition-colors ${
                  showWhite ? "text-primary-foreground/80 hover:text-primary-foreground" : "text-foreground/70 hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/quiz"
              className="hidden md:inline-flex items-center gap-1.5 rounded-pill bg-coral px-5 py-2.5 text-sm font-display font-bold text-primary-foreground hover:bg-coral-dark interactive"
            >
              Build My Bundle →
            </Link>

            <Link to="/cart" className="relative p-2">
              <ShoppingBag className={`h-5 w-5 ${showWhite ? "text-primary-foreground" : "text-foreground"}`} />
              {totalItems > 0 && (
                <span className={`absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-coral text-[10px] font-bold text-primary-foreground ${justAdded ? "animate-pulse-badge" : ""}`}>
                  {totalItems}
                </span>
              )}
            </Link>

            <button
              className="md:hidden p-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <X className={`h-6 w-6 ${showWhite ? "text-primary-foreground" : "text-foreground"}`} />
              ) : (
                <Menu className={`h-6 w-6 ${showWhite ? "text-primary-foreground" : "text-foreground"}`} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-midnight/40" />
          <div
            className="absolute top-0 right-0 w-72 h-full bg-card shadow-card-hover animate-fade-in flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-forest p-5">
              <img src={logoWhite} alt="BundledMum" className="h-8" />
            </div>
            <div className="p-5">
              <Link
                to="/quiz"
                className="mb-5 flex items-center justify-center rounded-pill bg-coral px-5 py-3 text-sm font-display font-bold text-primary-foreground"
              >
                Build My Bundle →
              </Link>
              {navLinks.map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="block py-3 text-base font-body font-bold text-foreground/80 border-b border-border"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
