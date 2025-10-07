/**
 * @fileoverview SettingsModal controls token/focus consistency tests (A4)
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import { screen, cleanup } from '@solidjs/testing-library';
import { render } from '@solidjs/testing-library';
import { SettingsModal } from '../../../../src/shared/components/ui/SettingsModal/SettingsModal';

describe('SettingsModal — tokenized styling and focus ring consistency', () => {
  const cssPath = resolve(cwd(), 'src/shared/components/ui/SettingsModal/SettingsModal.module.css');
  const css = readFileSync(cssPath, 'utf-8');

  it('uses semantic modal tokens for background/border', () => {
    expect(css).toContain('background: var(--xeg-modal-bg)');
    expect(css).toContain('border: 1px solid var(--xeg-modal-border)');
  });

  it('select and closeButton use focus ring tokens', () => {
    expect(css).toMatch(/:focus-visible\s*{[^}]*outline: var\(--xeg-focus-ring\)/m);
    expect(css).toMatch(/:focus-visible\s*{[^}]*outline-offset: var\(--xeg-focus-ring-offset\)/m);
  });

  it('runtime: close button is present and labeled, selects have classes', () => {
    try {
      render(() => <SettingsModal isOpen={true} onClose={() => void 0} />);
      const closeBtn = screen.getByLabelText('Close');
      expect(closeBtn).toBeDefined();
      const themeSelect = screen.getByLabelText('Theme');
      expect(themeSelect.className).toContain('select');
    } finally {
      cleanup();
    }
  });
});
