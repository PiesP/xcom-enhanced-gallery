import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Announce routing hardening (RED)', () => {
  beforeEach(() => {
    vi.resetModules();
    (globalThis as any).document.body.innerHTML = '';
  });

  it('should announce info/success via live region and suppress toast; show toast for warning/error', async () => {
    const { ensurePoliteLiveRegion, ensureAssertiveLiveRegion } = await import(
      '@/shared/utils/accessibility/index'
    );
    const polite = ensurePoliteLiveRegion();
    const assertive = ensureAssertiveLiveRegion();

    const { UnifiedToastManager } = await import('@/shared/services');
    const tm = UnifiedToastManager.getInstance();

    // Spy on DOM mutations inside live regions
    const setText = vi.spyOn(polite, 'appendChild');
    const setTextAssert = vi.spyOn(assertive, 'appendChild');

    // Show various messages
    tm.info('Info', 'hello');
    tm.success('Success', 'ok');
    tm.warning('Warn', 'careful');
    tm.error('Error', 'boom');

    // Expect info/success to go to live region, not to toast list
    const { toasts } = await import('@/shared/components/ui/Toast/Toast');
    const list = toasts.value;

    // At least warning and error should be present as toast items
    expect(list.some(t => t.type === 'warning')).toBe(true);
    expect(list.some(t => t.type === 'error')).toBe(true);

    // And info/success should not be present as toast items
    expect(list.some(t => t.type === 'info')).toBe(false);
    expect(list.some(t => t.type === 'success')).toBe(false);

    // Live region received some announcements for non-disruptive types
    expect(setText).toHaveBeenCalled();
    // For assertive we do not expect info/success announcements
    expect(setTextAssert).not.toHaveBeenCalled();
  });
});
