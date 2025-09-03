import { describe, it, expect } from 'vitest';
import { FallbackStrategy } from '@shared/services/media-extraction/strategies/fallback/FallbackStrategy';

/**
 * GREEN: Background image heuristic tie-break (DPR-aware)
 * 동일 qualityRank & 동일 inferredPixels → 더 높은 DPR(@2x/@3x/dpr=) 우선.
 */

describe('Heuristic v3.1+: background image DPR tie-break', () => {
  it('prefers @2x over same-rank non-@2x', () => {
    const strat: any = new FallbackStrategy();
    const base = 'https://pbs.twimg.com/media/IMG_1200x800';
    const urls = [
      `${base}?name=large`, // index 0
      `${base}@2x?name=large`, // index 1 - expected
      `${base}?name=large&v=2`, // index 2
    ];
    const cssBg = urls.map(u => `url("${u}")`).join(', ');
    const result = strat.selectBestBackgroundImageUrl(cssBg);
    expect(result?.url).toBe(urls[1]);
  });
});
