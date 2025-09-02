import { describe, it, expect, vi } from 'vitest';
import { createMediaExtractionOrchestrator } from '@/shared/services/media-extraction/orchestrator-factory';

describe('MediaExtractionOrchestrator autoDispose lifecycle', () => {
  it('autoDispose=true: orchestrator.dispose() calls cache.dispose()', () => {
    const disposeSpy = vi.fn();
    const fakeCache = { dispose: disposeSpy };
    const orch = createMediaExtractionOrchestrator({ cache: fakeCache, autoDispose: true });
    expect(typeof orch.dispose).toBe('function');
    orch.dispose();
    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });

  it('autoDispose=false: dispose not attached', () => {
    const disposeSpy = vi.fn();
    const fakeCache = { dispose: disposeSpy };
    const orch = createMediaExtractionOrchestrator({ cache: fakeCache });
    expect(orch.dispose).toBeUndefined();
  });
});
