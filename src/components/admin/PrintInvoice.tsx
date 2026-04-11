import { supabase } from "@/integrations/supabase/client";
import { useAdminUser } from "@/hooks/useAdminPermissions";
import { toast } from "sonner";

// The full branded HTML invoice template (A5, self-contained with base64 logos)
function getInvoiceHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BundledMum — Order Invoice</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Lato:ital,wght@0,300;0,400;0,700;1,300;1,400&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --coral: #F4845F; --coral-dark: #D4613C; --coral-light: #FDE8DF;
  --green: #2D6A4F; --green-dark: #1A4A33; --green-light: #D8EFE5;
  --black: #1A1A1A; --cream: #FFF8F4; --warm-grey: #F5F2EF;
  --text-muted: #7A7A7A; --divider: #E8E0D8;
}
html, body { font-family: 'Lato', sans-serif; background: #e2ddd8; color: var(--black); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.screen-controls { max-width: 680px; margin: 32px auto 16px; display: flex; align-items: center; justify-content: space-between; padding: 0 8px; }
.screen-label { font-size: 11px; font-weight: 700; color: #999; letter-spacing: 1px; text-transform: uppercase; }
.ctrl-btns { display: flex; gap: 10px; }
.btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: 100px; font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 12px; cursor: pointer; border: none; transition: all 0.18s; }
.btn-green { background: var(--green); color: white; }
.btn-green:hover { background: var(--green-dark); transform: translateY(-1px); }
.btn-outline { background: white; color: var(--black); border: 1.5px solid #ccc; }
.btn-outline:hover { border-color: var(--coral); color: var(--coral); }
.invoice-sheet { width: 148mm; min-height: 210mm; margin: 0 auto 48px; background: var(--cream); box-shadow: 0 12px 60px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08); display: flex; flex-direction: column; overflow: hidden; }
.top-band { background: var(--coral); padding: 18px 24px 15px; position: relative; overflow: hidden; flex-shrink: 0; }
.top-band::before { content: ''; position: absolute; top: -50px; right: -50px; width: 140px; height: 140px; border-radius: 50%; background: rgba(255,255,255,0.08); }
.top-band::after { content: ''; position: absolute; bottom: -35px; left: 50px; width: 90px; height: 90px; border-radius: 50%; background: rgba(255,255,255,0.06); }
.band-inner { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; }
.band-logo { height: 28px; width: auto; display: block; object-fit: contain; }
.band-right { text-align: right; }
.band-title { font-family: 'Nunito', sans-serif; font-weight: 900; font-size: 11px; color: white; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 2px; }
.band-tagline { font-family: 'Lato', sans-serif; font-style: italic; font-size: 8.5px; color: rgba(255,255,255,0.72); letter-spacing: 0.2px; }
.green-strip { background: var(--green); padding: 6px 24px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.strip-order { font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 9.5px; color: white; letter-spacing: 0.5px; }
.strip-date { font-size: 8.5px; color: rgba(255,255,255,0.6); }
.invoice-body { padding: 15px 22px 14px; flex: 1; display: flex; flex-direction: column; gap: 12px; }
.section-label { font-size: 7px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: var(--coral); margin-bottom: 5px; display: flex; align-items: center; gap: 5px; }
.section-label::before { content: ''; display: block; width: 10px; height: 1.5px; background: var(--coral); border-radius: 2px; flex-shrink: 0; }
.address-block { background: white; border-radius: 7px; padding: 9px 13px; border-left: 3px solid var(--coral); }
.address-name { font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 11.5px; color: var(--black); margin-bottom: 2px; }
.address-detail { font-size: 9px; color: var(--text-muted); line-height: 1.65; }
.section-divider { height: 1px; background: var(--divider); }
.items-table { width: 100%; border-collapse: collapse; }
.items-table thead tr { background: var(--warm-grey); }
.items-table thead th { font-size: 7px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: var(--text-muted); padding: 5px 7px; text-align: left; }
.items-table thead th:nth-child(2), .items-table thead th:last-child { text-align: right; }
.items-table thead th:first-child { border-radius: 5px 0 0 5px; }
.items-table thead th:last-child { border-radius: 0 5px 5px 0; }
.items-table tbody tr { border-bottom: 1px solid var(--divider); }
.items-table tbody tr:last-child { border-bottom: none; }
.items-table tbody td { padding: 6px 7px; vertical-align: top; }
.prod-name { font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 9.5px; color: var(--black); line-height: 1.3; margin-bottom: 1px; }
.prod-brand { font-size: 8px; color: var(--text-muted); }
.cell-right { font-size: 9.5px; font-weight: 700; color: var(--black); text-align: right; white-space: nowrap; vertical-align: middle; }
.cell-amount { font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 9.5px; color: var(--black); text-align: right; white-space: nowrap; vertical-align: middle; }
.totals-box { background: white; border-radius: 7px; padding: 9px 13px; border: 1px solid var(--divider); }
.totals-line { display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: var(--text-muted); padding: 2.5px 0; border-bottom: 1px solid var(--divider); }
.totals-line:last-of-type { border-bottom: none; }
.totals-line.discount .v { color: var(--green); font-weight: 700; }
.totals-mini-div { height: 1px; background: var(--divider); margin: 5px 0; }
.totals-grand { display: flex; justify-content: space-between; align-items: center; }
.totals-grand .lbl { font-family: 'Nunito', sans-serif; font-weight: 900; font-size: 10px; color: var(--black); }
.totals-grand .amt { font-family: 'Nunito', sans-serif; font-weight: 900; font-size: 15px; color: var(--green); }
.pay-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.pay-info { font-size: 8.5px; color: var(--text-muted); line-height: 1.65; }
.pay-info strong { color: var(--black); font-size: 9px; }
.paid-badge { display: inline-flex; align-items: center; gap: 4px; background: var(--green-light); color: var(--green-dark); border-radius: 100px; padding: 3px 9px; font-size: 8px; font-weight: 800; white-space: nowrap; flex-shrink: 0; }
.pending-badge { display: inline-flex; align-items: center; gap: 4px; background: var(--coral-light); color: var(--coral-dark); border-radius: 100px; padding: 3px 9px; font-size: 8px; font-weight: 800; white-space: nowrap; flex-shrink: 0; }
.gift-box { background: var(--coral-light); border-radius: 7px; padding: 9px 13px; border-left: 3px solid var(--coral); }
.gift-label { font-size: 7px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--coral); margin-bottom: 4px; }
.gift-msg { font-size: 9px; color: var(--black); font-style: italic; line-height: 1.65; }
.love-strip { padding: 9px 22px; text-align: center; border-top: 1px dashed var(--divider); flex-shrink: 0; }
.love-main { font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 8.5px; color: var(--coral); }
.love-sub { font-size: 7.5px; color: var(--text-muted); margin-top: 2px; line-height: 1.5; }
.bottom-band { background: var(--green); padding: 10px 22px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.bottom-logo { height: 20px; width: auto; display: block; object-fit: contain; opacity: 0.9; }
.bottom-right { text-align: right; }
.bottom-tagline { font-style: italic; font-size: 7.5px; color: rgba(255,255,255,0.55); margin-bottom: 2px; }
.bottom-contact { font-size: 7px; color: rgba(255,255,255,0.45); line-height: 1.7; }
@media print {
  html, body { background: white; }
  .screen-controls { display: none; }
  .invoice-sheet { margin: 0; box-shadow: none; width: 148mm; min-height: 210mm; }
  @page { size: A5 portrait; margin: 0; }
}
</style>
</head>
<body>
<div class="screen-controls">
  <span class="screen-label">📦 Delivery Invoice — A5 Print Size</span>
  <div class="ctrl-btns">
    <button class="btn btn-outline" onclick="window.close()">✕ Close</button>
    <button class="btn btn-green" onclick="window.print()">🖨️ Print</button>
  </div>
</div>
<div class="invoice-sheet">
  <div class="top-band">
    <div class="band-inner">
      <div style="font-family:'Nunito',sans-serif;font-weight:900;font-size:16px;color:white;letter-spacing:1px;">BundledMum</div>
      <div class="band-right">
        <div class="band-title">Order Invoice</div>
        <div class="band-tagline">...making being a mum easier...</div>
      </div>
    </div>
  </div>
  <div class="green-strip">
    <span class="strip-order" id="orderNum">Order: —</span>
    <span class="strip-date" id="orderDate"></span>
  </div>
  <div class="invoice-body">
    <div>
      <div class="section-label">Deliver To</div>
      <div class="address-block">
        <div class="address-name" id="custName"></div>
        <div class="address-detail" id="custAddress"></div>
      </div>
    </div>
    <div class="section-divider"></div>
    <div>
      <div class="section-label">Items in this order</div>
      <table class="items-table">
        <thead><tr><th>Product</th><th style="text-align:right">Qty</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody id="lineItemsBody"></tbody>
      </table>
    </div>
    <div class="section-divider"></div>
    <div class="totals-box">
      <div class="totals-line"><span>Subtotal</span><span class="v" id="subtotalVal">₦0</span></div>
      <div class="totals-line"><span>Delivery Fee</span><span class="v" id="deliveryVal">₦0</span></div>
      <div class="totals-line" id="serviceFeeRow"><span>Service Fee</span><span class="v" id="serviceFeeVal">₦0</span></div>
      <div class="totals-line discount" id="discountRow" style="display:none">
        <span>Discount <span id="couponTag" style="background:var(--green-light);color:var(--green);padding:1px 5px;border-radius:3px;font-size:6.5px;font-weight:800;margin-left:3px"></span></span>
        <span class="v" id="discountVal">-₦0</span>
      </div>
      <div class="totals-mini-div"></div>
      <div class="totals-grand">
        <span class="lbl">Total Paid</span>
        <span class="amt" id="totalVal">₦0</span>
      </div>
    </div>
    <div class="pay-row">
      <div class="pay-info">
        <strong id="payMethodLabel">Card Payment</strong><br>
        Ref: <span id="payRefLabel" style="font-family:'Courier New',monospace">N/A</span>
      </div>
      <div id="payBadge" class="paid-badge">✓ Paid</div>
    </div>
    <div class="gift-box" id="giftBox" style="display:none">
      <div class="gift-label">🎀 Gift Message</div>
      <div class="gift-msg" id="giftMsg"></div>
    </div>
  </div>
  <div class="love-strip">
    <div class="love-main">💝 Thank you for choosing BundledMum!</div>
    <div class="love-sub">We hope this bundle makes your motherhood journey a little easier. We're rooting for you.</div>
  </div>
  <div class="bottom-band">
    <div style="font-family:'Nunito',sans-serif;font-weight:900;font-size:12px;color:rgba(255,255,255,0.9);">BundledMum</div>
    <div class="bottom-right">
      <div class="bottom-tagline">...making being a mum easier...</div>
      <div class="bottom-contact">hello@bundledmum.com &nbsp;·&nbsp; www.bundledmum.com</div>
    </div>
  </div>
</div>
<script>
function fmt(n){if(!n&&n!==0)return'₦0';return'₦'+Number(n).toLocaleString('en-NG');}
function fmtDate(d){if(!d)return'';return new Date(d).toLocaleDateString('en-NG',{day:'numeric',month:'long',year:'numeric'});}
function cap(s){return(s||'').replace(/_/g,' ').replace(/\\b\\w/g,l=>l.toUpperCase());}
function populate(data){
  if(!data)return;
  document.getElementById('orderNum').textContent='Order: '+(data.order_number||'');
  document.getElementById('orderDate').textContent=fmtDate(data.invoice_date||new Date());
  document.getElementById('custName').textContent=data.customer_name||'';
  var addrParts=[data.delivery_address,[data.delivery_city,data.delivery_state].filter(Boolean).join(', '),data.customer_phone].filter(Boolean);
  document.getElementById('custAddress').innerHTML=addrParts.join('<br>');
  var items=data.line_items||[];
  document.getElementById('lineItemsBody').innerHTML=items.map(function(item){
    return '<tr><td><div class="prod-name">'+((item.product_name||''))+'</div><div class="prod-brand">'+((item.brand_name||''))+'</div></td><td class="cell-right">×'+(item.qty||1)+'</td><td class="cell-amount">'+fmt(item.line_total||(item.unit_price*(item.qty||1)))+'</td></tr>';
  }).join('');
  document.getElementById('subtotalVal').textContent=fmt(data.subtotal);
  document.getElementById('deliveryVal').textContent=fmt(data.delivery_fee);
  document.getElementById('serviceFeeVal').textContent=fmt(data.service_fee);
  document.getElementById('totalVal').textContent=fmt(data.total);
  if(data.discount_amount>0){document.getElementById('discountRow').style.display='flex';document.getElementById('discountVal').textContent='-'+fmt(data.discount_amount);if(data.coupon_code)document.getElementById('couponTag').textContent=data.coupon_code;}
  document.getElementById('payMethodLabel').textContent=cap(data.payment_method)||'Card Payment';
  document.getElementById('payRefLabel').textContent=data.paystack_reference||data.payment_reference||'N/A';
  if(data.payment_status!=='paid'){var b=document.getElementById('payBadge');b.className='pending-badge';b.textContent='⏳ Payment Pending';}
  if(data.gift_message){document.getElementById('giftBox').style.display='block';document.getElementById('giftMsg').textContent=data.gift_message;}
}
if(window.invoiceData){populate(window.invoiceData);}
</script>
</body>
</html>`;
}

interface PrintInvoiceProps {
  order: any;
  onClose: () => void;
}

export async function openBrandedInvoice(order: any, adminUserId?: string) {
  try {
    // Step 1: Generate/fetch permanent invoice record
    if (adminUserId) {
      await supabase.rpc("generate_invoice_from_order", {
        p_order_id: order.id,
        p_generated_by: adminUserId,
      }).then(({ error }) => {
        if (error) console.warn("Invoice record generation warning:", error.message);
      });
    }

    // Step 2: Build invoice data
    const invoiceData = {
      order_number: order.order_number,
      invoice_date: new Date().toISOString(),
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      delivery_address: order.delivery_address,
      delivery_city: order.delivery_city,
      delivery_state: order.delivery_state,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      paystack_reference: order.paystack_transaction_id || order.payment_reference,
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      service_fee: order.service_fee,
      discount_amount: order.discount_amount || 0,
      coupon_code: order.coupon_code || null,
      total: order.total,
      gift_message: order.gift_message,
      line_items: (order.order_items || []).map((item: any) => ({
        product_name: item.product_name,
        brand_name: item.brand_name,
        qty: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
      })),
    };

    // Step 3: Open in new window
    const printWindow = window.open("", "_blank", "width=700,height=900");
    if (!printWindow) {
      toast.error("Pop-up blocked — please allow pop-ups for this site.");
      return;
    }
    (printWindow as any).invoiceData = invoiceData;
    printWindow.document.write(getInvoiceHTML());
    printWindow.document.close();
  } catch (err) {
    console.error("Print invoice error:", err);
    toast.error("Failed to generate invoice");
  }
}

// Legacy component wrapper — kept for backward compatibility but now just triggers the new flow
export default function PrintInvoice({ order, onClose }: PrintInvoiceProps) {
  // Auto-open on mount and close
  openBrandedInvoice(order).then(() => onClose());
  return null;
}
