import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, Mail, Eye, EyeOff } from "lucide-react";

const TEMPLATE_PLACEHOLDERS: Record<string, string[]> = {
  order_confirmation: [
    "{{customer_name}}", "{{first_name}}", "{{customer_phone}}", "{{order_number}}", "{{order_date}}",
    "{{items_html}}", "{{subtotal}}", "{{delivery_fee}}", "{{service_fee}}",
    "{{discount_amount}}", "{{total}}", "{{delivery_address}}", "{{delivery_city}}",
    "{{delivery_state}}", "{{payment_method}}", "{{order_status}}", "{{estimated_delivery}}",
    "{{bank_name}}", "{{bank_account_name}}", "{{bank_account_number}}",
    "{{whatsapp_url}}", "{{referral_code}}", "{{referral_amount}}",
  ],
  payment_received: [
    "{{customer_name}}", "{{first_name}}", "{{customer_phone}}", "{{order_number}}", "{{total}}",
    "{{payment_method}}", "{{payment_reference}}", "{{payment_date}}",
    "{{estimated_delivery}}", "{{whatsapp_url}}",
  ],
  order_shipped: [
    "{{customer_name}}", "{{first_name}}", "{{customer_phone}}", "{{order_number}}",
    "{{delivery_address}}", "{{delivery_city}}", "{{delivery_state}}",
    "{{estimated_delivery}}", "{{tracking_number}}", "{{order_status}}", "{{whatsapp_url}}",
  ],
  order_delivered: [
    "{{customer_name}}", "{{first_name}}", "{{customer_phone}}", "{{order_number}}",
    "{{delivery_date}}", "{{delivery_city}}", "{{delivery_state}}",
    "{{referral_code}}", "{{referral_amount}}",
    "{{review_url}}", "{{whatsapp_url}}",
  ],
  referral_code_activated: [
    "{{customer_name}}", "{{first_name}}", "{{referral_code}}",
    "{{referral_amount}}", "{{referral_link}}", "{{whatsapp_share_url}}",
  ],
  abandoned_cart: [
    "{{customer_name}}", "{{first_name}}", "{{cart_items_html}}",
    "{{cart_total}}", "{{cart_url}}", "{{coupon_code}}", "{{coupon_discount}}",
  ],
};

const SAMPLE_DATA: Record<string, string> = {
  "{{customer_name}}": "Amara Okafor",
  "{{first_name}}": "Amara",
  "{{customer_phone}}": "08012345678",
  "{{order_number}}": "BM-20260416-0042",
  "{{order_date}}": "Wednesday, 16 April 2026",
  "{{items_html}}": `<table style="width:100%;border-collapse:collapse"><tr><td style="padding:8px;border-bottom:1px solid #eee">Hospital Bag Essentials Bundle × 1</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₦45,000</td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee">Newborn Care Kit × 1</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₦28,000</td></tr></table>`,
  "{{subtotal}}": "₦73,000",
  "{{delivery_fee}}": "₦3,500",
  "{{service_fee}}": "₦500",
  "{{discount_amount}}": "₦2,000",
  "{{total}}": "₦75,000",
  "{{delivery_address}}": "12 Admiralty Way, Lekki Phase 1",
  "{{delivery_city}}": "Lagos",
  "{{delivery_state}}": "Lagos",
  "{{payment_method}}": "transfer",
  "{{payment_reference}}": "PAY-REF-20260416-001",
  "{{payment_date}}": "Wednesday, 16 April 2026",
  "{{estimated_delivery}}": "Friday, 18 April 2026",
  "{{tracking_number}}": "TRK-2026-BM-001",
  "{{order_status}}": "shipped",
  "{{delivery_date}}": "Friday, 18 April 2026",
  "{{bank_name}}": "GTBank",
  "{{bank_account_name}}": "BundledMum Ltd",
  "{{bank_account_number}}": "0123456789",
  "{{whatsapp_url}}": "https://wa.me/2348001234567",
  "{{referral_code}}": "AMARA-BM42",
  "{{referral_amount}}": "₦2,000",
  "{{referral_link}}": "https://bundledmum.com/?ref=AMARA-BM42",
  "{{whatsapp_share_url}}": "https://wa.me/?text=Use%20my%20code%20AMARA-BM42",
  "{{review_url}}": "https://bundledmum.com/review/BM-20260416-0042",
  "{{cart_items_html}}": `<table style="width:100%;border-collapse:collapse"><tr><td style="padding:8px;border-bottom:1px solid #eee">Hospital Bag Essentials Bundle × 1</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₦45,000</td></tr></table>`,
  "{{cart_total}}": "₦45,000",
  "{{cart_url}}": "https://bundledmum.com/cart",
  "{{coupon_code}}": "WELCOME10",
  "{{coupon_discount}}": "10%",
};

function applyPreviewData(html: string): string {
  let result = html;
  for (const [placeholder, value] of Object.entries(SAMPLE_DATA)) {
    result = result.replaceAll(placeholder, value);
  }
  return result;
}

export default function AdminEmailTemplates() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["admin-email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveTemplate = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await supabase
        .from("email_templates")
        .update({ subject: editSubject, html_body: editBody, is_active: editActive })
        .eq("slug", editing.slug);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-email-templates"] });
      toast.success("Template saved");
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (t: any) => {
    setEditing(t);
    setEditSubject(t.subject || "");
    setEditBody(t.html_body || "");
    setEditActive(t.is_active ?? true);
  };

  // Edit view
  if (editing) {
    const placeholders = TEMPLATE_PLACEHOLDERS[editing.slug] || [];
    return (
      <div>
        <button onClick={() => setEditing(null)} className="flex items-center gap-1.5 text-sm text-text-med hover:text-forest mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to templates
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="pf text-2xl font-bold flex items-center gap-2">
              <Mail className="w-6 h-6" /> {editing.name}
            </h1>
            <p className="text-text-light text-xs mt-0.5 font-mono">{editing.slug}</p>
            {editing.description && <p className="text-text-med text-sm mt-1">{editing.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${showPreview ? "bg-forest/10 border-forest text-forest" : "border-border text-text-med hover:bg-muted"}`}>
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? "Hide Preview" : "Preview"}
            </button>
            <button onClick={() => saveTemplate.mutate()} disabled={saveTemplate.isPending}
              className="flex items-center gap-1.5 bg-forest text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-forest-deep disabled:opacity-50">
              <Save className="w-4 h-4" /> {saveTemplate.isPending ? "Saving..." : "Save Template"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            {/* Subject */}
            <div className="bg-card border border-border rounded-xl p-5">
              <label className="text-xs font-semibold text-text-med block mb-1.5">Subject Line</label>
              <input value={editSubject} onChange={e => setEditSubject(e.target.value)}
                placeholder="e.g. Order Confirmed — {{order_number}}"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background" />
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="bg-card border-2 border-forest/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-forest" />
                  <label className="text-xs font-semibold text-forest">Live Preview</label>
                  <span className="text-[10px] text-text-light ml-auto">Sample data is used for all placeholders</span>
                </div>
                <div className="bg-muted/30 border border-border rounded-lg px-4 py-2.5 mb-3">
                  <span className="text-[10px] text-text-light block mb-0.5">Subject:</span>
                  <span className="text-sm font-semibold">{applyPreviewData(editSubject)}</span>
                </div>
                <div className="bg-white border border-border rounded-lg overflow-hidden">
                  <iframe
                    title="Email preview"
                    srcDoc={applyPreviewData(editBody)}
                    className="w-full border-0"
                    style={{ minHeight: 500 }}
                    sandbox=""
                  />
                </div>
              </div>
            )}

            {/* HTML Body */}
            <div className="bg-card border border-border rounded-xl p-5">
              <label className="text-xs font-semibold text-text-med block mb-1.5">HTML Body</label>
              <textarea value={editBody} onChange={e => setEditBody(e.target.value)}
                rows={30} spellCheck={false}
                className="w-full border border-input rounded-lg px-3 py-2.5 text-xs font-mono bg-background leading-relaxed" />
              <p className="text-[10px] text-text-light mt-1.5">
                Full HTML email template. Use {"{{placeholder}}"} syntax for dynamic values. Inline CSS recommended for email clients.
              </p>
            </div>

            {/* Active toggle */}
            <div className="bg-card border border-border rounded-xl p-5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={editActive} onChange={e => setEditActive(e.target.checked)} className="rounded" />
                <div>
                  <span className="text-sm font-semibold">{editActive ? "Active" : "Inactive"}</span>
                  <p className="text-text-light text-xs mt-0.5">
                    {editActive ? "This email will be sent automatically when triggered." : "This email is disabled and will not be sent."}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Placeholders reference */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-xs font-bold text-text-med mb-3">Available Placeholders</h3>
              {placeholders.length > 0 ? (
                <div className="space-y-1.5">
                  {placeholders.map(p => (
                    <button key={p} onClick={() => { navigator.clipboard.writeText(p); toast.success(`Copied ${p}`); }}
                      className="block w-full text-left font-mono text-[11px] bg-muted/50 hover:bg-muted px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">
                      {p}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-text-light text-xs">No placeholders defined for this template.</p>
              )}
              <p className="text-[10px] text-text-light mt-3">Click a placeholder to copy it.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="pf text-2xl font-bold flex items-center gap-2">
          <Mail className="w-6 h-6" /> Email Templates
        </h1>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-text-med">Loading...</div>
      ) : (templates || []).length === 0 ? (
        <div className="text-center py-10 text-text-med">
          No email templates found. Insert rows into the <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">email_templates</code> table to get started.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-text-med">Template</th>
                <th className="px-4 py-3 text-left font-semibold text-text-med">Slug</th>
                <th className="px-4 py-3 text-center font-semibold text-text-med">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-text-med">Updated</th>
              </tr>
            </thead>
            <tbody>
              {(templates || []).map((t: any) => (
                <tr key={t.id} onClick={() => openEdit(t)} className="border-t border-border hover:bg-muted/30 cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{t.name}</div>
                    {t.description && <div className="text-text-light text-xs mt-0.5 line-clamp-1">{t.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-light font-mono">{t.slug}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-semibold ${t.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {t.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-light">
                    {t.updated_at ? new Date(t.updated_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
