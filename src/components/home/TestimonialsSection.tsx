import { useTestimonialsList } from "@/hooks/useHomepage";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

interface Props { title?: string | null; subtitle?: string | null; maxItems?: number }

export default function TestimonialsSection({ title, subtitle, maxItems = 6 }: Props) {
  const { data: items, isLoading } = useTestimonialsList();
  const list = (items || []).slice(0, maxItems);
  if (!isLoading && list.length === 0) return null;

  return (
    <section className="px-4 md:px-10 py-8 md:py-14">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-6">
          <h2 className="pf text-xl md:text-2xl font-bold">{title || "What Mums Are Saying"}</h2>
          {subtitle && <p className="text-text-med text-sm mt-1">{subtitle}</p>}
        </div>

        {isLoading ? (
          <div className="flex md:grid md:grid-cols-2 gap-3 overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="min-w-[280px] md:min-w-0 h-44 rounded-card flex-shrink-0" />)}
          </div>
        ) : (
          <div className="flex md:grid md:grid-cols-2 gap-3 overflow-x-auto snap-x snap-mandatory md:overflow-visible -mx-4 md:mx-0 px-4 md:px-0 scrollbar-none">
            {list.map(t => (
              <article key={t.id} className="snap-start flex-shrink-0 w-[280px] md:w-auto bg-card rounded-card p-4 shadow-card">
                <div className="flex items-center gap-2 mb-2">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt={t.customer_name} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-forest/10 text-forest flex items-center justify-center text-sm font-bold">
                      {(t.customer_initial || t.customer_name?.charAt(0) || "?").toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{t.customer_name}</div>
                    <div className="text-[11px] text-text-light truncate">{t.customer_location || t.customer_city}</div>
                  </div>
                  {t.is_verified_purchase && (
                    <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">✓ Verified</span>
                  )}
                </div>
                <div className="flex gap-0.5 mb-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < (t.rating || 5) ? "fill-coral text-coral" : "text-border"}`} />
                  ))}
                </div>
                <blockquote className="text-[13px] text-text-med leading-relaxed">"{t.quote}"</blockquote>
                {t.product_context && (
                  <div className="mt-2 text-[10px] text-text-light bg-muted/60 rounded px-1.5 py-0.5 inline-block">📦 {t.product_context}</div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
