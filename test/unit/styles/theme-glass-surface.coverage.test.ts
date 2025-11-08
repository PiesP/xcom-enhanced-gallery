import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { readFileSync } from 'node:fs';

const SEMANTIC_CSS = 'src/shared/styles/design-tokens.semantic.css';

function read(path) {
  return readFileSync(path, 'utf-8');
}

describe('Theme coverage: glass surface tokens', () => {
  setupGlobalTestIsolation();

  it('defines base glass surface tokens at :root', () => {
    const css = read(SEMANTIC_CSS);
    const rootSection = css;
    expect(rootSection).toContain('--xeg-surface-glass-bg:');
    expect(rootSection).toContain('--xeg-surface-glass-border:');
    expect(rootSection).toContain('--xeg-surface-glass-shadow:');
  });

  it('overrides glass tokens for [data-theme=light] and [data-theme=dark]', () => {
    const css = read(SEMANTIC_CSS);
    // 마지막 [data-theme] 블록 2개를 찾음 (glass tokens 정의에 해당)
    const allLight = css.match(/\[data-theme='light'\][\s\S]*?\}/g);
    const allDark = css.match(/\[data-theme='dark'\][\s\S]*?\}/g);
    const light = allLight?.[allLight.length - 1] || '';
    const dark = allDark?.[allDark.length - 1] || '';
    expect(light).toContain('--xeg-surface-glass-bg:');
    expect(light).toContain('--xeg-surface-glass-border:');
    expect(light).toContain('--xeg-surface-glass-shadow:');
    expect(dark).toContain('--xeg-surface-glass-bg:');
    expect(dark).toContain('--xeg-surface-glass-border:');
    expect(dark).toContain('--xeg-surface-glass-shadow:');
  });

  it('provides system fallback via prefers-color-scheme: dark', () => {
    const css = read(SEMANTIC_CSS);
    // 마지막 @media(prefers-color-scheme: dark) 블록을 찾음
    // (glass tokens 정의에 해당하는 것)
    const matches = css.match(/@media \(prefers-color-scheme: dark\)[\s\S]*?\}/g);
    const systemDark = matches?.[matches.length - 1] || '';
    expect(systemDark).toContain('--xeg-surface-glass-bg:');
    expect(systemDark).toContain('--xeg-surface-glass-border:');
    expect(systemDark).toContain('--xeg-surface-glass-shadow:');
  });
});
