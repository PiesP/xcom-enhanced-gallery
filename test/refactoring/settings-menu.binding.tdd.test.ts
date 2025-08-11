import { describe, it, expect, vi, beforeEach } from 'vitest';

import { SERVICE_KEYS } from '@/constants';

describe('Settings Modal ↔ SettingsService 바인딩 - TDD (RED)', () => {
  beforeEach(async () => {
    document.body.innerHTML = '';
    vi.clearAllMocks();

    // GM 메뉴 스텁
    // @ts-expect-error test env
    global.GM_registerMenuCommand =
      // @ts-expect-error test env
      typeof global.GM_registerMenuCommand === 'function' ? global.GM_registerMenuCommand : vi.fn();

    // 서비스 매니저 초기화 및 더미 SettingsService 주입
    const { CoreService } = await import('@shared/services/service-manager');
    CoreService.resetInstance();
    const sm = CoreService.getInstance();

    // 기본 설정 값 (테스트용)
    const initial = {
      gallery: {
        autoScrollSpeed: 8,
        infiniteScroll: true,
        preloadCount: 3,
        virtualScrolling: true,
        theme: 'auto' as const,
        animations: false,
      },
      download: {
        filenamePattern: 'timestamp' as const,
        imageQuality: 'large' as const,
        maxConcurrentDownloads: 7,
        autoZip: true,
        folderStructure: 'flat' as const,
      },
      tokens: {
        autoRefresh: true,
        expirationMinutes: 60,
      },
      performance: {
        domCaching: true,
        cacheTTL: 3000,
        memoryMonitoring: false,
        performanceLogging: false,
        debugMode: false,
      },
      accessibility: {
        highContrast: false,
        reduceMotion: false,
        screenReaderSupport: true,
        focusIndicators: true,
      },
      version: '1.0.0',
      lastModified: Date.now(),
    };

    const store: any = JSON.parse(JSON.stringify(initial));
    const setSpy = vi.fn(async (key: string, value: unknown) => {
      const parts = key.split('.');
      let t: any = store;
      for (let i = 0; i < parts.length - 1; i++) {
        t = t[parts[i]];
      }
      t[parts[parts.length - 1]] = value;
    });

    const mockSettingsService = {
      isInitialized: () => true,
      async initialize() {},
      get: (key: string) => {
        const parts = key.split('.');
        let v: any = store;
        for (const p of parts) v = v?.[p];
        return v;
      },
      set: setSpy,
      updateBatch: vi.fn(),
      getAllSettings: () => store,
      subscribe: () => () => {},
    } as any;

    sm.register(SERVICE_KEYS.SETTINGS_MANAGER, mockSettingsService);
  });

  it('모달 오픈 시 SettingsService 값으로 초기화된다 (inputs reflect settings)', async () => {
    const { registerSettingsMenu, __getLastRegisteredCallback } = await import(
      '@/features/settings/settings-menu'
    );

    registerSettingsMenu();
    const cb = __getLastRegisteredCallback();
    expect(cb).toBeTypeOf('function');
    cb && cb();

    const modal = document.querySelector('[data-testid="xeg-settings-modal"]') as HTMLElement;
    expect(modal).toBeTruthy();

    const filename = document.querySelector(
      '[data-testid="filename-pattern"]'
    ) as HTMLSelectElement;
    const quality = document.querySelector('[data-testid="image-quality"]') as HTMLSelectElement;
    const autoZip = document.querySelector('[data-testid="auto-zip"]') as HTMLInputElement;
    const conc = document.querySelector('[data-testid="concurrency"]') as HTMLInputElement;
    const speed = document.querySelector('[data-testid="auto-scroll-speed"]') as HTMLInputElement;
    const anim = document.querySelector('[data-testid="animations"]') as HTMLInputElement;

    expect(filename?.value).toBe('timestamp');
    expect(quality?.value).toBe('large');
    expect(autoZip?.checked).toBe(true);
    expect(conc?.value).toBe('7');
    expect(speed?.value).toBe('8');
    expect(anim?.checked).toBe(false);
  });

  it('입력 변경 시 SettingsService.set이 올바른 키/값으로 호출된다', async () => {
    const { registerSettingsMenu, __getLastRegisteredCallback } = await import(
      '@/features/settings/settings-menu'
    );

    registerSettingsMenu();
    const cb = __getLastRegisteredCallback();
    expect(cb).toBeTypeOf('function');
    cb && cb();

    const filename = document.querySelector(
      '[data-testid="filename-pattern"]'
    ) as HTMLSelectElement;
    const quality = document.querySelector('[data-testid="image-quality"]') as HTMLSelectElement;
    const autoZip = document.querySelector('[data-testid="auto-zip"]') as HTMLInputElement;
    const conc = document.querySelector('[data-testid="concurrency"]') as HTMLInputElement;
    const speed = document.querySelector('[data-testid="auto-scroll-speed"]') as HTMLInputElement;
    const anim = document.querySelector('[data-testid="animations"]') as HTMLInputElement;

    // 변경 이벤트 트리거
    filename.value = 'tweet-id';
    filename.dispatchEvent(new Event('change', { bubbles: true }));

    quality.value = 'medium';
    quality.dispatchEvent(new Event('change', { bubbles: true }));

    autoZip.checked = false;
    autoZip.dispatchEvent(new Event('change', { bubbles: true }));

    conc.value = '5';
    conc.dispatchEvent(new Event('change', { bubbles: true }));

    speed.value = '3';
    speed.dispatchEvent(new Event('change', { bubbles: true }));

    anim.checked = true;
    anim.dispatchEvent(new Event('change', { bubbles: true }));

    // 서비스 매니저에서 mock 가져와서 호출 검증
    const { CoreService } = await import('@shared/services/service-manager');
    const sm = CoreService.getInstance();
    const svc: any = sm.get(SERVICE_KEYS.SETTINGS_MANAGER);

    const setSpy = svc.set as ReturnType<typeof vi.fn>;
    expect(setSpy).toHaveBeenCalledWith('download.filenamePattern', 'tweet-id');
    expect(setSpy).toHaveBeenCalledWith('download.imageQuality', 'medium');
    expect(setSpy).toHaveBeenCalledWith('download.autoZip', false);
    expect(setSpy).toHaveBeenCalledWith('download.maxConcurrentDownloads', 5);
    expect(setSpy).toHaveBeenCalledWith('gallery.autoScrollSpeed', 3);
    expect(setSpy).toHaveBeenCalledWith('gallery.animations', true);
  });
});
