/**
 * RED: Adaptive 모달 표면 모드 평가기 테스트
 */
import { describe, it, expect } from 'vitest';
import { evaluateModalSurfaceMode } from '@shared/styles/modal-surface-evaluator';

describe('modal-surface mode evaluator (RED)', () => {
  it('고대비 배경 샘플에서는 glass 선택', () => {
    const mode = evaluateModalSurfaceMode({
      sampleColors: ['#000000', '#111111'],
      textColor: '#ffffff',
    });
    expect(mode).toBe('glass');
  });

  it('저대비 배경 샘플에서는 solid 선택', () => {
    const mode = evaluateModalSurfaceMode({
      sampleColors: ['#f2f3f4', '#f4f5f6'],
      textColor: '#ffffff',
    });
    expect(mode).toBe('solid');
  });
});
