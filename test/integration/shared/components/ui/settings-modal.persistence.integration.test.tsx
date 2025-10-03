/**
 * SettingsModal – persistence integration for progress toast toggle
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@test-utils/testing-library';
import { SettingsModal } from '@/shared/components/ui/SettingsModal/SettingsModal';
import { registerSettingsManager } from '@/shared/container/service-accessors';
import { SettingsService } from '@/features/settings/services/SettingsService';
import getUserscript from '@/shared/external/userscript/adapter';

// Speed up i18n to English
vi.stubGlobal('navigator', { language: 'en-US' } as any);

// Simple localStorage memory polyfill
const memoryStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
  };
})();

vi.stubGlobal('localStorage', memoryStorage as any);

describe('SettingsModal – persists download.showProgressToast', () => {
  const baseProps = { isOpen: true, onClose: vi.fn(), mode: 'panel' as const };

  beforeEach(async () => {
    cleanup();
    const svc = new SettingsService();
    await svc.initialize();
    registerSettingsManager(svc);
  });

  afterEach(() => {
    cleanup();
  });

  it('toggle persists and loads on re-render', async () => {
    const view = render(<SettingsModal {...baseProps} />);

    const input = document.getElementById('download-progress-toast') as any;
    expect(input).toBeTruthy();
    // Phase 2-2에서 기본값이 true로 변경됨
    expect(input.checked).toBe(true);

    // false로 토글
    fireEvent.click(input);
    expect(input.checked).toBe(false);

    // ensure persisted in storage (GM first, fallback to localStorage)
    const us = getUserscript();
    const gmRaw = await us.storage.get('xeg-app-settings');
    const raw = gmRaw ?? (globalThis as any).localStorage.getItem('xeg-app-settings');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    expect(parsed?.download?.showProgressToast).toBe(false);

    // re-render fresh component (simulating reopening)
    cleanup();
    const svc2 = new SettingsService();
    await svc2.initialize();
    registerSettingsManager(svc2);

    render(<SettingsModal {...baseProps} />);
    const input2 = document.getElementById('download-progress-toast') as any;
    expect(input2.checked).toBe(false);

    view.unmount();
  });
});
