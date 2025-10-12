/**
 * @fileoverview DOMCache 초기화 아키텍처 테스트
 * @description DOMCache가 자체적으로 설정 변경을 구독하는지 검증
 * @see https://github.com/PiesP/xcom-enhanced-gallery/issues/TBD
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Architecture: DOMCache Initialization', () => {
  describe('DOMCache 자율성', () => {
    it('DOMCache가 자체적으로 설정 변경을 구독해야 한다', async () => {
      // RED: DOMCache가 initializeDOMCache 메서드를 가지고 있는지 검증
      const { DOMCache } = await import('../../../src/shared/dom/dom-cache');

      expect(typeof DOMCache.prototype.initializeDOMCache).toBe('function');
    });

    it('DOMCache 초기화 시 SettingsService를 주입받아야 한다', async () => {
      // RED: DOMCache.initializeDOMCache가 SettingsService를 받는지 검증
      const { DOMCache } = await import('../../../src/shared/dom/dom-cache');
      const mockSettingsService = {
        get: vi.fn().mockReturnValue(20000),
        subscribe: vi.fn(),
      };

      const cache = new DOMCache();

      // 메서드가 존재하고 SettingsService를 받을 수 있어야 함
      await expect(async () => {
        await cache.initializeDOMCache(mockSettingsService as any);
      }).not.toThrow();
    });

    it('DOMCache가 설정 변경 시 자동으로 TTL을 업데이트해야 한다', async () => {
      // RED: 설정 변경 시 자동 TTL 업데이트 검증
      const { DOMCache } = await import('../../../src/shared/dom/dom-cache');

      let subscribeCallback: any = null;
      const mockSettingsService = {
        get: vi.fn().mockReturnValue(15000),
        subscribe: vi.fn(callback => {
          subscribeCallback = callback;
        }),
      };

      const cache = new DOMCache();
      const setDefaultTTLSpy = vi.spyOn(cache, 'setDefaultTTL');

      // 초기화
      await cache.initializeDOMCache(mockSettingsService as any);

      // 초기 TTL이 설정되었는지 확인
      expect(setDefaultTTLSpy).toHaveBeenCalledWith(15000);

      // 설정 변경 시뮬레이션
      if (subscribeCallback) {
        subscribeCallback({
          key: 'performance.cacheTTL',
          newValue: 30000,
          oldValue: 15000,
        });
      }

      // TTL이 자동 업데이트되었는지 확인
      expect(setDefaultTTLSpy).toHaveBeenCalledWith(30000);
    });
  });

  describe('Bootstrap 레이어 경계', () => {
    it('bootstrap/features.ts에 DOMCache 설정 구독 로직이 없어야 한다', () => {
      // 목표: Bootstrap은 초기화만 호출하고, 설정 구독 로직은 DOMCache 내부에서 처리
      const featuresPath = join(process.cwd(), 'src', 'bootstrap', 'features.ts');
      const featuresSource = readFileSync(featuresPath, 'utf-8');

      // 이전 방식의 직접 설정 구독 로직이 없어야 함
      expect(featuresSource).not.toMatch(/settingsService\.subscribe/);
      expect(featuresSource).not.toMatch(/setDefaultTTL\(/);
      expect(featuresSource).not.toMatch(/cacheTTL/);

      // 대신 initializeDOMCache 호출만 있어야 함
      expect(featuresSource).toMatch(/initializeDOMCache/);
    });
  });
});
