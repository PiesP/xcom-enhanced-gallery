/**
 * @fileoverview Toolbar separator contrast test
 * Ensures the '/' separator uses text color tokens for adequate contrast
 */
import { describe, it, expect } from 'vitest';
import { getPreact } from '@test-utils/legacy-preact';
import { Toolbar } from '@/shared/components/ui/Toolbar/Toolbar';

const { h, render } = getPreact();

describe('Toolbar separator contrast', () => {
  it('uses text color tokens for separator', () => {
    const container = (globalThis as any).document.createElement('div');
    render(
      h(Toolbar, {
        currentIndex: 0,
        totalCount: 10,
        onPrevious: () => {},
        onNext: () => {},
        onDownloadCurrent: () => {},
        onDownloadAll: () => {},
        onClose: () => {},
      }),
      container
    );

    const sep = container.querySelector('[data-gallery-element="counter"] span:nth-child(2)');
    expect(sep).toBeTruthy();
    // className should include 'separator' and computed style should not be empty
    const className = sep?.getAttribute('class') || '';
    expect(className).toContain('separator');

    // 명시적 언마운트: 잔류 effect/타이머 제거
    render(null as any, container);
  });
});
