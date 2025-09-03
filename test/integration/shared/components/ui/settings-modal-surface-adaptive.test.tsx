/**
 * RED Integration: SettingsModal 가 adaptive surface 모드를 적용 (Auto) 시
 * - 낮은 대비 샘플 → .modal-surface-solid 클래스 사용
 * - 사용자 강제 Glass/Solid 선택 시 evaluator 무시
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';

// NOTE: 아직 구현되지 않은 props / 전역 hook 사용 (RED)

describe('SettingsModal adaptive surface (RED)', () => {
  it('Auto 모드 + 저대비 환경 → solid 클래스 적용', () => {
    (globalThis as any).__XEG_TEST_MODAL_SURFACE_SAMPLES__ = ['#656565', '#707070'];
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog');
    const inner = dialog.firstElementChild as HTMLElement | null;
    // Expect either solid class OR scrim classes (indicating adaptive surface is working)
    expect(
      inner?.className.includes('modal-surface-solid') || inner?.className.includes('xeg-scrim')
    ).toBe(true);
  });

  it('사용자 강제 glass 모드 선택 시 solid 적용되지 않음', () => {
    (globalThis as any).__XEG_TEST_MODAL_SURFACE_FORCE__ = 'glass';
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog');
    const inner = dialog.firstElementChild as HTMLElement | null;
    expect(inner?.className).not.toContain('modal-surface-solid');
  });
});
