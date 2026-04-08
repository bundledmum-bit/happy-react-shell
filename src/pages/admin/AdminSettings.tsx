import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Plus, Trash2 } from "lucide-react";

const TABS = ["General", "Homepage", "Social", "Announcement", "Fees", "SEO"];

const TAB_KEYS: Record<string, { key: string; label: string; type: "text" | "textarea" | "number" | "toggle" | "color" | "url" | "email" }[]> = {
  General: [
    { key: "site_name", label: "Site Name", type: "text" },
    { key: "site_tagline", label: "Tagline", type: "text" },
    { key: "contact_email", label: "Contact Email", type: "email" },
    { key: "whatsapp_number", label: "WhatsApp Number", type: "text" },
    { key: "office_address", label: "Office Address", type: "textarea" },
    { key: "currency_symbol", label: "Currency Symbol", type: "text" },
  ],
  Homepage: [
    { key: "hero_badge", label: "Hero Badge Text", type: "text" },
    { key: "hero_title", label: "Hero Headline", type: "textarea" },
    { key: "hero_subtitle", label: "Hero Sub-headline", type: "textarea" },
    { key: "trust_stats", label: "Trust Stats (JSON)", type: "textarea" },
    { key: "trust_strip", label: "Trust Strip Text (JSON)", type: "textarea" },
    { key: "most_loved_heading", label: "Most Loved Section Title", type: "text" },
    { key: "testimonials_heading", label: "Testimonials Heading", type: "text" },
  ],
  Social: [
    { key: "social_links", label: "Social Links (JSON)", type: "textarea" },
    { key: "facebook_url", label: "Facebook URL", type: "url" },
    { key: "instagram_url", label: "Instagram URL", type: "url" },
    { key: "twitter_url", label: "Twitter / X URL", type: "url" },
    { key: "tiktok_url", label: "TikTok URL", type: "url" },
  ],
  Announcement: [
    { key: "announcement_enabled", label: "Show Announcement Bar", type: "toggle" },
    { key: "announcement_text", label: "Announcement Text", type: "text" },
    { key: "announcement_link", label: "Announcement Link", type: "url" },
    { key: "announcement_bg_color", label: "Background Color", type: "color" },
    { key: "announcement_text_color", label: "Text Color", type: "color" },
  ],
  Fees: [
    { key: "service_fee", label: "Service & Packaging Fee", type: "number" },
    { key: "free_delivery_threshold", label: "Free Delivery Threshold", type: "number" },
    { key: "referral_amount", label: "Referral Amount", type: "number" },
    { key: "gift_wrapping_price", label: "Gift Wrapping Price", type: "number" },
    { key: "calculator_base_prices", label: "Calculator Base Prices (JSON)", type: "textarea" },
    { key: "calculator_modifiers", label: "Calculator Modifiers (JSON)", type: "textarea" },
  ],
  SEO: [
    { key: "meta_title", label: "Default Meta Title", type: "text" },
    { key: "meta_description", label: "Default Meta Description", type: "textarea" },
    { key: "og_image_url", label: "Default OG Image URL", type: "url" },
  ],
};

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("General");
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").order("key");
      if (error) throw error;
      return data;
    },
  });

  const saveSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      let parsed;
      try { parsed = JSON.parse(value); } catch { parsed = value; }
      // Upsert
      const { error } = await supabase.from("site_settings").upsert({ key, value: parsed }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site_settings"] });
      setEditValues(prev => { const n = { ...prev }; delete n[vars.key]; return n; });
      toast.success("Setting saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const settingsMap = new Map((settings || []).map((s: any) => [s.key, s]));

  const getValue = (key: string) => {
    const s = settingsMap.get(key);
    if (!s) return "";
    if (typeof s.value === "object") return JSON.stringify(s.value, null, 2);
    return String(s.value);
  };

  const fields = TAB_KEYS[activeTab] || [];

  return (
    <div>
      <h1 className="pf text-2xl font-bold mb-6">Site Settings</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border ${activeTab === tab ? "border-forest bg-forest-light text-forest" : "border-border text-text-med"}`}>
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-text-med">Loading...</div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          {fields.map(field => {
            const currentValue = editValues[field.key] ?? getValue(field.key);
            const hasEdit = editValues[field.key] !== undefined;

            return (
              <div key={field.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-text-med">{field.label}</label>
                  {hasEdit && (
                    <button onClick={() => saveSetting.mutate({ key: field.key, value: editValues[field.key] })}
                      className="flex items-center gap-1 text-xs text-forest font-semibold">
                      <Save className="w-3 h-3" /> Save
                    </button>
                  )}
                </div>
                {field.type === "textarea" ? (
                  <textarea value={currentValue}
                    onChange={e => setEditValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    rows={Math.min(currentValue.split("\n").length + 1, 8)}
                    className="w-full border border-input rounded-lg px-3 py-2 text-xs font-mono bg-background" />
                ) : field.type === "toggle" ? (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={currentValue === "true" || currentValue === "1"}
                      onChange={e => {
                        setEditValues(prev => ({ ...prev, [field.key]: e.target.checked ? "true" : "false" }));
                      }}
                      className="rounded" />
                    <span className="text-sm">{currentValue === "true" || currentValue === "1" ? "Enabled" : "Disabled"}</span>
                  </label>
                ) : field.type === "color" ? (
                  <div className="flex items-center gap-2">
                    <input type="color" value={currentValue || "#000000"}
                      onChange={e => setEditValues(prev => ({ ...prev, [field.key]: JSON.stringify(e.target.value) }))}
                      className="w-10 h-8 rounded border border-input cursor-pointer" />
                    <input value={currentValue.replace(/^"|"$/g, "")}
                      onChange={e => setEditValues(prev => ({ ...prev, [field.key]: JSON.stringify(e.target.value) }))}
                      className="flex-1 border border-input rounded-lg px-3 py-2 text-sm bg-background" />
                  </div>
                ) : (
                  <input type={field.type === "number" ? "number" : "text"}
                    value={currentValue.replace(/^"|"$/g, "")}
                    onChange={e => setEditValues(prev => ({ ...prev, [field.key]: field.type === "number" ? e.target.value : JSON.stringify(e.target.value) }))}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
