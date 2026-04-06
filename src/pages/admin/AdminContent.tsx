import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";

export default function AdminContent() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"testimonials" | "faqs">("testimonials");
  const [editItem, setEditItem] = useState<any>(null);

  const { data: testimonials } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonials").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: faqs } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("faq_items").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const toggleTestimonial = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const { error } = await supabase.from("testimonials").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] }); toast.success("Updated"); },
  });

  const toggleFaq = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("faq_items").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-faqs"] }); toast.success("Updated"); },
  });

  return (
    <div>
      <h1 className="pf text-2xl font-bold mb-6">Content</h1>
      <div className="flex gap-2 mb-4">
        {(["testimonials", "faqs"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize ${tab === t ? "bg-forest text-primary-foreground" : "border border-border text-text-med"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "testimonials" && (
        <div className="space-y-3">
          {(testimonials || []).map((t: any) => (
            <div key={t.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{t.customer_name}</span>
                    <span className="text-text-light text-xs">— {t.customer_city}</span>
                    <span className="text-xs text-coral">{"⭐".repeat(t.rating)}</span>
                  </div>
                  <p className="text-text-med text-sm italic">"{t.quote}"</p>
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-4">
                  <button onClick={() => toggleTestimonial.mutate({ id: t.id, field: "is_featured", value: !t.is_featured })}
                    className={`px-2 py-1 rounded text-[10px] font-semibold ${t.is_featured ? "bg-coral/10 text-coral" : "bg-muted text-text-light"}`}>
                    {t.is_featured ? "Featured" : "Not Featured"}
                  </button>
                  <button onClick={() => toggleTestimonial.mutate({ id: t.id, field: "is_active", value: !t.is_active })}
                    className={`px-2 py-1 rounded text-[10px] font-semibold ${t.is_active ? "bg-forest/10 text-forest" : "bg-muted text-text-light"}`}>
                    {t.is_active ? "Active" : "Hidden"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "faqs" && (
        <div className="space-y-3">
          {(faqs || []).map((f: any) => (
            <div key={f.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-sm mb-1">{f.question}</div>
                  <p className="text-text-med text-xs line-clamp-2">{f.answer}</p>
                  <span className="text-[10px] text-text-light mt-1 inline-block capitalize">{f.category}</span>
                </div>
                <button onClick={() => toggleFaq.mutate({ id: f.id, is_active: !f.is_active })}
                  className={`px-2 py-1 rounded text-[10px] font-semibold flex-shrink-0 ${f.is_active ? "bg-forest/10 text-forest" : "bg-muted text-text-light"}`}>
                  {f.is_active ? "Active" : "Hidden"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
