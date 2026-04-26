import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Pin the viewport to the top on every navigation.
 *
 * Three fires per navigation, all with `behavior: "auto"` (no smooth
 * animation):
 *   1. useLayoutEffect — synchronously before paint, so the new page
 *      never paints scrolled.
 *   2. useEffect — after the React commit settles.
 *   3. requestAnimationFrame after the next render — catches the case
 *      where a useQuery skeleton swaps in a much taller page and the
 *      browser's scroll-anchoring drifts the viewport downward.
 *
 * Trigger keys: pathname, search, AND location.key. The key bumps on
 * every history entry — including back/forward — so reverse-navigation
 * also resets to the top instead of restoring the previous scroll.
 */
const ScrollToTop = () => {
  const { pathname, search, key } = useLocation();

  // Pre-paint reset.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search, key]);

  // Post-commit + post-render-after-data resets, in case a skeleton
  // grew into a tall page and triggered scroll anchoring.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const raf = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname, search, key]);

  return null;
};

export default ScrollToTop;
