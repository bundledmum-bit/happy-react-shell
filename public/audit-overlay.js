/*
 * BundledMum Mobile UI Audit Overlay
 * -----------------------------------
 * Load via DevTools console:
 *   const s = document.createElement('script'); s.src = '/audit-overlay.js'; document.head.appendChild(s);
 * Or bookmarklet: javascript:(()=>{const s=document.createElement('script');s.src=location.origin+'/audit-overlay.js';document.head.appendChild(s);})()
 *
 * Features:
 *  - Scans DOM for mobile-UI violations (tap target < 44px, input font-size < 16px, missing safe-area, small text in critical UI)
 *  - Draws colored outlines on violations + in-place labels
 *  - Floating control panel: counts by severity, category filter, rescan, dismiss
 *  - Re-scans on navigation / DOM mutation
 */
(() => {
  if (window.__BM_AUDIT_ACTIVE) {
    // toggle off
    window.__BM_AUDIT_CLEANUP?.();
    return;
  }
  window.__BM_AUDIT_ACTIVE = true;

  const STYLE_ID = 'bm-audit-style';
  const PANEL_ID = 'bm-audit-panel';
  const LAYER_ID = 'bm-audit-layer';

  const COLORS = {
    high: '#DC2626',      // red
    medium: '#EA580C',    // orange
    low: '#D97706',       // amber
    ok: '#16A34A',
  };

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${LAYER_ID} { position: fixed; inset: 0; pointer-events: none; z-index: 2147483646; }
    .bm-audit-mark { position: absolute; box-sizing: border-box; pointer-events: none; border-radius: 4px; }
    .bm-audit-mark.high { outline: 2px solid ${COLORS.high}; background: ${COLORS.high}18; }
    .bm-audit-mark.medium { outline: 2px dashed ${COLORS.medium}; background: ${COLORS.medium}12; }
    .bm-audit-mark.low { outline: 1px dashed ${COLORS.low}; background: ${COLORS.low}08; }
    .bm-audit-label {
      position: absolute; font: 700 10px/1 ui-monospace, monospace;
      padding: 2px 5px; border-radius: 3px; color: white; white-space: nowrap;
      pointer-events: none; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .bm-audit-label.high { background: ${COLORS.high}; }
    .bm-audit-label.medium { background: ${COLORS.medium}; }
    .bm-audit-label.low { background: ${COLORS.low}; }
    #${PANEL_ID} {
      position: fixed; top: 12px; right: 12px; width: 280px;
      background: white; border: 1px solid #e5e7eb; border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15); z-index: 2147483647;
      font: 13px/1.4 system-ui, -apple-system, sans-serif; color: #111827;
      overflow: hidden; pointer-events: auto;
    }
    #${PANEL_ID} .bm-hd { padding: 10px 12px; background: #111827; color: white; display: flex; align-items: center; justify-content: space-between; }
    #${PANEL_ID} .bm-hd .bm-title { font-weight: 700; font-size: 12px; letter-spacing: 0.02em; }
    #${PANEL_ID} .bm-hd button { background: transparent; border: 0; color: white; font-size: 16px; cursor: pointer; padding: 0 4px; }
    #${PANEL_ID} .bm-body { padding: 10px 12px; }
    #${PANEL_ID} .bm-row { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; }
    #${PANEL_ID} .bm-row + .bm-row { border-top: 1px solid #f3f4f6; }
    #${PANEL_ID} .bm-dot { width: 8px; height: 8px; border-radius: 9999px; display: inline-block; margin-right: 8px; }
    #${PANEL_ID} .bm-toggle { display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none; font-size: 12px; }
    #${PANEL_ID} .bm-count { font-weight: 700; font-variant-numeric: tabular-nums; }
    #${PANEL_ID} .bm-foot { padding: 8px 12px; background: #f9fafb; border-top: 1px solid #f3f4f6; display: flex; gap: 6px; }
    #${PANEL_ID} .bm-foot button { flex: 1; font-size: 11px; padding: 6px 8px; border: 1px solid #e5e7eb; background: white; border-radius: 6px; cursor: pointer; font-weight: 600; }
    #${PANEL_ID} .bm-foot button:hover { background: #f3f4f6; }
    #${PANEL_ID} .bm-categories { max-height: 200px; overflow-y: auto; }
    #${PANEL_ID} details { margin-top: 8px; }
    #${PANEL_ID} summary { cursor: pointer; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
  `;
  document.head.appendChild(style);

  const layer = document.createElement('div');
  layer.id = LAYER_ID;
  document.body.appendChild(layer);

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.innerHTML = `
    <div class="bm-hd">
      <span class="bm-title">🔍 BM Mobile Audit</span>
      <button id="bm-close" title="Close overlay">×</button>
    </div>
    <div class="bm-body">
      <div class="bm-row"><label class="bm-toggle"><span class="bm-dot" style="background:${COLORS.high}"></span>High severity</label><span id="bm-c-high" class="bm-count">0</span></div>
      <div class="bm-row"><label class="bm-toggle"><span class="bm-dot" style="background:${COLORS.medium}"></span>Medium</label><span id="bm-c-medium" class="bm-count">0</span></div>
      <div class="bm-row"><label class="bm-toggle"><span class="bm-dot" style="background:${COLORS.low}"></span>Low</label><span id="bm-c-low" class="bm-count">0</span></div>
      <details>
        <summary>By category</summary>
        <div id="bm-categories" class="bm-categories"></div>
      </details>
    </div>
    <div class="bm-foot">
      <button id="bm-rescan">Rescan</button>
      <button id="bm-toggle-marks">Hide marks</button>
    </div>
  `;
  document.body.appendChild(panel);

  // ── Scanner ──
  const CATEGORIES = {
    'tap-target': 'Tap targets < 44px',
    'input-zoom': 'Input font < 16px (iOS zoom)',
    'autofill-missing': 'Missing autoComplete',
    'tiny-text': 'Text < 11px in critical UI',
    'safe-area': 'Fixed bottom w/o safe-area',
  };

  let violations = [];
  let marksVisible = true;

  function isInteractive(el) {
    const tag = el.tagName;
    if (['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL'].includes(tag)) return true;
    if (el.getAttribute('role') === 'button') return true;
    if (el.onclick || el.getAttribute('onclick')) return true;
    const cs = getComputedStyle(el);
    if (cs.cursor === 'pointer' && el.children.length === 0) return true;
    return false;
  }

  function isVisible(el) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function scan() {
    violations = [];
    const all = document.body.querySelectorAll('*');

    for (const el of all) {
      if (el.closest('#' + PANEL_ID) || el.closest('#' + LAYER_ID)) continue;
      if (!isVisible(el)) continue;

      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();

      // Tap target
      if (isInteractive(el)) {
        const w = r.width, h = r.height;
        if (w > 0 && h > 0 && (w < 44 || h < 44) && w < 400) {
          const severity = (w < 36 || h < 36) ? 'high' : 'medium';
          violations.push({
            el, severity, category: 'tap-target',
            label: `${Math.round(w)}×${Math.round(h)}px`,
            rect: r,
          });
        }
      }

      // Input font-size (iOS zoom)
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) {
        const type = el.type || 'text';
        if (!['checkbox', 'radio', 'range', 'color', 'hidden', 'file'].includes(type)) {
          const fs = parseFloat(cs.fontSize);
          if (fs < 16) {
            violations.push({
              el, severity: 'high', category: 'input-zoom',
              label: `${fs}px → iOS zoom`,
              rect: r,
            });
          }
          // Autofill missing on checkout-like fields
          const name = (el.name || el.id || el.placeholder || '').toLowerCase();
          const hasAutocomplete = el.autocomplete && el.autocomplete !== '' && el.autocomplete !== 'off';
          const looksLikePII = /phone|tel|email|address|city|state|zip|postal|name|first|last/.test(name);
          if (looksLikePII && !hasAutocomplete) {
            violations.push({
              el, severity: 'medium', category: 'autofill-missing',
              label: `no autoComplete`,
              rect: r,
            });
          }
        }
      }

      // Tiny text in critical UI (badges, CTAs, prices)
      if (el.children.length === 0 && el.textContent.trim().length > 0 && el.textContent.trim().length < 50) {
        const fs = parseFloat(cs.fontSize);
        if (fs > 0 && fs < 11) {
          // Flag only if in a button, badge-like, or interactive context
          const inInteractive = el.closest('button, a, [role=button]');
          const hasBgColor = cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
          const looksCritical = inInteractive || hasBgColor || /save|only|left|sale|oos|sold/i.test(el.textContent);
          if (looksCritical) {
            violations.push({
              el, severity: fs < 10 ? 'high' : 'medium',
              category: 'tiny-text',
              label: `${fs}px`,
              rect: r,
            });
          }
        }
      }

      // Fixed bottom without safe-area
      if (cs.position === 'fixed') {
        const bottom = parseFloat(cs.bottom);
        if (bottom === 0 || (bottom < 10 && bottom >= 0)) {
          const pb = cs.paddingBottom;
          const hasSafeArea = /env\(safe-area/.test(el.style.paddingBottom) ||
                              /env\(safe-area/.test(pb) ||
                              el.className?.includes?.('safe-area') ||
                              el.className?.includes?.('pb-safe');
          // Check if parent has safe-area class too
          const parentHasSafe = el.parentElement && /safe-area|pb-safe/.test(el.parentElement.className || '');
          if (!hasSafeArea && !parentHasSafe && r.bottom >= window.innerHeight - 4) {
            violations.push({
              el, severity: 'high', category: 'safe-area',
              label: `fixed bottom · no safe-area`,
              rect: r,
            });
          }
        }
      }
    }

    render();
  }

  function render() {
    layer.innerHTML = '';
    const counts = { high: 0, medium: 0, low: 0 };
    const catCounts = {};

    if (marksVisible) {
      for (const v of violations) {
        counts[v.severity]++;
        catCounts[v.category] = (catCounts[v.category] || 0) + 1;

        const mark = document.createElement('div');
        mark.className = 'bm-audit-mark ' + v.severity;
        mark.style.left = v.rect.left + 'px';
        mark.style.top = v.rect.top + 'px';
        mark.style.width = v.rect.width + 'px';
        mark.style.height = v.rect.height + 'px';
        layer.appendChild(mark);

        const lbl = document.createElement('div');
        lbl.className = 'bm-audit-label ' + v.severity;
        lbl.textContent = v.label;
        // Position label above if room, else below
        const topPos = v.rect.top > 20 ? v.rect.top - 18 : v.rect.bottom + 2;
        lbl.style.left = Math.max(4, Math.min(window.innerWidth - 120, v.rect.left)) + 'px';
        lbl.style.top = topPos + 'px';
        layer.appendChild(lbl);
      }
    } else {
      for (const v of violations) {
        counts[v.severity]++;
        catCounts[v.category] = (catCounts[v.category] || 0) + 1;
      }
    }

    document.getElementById('bm-c-high').textContent = counts.high;
    document.getElementById('bm-c-medium').textContent = counts.medium;
    document.getElementById('bm-c-low').textContent = counts.low;

    const catEl = document.getElementById('bm-categories');
    catEl.innerHTML = Object.entries(CATEGORIES).map(([k, label]) => {
      const count = catCounts[k] || 0;
      return `<div class="bm-row" style="padding:4px 0;"><span style="font-size:11px; color:#4b5563;">${label}</span><span class="bm-count" style="font-size:11px;">${count}</span></div>`;
    }).join('');
  }

  // Control handlers
  document.getElementById('bm-close').addEventListener('click', () => {
    window.__BM_AUDIT_CLEANUP?.();
  });
  document.getElementById('bm-rescan').addEventListener('click', scan);
  document.getElementById('bm-toggle-marks').addEventListener('click', (e) => {
    marksVisible = !marksVisible;
    e.target.textContent = marksVisible ? 'Hide marks' : 'Show marks';
    render();
  });

  // Rescan on resize, scroll (debounced), and DOM changes
  let scanTimer;
  const debouncedScan = () => {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 250);
  };

  const mo = new MutationObserver(debouncedScan);
  mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });

  window.addEventListener('resize', debouncedScan);
  window.addEventListener('scroll', debouncedScan, { passive: true });

  // Router change detection (for SPA navigation)
  const origPush = history.pushState;
  const origReplace = history.replaceState;
  history.pushState = function() { origPush.apply(this, arguments); setTimeout(scan, 300); };
  history.replaceState = function() { origReplace.apply(this, arguments); setTimeout(scan, 300); };
  window.addEventListener('popstate', () => setTimeout(scan, 300));

  window.__BM_AUDIT_CLEANUP = () => {
    mo.disconnect();
    window.removeEventListener('resize', debouncedScan);
    window.removeEventListener('scroll', debouncedScan);
    history.pushState = origPush;
    history.replaceState = origReplace;
    document.getElementById(STYLE_ID)?.remove();
    document.getElementById(PANEL_ID)?.remove();
    document.getElementById(LAYER_ID)?.remove();
    window.__BM_AUDIT_ACTIVE = false;
    window.__BM_AUDIT_CLEANUP = null;
  };

  // Initial scan
  setTimeout(scan, 100);
  console.log('%c🔍 BM Mobile Audit loaded', 'background:#111827;color:white;padding:4px 8px;border-radius:4px;font-weight:700;');
  console.log('  • Violations rendered as colored outlines on page');
  console.log('  • Panel in top-right shows counts');
  console.log('  • Re-run the loader script to toggle off');
})();
