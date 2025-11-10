/**
 * @file MediaProcessor 텔레메트리(stage latency) GREEN 테스트
 */
/// <reference lib="dom" />
import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
// jsdom 환경 전제 선언
declare const document: any;

interface StageEventEntry {
  stage: string;
  count: number;
}

describe('MediaProcessor - Telemetry', () => {
  setupGlobalTestIsolation();

  it('단계별 진행 이벤트를 onStage 콜백으로 반환해야 한다', async () => {
    const { MediaProcessor } = await import('../../../src/shared/media/media-processor');
    const root = document.createElement('div');
    for (let i = 0; i < 3; i++) {
      const img = document.createElement('img');
      img.src = `https://example.com/${i}.jpg`;
      root.appendChild(img);
    }

    const processor = new MediaProcessor();
    const capturedEvents: StageEventEntry[] = [];
    const result: any = processor.process(root, {
      onStage: event => {
        capturedEvents.push({ stage: event.stage, count: event.count ?? 0 });
      },
    });

    expect(result.status).toBe('success');

    const expectedStages = ['collect', 'extract', 'normalize', 'dedupe', 'validate'];
    const emittedStages = capturedEvents
      .filter(entry => entry.stage !== 'complete')
      .map(entry => entry.stage);
    expect(emittedStages).toEqual(expectedStages);

    capturedEvents.forEach(entry => {
      expect(entry.count).toBeGreaterThanOrEqual(0);
    });
  });
});
