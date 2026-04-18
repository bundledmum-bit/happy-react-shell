import { useEffect } from "react";
import HomeQuiz from "@/components/home/HomeQuiz";

// /quiz route — a standalone page that renders the same 3-screen home
// quiz flow. Screen 1 (budget / categories / gender) sits on the brand
// green hero. Screens 2 (WhatsApp) and 3 (results) portal to a full-screen
// overlay, identical to the home embed.
export default function QuizPage() {
  useEffect(() => { document.title = "Build My List | BundledMum"; }, []);

  return (
    <section
      className="min-h-screen pt-20 md:pt-28 pb-12 md:pb-16 flex items-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1E5C44 55%, #163D2E 100%)" }}
    >
      <div className="absolute w-[700px] h-[700px] rounded-full bg-primary-foreground/[0.025] -top-[250px] -right-[250px] pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-coral/[0.04] -bottom-[200px] -left-[200px] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-5 md:px-10 w-full relative z-10">
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 bg-coral/[0.18] border border-coral/40 rounded-pill px-4 py-1.5 mb-4">
            <span className="text-coral text-xs font-semibold">Takes under a minute</span>
          </div>
          <h1 className="pf text-[26px] md:text-[38px] font-bold text-primary-foreground leading-tight mb-2">
            Build your <span className="text-coral italic">perfect bundle</span>
          </h1>
          <p className="text-primary-foreground/70 text-[13px] md:text-[15px] max-w-[520px] mx-auto font-body leading-relaxed">
            Answer three quick questions and we will hand-pick the right items for your budget.
          </p>
        </div>

        <HomeQuiz />
      </div>
    </section>
  );
}
