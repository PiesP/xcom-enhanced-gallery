import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';

// GREEN: high variance 배경 샘플 주입 시 glass 유지이면 scrim 클래스 적용

describe('[GREEN][Integration] SettingsModal scrim high variance 적용', () => {
  beforeEach(() => {
    (globalThis as any).__XEG_TEST_MODAL_SURFACE_SAMPLES__ = [
      '#ff0000',
      '#00ff00',
      '#0000ff',
      '#ffff00',
    ];
  });

  it('auto 모드에서 고채도 배경이면 glass + xeg-scrim 클래스 조합 또는 contrast 로 solid 전환 (scrim 미적용) 중 하나여야 한다', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    const inner = screen.getByRole('dialog').firstElementChild as HTMLElement | null;
    expect(inner).toBeTruthy();
    const className = inner?.className || '';
    const isSolid = className.includes('modal-surface-solid');
    if (!isSolid) {
      expect(className).toContain('xeg-scrim');
    }
  });
});
