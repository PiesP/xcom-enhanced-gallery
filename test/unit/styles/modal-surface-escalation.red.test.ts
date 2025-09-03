import { describe, it, expect } from 'vitest';

// Phase 21.3 RED: 아직 구현되지 않은 escalateTiersUntilContrast / collectBackgroundSamplesV2
// 구현 후 GREEN 전환 예정
import {
  escalateTiersUntilContrast,
  type EscalationResult,
  estimateBlendedContrastTier,
  collectBackgroundSamplesV2,
} from '@shared/styles/modal-surface-escalation';

describe('[RED][Phase21.3] modal surface tier escalation', () => {
  it('escalates from glass to at least scrim-med for low contrast bright samples (white text scenario)', () => {
    const samples = ['#f2f2f2', '#ececec', '#fafafa'];
    const result: EscalationResult = escalateTiersUntilContrast({
      samples,
      textColor: '#ffffff',
      threshold: 4.5,
      solidBg: '#111111',
    });
    // 기대: 현재 스텁 구현에서는 glass일 가능성이 높아 실패 -> GREEN 시 scrim-* 이상
    expect(result.finalStage).not.toBe('glass');
    // 충분히 밝은 배경이므로 최소 scrim-med 이상 요구(알파 0.34 레벨 가정)
    const order = ['glass', 'scrim-low', 'scrim-med', 'scrim-high', 'solid'];
    expect(order.indexOf(result.finalStage)).toBeGreaterThanOrEqual(order.indexOf('scrim-med'));
    expect(result.blendedContrastFinal).toBeGreaterThanOrEqual(4.5);
  });

  it('escalates all the way to solid when even scrim-high alpha insufficient', () => {
    const samples = ['#ffffff', '#ffffff'];
    const result = escalateTiersUntilContrast({
      samples,
      textColor: '#ffffff',
      threshold: 4.5,
      solidBg: '#111111',
    });
    // 의도적으로 solid 로 가야 함 (scrim-high 도 4.5 미만)
    expect(result.finalStage).toBe('solid');
    expect(result.blendedContrastFinal).toBeGreaterThanOrEqual(4.5);
  });

  it('fail-safe: empty samples -> solid', () => {
    const result = escalateTiersUntilContrast({
      samples: [],
      textColor: '#000000',
      threshold: 4.5,
      solidBg: '#ffffff',
    });
    expect(result.finalStage).toBe('solid');
  });
});

describe('[RED][Phase21.3] hysteresis one-step downgrade', () => {
  it('downgrades at most one level when contrast improves sharply', () => {
    const prev = 'scrim-high' as const;
    const samples = ['#d0d0d0', '#d8d8d8'];
    const r = escalateTiersUntilContrast({
      samples,
      textColor: '#ffffff',
      threshold: 4.5,
      solidBg: '#111111',
      previousStage: prev,
    });
    // 기대: 바로 glass 로 급락하지 않고 scrim-med 정도로 한 단계만 하향
    expect(['scrim-med', 'scrim-high']).toContain(r.finalStage);
  });
});

describe('[RED][Phase21.3] blended contrast estimator sanity', () => {
  it('returns higher contrast for higher alpha (dark overlay over light backgrounds with white text)', () => {
    const samples = ['#f0f0f0'];
    const low = estimateBlendedContrastTier({
      samples,
      textColor: '#ffffff',
      alpha: 0.22,
      overlayColor: '#000000',
    });
    const high = estimateBlendedContrastTier({
      samples,
      textColor: '#ffffff',
      alpha: 0.46,
      overlayColor: '#000000',
    });
    expect(high).toBeGreaterThan(low);
  });
});

describe('[RED][Phase21.3] collectBackgroundSamplesV2 placeholder', () => {
  it('returns deterministic array (<=16) even without DOM (jsdom fallback)', () => {
    const s = collectBackgroundSamplesV2();
    expect(Array.isArray(s)).toBe(true);
    expect(s.length).toBeLessThanOrEqual(16);
  });
});
