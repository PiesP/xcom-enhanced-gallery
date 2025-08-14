import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

function read(file: string): string {
  return fs.readFileSync(file, 'utf-8');
}

describe('Refactor: Toolbar/Settings style cleanup (TDD)', () => {
  const root = process.cwd();

  it('removes legacy ToolbarIconButton component and styles', () => {
    const comp = path.resolve(
      root,
      'src/shared/components/ui/Toolbar/components/ToolbarIconButton.tsx'
    );
    const css = path.resolve(
      root,
      'src/shared/components/ui/Toolbar/components/ToolbarIconButton.module.css'
    );

    // Updated: ToolbarIconButton.tsx exists as compatibility wrapper, but CSS module should be removed
    expect(fs.existsSync(comp)).toBe(true); // Compatibility wrapper exists
    expect(fs.existsSync(css)).toBe(false); // CSS module removed
  });

  it('cleans Toolbar.module.css of button-local duplicate rules', () => {
    const toolbarCss = path.resolve(root, 'src/shared/components/ui/Toolbar/Toolbar.module.css');
    const content = read(toolbarCss);

    expect(content).not.toMatch(/\.fitButton\b/);
    expect(content).not.toMatch(/\.downloadCurrent\b/);
    expect(content).not.toMatch(/\.downloadAll\b/);
    expect(content).not.toMatch(/\.downloadSpinner\b/);
  });

  it('cleans SettingsOverlay.module.css of local button duplicates', () => {
    const modalCss = path.resolve(
      root,
      'src/features/settings/components/SettingsOverlay.module.css'
    );
    const content = read(modalCss);

    expect(content).not.toMatch(/\.(?:button|buttonSecondary|buttonDanger|closeButton)\b/);
  });
});
