/**
 * ViewMode 최적화 테스트
 * 불필요한 함수 제거 및 상수 단순화 검증
 */

// @ts-nocheck - 리팩토링된 기능 테스트
import { describe, it, expect } from 'vitest';
import { VIEW_MODES, isValidViewMode } from '@/constants';

describe('ViewMode Optimization', () => {
  it('should have only necessary view modes', () => {
    expect(VIEW_MODES).toEqual(['verticalList']);
    expect(VIEW_MODES.length).toBe(1);
  });

  it('should validate view modes correctly', () => {
    expect(isValidViewMode('verticalList')).toBe(true);
    expect(isValidViewMode('invalidMode')).toBe(false);
    expect(isValidViewMode('')).toBe(false);
  });

  it('should not export unnecessary normalization function', async () => {
    // normalizeViewMode 함수가 제거되었는지 확인
    const constants = await import('@/constants');
    expect(constants.normalizeViewMode).toBeUndefined();
  });

  it('should use ViewMode type correctly', () => {
    // 타입 레벨에서 확인 (컴파일 타임)
    const validMode = 'verticalList';
    expect(isValidViewMode(validMode)).toBe(true);
  });
});
