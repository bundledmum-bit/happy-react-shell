import { useState, useEffect } from "react";

interface Props {
  stepsCompleted: number;
  totalSteps: number;
  onContinue: () => void;
}

export default function ExitIntentPopup({ stepsCompleted, totalSteps, onContinue }: Props) {
  const [show, setShow] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown || stepsCompleted < 1) return;
    const handler = (e: MouseEvent) => {
      if (e.clientY <= 5) {
        setShow(true);
        setShown(true);
      }
    };
    document.addEventListener("mousemove", handler);
    return () => document.removeEventListener("mousemove", handler);
  }, [shown, stepsCompleted]);

  // Also handle back button on mobile
  useEffect(() => {
    if (shown || stepsCompleted < 1) return;
    const handler = () => {
      setShow(true);
      setShown(true);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [shown, stepsCompleted]);

  if (!show) return null;

  const stepsLeft = totalSteps - stepsCompleted;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShow(false)} />
      <div className="relative bg-card rounded-[22px] shadow-2xl max-w-[420px] w-full p-6 md:p-8 animate-fade-in text-center">
        <div className="text-4xl mb-3">🎁</div>
        <h2 className="pf text-xl md:text-2xl font-bold mb-2">Wait — your bundle is almost ready!</h2>
        <p className="text-text-med text-sm mb-5">
          You're {stepsLeft} step{stepsLeft !== 1 ? "s" : ""} away from your personalised hospital bag list.
        </p>
        <div className="flex flex-col gap-2.5">
          <button onClick={() => { setShow(false); onContinue(); }}
            className="rounded-pill bg-coral px-6 py-3 font-body font-semibold text-primary-foreground hover:bg-coral-dark interactive text-sm">
            Continue My Quiz →
          </button>
          <button onClick={() => setShow(false)}
            className="rounded-pill border-2 border-border px-6 py-3 font-body font-semibold text-text-med hover:bg-warm-cream interactive text-sm">
            Maybe Later
          </button>
        </div>
        <p className="text-text-light text-[11px] mt-4 italic">
          ⭐ "The quiz took 2 minutes and saved me weeks of research" — Ngozi T.
        </p>
      </div>
    </div>
  );
}
