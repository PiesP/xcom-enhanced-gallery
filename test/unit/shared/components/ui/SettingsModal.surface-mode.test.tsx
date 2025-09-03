import { describe, it, expect, beforeEach, afterEach } from 'vitest';
// JSDOM 환경 전역 window 타입 가드
declare const window: Window & typeof globalThis;
import { render, fireEvent, screen, cleanup, within, waitFor } from '@testing-library/preact';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';

// Phase21.3 tests for user surface mode override & persistence.

const STORAGE_KEY = 'xeg-surface-mode';

describe('SettingsModal surface mode preference', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
  });

  it('Surface 모드 선택 UI (label + select) 가 표시되고 기본값은 auto', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    const label = screen.getByText(/Surface/i);
    expect(label).toBeDefined();
    const select = screen.getByLabelText(/Surface/i) as HTMLSelectElement | null;
    expect(select).toBeDefined();
    expect(select?.value).toBe('auto');
  });

  it('Surface select 에 auto | glass | solid 옵션 포함 (스코프 검색)', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    const select = screen.getByLabelText(/Surface/i) as HTMLSelectElement;
    const utils = within(select);
    expect(utils.getByRole('option', { name: /Auto/i })).toBeDefined();
    expect(utils.getByRole('option', { name: /Glass/i })).toBeDefined();
    expect(utils.getByRole('option', { name: /Solid/i })).toBeDefined();
  });

  it('solid 로 변경 시 modal-surface-solid 적용', async () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    const select = screen.getByLabelText(/Surface/i) as HTMLSelectElement;
    const dialog = screen.getByRole('dialog');
    expect(dialog.firstElementChild?.className).not.toContain('modal-surface-solid');
    fireEvent.change(select, { target: { value: 'solid' } });
    await waitFor(() => {
      expect(select.value).toBe('solid');
      const innerNow = screen.getByRole('dialog').firstElementChild as HTMLElement | null;
      expect(innerNow?.className).toContain('modal-surface-solid');
    });
  });

  it('glass 로 변경 시 modal-surface-solid 제거', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'solid');
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    await waitFor(() => {
      const inner = screen.getByRole('dialog').firstElementChild as HTMLElement | null;
      expect(inner?.className).toContain('modal-surface-solid');
    });
    const select = screen.getByLabelText(/Surface/i) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'glass' } });
    await waitFor(() => {
      expect(select.value).toBe('glass');
      const innerNow = screen.getByRole('dialog').firstElementChild as HTMLElement | null;
      expect(innerNow?.className).not.toContain('modal-surface-solid');
    });
  });

  it('선택 모드 persistence (localStorage)', async () => {
    const { rerender } = render(<SettingsModal isOpen={true} onClose={() => {}} />);
    const select = screen.getByLabelText(/Surface/i) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'solid' } });
    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('solid');
    });
    rerender(<SettingsModal isOpen={false} onClose={() => {}} />);
    rerender(<SettingsModal isOpen={true} onClose={() => {}} />);
    await waitFor(() => {
      const select2 = screen.getByLabelText(/Surface/i) as HTMLSelectElement;
      expect(select2.value).toBe('solid');
      const inner = screen.getByRole('dialog').firstElementChild as HTMLElement | null;
      expect(inner?.className).toContain('modal-surface-solid');
    });
  });
});
