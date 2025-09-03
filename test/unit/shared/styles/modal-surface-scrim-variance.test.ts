import { describe, it, expect } from 'vitest';
// RED: 새 유틸 아직 존재하지 않음 (estimateChromaVariance, deriveScrimIntensity)
// 구현 전 컴파일/실행 실패(또는 undefined) 상태를 확보하여 GREEN 단계에서 기능 추가.
// 의도적으로 존재하지 않는 import 로 RED 확보 (구현 시 파일 생성 예정)
import { estimateChromaVariance, deriveScrimIntensity } from '@shared/styles/modal-surface-scrim';

describe('[RED] modal-surface scrim variance utility', () => {
  it('고채도 색상 세트가 저채도 세트보다 variance 가 커야 한다', () => {
    const high = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];
    const low = ['#111111', '#101010', '#121212', '#0f0f0f'];
    // 아직 함수 미구현 상태 → 런타임/컴파일 실패 기대
    const hv = estimateChromaVariance(high);
    const lv = estimateChromaVariance(low);
    expect(hv).toBeGreaterThan(lv * 2); // 임시 임계 (GREEN 단계에서 조정 가능)
  });

  it('deriveScrimIntensity 가 variance/contrast 조합으로 intensity 문자열을 반환해야 한다', () => {
    const intensity = deriveScrimIntensity(0.5, 5.0);
    expect(['low', 'med', 'high']).toContain(intensity);
  });
});
