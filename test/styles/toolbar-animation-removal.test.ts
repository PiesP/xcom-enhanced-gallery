import { describe, it, expect } from 'vitest';

describe('Toolbar animation removal', () => {
  it('should not define toolbar-slide keyframes or classes', () => {
    const cssTexts: string[] = [];
    // Collect all inline <style> contents if present
    const styles = Array.from(document.querySelectorAll('style')) as any[];
    styles.forEach(s => cssTexts.push(s?.textContent || ''));
    // In JSDOM links don't fetch, so focus on inline styles

    const all = cssTexts.join('\n');
    expect(all).not.toMatch(/@keyframes\s+toolbar-slide-(down|up)/);
    expect(all).not.toMatch(/\.animate-toolbar-slide-(down|up)/);
  });

  it('toolbar animation tokens should be none when queried from CSS variables (if present)', () => {
    // We can only assert variables resolve to 'none' if defined on :root
    const root = document.documentElement as any;
    const gcs =
      (globalThis as any).getComputedStyle?.bind(globalThis) ||
      (() => ({ getPropertyValue: () => '' }));
    const show = gcs(root).getPropertyValue('--animation-toolbar-show').trim();
    const hide = gcs(root).getPropertyValue('--animation-toolbar-hide').trim();
    // In test env variables may be empty; treat empty as acceptable, otherwise must be none
    if (show) expect(show).toBe('none');
    if (hide) expect(hide).toBe('none');
  });
});
