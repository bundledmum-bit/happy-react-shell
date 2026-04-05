import { Link } from "react-router-dom";
import logoWhite from "@/assets/logos/BM-LOGO-WHITE.svg";

export default function Footer() {
  return (
    <footer style={{ background: "#1A1A1A" }} className="px-5 md:px-10 pt-10 md:pt-14 pb-7 md:pb-9">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-7 md:gap-14 mb-8 md:mb-12">
          <div className="col-span-2 md:col-span-1">
            <img src={logoWhite} alt="BundledMum" className="h-11 w-auto mb-3.5" />
            <p className="text-primary-foreground/45 text-[13px] leading-[1.8] max-w-[260px]">Nigeria's most trusted hospital bag curator. Everything you need, nothing you don't.</p>
            <div className="flex gap-2.5 mt-4">
              {["📘", "📷"].map(i => <div key={i} className="w-8 h-8 bg-primary-foreground/[0.08] rounded-full flex items-center justify-center cursor-pointer">{i}</div>)}
              <div className="w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center cursor-pointer">💬</div>
            </div>
          </div>
          {[
            { title: "Shop", links: [{ label: "Baby Items", to: "/shop?tab=baby" }, { label: "Mum Items", to: "/shop?tab=mum" }, { label: "Bundle Kits", to: "/bundles" }] },
            { title: "Help", links: [{ label: "FAQs", to: "/contact" }, { label: "WhatsApp Us", to: "#" }] },
            { title: "Company", links: [{ label: "Our Story", to: "/about" }, { label: "Contact", to: "/contact" }] },
          ].map(col => (
            <div key={col.title}>
              <div className="text-primary-foreground font-semibold text-[13px] mb-3.5">{col.title}</div>
              {col.links.map(l => (
                <Link key={l.label} to={l.to} className="block text-primary-foreground/40 text-xs mb-2 cursor-pointer hover:text-primary-foreground/70 transition-colors">{l.label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-primary-foreground/[0.07] pt-5 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-primary-foreground/30">
          <p>© 2026 BundledMum. All rights reserved.</p>
          <div className="flex gap-4">
            {["Privacy", "Terms", "Cookies"].map(l => <span key={l} className="cursor-pointer">{l}</span>)}
          </div>
        </div>
      </div>
    </footer>
  );
}
