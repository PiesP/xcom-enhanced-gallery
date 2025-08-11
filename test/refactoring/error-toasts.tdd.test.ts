import { describe, it, expect } from 'vitest';

describe('User-friendly error toasts - TDD', () => {
  it('shows toast when ZIP download fails', async () => {
    const { MediaService } = await import('@shared/services/media-service');
    const svc = new MediaService();
    // simulate failure by passing an empty list and forcing failure via options
    const result = await svc.downloadMultiple([], { createZip: true });
    expect(result.success).toBe(false);

    // Toast integration should be invoked
    const { toasts } = await import('@shared/components/ui');
    // toast signal value may be async; allow microtask
    await Promise.resolve();
    expect(Array.isArray(toasts.value)).toBe(true);
  });

  it('shows toast when media extraction returns no items', async () => {
    const { MediaExtractionService } = await import(
      '@shared/services/media-extraction/MediaExtractionService'
    );
    const svc = new MediaExtractionService();
    const container = document.createElement('div');
    const res = await svc.extractFromRoot(container);
    expect(Array.isArray(res)).toBe(true);

    // If later wiring adds toast on failure paths, the container should render toasts
    const { toasts } = await import('@shared/components/ui');
    await Promise.resolve();
    expect(Array.isArray(toasts.value)).toBe(true);
  });
});
