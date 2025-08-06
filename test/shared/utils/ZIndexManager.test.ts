/**
 * Z-Index 관리 시스템 테스트
 * @description TDD 방식으로 Z-Index 충돌 방지 시스템 검증
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ZIndexService - Z-Index 충돌 방지 시스템', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 동작', () => {
    it('ZIndexService 클래스가 정상적으로 임포트되어야 한다', async () => {
      const { ZIndexService } = await import('@shared/utils/z-index-service');
      expect(ZIndexService).toBeDefined();
      expect(typeof ZIndexService).toBe('function');
    });

    it('싱글톤 패턴으로 동작해야 한다', async () => {
      const { ZIndexService } = await import('@shared/utils/z-index-service');
      const instance1 = ZIndexService.getInstance();
      const instance2 = ZIndexService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Z-Index 계층 관리', () => {
    it('정의된 계층에 대한 Z-Index 값을 반환해야 한다', async () => {
      const { ZIndexService } = await import('@shared/utils/z-index-service');
      const manager = ZIndexService.getInstance();

      expect(manager.getZIndex('gallery')).toBe(2000);
      expect(manager.getZIndex('toolbar')).toBe(2500);
      expect(manager.getZIndex('modal')).toBe(3000);
      expect(manager.getZIndex('toast')).toBe(4000);
    });

    it('오프셋을 적용한 Z-Index 값을 반환해야 한다', async () => {
      const { ZIndexService } = await import('@shared/utils/z-index-service');
      const manager = ZIndexService.getInstance();

      expect(manager.getZIndex('gallery', 10)).toBe(2010);
      expect(manager.getZIndex('toolbar', -5)).toBe(2495);
    });

    it('정의되지 않은 계층에 대해 에러를 던져야 한다', async () => {
      const { ZIndexService } = await import('@shared/utils/z-index-service');
      const manager = ZIndexService.getInstance();

      expect(() => {
        // @ts-expect-error - 테스트용 잘못된 타입
        manager.getZIndex('invalid');
      }).toThrow('Unknown z-index layer: invalid');
    });
  });

  describe('계층 간 관계 검증', () => {
    it('상위 계층의 Z-Index가 하위 계층보다 높아야 한다', async () => {
      const { ZIndexService } = await import('@shared/utils/z-index-service');
      const manager = ZIndexService.getInstance();

      const gallery = manager.getZIndex('gallery');
      const toolbar = manager.getZIndex('toolbar');
      const modal = manager.getZIndex('modal');
      const toast = manager.getZIndex('toast');

      expect(toolbar).toBeGreaterThan(gallery);
      expect(modal).toBeGreaterThan(toolbar);
      expect(toast).toBeGreaterThan(modal);
    });

    it('계층 간 최소 간격이 유지되어야 한다', async () => {
      const { ZIndexService } = await import('@shared/utils/z-index-service');
      const manager = ZIndexService.getInstance();

      const gallery = manager.getZIndex('gallery');
      const toolbar = manager.getZIndex('toolbar');
      const modal = manager.getZIndex('modal');
      const toast = manager.getZIndex('toast');

      // 최소 100 간격 유지
      expect(toolbar - gallery).toBeGreaterThanOrEqual(100);
      expect(modal - toolbar).toBeGreaterThanOrEqual(100);
      expect(toast - modal).toBeGreaterThanOrEqual(100);
    });
  });

  describe('CSS 변수 생성', () => {
    it('CSS 변수 문자열을 생성해야 한다', async () => {
      const { ZIndexService } = await import('@shared/utils/z-index-service');
      const manager = ZIndexService.getInstance();

      const cssVars = manager.generateCSSVariables();

      expect(cssVars).toContain('--xeg-z-gallery: 2000');
      expect(cssVars).toContain('--xeg-z-toolbar: 2500');
      expect(cssVars).toContain('--xeg-z-modal: 3000');
      expect(cssVars).toContain('--xeg-z-toast: 4000');
    });

    it('CSS 변수가 올바른 형식이어야 한다', async () => {
      const { ZIndexService } = await import('@shared/utils/z-index-service');
      const manager = ZIndexService.getInstance();

      const cssVars = manager.generateCSSVariables();

      // CSS 변수 형식 검증 (--변수명: 값;)
      const cssVariablePattern = /--xeg-z-\w+: \d+;/g;
      const matches = cssVars.match(cssVariablePattern);

      expect(matches).not.toBeNull();
      expect(matches?.length).toBeGreaterThan(0);
    });
  });

  describe('동적 계층 관리', () => {
    it('새로운 계층을 등록할 수 있어야 한다', async () => {
      const { ZIndexService } = await import('@shared/utils/z-index-service');
      const manager = ZIndexService.getInstance();

      manager.registerLayer('custom', 5000);

      expect(manager.getZIndex('custom')).toBe(5000);
    });

    it('기존 계층을 덮어쓸 수 없어야 한다', async () => {
      const { ZIndexService } = await import('@shared/utils/z-index-service');
      const manager = ZIndexService.getInstance();

      expect(() => {
        manager.registerLayer('gallery', 9999);
      }).toThrow('Layer gallery already exists');
    });

    it('충돌하는 Z-Index 값으로 등록할 수 없어야 한다', async () => {
      const { ZIndexService } = await import('@shared/utils/z-index-service');
      const manager = ZIndexService.getInstance();

      expect(() => {
        manager.registerLayer('conflict', 2000); // gallery와 동일
      }).toThrow('Z-Index 2000 is already used by layer: gallery');
    });
  });

  describe('메모리 및 성능', () => {
    it('계층 정보를 캐시해야 한다', async () => {
      const { ZIndexService } = await import('@shared/utils/z-index-service');
      const manager = ZIndexService.getInstance();

      // 첫 번째 호출
      const value1 = manager.getZIndex('gallery');
      // 두 번째 호출 (캐시된 값)
      const value2 = manager.getZIndex('gallery');

      expect(value1).toBe(value2);
    });

    it('리셋 후 기본 상태로 돌아가야 한다', async () => {
      const { ZIndexService } = await import('@shared/utils/z-index-service');
      const manager = ZIndexService.getInstance();

      // 커스텀 계층 추가
      manager.registerLayer('temp', 5500);
      expect(() => manager.getZIndex('temp')).not.toThrow();

      // 리셋
      manager.reset();

      // 커스텀 계층 제거됨
      expect(() => {
        // @ts-expect-error - 테스트용 잘못된 타입
        manager.getZIndex('temp');
      }).toThrow();

      // 기본 계층은 유지됨
      expect(manager.getZIndex('gallery')).toBe(2000);
    });
  });
});
