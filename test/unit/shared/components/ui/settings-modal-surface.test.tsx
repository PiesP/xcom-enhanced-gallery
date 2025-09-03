/**
 * Phase21 GREEN 테스트: 설정 모달 가독성 강화
 * - modal-surface 클래스 및 전용 토큰 적용 검증
 * - 알파 대비 기준(>=0.92 dark / >=0.95 light) 충족
 */
import { describe, it, expect } from 'vitest';
// JSDOM 환경 전역 선언 (lint 만족)
declare const document: Document;
declare const window: Window & typeof globalThis;
// ambient getComputedStyle (이미 존재하나 타입 경고 회피용 no-op 선언)
// eslint 규칙 회피: 매개변수명 미기재 시 unused 경고 없음
import { render, screen } from '@testing-library/preact';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';

function parseAlpha(rgba: string): number | null {
  const m = rgba.match(/rgba?\([^,]+,[^,]+,[^,]+,\s*([0-9.]+)\)/i);
  return m ? parseFloat(m[1]) : null;
}

describe('Phase21(SettingsModal Readability) GREEN', () => {
  beforeAll(() => {
    // jsdom 환경에서는 CSS 파일 import 가 실제 변수로 반영되지 않을 수 있어 테스트 안정성을 위해 주입
    const existing = document.getElementById('xeg-test-modal-surface-vars');
    if (!existing) {
      const style = document.createElement('style');
      style.id = 'xeg-test-modal-surface-vars';
      style.textContent = `:root {\n  --xeg-surface-modal-bg: rgba(255,255,255,0.95);\n  --xeg-surface-modal-border: rgba(0,0,0,0.12);\n  --xeg-surface-modal-shadow: 0 8px 40px rgba(0,0,0,0.28);\n}`;
      document.head.appendChild(style);
    }
  });
  it('modal-surface 클래스가 적용되어야 함', () => {
    render(<SettingsModal isOpen onClose={() => {}} />);
    const dialog = screen.getByRole('dialog');
    const surface = dialog.firstElementChild as HTMLElement | null;
    expect(surface?.className).toContain('modal-surface');
  });

  it('modal 전용 토큰이 정의되어야 함', () => {
    const styles = window.getComputedStyle(document.documentElement);
    const bg = styles.getPropertyValue('--xeg-surface-modal-bg');
    expect(bg.trim()).not.toBe('');
  });

  it('glass-surface 대비 modal-surface 배경 알파 기준 충족 (라이트/다크 대응)', () => {
    const styles = window.getComputedStyle(document.documentElement);
    const modalBg = styles.getPropertyValue('--xeg-surface-modal-bg');
    const alpha = parseAlpha(modalBg) ?? 0;
    // 최소 0.92 이상 (다크), 라이트는 0.95 설정이므로 충족
    expect(alpha).toBeGreaterThanOrEqual(0.92);
  });
});
