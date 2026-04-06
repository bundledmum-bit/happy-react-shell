import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/lib/cart";

const TABS = [
  { to: "/", icon: "🏠", label: "Home" },
  { to: "/quiz", icon: "🧩", label: "Quiz" },
  { to: "/shop", icon: "🛍", label: "Shop" },
  { to: "/cart", icon: "🛒", label: "Cart" },
];

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const { totalItems } = useCart();

  // Don't show on checkout or order confirmed
  if (pathname === "/checkout" || pathname === "/order-confirmed") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[90] bg-card border-t border-border md:hidden">
      <div className="flex justify-around items-center h-14">
        {TABS.map(tab => {
          const active = tab.to === "/" ? pathname === "/" : pathname.startsWith(tab.to);
          return (
            <Link key={tab.to} to={tab.to}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative ${active ? "text-forest" : "text-text-light"}`}>
              <span className="text-lg relative">
                {tab.icon}
                {tab.label === "Cart" && totalItems > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-coral text-[8px] font-bold text-primary-foreground">
                    {totalItems}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
