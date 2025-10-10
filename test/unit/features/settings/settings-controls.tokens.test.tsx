/**
 * @fileoverview SettingsModal controls token/focus consistency tests (A4)
 */
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import { cleanup, render, screen } from '../../../utils/testing-library';
import { initializeVendors } from '@shared/external/vendors';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';

const noop = () => {};

const renderModal = () => render(() => <SettingsModal isOpen={true} onClose={noop} />);

describe('SettingsModal — tokenized styling and focus ring consistency', () => {
  const cssPath = resolve(cwd(), 'src/shared/components/ui/SettingsModal/SettingsModal.module.css');
  const css = readFileSync(cssPath, 'utf-8');

  afterEach(() => {
    cleanup();
  });

  it('uses semantic modal tokens for background/border', () => {
    expect(css).toContain('background: var(--xeg-modal-bg)');
    expect(css).toContain('border: 1px solid var(--xeg-modal-border)');
  });

  it('select and closeButton use focus ring tokens', () => {
    expect(css).toMatch(/:focus-visible\s*{[^}]*outline: var\(--xeg-focus-ring\)/m);
    expect(css).toMatch(/:focus-visible\s*{[^}]*outline-offset: var\(--xeg-focus-ring-offset\)/m);
  });

  it('runtime: close button is present and labeled, selects have classes', async () => {
    await initializeVendors();
    renderModal();

    const closeBtn = screen.getByLabelText('Close');
    expect(closeBtn).toBeDefined();

    const themeSelect = screen.getByLabelText('Theme');
    expect(themeSelect.className).toContain('select');
  });
});
