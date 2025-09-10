import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const TOKENS_CSS = 'src/shared/styles/design-tokens.css';

function read(path) {
  return readFileSync(path, 'utf-8');
}

describe('Theme coverage: glass surface tokens', () => {
  it('defines base glass surface tokens at :root', () => {
    const css = read(TOKENS_CSS);
    const rootSection = css;
    expect(rootSection).toContain('--xeg-surface-glass-bg:');
    expect(rootSection).toContain('--xeg-surface-glass-border:');
    expect(rootSection).toContain('--xeg-surface-glass-shadow:');
  });

  it('overrides glass tokens for [data-theme=light] and [data-theme=dark]', () => {
    const css = read(TOKENS_CSS);
    const light = css.match(/\[data-theme='light'\][\s\S]*?\}/)?.[0] || '';
    const dark = css.match(/\[data-theme='dark'\][\s\S]*?\}/)?.[0] || '';
    expect(light).toContain('--xeg-surface-glass-bg:');
    expect(light).toContain('--xeg-surface-glass-border:');
    expect(light).toContain('--xeg-surface-glass-shadow:');
    expect(dark).toContain('--xeg-surface-glass-bg:');
    expect(dark).toContain('--xeg-surface-glass-border:');
    expect(dark).toContain('--xeg-surface-glass-shadow:');
  });

  it('provides system fallback via prefers-color-scheme: dark', () => {
    const css = read(TOKENS_CSS);
    const systemDark = css.match(/@media \(prefers-color-scheme: dark\)[\s\S]*?\}/)?.[0] || '';
    expect(systemDark).toContain('--xeg-surface-glass-bg:');
    expect(systemDark).toContain('--xeg-surface-glass-border:');
    expect(systemDark).toContain('--xeg-surface-glass-shadow:');
  });
});
