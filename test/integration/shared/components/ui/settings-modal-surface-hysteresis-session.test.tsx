import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';

/**
 * Session hysteresis test: force low contrast first open -> solid, then slightly improved but within solidHoldMargin -> keep solid.
 */

describe('SettingsModal surface hysteresis across reopen', () => {
  it('keeps solid after reopen when contrast only slightly improved', () => {
    (globalThis as any).__XEG_TEST_MODAL_SURFACE_SAMPLES__ = ['#4d4d4d']; // low contrast -> solid
    const { rerender } = render(<SettingsModal isOpen={true} onClose={() => {}} />);
    let inner = screen.getByRole('dialog').firstElementChild as HTMLElement | null;
    expect(inner?.className).toContain('modal-surface-solid');

    // close modal
    rerender(<SettingsModal isOpen={false} onClose={() => {}} />);

    // slightly improved contrast but within hold margin (< min + 0.2)
    (globalThis as any).__XEG_TEST_MODAL_SURFACE_SAMPLES__ = ['#606060'];
    rerender(<SettingsModal isOpen={true} onClose={() => {}} />);
    inner = screen.getByRole('dialog').firstElementChild as HTMLElement | null;
    expect(inner?.className).toContain('modal-surface-solid');
  });
});
