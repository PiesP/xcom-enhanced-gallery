/**
 * RED: 모달 표면 대비 계산 유틸 테스트 (Phase21.2)
 * - computeRelativeLuminance
 * - computeContrastRatio
 * 구현 전이므로 현재 실패 예상
 */
import { describe, it, expect } from 'vitest';
import {
  computeRelativeLuminance,
  computeContrastRatio,
} from '@shared/styles/modal-surface-evaluator';

describe('modal-surface contrast utils (RED)', () => {
  it('sRGB 상대 휘도 계산이 흰색=1, 검정=0 에 근사해야 함', () => {
    const lw = computeRelativeLuminance('#ffffff');
    const lb = computeRelativeLuminance('#000000');
    expect(lw).toBeGreaterThan(0.99);
    expect(lb).toBeLessThan(0.01);
  });

  it('대비 공식이 WCAG 예시 (#000,#fff)=21:1 근사', () => {
    const ratio = computeContrastRatio('#000', '#fff');
    expect(ratio).toBeGreaterThan(20.9);
  });
});
