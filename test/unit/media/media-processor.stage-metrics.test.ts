import { describe, it, expect, vi } from 'vitest';
import MediaProcessor, { type MediaProcessStageEvent } from '@/shared/media/media-processor';

function makeDom(html: string) {
  const container = document.createElement('div');
  container.id = 'root';
  container.innerHTML = html;
  return container;
}

describe('MediaProcessor stage metrics', () => {
  it('calls onStage with stageMs and totalMs when telemetry=true', () => {
    const root = makeDom('<img src="https://pbs.twimg.com/media/a.jpg" />');
    const onStage = vi.fn<(event: MediaProcessStageEvent) => void>();
    const processor = new MediaProcessor();

    // act
    const result = processor.process(root, { stage: 'collect', onStage, telemetry: true });

    // assert
    expect(onStage).toHaveBeenCalled();
    const calls = onStage.mock.calls.map(([event]) => event);

    // should include all stages and complete
    const stages = calls.map(c => c.stage);
    expect(stages).toEqual(
      expect.arrayContaining(['collect', 'extract', 'normalize', 'dedupe', 'validate', 'complete'])
    );

    // verify metrics presence when telemetry enabled
    for (const evt of calls) {
      expect(evt).toHaveProperty('count');
      expect(evt).toHaveProperty('stageMs');
      expect(evt).toHaveProperty('totalMs');
      if (typeof evt.stageMs === 'number') expect(evt.stageMs).toBeGreaterThanOrEqual(0);
      if (typeof evt.totalMs === 'number') expect(evt.totalMs).toBeGreaterThanOrEqual(0);
    }

    // result should still be standard Result shape with optional telemetry array
    expect(result).toHaveProperty('success');
    if ((result as any).telemetry) {
      const telemetry = (result as any).telemetry as Array<{
        stage: string;
        count: number;
        duration: number;
      }>;
      expect(Array.isArray(telemetry)).toBe(true);
      expect(telemetry.length).toBeGreaterThan(0);
      for (const t of telemetry) {
        expect(typeof t.duration).toBe('number');
        expect(t.duration).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
