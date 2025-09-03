/**
 * SettingsModal theme toggle contrast RED test (Phase21.5)
 * 목표: theme 전환 시 data-theme 적용 및 대비 계산 ≥4.5 (현재 대비 계산 util 부재로 placeholder)
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/preact';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';

function mockMatchMedia(dark: boolean) {
  const win =
    (globalThis as unknown as { window?: Window }).window ?? (globalThis as unknown as Window);
  Object.defineProperty(win, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('dark') ? dark : !dark,
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

describe('SettingsModal Theme Toggle (RED)', () => {
  afterEach(() => cleanup());

  it('auto -> dark 전환 시 documentElement data-theme="dark" 기대', () => {
    mockMatchMedia(true);
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);
    const select = screen.getByLabelText('Theme') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'dark' } });
    const doc = (globalThis as unknown as { document?: Document }).document;
    const attr = doc?.documentElement.getAttribute('data-theme');
    expect(attr).toBe('dark'); // GREEN 후 안정
  });

  it('dark -> light 전환 시 data-theme="light" 기대', () => {
    mockMatchMedia(false);
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);
    const select = screen.getByLabelText('Theme') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'light' } });
    const doc = (globalThis as unknown as { document?: Document }).document;
    expect(doc?.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
