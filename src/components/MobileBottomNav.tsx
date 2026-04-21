import { Link, useLocation } from "react-router-dom";
import { Home as HomeIcon, Sparkles, ShoppingBag, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/lib/cart";

type Tab = {
  to: string;
  icon: typeof HomeIcon;
  label: string;
  match?: (pathname: string) => boolean;
};

const TABS: Tab[] = [
  { to: "/", icon: HomeIcon, label: "Home", match: p => p === "/" },
  { to: "/quiz", icon: Sparkles, label: "Quiz" },
  { to: "/shop", icon: ShoppingBag, label: "Shop" },
  { to: "/cart", icon: ShoppingCart, label: "Cart" },
  { to: "/track-order", icon: User, label: "Account" },
];

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const { totalItems } = useCart();

  // Hide on focused flows where the bottom nav would compete with
  // page-level primary actions.
  if (
    pathname === "/checkout" ||
    pathname === "/order-confirmed" ||
    pathname.startsWith("/quiz")
  ) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[90] bg-card border-t border-border md:hidden">
      <div className="flex justify-around items-center h-14">
        {TABS.map(tab => {
          const active = tab.match ? tab.match(pathname) : pathname.startsWith(tab.to);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative ${active ? "text-forest" : "text-text-light"}`}
            >
              <span className="relative flex items-center justify-center">
                <Icon className="w-5 h-5" />
                {tab.label === "Cart" && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-coral text-[9px] font-bold text-primary-foreground px-1">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </Link>
          );
        })}
      </div>
      {/* iOS safe-area cushion so the bar doesn't sit under the home indicator */}
      <div className="h-[env(safe-area-inset-bottom)] bg-card" />
    </nav>
  );
}
