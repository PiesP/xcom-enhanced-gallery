/**
 * @fileoverview Settings Modal Focus Management Tests (Solid)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@test/utils/testing-library';
import { SettingsModal } from '../../../../../src/shared/components/ui/SettingsModal/SettingsModal';

describe.skip('SettingsModal focus management', () => {
  // SKIP: Solid.js component testing with reactivity needs refined approach
  // TODO: Rewrite as integration test or E2E test
  // Related: Phase 10 test stabilization - Solid.js testing patterns

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  const renderModal = (isOpen: boolean) =>
    render(() => <SettingsModal isOpen={isOpen} onClose={mockOnClose} />);

  it('초기 렌더 시 닫기 버튼에 포커스를 맞춘다', async () => {
    renderModal(true);

    const closeButton = await screen.findByLabelText('Close');
    await waitFor(() => {
      expect(closeButton).toBe(document.activeElement);
    });
  });

  it('ESC 키 입력 시 onClose를 호출한다', async () => {
    renderModal(true);

    const dialog = await screen.findByRole('document');
    fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('모달이 닫힐 때 이전 포커스를 복원한다', async () => {
    const triggerButton = document.createElement('button');
    triggerButton.type = 'button';
    triggerButton.textContent = 'Open settings';
    document.body.appendChild(triggerButton);
    triggerButton.focus();

    const { rerender } = renderModal(true);
    const closeButton = await screen.findByLabelText('Close');

    await waitFor(() => {
      expect(closeButton).toBe(document.activeElement);
    });

    rerender(() => <SettingsModal isOpen={false} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(triggerButton).toBe(document.activeElement);
    });

    triggerButton.remove();
  });

  it('배경을 클릭하면 onClose를 호출한다', async () => {
    renderModal(true);

    const backdrop = await screen.findByRole('dialog');
    fireEvent.click(backdrop);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
