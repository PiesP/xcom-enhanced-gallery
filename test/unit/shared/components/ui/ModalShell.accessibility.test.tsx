import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/preact';
import { getPreact, initializeVendors } from '@shared/external/vendors';
import { ModalShell } from '@shared/components/ui/ModalShell/ModalShell';

describe('ModalShell accessibility - focus trap and semantics', () => {
  const { h } = getPreact();

  beforeEach(() => {
    initializeVendors();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('renders dialog with aria-modal and traps focus between first/last', () => {
    const onClose = vi.fn();
    const result = render(
      h(
        ModalShell as any,
        {
          isOpen: true,
          onClose,
          'aria-label': 'Test Modal',
        },
        h('div', {}, [
          h('button', { id: 'first', 'aria-label': 'first' }, 'First'),
          h('input', { id: 'mid', type: 'text' }),
          h('button', { id: 'last', 'aria-label': 'last' }, 'Last'),
        ])
      )
    );

    const dialog = result.container.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).toBeTruthy();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');

    // Initial focus should land on the first focusable
    const first = result.container.querySelector('#first') as HTMLElement;
    const last = result.container.querySelector('#last') as HTMLElement;
    expect(first).toBeTruthy();
    expect(last).toBeTruthy();

    // Move focus to last and Tab should cycle to first
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    // Shift+Tab from first should cycle to last
    first.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('Escape restores focus and calls onClose when enabled', async () => {
    const onClose = vi.fn();
    const opener = document.createElement('button');
    opener.id = 'opener';
    document.body.appendChild(opener);
    opener.focus();

    render(
      h(
        ModalShell as any,
        {
          isOpen: true,
          onClose,
          'aria-label': 'Test Modal',
        },
        h('div', {}, [h('button', { id: 'first' }, 'First'), h('button', { id: 'last' }, 'Last')])
      )
    );

    // Press Escape on document to trigger hook
    fireEvent.keyDown(document, { key: 'Escape' });

    // onClose should be called and focus should be restored to opener eventually
    expect(onClose).toHaveBeenCalledTimes(1);

    // The hook retries focus restore; wait a short period
    await new Promise(r => setTimeout(r, 20));
    expect(document.activeElement && (document.activeElement as HTMLElement).id).toBe('opener');
  });
});
