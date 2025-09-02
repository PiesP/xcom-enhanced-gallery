/**
 * Phase 11 HARDEN RED: StrategyChain 리팩터
 * 요구사항 (RED):
 * 1) 전략들을 우선순위 순서대로 실행한다 (priority asc)
 * 2) 첫 성공 시 체인 실행 중단하고 metrics 반환 (attemptedStrategies, successStrategy)
 * 3) 모든 실패 시 failure result 에 attemptedStrategies 목록 포함
 * 4) Orchestrator 는 StrategyChain 에 위임 (직접 for-loop 제거 예정)
 * 현재 Orchestrator 는 for-loop 직접 실행 -> metrics 미포함 → 이 테스트 실패해야 함
 */
import { describe, it, expect } from 'vitest';
import { MediaExtractionOrchestrator } from '@/shared/services/media-extraction/MediaExtractionOrchestrator';
import type { MediaExtractionResult, MediaExtractionOptions } from '@/shared/types/media.types';

class TestStrategy {
  constructor(
    public name: string,
    public priority: number,
    private succeed = false
  ) {}
  canHandle(): boolean {
    return true;
  }
  async extract(): Promise<MediaExtractionResult> {
    if (this.succeed) {
      return {
        success: true,
        mediaItems: [],
        clickedIndex: 0,
        metadata: { extractedAt: Date.now(), sourceType: 'test', strategy: this.name },
      };
    }
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: { extractedAt: Date.now(), sourceType: 'test', strategy: this.name },
    };
  }
}

describe('Phase 11 RED: StrategyChain 리팩터', () => {
  it('우선순위 순으로 실행 및 첫 성공 시 중단, 체인 metrics 포함 (RED)', async () => {
    const orch = new MediaExtractionOrchestrator();
    // 낮은 priority 값이 먼저 실행되어야 함: A(1) -> B(2) -> C(3)
    // B 에서 성공하도록 구성
    // @ts-ignore addStrategy public API 사용
    orch.addStrategy(new TestStrategy('A', 1, false));
    // @ts-ignore
    orch.addStrategy(new TestStrategy('B', 2, true));
    // @ts-ignore
    orch.addStrategy(new TestStrategy('C', 3, true));

    const dummyEl = document.createElement('div');
    const result = await orch.extract(dummyEl, {} as MediaExtractionOptions);

    // 기대: success true, successStrategy === 'B', attemptedStrategies === ['A','B']
    expect(result.success).toBe(true);
    // RED 기대 메타데이터 확장 (아직 구현 전):
    expect(result.metadata?.successStrategy, 'successStrategy 메타데이터 필요').toBe('B');
    expect(result.metadata?.attemptedStrategies, 'attemptedStrategies 메타데이터 필요').toEqual([
      'A',
      'B',
    ]);
  });
});
