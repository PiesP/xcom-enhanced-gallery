/**
 * @file MediaProcessor 진행률/단계 옵저버 GREEN 테스트
 */
/// <reference lib="dom" />
import { describe, it, expect } from 'vitest';

interface StageEventCapture {
  stage: string;
  count?: number;
}

describe('MediaProcessor - 진행률 옵저버', () => {
  it('파이프라인 단계 순서대로 stage 이벤트를 방출해야 한다', async () => {
    const { MediaProcessor } = await import('@shared/media/media-processor');

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
      onStage: (e: any) => stages.push({ stage: e.stage, count: e.count }),
    });

    expect(result.success).toBe(true);

    const expectedSequence = ['collect', 'extract', 'normalize', 'dedupe', 'validate', 'complete'];
    const receivedSequence = stages.map(s => s.stage);
    expect(receivedSequence).toEqual(expectedSequence);

    for (const s of stages) {
      if (typeof s.count !== 'undefined') {
        expect(s.count).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
