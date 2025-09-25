import { describe, it, expect } from 'vitest';
import { Buffer } from 'node:buffer';

const CSS_BUDGET_BYTES = 70 * 1024; // 70 KiB upper bound

describe('[REF-LITE-V3][Stage2] global CSS budget guard', () => {
  it('prod bundle CSS text should not exceed budget', () => {
    const cssText = (globalThis as { XEG_CSS_TEXT?: string }).XEG_CSS_TEXT;

    expect(cssText, 'window.XEG_CSS_TEXT must be defined by the userscript bundle').toBeTypeOf(
      'string'
    );

    const byteLength = Buffer.byteLength(cssText ?? '', 'utf8');

    expect(byteLength).toBeLessThanOrEqual(CSS_BUDGET_BYTES);
  });
});
