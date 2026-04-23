import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "bm_preview_token";

async function validate(token: string): Promise<boolean> {
  try {
    const { data, error } = await (supabase as any).rpc("validate_preview_token", { p_token: token });
    if (error) return false;
    // RPC can return either a boolean or an object like { valid: true }.
    if (typeof data === "boolean") return data;
    return !!data?.valid;
  } catch {
    return false;
  }
}

/**
 * Reads `?preview=TOKEN` on mount, validates against the DB, and persists it
 * in localStorage so subsequent visits bypass the Coming Soon gate until the
 * token is revoked/expired.
 *
 * Returns `{ ready, valid }`. While `ready` is false the gate must not fire
 * — otherwise a user arriving via a preview link would still see the
 * Coming Soon redirect for a frame before the bypass kicks in.
 */
export function usePreviewToken(): { ready: boolean; valid: boolean } {
  const [state, setState] = useState<{ ready: boolean; valid: boolean }>({ ready: false, valid: false });

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      // 1. Consume ?preview= from the URL (one-shot).
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("preview");
      if (fromUrl) {
        if (await validate(fromUrl)) {
          localStorage.setItem(STORAGE_KEY, fromUrl);
          // Clean up the URL so the token isn't copy-pasted around.
          const url = new URL(window.location.href);
          url.searchParams.delete("preview");
          window.history.replaceState({}, "", url.toString());
          if (mounted) setState({ ready: true, valid: true });
          return;
        }
        // Invalid token in URL — fall through to localStorage check.
      }

      // 2. Re-validate any stored token so revoked/expired ones get cleared.
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const ok = await validate(stored);
        if (!ok) localStorage.removeItem(STORAGE_KEY);
        if (mounted) setState({ ready: true, valid: ok });
        return;
      }

      if (mounted) setState({ ready: true, valid: false });
    };

    run();
    return () => { mounted = false; };
  }, []);

  return state;
}
