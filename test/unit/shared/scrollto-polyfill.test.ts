/**
 * scrollTo polyfill 안정성 테스트 (선택 기능)
 * 요구사항:
 * 1) window.scrollTo 존재하고 함수여야 함
 * 2) 호출 시 예외 발생하지 않아야 함
 */
import { describe, it, expect } from 'vitest';
// @vitest-environment jsdom

describe('scrollTo polyfill', () => {
  it('window.scrollTo exists and callable without error', () => {
    expect(typeof window.scrollTo).toBe('function');
    expect(() => window.scrollTo(0, 100)).not.toThrow();
  });
});
