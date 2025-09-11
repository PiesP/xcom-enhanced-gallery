/**
 * @fileoverview Runtime injected CSS must use design tokens only
 * - No hardcoded durations (e.g., 200ms, 0.2s) in injected styles
 * - No raw easing functions (cubic-bezier, ease-in/out) in injected styles
 * - Must prefer standard easing tokens (e.g., --xeg-ease-standard / accelerate / decelerate)
 */
import { describe, it, expect, beforeEach } from 'vitest';

describe('Injected CSS Token Policy', () => {
  beforeEach(() => {
    // Clean up any previously injected styles
    const doc = globalThis.document;
    doc
      .querySelectorAll('style#xcom-gallery-animations, style#xcom-animations')
      .forEach(s => s.remove());
  });

  it('css-animations inject uses only duration/easing tokens and standard easing names', async () => {
    const { injectAnimationStyles } = await import('@shared/utils/css-animations');
    injectAnimationStyles();

    const doc = globalThis.document;
    const style = doc.getElementById('xcom-gallery-animations');
    expect(style).not.toBeNull();
    const css = style && style.textContent ? style.textContent : '';

    // No hardcoded duration values in rules (e.g., 150ms, 0.2s)
    const hardcodedDurations = css.match(/\b\d+(?:\.\d+)?m?s\b/g) || [];
    expect(hardcodedDurations.length).toBe(0);

    // No raw easing functions in injected CSS (ignore var(...) references)
    const cssNoVars = css.replace(/var\([^)]*\)/g, '');
    expect(cssNoVars).not.toMatch(/cubic-bezier\(/);
    expect(cssNoVars).not.toMatch(/\bease(?:-in|-out|-in-out)?\b/);

    // Must use standard easing tokens and not legacy easing variable names
    expect(css).toMatch(/var\(--xeg-(?:ease-standard|ease-accelerate|ease-decelerate)\)/);
    expect(css).not.toMatch(/var\(--xeg-easing-(?:ease-in|ease-out|ease-in-out)\)/);
  });

  it('AnimationService inject uses only duration/easing tokens', async () => {
    const { AnimationService } = await import('@shared/services/AnimationService');
    const svc = AnimationService.getInstance();
    // Trigger style injection via any public method
    const doc2 = globalThis.document;
    await svc.fadeIn(doc2.createElement('div'));

    const style = doc2.getElementById('xcom-animations');
    expect(style).not.toBeNull();
    const css = style && style.textContent ? style.textContent : '';

    // No hardcoded duration values in rules
    const hardcodedDurations = css.match(/\b\d+(?:\.\d+)?m?s\b/g) || [];
    expect(hardcodedDurations.length).toBe(0);

    // No raw easing functions in injected CSS (ignore var(...) references)
    const cssNoVars = css.replace(/var\([^)]*\)/g, '');
    expect(cssNoVars).not.toMatch(/cubic-bezier\(/);
    expect(cssNoVars).not.toMatch(/\bease(?:-in|-out|-in-out)?\b/);

    // Must use standard easing tokens
    expect(css).toMatch(/var\(--xeg-(?:ease-standard|ease-accelerate|ease-decelerate)\)/);
  });
});
