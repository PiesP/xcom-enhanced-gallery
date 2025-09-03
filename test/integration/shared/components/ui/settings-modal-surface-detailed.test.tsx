import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';

// Integration test for evaluateModalSurfaceModeDetailed usage (borderline => text shadow)

// global test flag already typed loosely elsewhere; no interface augmentation needed

describe('SettingsModal detailed surface evaluator (borderline text-shadow)', () => {
  beforeEach(() => {
    // simulate borderline contrast just above threshold to keep glass but require text-shadow
    (globalThis as any).__XEG_TEST_MODAL_SURFACE_SAMPLES__ = ['#777777'];
  });

  it('applies xeg-modal-text-shadow class when glass and borderline contrast', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    const inner = screen.getByRole('dialog').firstElementChild as HTMLElement | null;
    expect(inner?.className).toContain('modal-surface');
    expect(inner?.className).toContain('glass-surface');
    expect(inner?.className).toContain('xeg-modal-text-shadow');
    expect(inner?.className).not.toContain('modal-surface-solid');
  });
});
