/** @jsxImportSource solid-js */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup, screen } from '@solidjs/testing-library';
import { createSignal, onCleanup } from 'solid-js';

import { ModalShell } from '@shared/components/ui/ModalShell';

describe('ModalShell accessibility - focus trap and semantics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('renders dialog with aria-modal and traps focus between first/last', async () => {
    const onClose = vi.fn();

    render(() => (
      <ModalShell isOpen onClose={onClose} aria-label='Test Modal' data-testid='test-modal'>
        <div>
          <button id='first' aria-label='first'>
            First
          </button>
          <input id='mid' type='text' />
          <button id='last' aria-label='last'>
            Last
          </button>
        </div>
      </ModalShell>
    ));

    vi.runAllTimers();

    const dialog = (await screen.findByRole('dialog')) as HTMLElement;
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    const first = dialog.querySelector('#first') as HTMLElement;
    const last = dialog.querySelector('#last') as HTMLElement;
    expect(first).toBeTruthy();
    expect(last).toBeTruthy();

    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    first.focus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('Escape restores focus and calls onClose when enabled', async () => {
    const onClose = vi.fn();
    const opener = document.createElement('button');
    opener.id = 'opener';
    document.body.appendChild(opener);
    opener.focus();

    let setOpen!: (value: boolean) => void;

    render(() => {
      const [open, set] = createSignal(true);
      setOpen = set;

      onCleanup(() => {
        opener.remove();
      });

      return (
        <ModalShell
          isOpen={open()}
          onClose={onClose}
          aria-label='Test Modal'
          data-testid='test-modal'
        >
          <div>
            <button id='first'>First</button>
            <button id='last'>Last</button>
          </div>
        </ModalShell>
      );
    });

    vi.runAllTimers();

    // 모달 내부 요소에서 Escape 키 발생 (handleKeyDown은 containerRef.contains 체크)
    const dialog = await screen.findByRole('dialog');
    const firstButton = dialog.querySelector('#first') as HTMLElement;
    expect(firstButton).toBeTruthy();

    fireEvent.keyDown(firstButton, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);

    setOpen(false);
    vi.runAllTimers();
    await Promise.resolve();

    expect(document.activeElement && (document.activeElement as HTMLElement).id).toBe('opener');
  });
});
