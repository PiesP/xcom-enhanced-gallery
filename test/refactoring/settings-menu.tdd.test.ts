import { describe, it, expect, vi, beforeEach } from 'vitest';

// settings menu registration and modal opening

describe('Settings Menu - TDD', () => {
  beforeEach(() => {
    // fresh DOM
    document.body.innerHTML = '';
    // reset GM mock if exists
    // @ts-expect-error test env
    global.GM_registerMenuCommand =
      typeof global.GM_registerMenuCommand === 'function' ? global.GM_registerMenuCommand : vi.fn();
    vi.clearAllMocks();
  });

  it('should register GM menu command with caption "XEG 설정"', async () => {
    const { registerSettingsMenu } = await import('@/features/settings/settings-menu');
    registerSettingsMenu();
    // @ts-expect-error spy
    expect(global.GM_registerMenuCommand).toHaveBeenCalled();
    // @ts-expect-error spy
    const args = (global.GM_registerMenuCommand as any).mock.calls[0];
    expect(args[0]).toBe('XEG 설정');
    expect(typeof args[1]).toBe('function');
  });

  it('should open a Preact settings modal when menu callback is invoked', async () => {
    const { registerSettingsMenu, __getLastRegisteredCallback } = await import(
      '@/features/settings/settings-menu'
    );
    registerSettingsMenu();
    const cb = __getLastRegisteredCallback();
    expect(typeof cb).toBe('function');

    // invoke
    cb();

    // modal root should exist
    const root = document.querySelector('#xeg-settings-modal-root') as HTMLElement | null;
    expect(root).not.toBeNull();
    // modal content marker
    const modal = document.querySelector('[data-testid="xeg-settings-modal"]');
    expect(modal).not.toBeNull();
  });
});
