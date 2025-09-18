/**
 * Viewport-weighted prefetch ordering and concurrency queue draining
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { MediaService } from '@/shared/services/MediaService';

describe('viewport-weighted prefetch', () => {
  let svc: MediaService;

  beforeEach(() => {
    svc = MediaService.getInstance();
    // Prevent real network
    // @ts-expect-error private access in test by design
    vi.spyOn(svc as any, 'prefetchSingle').mockImplementation(async (url: string) => {
      return Promise.resolve();
    });
  });

  it('orders prefetch URLs by distance from current, preferring next-side first', async () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const currentIndex = 2; // 'c'
    const range = 2;

    const calls: string[] = [];
    // capture order
    // @ts-expect-error private access in test by design
    (svc as any).prefetchSingle.mockImplementation(async (url: string) => {
      calls.push(url);
      return Promise.resolve();
    });

    await svc.prefetchNextMedia(items, currentIndex, {
      prefetchRange: range,
      maxConcurrent: 4, // schedule all immediately to preserve call order
      schedule: 'immediate',
    });

    // Expected distance-order, prefer next first when equal distance
    // neighbors: right: d(3), left: b(1), right: e(4), left: a(0)
    expect(calls).toEqual(['d', 'b', 'e', 'a']);
  });

  it('drains entire queue even when maxConcurrent=1', async () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const currentIndex = 2;
    const range = 2;

    const calls: string[] = [];
    // mock with micro delays to simulate async completion
    // @ts-expect-error private access in test by design
    (svc as any).prefetchSingle.mockImplementation(async (url: string) => {
      calls.push(url);
      await new Promise(r => setTimeout(r, 0));
      return;
    });

    await svc.prefetchNextMedia(items, currentIndex, {
      prefetchRange: range,
      maxConcurrent: 1,
      schedule: 'immediate',
    });

    expect(calls.length).toBe(4);
    expect(calls[0]).toBe('d');
  });
});
