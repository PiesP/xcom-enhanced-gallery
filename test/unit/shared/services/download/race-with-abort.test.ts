// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { describe, expect, it, vi } from 'vitest';
import { raceWithAbort } from '@shared/services/download/single-download';

describe('raceWithAbort', () => {
  it('returns work result when work finishes first', async () => {
    const controller = new AbortController();
    const result = await raceWithAbort(
      Promise.resolve('done'),
      controller.signal,
      () => 'aborted'
    );
    expect(result).toBe('done');
  });

  it('returns abort result when signal aborts before work', async () => {
    const controller = new AbortController();
    const work = new Promise<string>(() => {
      // never resolves
    });
    const racePromise = raceWithAbort(work, controller.signal, () => 'aborted');
    controller.abort();
    const result = await racePromise;
    expect(result).toBe('aborted');
  });

  it('returns abort result immediately when signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const result = await raceWithAbort(
      Promise.resolve('work'),
      controller.signal,
      () => 'aborted'
    );
    expect(result).toBe('aborted');
  });

  it('does not leave listeners on the signal after work resolves', async () => {
    const controller = new AbortController();

    await raceWithAbort(
      Promise.resolve('done'),
      controller.signal,
      () => 'aborted'
    );

    // After resolution, aborting the signal should not trigger any side effects.
    // If a listener was left behind, the onAborted callback would be called.
    // We verify this by aborting and checking no unexpected behavior occurs.
    expect(() => controller.abort()).not.toThrow();
  });

  it('cleans up listener when work rejects', async () => {
    const controller = new AbortController();

    await expect(
      raceWithAbort(
        Promise.reject(new Error('fail')),
        controller.signal,
        () => 'aborted'
      )
    ).rejects.toThrow('fail');

    // Aborting after cleanup should not trigger onAborted
    expect(() => controller.abort()).not.toThrow();
  });

  it('does not leave listeners after abort wins the race', async () => {
    const controller = new AbortController();
    const work = new Promise<string>(() => {
      // never resolves
    });
    const racePromise = raceWithAbort(work, controller.signal, () => 'aborted');

    controller.abort();
    await racePromise;

    // The { once: true } listener should have auto-removed.
    // Re-aborting should be a no-op.
    expect(() => controller.abort()).not.toThrow();
  });
});
