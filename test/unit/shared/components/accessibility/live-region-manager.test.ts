import { describe, it, expect, beforeEach } from 'vitest';
import {
  ensurePoliteLiveRegion,
  ensureAssertiveLiveRegion,
} from '../../../src/shared/utils/accessibility/live-region-manager';

describe('[a11y] LiveRegionManager – 단일 인스턴스 & 속성', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('polite 라이브 리전은 한 번만 생성되고 재사용된다', () => {
    const polite1 = ensurePoliteLiveRegion();
    const polite2 = ensurePoliteLiveRegion();
    expect(polite1).toBe(polite2);
    expect(polite1.getAttribute('data-xe-live-region')).toBe('polite');
    expect(polite1.getAttribute('aria-live')).toBe('polite');
    expect(polite1.getAttribute('role')).toBe('status');
    const all = document.querySelectorAll('[data-xe-live-region="polite"]');
    expect(all.length).toBe(1);
  });

  it('assertive 라이브 리전은 한 번만 생성되고 재사용된다', () => {
    const assertive1 = ensureAssertiveLiveRegion();
    const assertive2 = ensureAssertiveLiveRegion();
    expect(assertive1).toBe(assertive2);
    expect(assertive1.getAttribute('data-xe-live-region')).toBe('assertive');
    expect(assertive1.getAttribute('aria-live')).toBe('assertive');
    expect(assertive1.getAttribute('role')).toBe('alert');
    const all = document.querySelectorAll('[data-xe-live-region="assertive"]');
    expect(all.length).toBe(1);
  });

  it('polite + assertive 동시 생성 시 총 2개만 존재', () => {
    const polite = ensurePoliteLiveRegion();
    const assertive = ensureAssertiveLiveRegion();
    expect(polite).not.toBe(assertive);
    const all = document.querySelectorAll('[data-xe-live-region]');
    expect(all.length).toBe(2);
  });
});
