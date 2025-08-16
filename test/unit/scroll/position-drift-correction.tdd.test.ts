import { describe, it, expect } from 'vitest';
import { timelineStabilizer } from '@shared/scroll/timeline-position-stabilizer';

describe('[scroll][stabilizer] position drift correction minimal smoke', () => {
  it('detectPositionDrift returns positive when actual below expected', () => {
    const el: any = { getBoundingClientRect: () => ({ top: 120 }) };
    const drift = timelineStabilizer.detectPositionDrift(el, 100);
    expect(drift).toBe(20);
  });
});
