/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { getPreact, initializeVendors, isVendorsInitialized } from '@shared/external/vendors';
import { MediaCounter } from '@shared/components/ui/MediaCounter/MediaCounter';

// GREEN 목표: MediaCounter가 렌더되고 기본 ARIA/진행률 구조가 존재

describe('MediaCounter component basic rendering', () => {
  it('renders current/total text and progressbar', async () => {
    if (!isVendorsInitialized()) await initializeVendors();
    const { h, render } = getPreact();
    const root = (globalThis as any).document.createElement('div');
    // Direct render without Fragment to avoid potential serialization anomaly
    render(h(MediaCounter, { current: 1, total: 5 }), root);
    const text = root.textContent || '';
    if (text === '[object Object]') {
      // Debug aid: surface innerHTML for diagnosis if anomaly recurs
      throw new Error('Unexpected object serialization: innerHTML=' + root.innerHTML);
    }
    expect(text).toContain('1');
    expect(text).toContain('/');
    expect(text).toContain('5');
    const progress = root.querySelector('[role="progressbar"]');
    expect(progress).toBeTruthy();
    expect(progress?.getAttribute('aria-valuemax')).toBe('5');
  });
});
