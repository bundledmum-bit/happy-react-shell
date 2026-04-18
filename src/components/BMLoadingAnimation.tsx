import { useEffect, useState } from "react";

// BundledMum loading animation — pumping heart inside the B.
// Rendered on a transparent background so the parent's styling shines through.
//
// Heart geometry (600×600 source icon):
//   center    → (281, 298.5) → 46.83%, 49.75%
//   bounding  → 32.83% wide × 28.67% tall
const HEART_CX_PCT = 46.83;
const HEART_CY_PCT = 49.75;
const HEART_W_PCT = 32.83;
const HEART_H_PCT = 28.67;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeInCubic = (t: number) => t * t * t;

// Heartbeat — full zoom-out/in cycle per second.
// 0.00–0.35 expand 1.0 → 1.9
// 0.35–0.50 hold near peak with a tiny sine pulse
// 0.50–0.80 contract 1.9 → 0.55
// 0.80–1.00 re-expand 0.55 → 1.0
function heartbeatScale(T: number) {
  const cycle = T % 1.0;
  if (cycle < 0.35) return lerp(1.0, 1.9, easeOutCubic(cycle / 0.35));
  if (cycle < 0.5) {
    const k = (cycle - 0.35) / 0.15;
    return 1.9 + Math.sin(k * Math.PI) * 0.05;
  }
  if (cycle < 0.8) return lerp(1.9, 0.55, easeInOutCubic((cycle - 0.5) / 0.3));
  return lerp(0.55, 1.0, easeInOutQuad((cycle - 0.8) / 0.2));
}

function heartGlow(T: number) {
  const cycle = T % 1.0;
  if (cycle < 0.35) return easeInCubic(cycle / 0.35) * 0.9;
  if (cycle < 0.55) return 0.9 - ((cycle - 0.35) / 0.2) * 0.6;
  return 0;
}

function useTime() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return t;
}

export default function BMLoadingAnimation({ size = 180 }: { size?: number }) {
  const t = useTime();
  const scale = heartbeatScale(t);
  const glow = heartGlow(t);

  const heartW = size * (HEART_W_PCT / 100);
  const heartH = size * (HEART_H_PCT / 100);
  const heartLeft = size * (HEART_CX_PCT / 100) - heartW / 2;
  const heartTop = size * (HEART_CY_PCT / 100) - heartH / 2;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        willChange: "transform",
      }}
      aria-label="Loading"
      role="status"
    >
      {/* Static plate inside the heart hole — keeps the hole filled when animated heart shrinks below neutral */}
      <div
        style={{
          position: "absolute",
          left: heartLeft,
          top: heartTop,
          width: heartW,
          height: heartH,
        }}
      >
        <img src="/images/heart.png" alt="" style={{ width: "100%", height: "100%", display: "block" }} />
      </div>

      {/* Static B mark */}
      <img
        src="/images/bm-icon-green.png"
        alt="BundledMum"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />

      {/* Animated heart — rendered on top of the B so it can bulge past the outline at peak */}
      <div
        style={{
          position: "absolute",
          left: heartLeft,
          top: heartTop,
          width: heartW,
          height: heartH,
          transform: `scale(${scale})`,
          transformOrigin: "center",
          willChange: "transform, filter",
          filter:
            glow > 0.01
              ? `drop-shadow(0 0 ${glow * 26}px rgba(45, 106, 79, ${glow * 0.55}))`
              : "none",
        }}
      >
        <img src="/images/heart.png" alt="" style={{ width: "100%", height: "100%", display: "block" }} />
      </div>
    </div>
  );
}
