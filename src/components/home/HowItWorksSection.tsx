import { useHowItWorksSteps } from "@/hooks/useHomepage";
import { Skeleton } from "@/components/ui/skeleton";

interface Props { title?: string | null; subtitle?: string | null }

export default function HowItWorksSection({ title, subtitle }: Props) {
  const { data: steps, isLoading } = useHowItWorksSteps();
  if (!isLoading && (!steps || steps.length === 0)) return null;

  return (
    <section className="px-4 md:px-10 py-8 md:py-14 bg-warm-cream/60">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-6">
          <h2 className="pf text-xl md:text-2xl font-bold">{title || "How It Works"}</h2>
          {subtitle && <p className="text-text-med text-sm mt-1">{subtitle}</p>}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-card" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(steps || []).map(s => (
              <div key={s.id} className="bg-card rounded-card p-5 text-center shadow-card relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-forest text-primary-foreground text-xs font-bold">
                  {s.step_number}
                </span>
                <div className="text-4xl mb-3 pt-2">{s.icon}</div>
                <div className="font-semibold text-sm mb-1">{s.title}</div>
                <div className="text-text-med text-xs leading-relaxed">{s.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
