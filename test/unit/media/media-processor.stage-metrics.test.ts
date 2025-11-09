import { describe, it, expect, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import type { MediaProcessStageEvent } from '../../../src/shared/media/media-processor.ts';

function makeDom(html: string) {
  const container = document.createElement('div');
  container.id = 'root';
  container.innerHTML = html;
  return container;
}

describe('MediaProcessor stage metrics', () => {
  setupGlobalTestIsolation();

  it('emits progress events for each stage', async () => {
    const root = makeDom('<img src="https://pbs.twimg.com/media/a.jpg" />');
    const onStage = vi.fn<(event: MediaProcessStageEvent) => void>();
    const { MediaProcessor } = await import('../../../src/shared/media/media-processor.ts');
    const processor = new MediaProcessor();

    // act
    const result = processor.process(root, { onStage });

    // assert
    expect(onStage).toHaveBeenCalled();
    const calls = onStage.mock.calls.map(([event]) => event);

    // should include all stages and complete
    const stages = calls.map(c => c.stage);
    expect(stages).toEqual(
      expect.arrayContaining(['collect', 'extract', 'normalize', 'dedupe', 'validate', 'complete'])
    );

    for (const evt of calls) {
      if (evt.count !== undefined) {
        expect(typeof evt.count).toBe('number');
        expect(evt.count).toBeGreaterThanOrEqual(0);
      }
      expect('stageMs' in evt).toBe(false);
      expect('totalMs' in evt).toBe(false);
    }

    expect(result).toHaveProperty('status');
  });
});
