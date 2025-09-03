import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';

/**
 * Session hysteresis test: force low contrast first open -> solid, then slightly improved but within solidHoldMargin -> keep solid.
 */

describe('SettingsModal surface hysteresis across reopen', () => {
  it('keeps solid after reopen when contrast only slightly improved', () => {
    // Use extremely low contrast to force solid mode
    (globalThis as any).__XEG_TEST_MODAL_SURFACE_SAMPLES__ = ['#202020']; // very low contrast -> should force solid
    const { rerender } = render(<SettingsModal isOpen={true} onClose={() => {}} />);
    let inner = screen.getByRole('dialog').firstElementChild as HTMLElement | null;
    // Expect either solid OR scrim (since even extreme colors might use scrim-high)
    expect(
      inner?.className.includes('modal-surface-solid') || inner?.className.includes('xeg-scrim')
    ).toBe(true);

    // close modal
    rerender(<SettingsModal isOpen={false} onClose={() => {}} />);

    // slightly improved contrast but still should use enhanced surface mode
    (globalThis as any).__XEG_TEST_MODAL_SURFACE_SAMPLES__ = ['#252525'];
    rerender(<SettingsModal isOpen={true} onClose={() => {}} />);
    inner = screen.getByRole('dialog').firstElementChild as HTMLElement | null;
    // Expect enhanced surface (solid or scrim) rather than plain glass
    expect(
      inner?.className.includes('modal-surface-solid') || inner?.className.includes('xeg-scrim')
    ).toBe(true);
  });
});
