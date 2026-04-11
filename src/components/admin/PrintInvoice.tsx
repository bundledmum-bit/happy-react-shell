import { X } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSupabaseData";
import BmLogoGreen from "@/assets/logos/BM-LOGO-GREEN.svg";
import { useRef } from "react";

interface Props {
  order: any;
  onClose: () => void;
}

export default function PrintInvoice({ order, onClose }: Props) {
  const { data: settings } = useSiteSettings();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const logoUrl = settings?.brand_logo_url || BmLogoGreen;
  const primaryColor = settings?.brand_primary_color || "#2D6A4F";
  const accentColor = settings?.brand_accent_color || "#F4845F";
  const bgColor = settings?.brand_background_color || "#FFF8F4";
  const patternUrl = settings?.brand_pattern_url || "";

  const handlePrint = () => window.print();

  const items = order.order_items || [];

  return (
    <div className="fixed inset-0 bg-foreground/50 z-[100] flex items-start justify-center pt-6 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl mx-4 mb-10 rounded-xl shadow-lg print:shadow-none print:rounded-none print:mx-0 print:max-w-none relative">
        {/* Print watermark */}
        {patternUrl && (
          <div className="absolute inset-0 pointer-events-none print:block hidden z-0"
            style={{ backgroundImage: `url(${patternUrl})`, backgroundRepeat: 'repeat', opacity: 0.04 }} />
        )}

        {/* Header - hide on print */}
        <div className="flex items-center justify-between p-4 border-b border-border print:hidden">
          <h2 className="text-lg font-bold">Invoice</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: primaryColor }}>🖨️ Print</button>
            <button onClick={onClose}><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Invoice body */}
        <div ref={invoiceRef} id="invoice-content" className="p-8 text-sm text-gray-800 relative z-10" style={{ backgroundColor: "white" }}>
          {/* Logo + Order info header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <img src={logoUrl} alt="BundledMum" className="h-10 mb-2" crossOrigin="anonymous" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <p className="text-xs text-gray-500 mt-1">...making being a mum easier.</p>
              <p className="text-xs text-gray-500">{settings?.contact_email || "hello@bundledmum.com"}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold" style={{ color: primaryColor }}>{order.order_number || "—"}</div>
              <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</div>
              <div className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold ${order.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {order.payment_status}
              </div>
            </div>
          </div>

          <div className="w-full h-px mb-6" style={{ backgroundColor: primaryColor, opacity: 0.3 }} />

          {/* Bill To / Ship To */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-xs font-semibold uppercase mb-1" style={{ color: accentColor }}>Bill To</h3>
              <div className="font-semibold">{order.customer_name}</div>
              <div className="text-xs">{order.customer_email}</div>
              <div className="text-xs">{order.customer_phone}</div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase mb-1" style={{ color: accentColor }}>Ship To</h3>
              <div className="text-xs">{order.delivery_address}</div>
              <div className="text-xs">{order.delivery_city}, {order.delivery_state}</div>
              {order.delivery_notes && <div className="text-xs italic mt-1">{order.delivery_notes}</div>}
            </div>
          </div>

          {/* Items table */}
          <table className="w-full mb-6">
            <thead>
              <tr style={{ borderBottom: `2px solid ${primaryColor}` }}>
                <th className="text-left py-2 text-xs font-semibold" style={{ color: primaryColor }}>Item</th>
                <th className="text-center py-2 text-xs font-semibold" style={{ color: primaryColor }}>Qty</th>
                <th className="text-right py-2 text-xs font-semibold" style={{ color: primaryColor }}>Price</th>
                <th className="text-right py-2 text-xs font-semibold" style={{ color: primaryColor }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-2">
                    <div className="font-medium text-xs">{item.product_name}</div>
                    <div className="text-[10px] text-gray-500">{item.brand_name}{item.size ? ` · ${item.size}` : ""}{item.color ? ` · ${item.color}` : ""}</div>
                  </td>
                  <td className="py-2 text-center text-xs">{item.quantity}</td>
                  <td className="py-2 text-right text-xs">₦{(item.unit_price || 0).toLocaleString()}</td>
                  <td className="py-2 text-right text-xs font-semibold">₦{(item.line_total || 0).toLocaleString()}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-xs text-gray-400">No items found</td></tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1 text-xs">
              <div className="flex justify-between"><span>Subtotal</span><span>₦{(order.subtotal || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{order.delivery_fee === 0 ? "FREE" : `₦${(order.delivery_fee || 0).toLocaleString()}`}</span></div>
              <div className="flex justify-between"><span>Service Fee</span><span>₦{(order.service_fee || 0).toLocaleString()}</span></div>
              {(order.discount_amount || 0) > 0 && <div className="flex justify-between" style={{ color: primaryColor }}><span>Coupon Discount</span><span>-₦{(order.discount_amount || 0).toLocaleString()}</span></div>}
              {(order.spend_discount_amount || 0) > 0 && <div className="flex justify-between" style={{ color: primaryColor }}><span>Spend Discount</span><span>-₦{(order.spend_discount_amount || 0).toLocaleString()}</span></div>}
              {(order.discount || 0) > 0 && !(order.discount_amount || 0) && !(order.spend_discount_amount || 0) && <div className="flex justify-between" style={{ color: primaryColor }}><span>Discount</span><span>-₦{order.discount.toLocaleString()}</span></div>}
              <div className="flex justify-between font-bold text-sm pt-2 mt-2" style={{ borderTop: `2px solid ${primaryColor}` }}>
                <span>Total</span><span>₦{(order.total || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Gift message */}
          {order.gift_message && (
            <div className="mt-6 p-3 rounded-lg border" style={{ backgroundColor: `${accentColor}08`, borderColor: `${accentColor}30` }}>
              <p className="text-xs font-semibold" style={{ color: accentColor }}>🎁 Gift Message</p>
              <p className="text-xs mt-1 italic">{order.gift_message}</p>
            </div>
          )}

          {/* Payment & Order info */}
          <div className="mt-6 grid grid-cols-2 gap-4 text-[10px] text-gray-500">
            <div>
              <span className="font-semibold text-gray-700">Payment Method:</span> {order.payment_method || "—"}
            </div>
            <div>
              <span className="font-semibold text-gray-700">Order Status:</span> {order.order_status || "—"}
            </div>
            {order.payment_reference && (
              <div>
                <span className="font-semibold text-gray-700">Payment Ref:</span> {order.payment_reference}
              </div>
            )}
            {order.tracking_number && (
              <div>
                <span className="font-semibold text-gray-700">Tracking #:</span> {order.tracking_number}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 text-center text-[10px] text-gray-400" style={{ borderTop: `1px solid ${primaryColor}20` }}>
            Thank you for shopping with BundledMum! 💛 ...making being a mum easier. · {settings?.contact_email || "hello@bundledmum.com"} · bundledmum.com
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-content, #invoice-content * { visibility: visible !important; }
          #invoice-content {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 20mm !important;
            background: white !important;
          }
          nav, .admin-sidebar, .no-print, [class*="print\\:hidden"] { display: none !important; }
        }
      `}</style>
    </div>
  );
}
