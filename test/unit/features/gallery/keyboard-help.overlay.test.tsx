import { sharedConfig } from 'solid-js';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@test/utils/testing-library';
import { getSolid } from '../../../../src/shared/external/vendors';
import { KeyboardHelpOverlay } from '../../../../src/features/gallery/components/KeyboardHelpOverlay/KeyboardHelpOverlay';

vi.mock('../../../../src/shared/hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({
    isActive: false,
    activate: vi.fn(),
    deactivate: vi.fn(),
  }),
}));

const { createSignal } = getSolid();

function resetSharedConfig(): void {
  Reflect.set(sharedConfig, 'context', undefined);
  Reflect.set(sharedConfig, 'registry', undefined);
}

describe.skip('KeyboardHelpOverlay', () => {
  // ⚠️ SKIPPED: Solid.js 반응성과 jsdom 제약
  //
  // 이슈:
  // - Solid.js의 fine-grained reactivity가 jsdom 환경에서 불안정
  // - signal props의 추적 및 갱신이 테스트 환경에서 제대로 작동하지 않음
  //
  // 대안:
  // - E2E 테스트에서 검증됨 (playwright/smoke/modals.spec.ts)
  // - 실제 브라우저에서 마운트/언마운트 및 ESC/backdrop 동작 확인
  //
  // 향후:
  // - E2E 커버리지가 충분하므로 이 테스트는 제거 검토
  // - 또는 개별 동작(포커스 트랩, 키보드 핸들러)을 단위 테스트로 분리

  it('opens and closes with ESC and backdrop click', async () => {
    resetSharedConfig();
    const [isOpen, setIsOpen] = createSignal(true);
    const onClose = vi.fn(() => {
      setIsOpen(false);
    });

    // Render with reactive prop access
    const { getByRole, queryByRole, container } = render(() => (
      <KeyboardHelpOverlay open={isOpen()} onClose={onClose} />
    ));

    // Dialog should be visible initially
    let dialog = getByRole('dialog');
    expect(dialog).toBeTruthy();

    // ESC closes
    fireEvent.keyDown(globalThis.document ?? window.document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    // Reopen
    setIsOpen(true);
    await waitFor(() => expect(getByRole('dialog')).toBeTruthy(), { timeout: 1000 });

    // Backdrop click closes
    const backdrop = container.firstElementChild as HTMLElement | null;
    expect(backdrop).toBeTruthy();
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(onClose).toHaveBeenCalledTimes(2);

    // Verify closed state - dialog should not be in DOM
    await waitFor(
      () => {
        const dialogElement = queryByRole('dialog');
        expect(dialogElement).toBeNull();
      },
      { timeout: 1000 }
    );
  });
});
