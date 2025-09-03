/**
 * SettingsModal reduced-transparency + high-contrast 복합 조건 RED 테스트
 * 목표: 추후 adaptive escalation 후 stage solid/scrim-high & 대비 ≥4.5 이상 보장
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/preact';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';

function mockMatchMediaMap(map: Record<string, boolean>) {
  const win =
    (globalThis as unknown as { window?: Window }).window ?? (globalThis as unknown as Window);
  Object.defineProperty(win, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: Object.entries(map).some(([k, v]) => query.includes(k) && v),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('SettingsModal 복합 접근성 모드 (RED)', () => {
  afterEach(() => cleanup());

  it('prefers-reduced-transparency + prefers-contrast: high 조합에서 모달 DOM 존재', () => {
    mockMatchMediaMap({ 'prefers-reduced-transparency': true, 'prefers-contrast': true });
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    // 차후 GREEN: stage / 클래스 검증 (xeg-scrim-intensity-* 또는 solid)
  });
});
