/**
 * @fileoverview SettingsService 단위 테스트
 * @description Phase 354: Settings Service Consolidation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SettingsService } from '../../../../src/features/settings/services/settings-service';
import type {
  AppSettings,
  NestedSettingKey,
} from '../../../../src/features/settings/types/settings.types';
import { DEFAULT_SETTINGS } from '../../../../src/constants';

// 모킹 스토리지
let mockStorage = new Map<string, string>();

const serializeValue = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value);

const deserializeValue = (value: string | undefined, fallback?: unknown): unknown => {
  if (value === undefined) {
    return fallback;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

// PersistentStorage 모킹
vi.mock('../../../../src/shared/services/persistent-storage', () => ({
  getPersistentStorage: () => ({
    get: async (key: string, defaultValue?: unknown) =>
      deserializeValue(mockStorage.get(key), defaultValue),
    set: async (key: string, value: unknown) => {
      mockStorage.set(key, serializeValue(value));
    },
    remove: async (key: string) => {
      mockStorage.delete(key);
    },
    has: async (key: string) => mockStorage.has(key),
  }),
}));

// logger 모킹
vi.mock('../../../../src/shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    mockStorage.clear();
    service = new SettingsService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('초기화', () => {
    it('기본 설정으로 초기화되어야 함', async () => {
      await service.initialize();

      expect(service.isInitialized()).toBe(true);
      const settings = service.getAllSettings();
      expect(settings.gallery).toBeDefined();
      expect(settings.download).toBeDefined();
    });

    it('저장소에서 설정을 로드해야 함', async () => {
      const testSettings: AppSettings = {
        ...DEFAULT_SETTINGS,
        gallery: {
          ...DEFAULT_SETTINGS.gallery,
          theme: 'dark',
        },
      };

      mockStorage.set('xeg-app-settings', JSON.stringify(testSettings));

      await service.initialize();

      expect(service.get('gallery.theme')).toBe('dark');
    });
  });

  describe('설정 조회 (get)', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('중첩된 설정 값을 조회할 수 있어야 함', () => {
      const theme = service.get<string>('gallery.theme');
      expect(theme).toBeDefined();
    });

    it('getAllSettings는 읽기 전용 복사본을 반환해야 함', () => {
      const settings = service.getAllSettings();
      const originalTheme = settings.gallery.theme;

      // 반환된 객체 수정
      (settings.gallery as { theme: string }).theme = 'modified';

      // 원본은 변경되지 않아야 함
      expect(service.get('gallery.theme')).toBe(originalTheme);
    });
  });

  describe('설정 변경 (set)', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('설정 값을 변경할 수 있어야 함', async () => {
      await service.set('gallery.theme', 'dark');
      expect(service.get('gallery.theme')).toBe('dark');
    });

    it('lastModified 타임스탬프가 업데이트되어야 함', async () => {
      const before = service.getAllSettings().lastModified;
      await new Promise(resolve => setTimeout(resolve, 10));

      await service.set('gallery.theme', 'dark');

      const after = service.getAllSettings().lastModified;
      expect(after).toBeGreaterThan(before);
    });
  });

  describe('구독 (subscribe)', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('설정 변경 이벤트를 수신할 수 있어야 함', async () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);

      await service.set('gallery.theme', 'dark');

      expect(listener).toHaveBeenCalled();

      unsubscribe();
    });

    it('구독 해제 후에는 이벤트를 수신하지 않아야 함', async () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);

      unsubscribe();
      await service.set('gallery.theme', 'dark');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('설정 가져오기/내보내기', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('설정을 JSON으로 내보낼 수 있어야 함', () => {
      const exported = service.exportSettings();
      const parsed = JSON.parse(exported);

      expect(parsed.gallery).toBeDefined();
    });

    it('JSON에서 설정을 가져올 수 있어야 함', async () => {
      const customSettings: AppSettings = {
        ...DEFAULT_SETTINGS,
        gallery: {
          ...DEFAULT_SETTINGS.gallery,
          theme: 'dark',
        },
      };

      await service.importSettings(JSON.stringify(customSettings));

      expect(service.get('gallery.theme')).toBe('dark');
    });

    it('유효하지 않은 JSON은 에러를 던져야 함', async () => {
      await expect(service.importSettings('invalid json')).rejects.toThrow();
    });
  });
});
