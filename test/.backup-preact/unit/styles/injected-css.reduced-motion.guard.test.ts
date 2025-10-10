/**
 * @fileoverview Guard: Injected CSS must respect reduced motion
 */
import { describe, it, expect, beforeEach } from 'vitest';

describe('Injected CSS — reduced motion policy', () => {
  beforeEach(() => {
    // Clean up any previously injected styles
    const doc = globalThis.document;
    doc.querySelectorAll('style#xcom-animations').forEach(s => s.remove());
  });

  it('AnimationService CSS includes @media (prefers-reduced-motion: reduce)', async () => {
    const { AnimationService } = await import('@shared/services/AnimationService');
    const svc = AnimationService.getInstance();
    // trigger injection
    await svc.fadeIn(globalThis.document.createElement('div'));

    const style = globalThis.document.getElementById('xcom-animations');
    expect(style).not.toBeNull();
    const css = style && style.textContent ? style.textContent : '';

    // Must include reduced-motion media query
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);

    // In reduced-motion, animations/transitions should be disabled or minimized
    // We check for a simple signal: transition: none or animation: none within the block
    const reducedBlock = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\}/);
    expect(reducedBlock).not.toBeNull();
    if (reducedBlock) {
      expect(reducedBlock[0]).toMatch(/transition:\s*none|animation:\s*none/);
    }
  });
});
