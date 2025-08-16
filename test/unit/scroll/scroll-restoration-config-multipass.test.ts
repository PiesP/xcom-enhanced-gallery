import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getScrollRestorationConfig,
  setScrollRestorationConfig,
  resetScrollRestorationConfig,
} from '@shared/scroll/scroll-restoration-config';
import { restoreScrollPosition, saveScrollPosition } from '@shared/browser';

// jsdom scroll mocking
function mockScroll(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, writable: true, configurable: true });
  Object.defineProperty(window, 'pageYOffset', { value: y, writable: true, configurable: true });
}

describe('scroll-restoration-config multipass disable flag', () => {
  beforeEach(() => {
    resetScrollRestorationConfig();
    sessionStorage.clear();
    mockScroll(1000);
    saveScrollPosition();
  });

  it('기본값: disableMultiPassScrollCorrection=true 이어야 한다', () => {
    const cfg = getScrollRestorationConfig();
    expect(cfg.disableMultiPassScrollCorrection).toBe(true);
  });

  it('multi-pass correction logic removed: no setTimeout even when flag=false', () => {
    const spy1 = vi.spyOn(window, 'setTimeout');
    restoreScrollPosition(undefined, false);
    expect(spy1).not.toHaveBeenCalled();
    setScrollRestorationConfig({ disableMultiPassScrollCorrection: false });
    const spy2 = vi.spyOn(window, 'setTimeout');
    restoreScrollPosition(undefined, false);
    expect(spy2).not.toHaveBeenCalled();
  });
});
