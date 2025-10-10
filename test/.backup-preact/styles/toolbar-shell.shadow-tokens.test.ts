import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('styles: ToolbarShell shadow token usage', () => {
  it('defines component-level shadow tokens and consumes them', () => {
    const cssPath = resolve(
      process.cwd(),
      'src/shared/components/ui/ToolbarShell/ToolbarShell.module.css'
    );
    const css = readFileSync(cssPath, 'utf8');

    // Must define component-level tokens
    expect(css).toMatch(/--xeg-toolbar-bg:/);
    expect(css).toMatch(/--xeg-toolbar-border:/);
    // Accept legacy or new component shadow token name
    expect(css).toMatch(/--xeg-(comp-)?toolbar-shadow:/);

    // Elevation classes must use the component shadow token (legacy or new)
    expect(css).toMatch(
      /\.toolbar-elevation-(low|medium|high)[\s\S]*box-shadow:\s*var\(--xeg-(comp-)?toolbar-shadow\)/
    );

    // Surface variants should consume component tokens
    expect(css).toMatch(
      /\.toolbar-surface-(glass|overlay)[\s\S]*background:\s*var\(--xeg-toolbar-bg\)/
    );
    expect(css).toMatch(
      /\.toolbar-surface-(glass|overlay)[\s\S]*border.*var\(--xeg-toolbar-border\)/
    );
  });
});
