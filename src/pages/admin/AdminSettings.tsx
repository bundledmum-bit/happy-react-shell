import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save } from "lucide-react";

const GROUPS: Record<string, string[]> = {
  "Homepage": ["hero_title", "hero_subtitle", "hero_badge", "trust_stats", "trust_strip"],
  "Calculator": ["calculator_base_prices", "calculator_modifiers"],
  "Fees": ["service_fee", "free_delivery_threshold", "referral_amount", "gift_wrapping_price"],
  "Social": ["whatsapp_number", "social_links"],
  "SEO": ["meta_title", "meta_description", "og_image_url"],
};

export default function AdminSettings() {
  const queryClient = useQueryClient();
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
      const { error } = await supabase.from("site_settings").update({ value: parsed }).eq("key", key);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      setEditValues(prev => { const n = { ...prev }; delete n[vars.key]; return n; });
      toast.success("Setting saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const settingsMap = new Map((settings || []).map((s: any) => [s.key, s]));

  return (
    <div>
      <h1 className="pf text-2xl font-bold mb-6">Site Settings</h1>
      {isLoading ? (
        <div className="text-center py-10 text-text-med">Loading...</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(GROUPS).map(([group, keys]) => (
            <div key={group} className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-bold text-lg mb-4">{group}</h2>
              <div className="space-y-4">
                {keys.map(key => {
                  const setting = settingsMap.get(key);
                  if (!setting) return null;
                  const currentValue = editValues[key] ?? JSON.stringify(setting.value, null, 2);
                  const isJson = typeof setting.value === "object";
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-text-med">{key}</label>
                        {editValues[key] !== undefined && (
                          <button onClick={() => saveSetting.mutate({ key, value: editValues[key] })}
                            className="flex items-center gap-1 text-xs text-forest font-semibold">
                            <Save className="w-3 h-3" /> Save
                          </button>
                        )}
                      </div>
                      {setting.description && <p className="text-[10px] text-text-light mb-1">{setting.description}</p>}
                      {isJson ? (
                        <textarea value={currentValue}
                          onChange={e => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
                          rows={Math.min(JSON.stringify(setting.value, null, 2).split("\n").length + 1, 8)}
                          className="w-full border border-input rounded-lg px-3 py-2 text-xs font-mono bg-background" />
                      ) : (
                        <input value={currentValue.replace(/^"|"$/g, "")}
                          onChange={e => setEditValues(prev => ({ ...prev, [key]: JSON.stringify(e.target.value) }))}
                          className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
