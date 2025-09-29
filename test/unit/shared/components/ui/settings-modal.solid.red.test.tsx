/**
 * @fileoverview RED test for Solid SettingsModal implementation
 * @description Drives FRAME-ALT-001 Stage D Phase 2 shared UI migration.
 */

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';

vi.mock('@shared/components/ui/SettingsModal/SettingsModal.module.css', () => ({
  default: new Proxy(
    {},
    {
      get: (_target, key: string) => key,
    }
  ),
}));

vi.mock('@shared/styles/primitives.module.css', () => ({
  default: new Proxy(
    {},
    {
      get: (_target, key: string) => key,
    }
  ),
}));

describe('SettingsModal Solid port (RED)', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value:
        window.matchMedia ||
        vi.fn().mockImplementation((query: string) => ({
          matches: query.includes('dark') ? false : true,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders controls and handles close interaction using Solid renderer', async () => {
    const { SettingsModal } = await import('@shared/components/ui/SettingsModal/SettingsModal');

    const handleClose = vi.fn();

    render(() => (
      <SettingsModal
        isOpen={true}
        onClose={handleClose}
        mode='panel'
        position='toolbar-below'
        data-testid='solid-settings-modal'
      />
    ));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('data-testid', 'solid-settings-modal');

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const themeLabel = screen.getByText(/theme/i);
    expect(themeLabel).toBeInTheDocument();

    const languageSelect = screen.getByLabelText(/language/i);
    expect(languageSelect).toBeInstanceOf(HTMLElement);
    expect((languageSelect as HTMLElement).tagName).toBe('SELECT');
  });
});
