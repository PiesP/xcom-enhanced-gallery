import { describe, it, expect } from 'vitest';
import { getSolid } from '@shared/external/vendors';
import { createSignal as directCreateSignal } from 'solid-js';

describe('getSolid identity', () => {
  it('returns same createSignal function as solid-js direct import', () => {
    const { createSignal } = getSolid();
    expect(createSignal === directCreateSignal).toBe(true);
  });
});
