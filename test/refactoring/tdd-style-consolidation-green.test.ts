/**
 * @fileoverview TDD GREEN Phase: 통합 StyleService 기능 검증
 * @description StyleService가 정상적으로 작동하는지 검증하는 간단한 테스트
 * @version 1.0.0 - GREEN Phase
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';

// DOM 모킹을 최소화하고 기본 기능만 테스트
describe('🟢 TDD GREEN Phase: StyleService 기본 기능 검증', () => {
  // 전역 DOM API 모킹
  beforeAll(() => {
    global.window = {
      matchMedia: vi.fn(() => ({ matches: false })),
    } as any;

    global.document = {
      documentElement: {
        style: { setProperty: vi.fn(), getPropertyValue: vi.fn() },
        classList: { add: vi.fn(), remove: vi.fn(), toggle: vi.fn() },
        setAttribute: vi.fn(),
      },
      createElement: vi.fn(() => ({
        style: { setProperty: vi.fn() },
        classList: { add: vi.fn(), remove: vi.fn(), toggle: vi.fn() },
      })),
      getElementById: vi.fn(() => null),
      head: { appendChild: vi.fn() },
    } as any;

    global.getComputedStyle = vi.fn(() => ({
      getPropertyValue: vi.fn(() => 'test-value'),
    }));
  });

  describe('StyleService Import 및 기본 구조', () => {
    it('StyleService를 성공적으로 import할 수 있어야 함', async () => {
      const module = await import('../../src/shared/services/style-service');

      expect(module.default).toBeDefined();
      expect(module.styleService).toBeDefined();
      expect(typeof module.default).toBe('function'); // 클래스는 함수
    });

    it('styleService 인스턴스가 존재해야 함', async () => {
      const { styleService } = await import('../../src/shared/services/style-service');

      expect(styleService).toBeDefined();
      expect(typeof styleService).toBe('object');
    });
  });

  describe('핵심 기능 동작 확인', () => {
    it('combineClasses 함수가 정상 작동해야 함', async () => {
      const { styleService } = await import('../../src/shared/services/style-service');

      // combineClasses 메서드 존재 확인
      expect(typeof styleService.combineClasses).toBe('function');

      // 기본 동작 테스트
      const result = styleService.combineClasses('a', null, 'b', false, 'c');
      expect(result).toBe('a b c');
    });

    it('setCSSVariable 함수가 존재하고 호출 가능해야 함', async () => {
      const { styleService } = await import('../../src/shared/services/style-service');

      expect(typeof styleService.setCSSVariable).toBe('function');

      // 에러 없이 호출되는지 확인
      expect(() => {
        styleService.setCSSVariable('test', 'value');
      }).not.toThrow();
    });

    it('기본 메서드들이 모두 존재해야 함', async () => {
      const { styleService } = await import('../../src/shared/services/style-service');

      const requiredMethods = [
        'combineClasses',
        'setCSSVariable',
        'getCSSVariable',
        'applyGlassmorphism',
        'setTheme',
        'updateComponentState',
        'toggleClass',
        'cleanup',
        'getActiveResources',
      ];

      requiredMethods.forEach(method => {
        expect(typeof styleService[method]).toBe('function');
      });
    });
  });

  describe('싱글톤 패턴 검증', () => {
    it('getInstance()가 항상 같은 인스턴스를 반환해야 함', async () => {
      const { default: StyleService } = await import('../../src/shared/services/style-service');

      const instance1 = StyleService.getInstance();
      const instance2 = StyleService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('export된 styleService가 싱글톤 인스턴스여야 함', async () => {
      const { default: StyleService, styleService } = await import(
        '../../src/shared/services/style-service'
      );

      const instance = StyleService.getInstance();
      expect(styleService).toBe(instance);
    });
  });

  describe('안전성 검증', () => {
    it('잘못된 인수로 호출해도 에러가 발생하지 않아야 함', async () => {
      const { styleService } = await import('../../src/shared/services/style-service');

      expect(() => {
        styleService.combineClasses();
        styleService.combineClasses(null, undefined, false);
        styleService.setCSSVariable('', '');
      }).not.toThrow();
    });

    it('cleanup 호출이 안전해야 함', async () => {
      const { styleService } = await import('../../src/shared/services/style-service');

      expect(() => {
        styleService.cleanup();
        styleService.cleanup(); // 두 번 호출해도 안전해야 함
      }).not.toThrow();
    });
  });

  describe('리소스 관리', () => {
    it('getActiveResources가 숫자를 반환해야 함', async () => {
      const { styleService } = await import('../../src/shared/services/style-service');

      const resourceCount = styleService.getActiveResources();
      expect(typeof resourceCount).toBe('number');
      expect(resourceCount).toBeGreaterThanOrEqual(0);
    });
  });
});
