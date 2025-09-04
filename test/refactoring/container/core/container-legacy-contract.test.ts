/**
 * @fileoverview Phase 0 - Legacy Container Contract Tests (현 구조 보호망)
 * @description 기존 CoreService + SERVICE_KEYS 구조의 최소 계약 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CoreService } from '@shared/services/ServiceManager';
import { SERVICE_KEYS } from '@/constants';

describe('Phase 0 - Legacy Container Contract', () => {
  let coreService: CoreService;
  let logSpy: any;

  beforeEach(() => {
    // 매 테스트마다 깨끗한 상태로 시작
    CoreService.resetInstance();
    coreService = CoreService.getInstance();

    // 로그 스파이 설정
    logSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    CoreService.resetInstance();
  });

  describe('등록된 서비스 키 존재성', () => {
    it('필수 서비스 키들이 상수로 정의되어 있어야 함', () => {
      const requiredKeys = [
        'MEDIA_SERVICE',
        'THEME',
        'TOAST',
        'VIDEO_CONTROL',
        'VIDEO_STATE',
        'MEDIA_EXTRACTION',
      ];

      for (const key of requiredKeys) {
        expect(SERVICE_KEYS).toHaveProperty(key);
        expect(typeof SERVICE_KEYS[key as keyof typeof SERVICE_KEYS]).toBe('string');
      }
    });

    it('서비스 키 값들이 고유해야 함', () => {
      const keyValues = Object.values(SERVICE_KEYS);
      const uniqueValues = [...new Set(keyValues)];

      expect(keyValues.length).toBe(uniqueValues.length);
    });
  });

  describe('중복 등록 시 경고 로그', () => {
    it('동일 키로 서비스를 두 번 등록하면 경고 로그가 발생해야 함', () => {
      const testService = { test: true };
      const testKey = 'test.service';

      // 첫 번째 등록
      coreService.register(testKey, testService);
      expect(logSpy).not.toHaveBeenCalled();

      // 두 번째 등록 - 경고 발생해야 함
      coreService.register(testKey, testService);
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[XEG]'),
        expect.stringContaining('서비스 덮어쓰기')
      );
    });
  });

  describe('누락 키 접근 시 오류 메시지', () => {
    it('등록되지 않은 키로 접근하면 명확한 오류 메시지를 throw해야 함', () => {
      const nonExistentKey = 'non.existent.service';

      expect(() => {
        coreService.get(nonExistentKey);
      }).toThrow(`서비스를 찾을 수 없습니다: ${nonExistentKey}`);
    });

    it('tryGet은 누락 키에 대해 null을 반환해야 함', () => {
      const nonExistentKey = 'non.existent.service';

      const result = coreService.tryGet(nonExistentKey);
      expect(result).toBeNull();
    });
  });

  describe('서비스 진단 기능', () => {
    it('getDiagnostics는 현재 등록 상태를 정확히 반환해야 함', () => {
      const testService1 = { name: 'service1' };
      const testService2 = { name: 'service2' };

      coreService.register('test.service1', testService1);
      coreService.register('test.service2', testService2);

      const diagnostics = coreService.getDiagnostics();

      expect(diagnostics.registeredServices).toBe(2);
      expect(diagnostics.activeInstances).toBe(2);
      expect(diagnostics.services).toContain('test.service1');
      expect(diagnostics.services).toContain('test.service2');
      expect(diagnostics.instances['test.service1']).toBe(true);
      expect(diagnostics.instances['test.service2']).toBe(true);
    });
  });

  describe('서비스 생명주기', () => {
    it('cleanup 호출 시 cleanup 메서드가 있는 서비스들이 정리되어야 함', async () => {
      const cleanupSpy = vi.fn();
      const serviceWithCleanup = { cleanup: cleanupSpy };
      const serviceWithoutCleanup = { name: 'test' };

      coreService.register('service.with.cleanup', serviceWithCleanup);
      coreService.register('service.without.cleanup', serviceWithoutCleanup);

      coreService.cleanup();

      expect(cleanupSpy).toHaveBeenCalledOnce();
    });

    it('reset 호출 시 모든 서비스가 제거되어야 함', () => {
      coreService.register('test.service', { test: true });
      expect(coreService.has('test.service')).toBe(true);

      coreService.reset();
      expect(coreService.has('test.service')).toBe(false);
      expect(coreService.getRegisteredServices()).toHaveLength(0);
    });
  });
});
