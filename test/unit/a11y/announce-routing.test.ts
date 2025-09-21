import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Announce routing hardening', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.resetModules();
    document.body.innerHTML = '';
  });

  it('should announce info/success via live region and suppress toast; show toast for warning/error', async () => {
    const { ensurePoliteLiveRegion, ensureAssertiveLiveRegion } = await import(
      '@/shared/utils/accessibility/index'
    );
    const polite = ensurePoliteLiveRegion();
    const assertive = ensureAssertiveLiveRegion();

    const { UnifiedToastManager } = await import('@/shared/services');
    const tm = UnifiedToastManager.getInstance();

    // Observe text changes via MutationObserver
    vi.useFakeTimers();
    const politeSeen: string[] = [];
    const assertiveSeen: string[] = [];
    const obsPolite = new window.MutationObserver(() => {
      const t = polite.textContent || '';
      if (t) politeSeen.push(t);
    });
    const obsAssert = new window.MutationObserver(() => {
      const t = assertive.textContent || '';
      if (t) assertiveSeen.push(t);
    });
    obsPolite.observe(polite, { childList: true, characterData: true, subtree: true });
    obsAssert.observe(assertive, { childList: true, characterData: true, subtree: true });

    // Show various messages
    tm.info('Info', 'hello');
    tm.success('Success', 'ok');
    tm.warning('Warn', 'careful');
    tm.error('Error', 'boom');

    // Flush queued live region announcements
    vi.runAllTimers();
    await Promise.resolve();

    // Expect info/success to go to live region, not to toast list
    const { toasts } = await import('@/shared/components/ui/Toast/Toast');
    const list = toasts.value;

    // At least warning and error should be present as toast items
    expect(list.some(t => t.type === 'warning')).toBe(true);
    expect(list.some(t => t.type === 'error')).toBe(true);

    // And info/success should not be present as toast items
    expect(list.some(t => t.type === 'info')).toBe(false);
    expect(list.some(t => t.type === 'success')).toBe(false);

    // Live region received announcements for non-disruptive types (polite)
    expect(politeSeen.some(t => t.includes('Info: hello') || t.includes('Success: ok'))).toBe(true);
    // Assertive channel should receive error
    expect(assertiveSeen.some(t => t.includes('Error: boom'))).toBe(true);

    obsPolite.disconnect();
    obsAssert.disconnect();
  });
});
