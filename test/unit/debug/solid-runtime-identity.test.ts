import { describe, it, expect } from 'vitest';
import { getSolid } from '@shared/external/vendors';
import { createSignal as directCreateSignal } from 'solid-js';

describe('Solid runtime identity', () => {
  it('getSolid.createSignal should match solid-js imported createSignal', () => {
    const { createSignal } = getSolid();
    expect(createSignal).toBe(directCreateSignal);
  });
});
