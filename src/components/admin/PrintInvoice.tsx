import { X } from "lucide-react";

interface Props {
  order: any;
  onClose: () => void;
}

export default function PrintInvoice({ order, onClose }: Props) {
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-foreground/50 z-[100] flex items-start justify-center pt-6 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl mx-4 mb-10 rounded-xl shadow-lg print:shadow-none print:rounded-none print:mx-0 print:max-w-none">
        {/* Header - hide on print */}
        <div className="flex items-center justify-between p-4 border-b border-border print:hidden">
          <h2 className="text-lg font-bold">Invoice</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="px-4 py-2 bg-forest text-white rounded-lg text-sm font-semibold">🖨️ Print</button>
            <button onClick={onClose}><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Invoice body */}
        <div className="p-8 text-sm text-gray-800">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-forest">BundledMum</h1>
              <p className="text-xs text-gray-500 mt-1">Nigeria's Hospital Bag Curator</p>
              <p className="text-xs text-gray-500">hello@bundledmum.com</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{order.order_number || "—"}</div>
              <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</div>
              <div className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold ${order.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {order.payment_status}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1">Bill To</h3>
              <div className="font-semibold">{order.customer_name}</div>
              <div className="text-xs">{order.customer_email}</div>
              <div className="text-xs">{order.customer_phone}</div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1">Ship To</h3>
              <div className="text-xs">{order.delivery_address}</div>
              <div className="text-xs">{order.delivery_city}, {order.delivery_state}</div>
              {order.delivery_notes && <div className="text-xs italic mt-1">{order.delivery_notes}</div>}
            </div>
          </div>

          <table className="w-full mb-6">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 text-xs font-semibold text-gray-500">Item</th>
                <th className="text-center py-2 text-xs font-semibold text-gray-500">Qty</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-500">Price</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.order_items || []).map((item: any) => (
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
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64 space-y-1 text-xs">
              <div className="flex justify-between"><span>Subtotal</span><span>₦{(order.subtotal || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>₦{(order.delivery_fee || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Service Fee</span><span>₦{(order.service_fee || 0).toLocaleString()}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₦{order.discount.toLocaleString()}</span></div>}
              <div className="flex justify-between font-bold text-sm border-t border-gray-200 pt-2 mt-2">
                <span>Total</span><span>₦{(order.total || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {order.gift_message && (
            <div className="mt-6 p-3 bg-coral/5 rounded-lg border border-coral/20">
              <p className="text-xs font-semibold text-coral">🎁 Gift Message</p>
              <p className="text-xs mt-1 italic">{order.gift_message}</p>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400">
            Thank you for shopping with BundledMum! 💛 · hello@bundledmum.com · bundledmum.com
          </div>
        </div>
      </div>
    </div>
  );
}
