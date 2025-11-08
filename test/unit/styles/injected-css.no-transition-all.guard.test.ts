/**
 * @fileoverview Guard: Injected CSS must not use `transition: all`
 * Rationale: limit to explicit properties for performance and predictability.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';

describe('Injected CSS — forbid transition: all', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    const doc = globalThis.document;
    doc.querySelectorAll('style#xcom-animations').forEach(s => s.remove());
  });

  it('AnimationService CSS should not include transition: all', async () => {
    const { AnimationService } = await import('@shared/services/animation-service');
    const svc = AnimationService.getInstance();
    await svc.fadeIn(globalThis.document.createElement('div'));

    const style = globalThis.document.getElementById('xcom-animations');
    expect(style).not.toBeNull();
    const css = style && style.textContent ? style.textContent : '';

    const cssNoVars = css.replace(/var\([^)]*\)/g, '');
    expect(cssNoVars).not.toMatch(/transition\s*:\s*all\b/);
  });
});
