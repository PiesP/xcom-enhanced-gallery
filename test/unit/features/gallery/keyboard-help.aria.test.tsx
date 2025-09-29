/** @jsxImportSource solid-js */
import { KeyboardHelpOverlay } from '@/features/gallery/components/KeyboardHelpOverlay/KeyboardHelpOverlay';
import { render } from '../../../utils/preact-testing-library';

describe('KeyboardHelpOverlay a11y', () => {
  it('has role=dialog and labelled/ described by title/desc', () => {
    const onClose = vi.fn();
    const { getByRole, getByText } = render(<KeyboardHelpOverlay open onClose={onClose} />);

    const dialog = getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    const title = getByText('Keyboard shortcuts');
    expect(title.id).toBeTruthy();

    const listItem = getByText('?: Show this help');
    expect(listItem).toBeTruthy();
  });
});
