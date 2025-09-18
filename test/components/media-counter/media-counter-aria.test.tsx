import { describe, it, expect } from 'vitest';
import { getPreact } from '@shared/external/vendors';
import { MediaCounter } from '@shared/components/ui/MediaCounter/MediaCounter';

// P6 GREEN: progressbar에 aria-valuetext 및 now/max/min 계약 검증

describe('P6: MediaCounter progressbar ARIA semantics', () => {
  it('provides aria-valuetext reflecting percentage and position', () => {
    const { h, render } = getPreact();
    const root = (globalThis as any).document.createElement('div');
    render(h(MediaCounter, { current: 3, total: 10 }), root);
    const progress = root.querySelector('[role="progressbar"]');
    expect(progress).toBeTruthy();
    const valueText = progress?.getAttribute('aria-valuetext');
    expect(valueText).toBe('30% (3/10)');
    expect(progress?.getAttribute('aria-valuenow')).toBe('30');
    expect(progress?.getAttribute('aria-valuemax')).toBe('10');
    expect(progress?.getAttribute('aria-valuemin')).toBe('0');
  });

  it('handles zero/empty total gracefully', () => {
    const { h, render } = getPreact();
    const root = (globalThis as any).document.createElement('div');
    render(h(MediaCounter, { current: 0, total: 0 }), root);
    const progress = root.querySelector('[role="progressbar"]');
    expect(progress).toBeTruthy();
    // total이 0이면 percent는 0
    expect(progress?.getAttribute('aria-valuenow')).toBe('0');
    expect(progress?.getAttribute('aria-valuetext')).toBe('0% (0/0)');
  });
});
