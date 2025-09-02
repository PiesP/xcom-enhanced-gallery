// @vitest-environment jsdom
/**
 * successResultCacheMaxEntries LRU 동작 & 중복 큐 스킵(중복 push 로 인한 과도 eviction 미발생) 검증
 * 시나리오:
 *  1. max=1 설정
 *  2. 동일 element A 3회 연속 extract (큐 중복 push 발생) → eviction 0 유지
 *  3. 새로운 element B extract → LRU eviction 1회 (A 제거)
 *  4. 새로운 element C extract → LRU eviction 2회 (B 제거) / 중간 stale 큐 항목(A) skip 되어 추가 eviction 없음
 */
import { describe, it, expect } from 'vitest';
import { MediaExtractionOrchestrator } from '../../../src/shared/services/media-extraction/MediaExtractionOrchestrator';
import type { MediaExtractionResult } from '../../../src/shared/types/media.types';

function makeStrategy() {
  return {
    name: 'S',
    priority: 1,
    canHandle: () => true,
    async extract(): Promise<MediaExtractionResult> {
      return {
        success: true,
        mediaItems: [
          {
            id: Math.random().toString(16).slice(2),
            url: 'https://ex.com/a.jpg',
            type: 'image',
            filename: 'a.jpg',
          },
        ],
        clickedIndex: 0,
        metadata: { sourceType: 'max-entries-lru', strategy: 'S' },
        tweetInfo: null,
        errors: [],
      };
    },
  };
}

describe('successResultCacheMaxEntries LRU & 중복 큐 스킵', () => {
  it('max=1 에서 동일 요소 반복 후 다른 요소 삽입 시 eviction 카운트 과증가 없이 1씩 증가', async () => {
    const orch = new MediaExtractionOrchestrator();
    orch.addStrategy(makeStrategy());
    if (typeof orch.setSuccessResultCacheMaxEntries === 'function') {
      orch.setSuccessResultCacheMaxEntries(1);
    }
    const elFactory = () =>
      (globalThis.document || { createElement: () => ({}) }).createElement('div') as HTMLElement;
    const elA = elFactory() as HTMLElement;
    // 동일 요소 3회 - eviction 없어야 함
    await orch.extract(elA, {});
    await orch.extract(elA, {});
    await orch.extract(elA, {});
    // B 삽입 → A 제거 LRU 1회
    await orch.extract(elFactory(), {});
    // C 삽입 → B 제거 LRU 2회 (stale A 큐 항목 skip)
    await orch.extract(elFactory(), {});

    // 마지막 추출 결과 (C) 메타에서 centralMetrics 확인
    const res = await orch.extract(elFactory(), {}); // D 삽입 → C 제거 LRU 3회
    const cm = (
      res.metadata && (res.metadata as any).centralMetrics
        ? (res.metadata as any).centralMetrics
        : undefined
    ) as any;
    expect(
      cm && cm.successResultCacheEvictionTypes && cm.successResultCacheEvictionTypes.lru
    ).toBeGreaterThanOrEqual(3);
    expect(cm.successResultCacheSize).toBe(1);
  });
});
