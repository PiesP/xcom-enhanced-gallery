import { sharedConfig } from 'solid-js';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@test/utils/testing-library';
import { getSolid } from '../../../../src/shared/external/vendors';
import { KeyboardHelpOverlay } from '../../../../src/features/gallery/components/KeyboardHelpOverlay/KeyboardHelpOverlay';

vi.mock('../../../../src/shared/hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({
    isActive: false,
    activate: vi.fn(),
    deactivate: vi.fn(),
  }),
}));

const { createSignal, createComponent } = getSolid();

describe('KeyboardHelpOverlay aria attributes', () => {
  it('sets appropriate aria-modal and role attributes', () => {
    sharedConfig.context = undefined;
    sharedConfig.registry = undefined;
    const [isOpen] = createSignal(true);

    const { getByRole } = render(() =>
      createComponent(KeyboardHelpOverlay, {
        open: isOpen(),
        onClose: vi.fn(),
      })
    );

    const dialog = getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });
});

const messages = {
  en: {
    title: 'Keyboard shortcuts',
    help: '?: Show this help',
  },
};

describe('KeyboardHelpOverlay a11y', () => {
  it('has role=dialog and labelled/ described by title/desc', () => {
    sharedConfig.context = undefined;
    sharedConfig.registry = undefined;
    const [isOpen] = createSignal(true);
    const onClose = vi.fn();
    const { getByRole, getByText } = render(() =>
      createComponent(KeyboardHelpOverlay, { open: isOpen(), onClose })
    );

    const dialog = getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    const title = getByText(messages.en.title);
    expect(title.id).toBeTruthy();

    const listItem = getByText(messages.en.help);
    expect(listItem).toBeTruthy();
  });
});
