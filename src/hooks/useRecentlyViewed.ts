const KEY = "bm-recently-viewed";
const MAX = 10;

function readRaw(): string[] {
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return [];
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr.filter(x => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeRaw(ids: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX)));
    // Notify any mounted <RecentlyViewedStrip /> to re-read.
    window.dispatchEvent(new CustomEvent("bm-recently-viewed-changed"));
  } catch {
    /* quota / private mode — silent */
  }
}

/**
 * Record a product as "recently viewed". LRU: most recent first,
 * deduped by id, capped at 10.
 */
export function addRecentlyViewed(productId: string): void {
  if (!productId) return;
  const current = readRaw().filter(id => id !== productId);
  writeRaw([productId, ...current]);
}

/** Read the list of recently-viewed product ids (most recent first). */
export function getRecentlyViewed(): string[] {
  return readRaw();
}

/** Clear the list entirely. */
export function clearRecentlyViewed(): void {
  writeRaw([]);
}
