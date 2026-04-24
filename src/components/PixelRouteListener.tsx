import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { track } from "@/lib/metaPixel";

/**
 * Fires a Meta Pixel PageView on every route change. The base code in
 * index.html only fires once on initial load — without this listener
 * client-side SPA navigation would silently skip all subsequent
 * PageViews.
 */
export default function PixelRouteListener() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    track("PageView");
  }, [pathname, search]);
  return null;
}
