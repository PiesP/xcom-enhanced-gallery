/**
 * @file RED: MediaProcessor 진행률/단계 옵저버 테스트
 */
/// <reference lib="dom" />
/* eslint-env browser */
import { describe, it, expect } from 'vitest';

interface StageEventCapture {
  stage: string;
  count?: number;
}

describe('MediaProcessor - 진행률 옵저버 (RED)', () => {
  it('파이프라인 단계 순서대로 stage 이벤트를 방출해야 한다', async () => {
    const { MediaProcessor } = await import('@shared/media/MediaProcessor');

    const root = document.createElement('div');
    const img1 = document.createElement('img');
    img1.src = 'https://example.com/a.jpg';
    const img2 = document.createElement('img');
    img2.src = 'https://example.com/b.jpg';
    root.appendChild(img1);
    root.appendChild(img2);

    const stages: StageEventCapture[] = [];

    const processor = new MediaProcessor();
    const result = (processor as any).process(root, {
      onStage: (e: any) => {
        stages.push({ stage: e.stage, count: e.count });
      },
    });

    // 기본 결과는 여전히 성공이어야 한다
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);

    // 기대되는 단계 시퀀스
    const expectedSequence = ['collect', 'extract', 'normalize', 'dedupe', 'validate', 'complete'];
    const receivedSequence = stages.map(s => s.stage);

    // RED: 아직 구현 전이므로 실패 기대. 구현 후 GREEN 전환.
    expect(receivedSequence).toEqual(expectedSequence);

    // 각 단계 count가 0 이상이어야 함 (마지막 complete는 최종 개수)
    for (const s of stages) {
      if (typeof s.count !== 'undefined') {
        expect(s.count).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
