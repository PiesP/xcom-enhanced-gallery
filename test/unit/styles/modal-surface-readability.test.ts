import { describe, it, expect } from 'vitest';

// RED: 구현 전 단계 - 아직 모듈/함수 미구현 상태를 전제.
// 목표: 고주파(색상/명도 다양) 배경 > 저주파(균일) 배경 noiseScore 가 높아야 함.
// 또한 대비 미달(minContrast ~4.9) + 중간 noise 에서 ladder 가 'scrim-med' 이상을 반환해야 함.

// 미리 정의할(기대) API 시그니처 (구현 후 동일 유지):
// computeNoiseMetrics(colors: string[]): { luminanceVariance:number; avgAdjacencyDeltaL:number; noiseScore:number }
// adaptReadabilityLadder(params:{ minContrast:number; noiseScore:number; previousStage?:string }): 'glass'|'scrim-low'|'scrim-med'|'scrim-high'|'solid'

// NOTE: 현재는 import 시점에서 모듈이 존재하지 않아 테스트가 실패(모듈 해석 에러) → RED.
import {
  computeNoiseMetrics,
  adaptReadabilityLadder,
} from '@shared/styles/modal-surface-readability';

describe('[RED] modal-surface-readability metrics', () => {
  it('고주파(다채색) 배경은 저주파(거의 동일 명도) 배경보다 noiseScore 가 높아야 한다', () => {
    const highChroma = [
      '#ff0000',
      '#00ff00',
      '#0000ff',
      '#ffff00',
      '#ff00ff',
      '#00ffff',
      '#000000',
      '#ffffff',
    ];
    const lowChroma = ['#222222', '#232323', '#242424', '#252525', '#242424', '#232323'];
    const high = computeNoiseMetrics(highChroma);
    const low = computeNoiseMetrics(lowChroma);
    expect(high.noiseScore).toBeGreaterThan(low.noiseScore + 0.15); // 유의 차이 기대
  });

  it('대비 4.9 & 중간 noiseScore 상황에서 ladder 는 최소 scrim-med 이상을 선택해야 한다', () => {
    const stage = adaptReadabilityLadder({ minContrast: 4.9, noiseScore: 0.45 });
    expect(['scrim-med', 'scrim-high', 'solid']).toContain(stage);
  });

  it('아주 낮은 대비(4.2) + 매우 높은 noise(>=0.7) 는 solid 로 강등되어야 한다', () => {
    const stage = adaptReadabilityLadder({ minContrast: 4.2, noiseScore: 0.75 });
    expect(stage === 'solid').toBe(true);
  });
});
