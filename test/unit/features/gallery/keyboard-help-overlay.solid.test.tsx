/**
 * KeyboardHelpOverlay Solid.js 버전 테스트
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@solidjs/testing-library';
import { getSolid } from '@shared/external/vendors';
import { KeyboardHelpOverlay } from '@/features/gallery/components/KeyboardHelpOverlay/KeyboardHelpOverlay';
import { renderWithVendorSolid as render } from '../../../utils/render-with-vendor-solid';

const { createSignal } = getSolid();

describe('KeyboardHelpOverlay (Solid)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should render dialog when open is true', () => {
    const onClose = vi.fn();

    render(() => <KeyboardHelpOverlay open={true} onClose={onClose} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('should not render when open is false', () => {
    const onClose = vi.fn();

    render(() => <KeyboardHelpOverlay open={false} onClose={onClose} />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should call onClose when ESC key is pressed', async () => {
    const onClose = vi.fn();

    render(() => <KeyboardHelpOverlay open={true} onClose={onClose} />);

    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn();

    const { container } = render(() => <KeyboardHelpOverlay open={true} onClose={onClose} />);

    const backdrop = container.firstElementChild as HTMLElement;
    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();

    render(() => <KeyboardHelpOverlay open={true} onClose={onClose} />);

    const closeButton = screen.getByTestId('kho-close-button');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should have correct ARIA attributes', () => {
    const onClose = vi.fn();

    render(() => <KeyboardHelpOverlay open={true} onClose={onClose} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
    expect(dialog.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('should reactively update when open prop changes', () => {
    const onClose = vi.fn();
    const [open, setOpen] = createSignal(true);

    render(() => <KeyboardHelpOverlay open={open()} onClose={onClose} />);

    expect(screen.getByRole('dialog')).toBeTruthy();

    setOpen(false);

    // Solid는 동기적으로 업데이트됨
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should display keyboard shortcuts list', () => {
    const onClose = vi.fn();

    render(() => <KeyboardHelpOverlay open={true} onClose={onClose} />);

    const list = screen.getByRole('list');
    expect(list).toBeTruthy();

    const items = screen.getAllByRole('listitem');
    expect(items.length).toBeGreaterThan(0);
  });
});
