import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSupabaseData";

export default function AboutPage() {
  const { data: settings } = useSiteSettings();

  const story = settings?.about_story || "";
  const values: { icon: string; t: string; d: string }[] = Array.isArray(settings?.about_values) ? settings.about_values : [];

  return (
    <div className="min-h-screen pt-[68px]">
      <div style={{ background: "linear-gradient(135deg, #2D6A4F, #1E5C44)" }} className="px-5 md:px-10 py-12 md:py-24">
        <div className="max-w-[780px] mx-auto text-center">
          <div className="text-5xl mb-4">🌿</div>
          <h1 className="pf text-3xl md:text-[50px] text-primary-foreground mb-3.5">Our Story</h1>
          <p className="text-primary-foreground/70 text-[15px] md:text-[17px] leading-[1.8]">BundledMum was born from a very real moment of overwhelm.</p>
        </div>
      </div>
      <div className="max-w-[780px] mx-auto px-5 md:px-10 py-10 md:py-[72px]">
        {story && story.split("\n\n").map((para: string, i: number) => (
          <p key={i} className="text-text-med text-[15px] md:text-[17px] leading-[1.9] mb-5" dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, '<strong class="text-forest">$1</strong>') }} />
        ))}
        {values.length > 0 && (
          <div className="grid md:grid-cols-3 gap-3.5 md:gap-5 mb-9">
            {values.map(v => (
              <div key={v.t} className="bg-warm-cream rounded-[18px] p-5 md:p-6 text-center">
                <div className="text-3xl mb-2.5">{v.icon}</div>
                <h4 className="pf text-forest text-base mb-2">{v.t}</h4>
                <p className="text-text-med text-[13px] leading-[1.7]">{v.d}</p>
              </div>
            ))}
          </div>
        )}
        <div className="bg-forest rounded-[20px] p-7 md:p-10 text-center">
          <h2 className="pf text-primary-foreground text-xl md:text-[34px] mb-3">Ready to Build Your Bundle?</h2>
          <p className="text-primary-foreground/65 text-sm mb-5">Join hundreds of Nigerian mums who've made hospital prep stress-free.</p>
          <Link to="/quiz" className="rounded-pill bg-coral px-8 py-3.5 font-body font-semibold text-primary-foreground hover:bg-coral-dark interactive text-[15px] inline-block">Start the Quiz →</Link>
        </div>
      </div>
    </div>
  );
}
