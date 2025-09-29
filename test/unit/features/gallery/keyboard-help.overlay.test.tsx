/** @jsxImportSource solid-js */
import { KeyboardHelpOverlay } from '@/features/gallery/components/KeyboardHelpOverlay/KeyboardHelpOverlay';
import { render, fireEvent } from '../../../utils/preact-testing-library';

describe('KeyboardHelpOverlay', () => {
  it('opens and closes with ESC and backdrop click', async () => {
    const onClose = vi.fn();
    const { getByRole, queryByRole, rerender, container, unmount } = render(
      <KeyboardHelpOverlay open onClose={onClose} />
    );

    const dialog = getByRole('dialog');
    expect(dialog).toBeTruthy();

    // ESC closes
    fireEvent.keyDown(globalThis.document as unknown as any, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    // Backdrop click closes (re-open with same instance)
    rerender(<KeyboardHelpOverlay open onClose={onClose} />);
    const backdrop = container.firstElementChild as unknown as any;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(2);

    // Closed state renders null
    unmount();

    const { queryByRole: queryWhenClosed } = render(
      <KeyboardHelpOverlay open={false} onClose={onClose} />
    );
    expect(queryWhenClosed('dialog')).toBeNull();
  });
});
