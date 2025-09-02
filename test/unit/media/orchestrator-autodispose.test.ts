/* @ts-nocheck */
import { describe, it, expect, vi } from 'vitest';
import { createMediaExtractionOrchestrator } from '@/shared/services/media-extraction/orchestrator-factory';

// 단위: autoDispose 옵션이 orchestrator.dispose() 호출 시 내부 cache.dispose() 위임하는지

describe('MediaExtractionOrchestrator autoDispose lifecycle', () => {
  it('autoDispose=true 면 orchestrator.dispose() 호출 시 cache.dispose() 호출', () => {
    const disposeSpy = vi.fn();
    const fakeCache = { dispose: disposeSpy } as any;
    const orch = createMediaExtractionOrchestrator({ cache: fakeCache, autoDispose: true });
    expect(typeof (orch as any).dispose).toBe('function');
    (orch as any).dispose();
    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });

  it('autoDispose=false(default) 면 dispose 미제공', () => {
    const fakeCache = { dispose: vi.fn() } as any;
    const orch = createMediaExtractionOrchestrator({ cache: fakeCache });
    expect((orch as any).dispose).toBeUndefined();
  });
});
