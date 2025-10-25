import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LanguageService, type SupportedLanguage } from '@shared/services/language-service';
import { InMemoryStorageAdapter } from '../../../__mocks__/in-memory-storage-adapter';
import { getSolid } from '@shared/external/vendors';
import { useToolbarSettingsController } from '@shared/hooks/toolbar/use-toolbar-settings-controller';

describe('Phase 117: LanguageService persistence flow (RED)', () => {
  const STORAGE_KEY = 'xeg-language';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('restores saved language and notifies listeners during initialize', async () => {
    const storage = new InMemoryStorageAdapter();
    await storage.setItem(STORAGE_KEY, 'ko');
    const getSpy = vi.spyOn(storage, 'getItem');
    const service = new LanguageService(storage);
    const events: SupportedLanguage[] = [];
    service.onLanguageChange(language => {
      events.push(language);
    });

    await service.initialize();

    expect(service.getCurrentLanguage()).toBe('ko');
    expect(events).toEqual(['ko']);
    expect(getSpy).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('persists language changes and notifies listeners synchronously', async () => {
    const storage = new InMemoryStorageAdapter();
    const setSpy = vi.spyOn(storage, 'setItem');
    const service = new LanguageService(storage);
    const events: SupportedLanguage[] = [];
    service.onLanguageChange(language => {
      events.push(language);
    });

    service.setLanguage('ja');

    expect(events).toEqual(['ja']);
    expect(service.getCurrentLanguage()).toBe('ja');
    expect(setSpy).toHaveBeenLastCalledWith(STORAGE_KEY, 'ja');
  });

  it('synchronizes toolbar controller state when service language updates externally', async () => {
    const storage = new InMemoryStorageAdapter();
    const service = new LanguageService(storage);
    await service.initialize();

    const solid = getSolid();
    const { createRoot } = solid;

    await new Promise<void>(resolve => {
      createRoot(dispose => {
        const controller = useToolbarSettingsController({
          setNeedsHighContrast: () => undefined,
          isSettingsExpanded: () => false,
          setSettingsExpanded: () => undefined,
          toggleSettingsExpanded: () => undefined,
          documentRef: undefined,
          windowRef: undefined,
          eventManager: {
            addListener: vi.fn().mockReturnValue('listener-id'),
            removeListener: vi.fn().mockReturnValue(true),
          } as unknown as { addListener: () => unknown; removeListener: () => boolean },
          languageService: service,
          scrollThrottle: <T extends (...args: never[]) => void>(fn: T): T => fn,
        });

        expect(controller.currentLanguage()).toBe('auto');

        // Solid.js의 createEffect가 완전히 실행되도록 microtask 대기
        Promise.resolve().then(() => {
          service.setLanguage('en');
          expect(controller.currentLanguage()).toBe('en');

          dispose();
          resolve();
        });
      });
    });
  });

  describe('Phase 117.1: 중복 저장 방지', () => {
    it('동일한 값으로 setLanguage() 호출 시 스토리지에 저장하지 않음', async () => {
      // Given: 초기 언어가 'auto'
      const storage = new InMemoryStorageAdapter();
      const setSpy = vi.spyOn(storage, 'setItem');
      const service = new LanguageService(storage);
      await service.initialize();
      expect(service.getCurrentLanguage()).toBe('auto');
      setSpy.mockClear(); // 초기화 시 저장 호출 제거

      // When: 동일한 'auto'로 설정
      service.setLanguage('auto');

      // 비동기 저장 대기
      await new Promise(resolve => setTimeout(resolve, 10));

      // Then: 스토리지 저장 호출 안 됨
      expect(setSpy).not.toHaveBeenCalled();
    });

    it('다른 값으로 setLanguage() 호출 시 스토리지에 저장됨', async () => {
      // Given: 초기 언어가 'auto'
      const storage = new InMemoryStorageAdapter();
      const setSpy = vi.spyOn(storage, 'setItem');
      const service = new LanguageService(storage);
      await service.initialize();
      setSpy.mockClear();

      // When: 'ko'로 변경
      service.setLanguage('ko');

      // 비동기 저장 대기
      await new Promise(resolve => setTimeout(resolve, 10));

      // Then: 스토리지 저장 호출됨
      expect(setSpy).toHaveBeenCalledWith(STORAGE_KEY, 'ko');
    });

    it('정규화된 값이 현재 값과 같으면 스토리지에 저장하지 않음', async () => {
      // Given: 언어가 'en'으로 설정됨
      const storage = new InMemoryStorageAdapter();
      const setSpy = vi.spyOn(storage, 'setItem');
      const service = new LanguageService(storage);
      await service.initialize();
      service.setLanguage('en');
      await new Promise(resolve => setTimeout(resolve, 10));
      setSpy.mockClear();

      // When: 동일한 'en'으로 재설정
      service.setLanguage('en');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Then: 스토리지 저장 호출 안 됨
      expect(setSpy).not.toHaveBeenCalled();
    });

    it('값이 변경되지 않으면 리스너에게 알림 안 함', () => {
      // Given: 리스너 등록
      const storage = new InMemoryStorageAdapter();
      const service = new LanguageService(storage);
      const listener = vi.fn();
      service.onLanguageChange(listener);

      // When: 동일한 값으로 설정 ('auto' → 'auto')
      service.setLanguage('auto');

      // Then: 리스너 호출 안 됨
      expect(listener).not.toHaveBeenCalled();
    });

    it('지원하지 않는 언어를 설정하면 정규화되고, 현재 값과 다르면 저장됨', async () => {
      // Given: 초기 언어가 'auto'
      const storage = new InMemoryStorageAdapter();
      const setSpy = vi.spyOn(storage, 'setItem');
      const service = new LanguageService(storage);
      await service.initialize();
      setSpy.mockClear();

      // When: 지원하지 않는 'fr' 설정 (정규화 → 'en')
      service.setLanguage('fr' as SupportedLanguage);

      // 비동기 저장 대기
      await new Promise(resolve => setTimeout(resolve, 10));

      // Then: 'en'으로 정규화되어 저장됨
      expect(setSpy).toHaveBeenCalledWith(STORAGE_KEY, 'en');
      expect(service.getCurrentLanguage()).toBe('en');
    });
  });
});
