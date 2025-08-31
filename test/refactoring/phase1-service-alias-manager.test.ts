/**
 * @fileoverview Phase 1.2: 서비스 별칭 관리자 - ServiceAliasManager TDD 테스트
 * @description ServiceManager의 별칭 관리 기능을 분리
 *
 * Phase 1.2: 서비스 별칭 관리자 - ServiceAliasManager TDD 테스트
 *
 * 목표: ServiceManager의 별칭 관리 기능을 분리
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceAliasManager } from '@shared/services/ServiceAliasManager';

describe('ServiceAliasManager - TDD Phase 1.2', () => {
  let aliasManager: ServiceAliasManager;

  beforeEach(() => {
    aliasManager = new ServiceAliasManager();
  });

  describe('기본 별칭 등록/조회', () => {
    it('별칭을 등록하고 원본 키를 조회할 수 있어야 한다', () => {
      // When: 별칭 등록
      aliasManager.registerAlias('shortName', 'very.long.service.name');

      // Then: 별칭으로 원본 키 조회 가능
      expect(aliasManager.resolveAlias('shortName')).toBe('very.long.service.name');
    });

    it('등록되지 않은 별칭은 원본 키를 그대로 반환해야 한다', () => {
      // When & Then: 등록되지 않은 별칭 조회
      expect(aliasManager.resolveAlias('not-an-alias')).toBe('not-an-alias');
    });

    it('별칭 존재 여부를 확인할 수 있어야 한다', () => {
      // Given: 별칭 등록
      aliasManager.registerAlias('alias', 'original');

      // When & Then: 존재 여부 확인
      expect(aliasManager.hasAlias('alias')).toBe(true);
      expect(aliasManager.hasAlias('non-existent')).toBe(false);
    });
  });

  describe('별칭 체인 방지', () => {
    it('별칭에 대한 별칭 등록을 방지해야 한다', () => {
      // Given: 첫 번째 별칭 등록
      aliasManager.registerAlias('alias1', 'original');

      // When & Then: 별칭에 대한 별칭 등록 시도 시 에러 발생
      expect(() => {
        aliasManager.registerAlias('alias2', 'alias1');
      }).toThrow('Alias chain not supported: alias1 is already an alias');
    });
  });

  describe('별칭 관리', () => {
    it('특정 원본 키의 모든 별칭을 조회할 수 있어야 한다', () => {
      // Given: 같은 원본에 대한 여러 별칭 등록
      aliasManager.registerAlias('short', 'original.service');
      aliasManager.registerAlias('s', 'original.service');
      aliasManager.registerAlias('legacy', 'original.service');

      // When: 원본 키의 별칭들 조회
      const aliases = aliasManager.getAliasesFor('original.service');

      // Then: 모든 별칭이 반환되어야 함
      expect(aliases).toContain('short');
      expect(aliases).toContain('s');
      expect(aliases).toContain('legacy');
      expect(aliases).toHaveLength(3);
    });

    it('별칭이 없는 원본 키는 빈 배열을 반환해야 한다', () => {
      // When & Then: 별칭이 없는 키 조회
      const aliases = aliasManager.getAliasesFor('no-aliases');
      expect(aliases).toEqual([]);
    });
  });

  describe('별칭 제거', () => {
    it('별칭을 제거할 수 있어야 한다', () => {
      // Given: 별칭 등록
      aliasManager.registerAlias('temp-alias', 'original');
      expect(aliasManager.hasAlias('temp-alias')).toBe(true);

      // When: 별칭 제거
      const removed = aliasManager.removeAlias('temp-alias');

      // Then: 별칭이 제거되어야 함
      expect(removed).toBe(true);
      expect(aliasManager.hasAlias('temp-alias')).toBe(false);
      expect(aliasManager.resolveAlias('temp-alias')).toBe('temp-alias');
    });

    it('존재하지 않는 별칭 제거 시 false를 반환해야 한다', () => {
      // When & Then: 존재하지 않는 별칭 제거
      const removed = aliasManager.removeAlias('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('별칭 덮어쓰기', () => {
    it('기본적으로 별칭 덮어쓰기를 허용해야 한다', () => {
      // Given: 첫 번째 별칭 등록
      aliasManager.registerAlias('alias', 'original1');

      // When: 같은 별칭으로 다른 원본에 등록
      aliasManager.registerAlias('alias', 'original2');

      // Then: 새로운 원본이 조회되어야 함
      expect(aliasManager.resolveAlias('alias')).toBe('original2');
    });

    it('allowOverwrite=false일 때 덮어쓰기를 방지해야 한다', () => {
      // Given: 첫 번째 별칭 등록
      aliasManager.registerAlias('alias', 'original1');

      // When & Then: allowOverwrite=false로 덮어쓰기 시도 시 에러 발생
      expect(() => {
        aliasManager.registerAlias('alias', 'original2', false);
      }).toThrow('Alias already exists: alias');
    });
  });

  describe('전체 별칭 목록', () => {
    it('등록된 모든 별칭 목록을 반환할 수 있어야 한다', () => {
      // Given: 여러 별칭 등록
      aliasManager.registerAlias('alias1', 'original1');
      aliasManager.registerAlias('alias2', 'original2');
      aliasManager.registerAlias('alias3', 'original1');

      // When: 전체 별칭 목록 조회
      const allAliases = aliasManager.getAllAliases();

      // Then: 모든 별칭이 포함되어야 함
      expect(allAliases).toContain('alias1');
      expect(allAliases).toContain('alias2');
      expect(allAliases).toContain('alias3');
      expect(allAliases).toHaveLength(3);
    });
  });

  describe('리소스 정리', () => {
    it('reset 메서드로 모든 별칭을 초기화할 수 있어야 한다', () => {
      // Given: 여러 별칭 등록
      aliasManager.registerAlias('alias1', 'original1');
      aliasManager.registerAlias('alias2', 'original2');

      // When: 리셋 실행
      aliasManager.reset();

      // Then: 모든 별칭이 제거되어야 함
      expect(aliasManager.hasAlias('alias1')).toBe(false);
      expect(aliasManager.hasAlias('alias2')).toBe(false);
      expect(aliasManager.getAllAliases()).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('빈 문자열 별칭을 처리할 수 있어야 한다', () => {
      // When & Then: 빈 문자열 별칭 등록/조회
      aliasManager.registerAlias('', 'original');
      expect(aliasManager.resolveAlias('')).toBe('original');
      expect(aliasManager.hasAlias('')).toBe(true);
    });

    it('같은 문자열로 별칭과 원본을 등록할 수 있어야 한다', () => {
      // When: 같은 문자열로 별칭 등록 (자기 참조)
      aliasManager.registerAlias('service', 'service');

      // Then: 정상 동작해야 함
      expect(aliasManager.resolveAlias('service')).toBe('service');
      expect(aliasManager.hasAlias('service')).toBe(true);
    });
  });
});
