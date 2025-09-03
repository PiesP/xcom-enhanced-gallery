import { describe, it, expect } from 'vitest';
import { evaluateModalSurfaceModeDetailed } from '@shared/styles/modal-surface-evaluator';

// GREEN: scrim 필드 구현 후 메타 데이터 검증

describe('[GREEN] modal-surface evaluator scrim field', () => {
  it('고채도 샘플 입력 시 detailed.scrim.enabled=true 이고 intensity 가 정의되어야 한다', () => {
    // NOTE: #0000ff (blue) 제거 (black 대비 2.44:1 → solid 전환) → glass 유지 위해 #ff00ff 사용
    const samples = ['#ff0000', '#00ff00', '#ff00ff', '#ffff00'];
    const detailed = evaluateModalSurfaceModeDetailed({
      sampleColors: samples,
      textColor: '#000000',
    });
    expect(detailed.scrim).toBeDefined();
    expect(detailed.scrim?.enabled).toBe(true);
    expect(['low', 'med', 'high']).toContain(detailed.scrim?.intensity);
    expect(typeof detailed.scrim?.variance).toBe('number');
  });
});
