/**
 * @fileoverview CoreService registerAlias 기능 테스트
 * @description TDD RED 단계: 서비스 덮어쓰기 경고 해결을 위한 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoreService } from '@shared/services/ServiceManager';
import { logger } from '@shared/logging/logger';

// 로거 모킹
vi.mock('@shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('CoreService registerAlias 기능', () => {
  let coreService: CoreService;

  beforeEach(() => {
    // 각 테스트 전에 CoreService 인스턴스 초기화
    CoreService.resetInstance();
    coreService = CoreService.getInstance();
    vi.clearAllMocks();
  });

  describe('registerAlias 메서드', () => {
    it('별칭 등록 시 경고 메시지가 출력되지 않아야 함', () => {
      // Given: 서비스가 등록되어 있음
      const testService = { name: 'test-service' };
      coreService.register('original-key', testService);

      // When: 별칭을 등록함
      coreService.registerAlias('alias-key', 'original-key');

      // Then: 경고 메시지가 출력되지 않음
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('별칭으로 원본 서비스를 조회할 수 있어야 함', () => {
      // Given: 서비스가 등록되어 있음
      const testService = { name: 'test-service' };
      coreService.register('original-key', testService);

      // When: 별칭을 등록함
      coreService.registerAlias('alias-key', 'original-key');

      // Then: 별칭으로 동일한 서비스를 조회할 수 있음
      expect(coreService.get('alias-key')).toBe(testService);
      expect(coreService.get('original-key')).toBe(testService);
    });

    it('존재하지 않는 서비스에 대한 별칭 등록 시 에러가 발생해야 함', () => {
      // When & Then: 존재하지 않는 서비스에 별칭 등록 시 에러 발생
      expect(() => {
        coreService.registerAlias('alias-key', 'non-existent-key');
      }).toThrow('별칭 등록 실패: 원본 서비스를 찾을 수 없습니다: non-existent-key');
    });

    it('동일한 별칭을 중복 등록할 경우 덮어쓰기 경고가 출력되어야 함', () => {
      // Given: 서비스와 별칭이 등록되어 있음
      const testService1 = { name: 'test-service-1' };
      const testService2 = { name: 'test-service-2' };
      coreService.register('original-key-1', testService1);
      coreService.register('original-key-2', testService2);
      coreService.registerAlias('alias-key', 'original-key-1');

      // When: 동일한 별칭을 다시 등록함
      coreService.registerAlias('alias-key', 'original-key-2');

      // Then: 덮어쓰기 경고가 출력됨
      expect(logger.warn).toHaveBeenCalledWith('[CoreService] 별칭 덮어쓰기: alias-key');
    });

    it('별칭 체인은 지원하지 않아야 함', () => {
      // Given: 서비스와 별칭이 등록되어 있음
      const testService = { name: 'test-service' };
      coreService.register('original-key', testService);
      coreService.registerAlias('alias-key', 'original-key');

      // When & Then: 별칭에 대한 별칭 등록 시 에러 발생
      expect(() => {
        coreService.registerAlias('alias-alias-key', 'alias-key');
      }).toThrow('별칭 체인은 지원하지 않습니다: alias-key');
    });
  });

  describe('기존 register 메서드 개선', () => {
    it('allowOverwrite 플래그가 true일 때 덮어쓰기 경고가 출력되지 않아야 함', () => {
      // Given: 서비스가 등록되어 있음
      const testService1 = { name: 'test-service-1' };
      const testService2 = { name: 'test-service-2' };
      coreService.register('test-key', testService1);

      // When: allowOverwrite=true로 덮어쓰기
      coreService.register('test-key', testService2, true);

      // Then: 경고 메시지가 출력되지 않음
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('allowOverwrite 플래그가 false일 때 덮어쓰기 경고가 출력되어야 함', () => {
      // Given: 서비스가 등록되어 있음
      const testService1 = { name: 'test-service-1' };
      const testService2 = { name: 'test-service-2' };
      coreService.register('test-key', testService1);

      // When: allowOverwrite=false로 덮어쓰기 (기본값)
      coreService.register('test-key', testService2);

      // Then: 덮어쓰기 경고가 출력됨
      expect(logger.warn).toHaveBeenCalledWith('[CoreService] 서비스 덮어쓰기: test-key');
    });
  });

  describe('별칭 관리 기능', () => {
    it('getAliases 메서드로 특정 서비스의 모든 별칭을 조회할 수 있어야 함', () => {
      // Given: 서비스와 여러 별칭이 등록되어 있음
      const testService = { name: 'test-service' };
      coreService.register('original-key', testService);
      coreService.registerAlias('alias-1', 'original-key');
      coreService.registerAlias('alias-2', 'original-key');

      // When: 별칭 목록을 조회함
      const aliases = coreService.getAliases('original-key');

      // Then: 모든 별칭이 반환됨
      expect(aliases).toEqual(['alias-1', 'alias-2']);
    });

    it('removeAlias 메서드로 별칭을 제거할 수 있어야 함', () => {
      // Given: 서비스와 별칭이 등록되어 있음
      const testService = { name: 'test-service' };
      coreService.register('original-key', testService);
      coreService.registerAlias('alias-key', 'original-key');

      // When: 별칭을 제거함
      const removed = coreService.removeAlias('alias-key');

      // Then: 별칭이 제거되고 true가 반환됨
      expect(removed).toBe(true);
      expect(() => coreService.get('alias-key')).toThrow();
      expect(coreService.get('original-key')).toBe(testService); // 원본은 유지
    });

    it('존재하지 않는 별칭 제거 시 false가 반환되어야 함', () => {
      // When: 존재하지 않는 별칭을 제거함
      const removed = coreService.removeAlias('non-existent-alias');

      // Then: false가 반환됨
      expect(removed).toBe(false);
    });
  });
});
