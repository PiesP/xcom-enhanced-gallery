/**
 * @fileoverview Core Types TDD 테스트
 * @description TDD 기반으로 핵심 타입 정의 검증
 */

import { describe, it, expect } from 'vitest';
import type {
  Result,
  AsyncResult,
  ServiceLifecycle,
  ComponentProps,
  EventHandler,
} from '@shared/types/core/core-types';

describe('Core Types TDD 테스트', () => {
  describe('🔴 RED: Result 패턴 검증', () => {
    it('성공적인 Result 타입이 정의되어야 한다', () => {
      const successResult: Result<string, Error> = {
        success: true,
        data: 'test data',
      };

      expect(successResult.success).toBe(true);
      expect(successResult.data).toBe('test data');
      expect('error' in successResult).toBe(false);
    });

    it('실패한 Result 타입이 정의되어야 한다', () => {
      const errorResult: Result<string, Error> = {
        success: false,
        error: new Error('Test error'),
      };

      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toBeInstanceOf(Error);
      expect('data' in errorResult).toBe(false);
    });

    it('AsyncResult 타입이 Promise를 반환해야 한다', async () => {
      const asyncSuccess: AsyncResult<number> = Promise.resolve({
        success: true,
        data: 42,
      });

      const result = await asyncSuccess;
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });
  });

  describe('🟢 GREEN: 서비스 생명주기 검증', () => {
    it('ServiceLifecycle 인터페이스가 정의되어야 한다', () => {
      const service: ServiceLifecycle = {
        initialize: async () => ({ success: true, data: undefined }),
        cleanup: async () => ({ success: true, data: undefined }),
        isReady: () => true,
      };

      expect(typeof service.initialize).toBe('function');
      expect(typeof service.cleanup).toBe('function');
      expect(typeof service.isReady).toBe('function');
      expect(service.isReady()).toBe(true);
    });

    it('ServiceLifecycle의 메서드들이 올바른 반환 타입을 가져야 한다', async () => {
      const service: ServiceLifecycle = {
        initialize: async () => ({ success: true, data: undefined }),
        cleanup: async () => ({ success: false, error: new Error('cleanup failed') }),
        isReady: () => false,
      };

      const initResult = await service.initialize();
      expect(initResult.success).toBe(true);

      const cleanupResult = await service.cleanup();
      expect(cleanupResult.success).toBe(false);
      if (!cleanupResult.success) {
        expect(cleanupResult.error).toBeInstanceOf(Error);
      }
    });
  });

  describe('🔵 REFACTOR: 컴포넌트 Props 검증', () => {
    it('ComponentProps가 기본 HTML 속성을 확장해야 한다', () => {
      const props: ComponentProps<'div'> = {
        className: 'test-class',
        'data-testid': 'test-component',
        onClick: () => {},
        children: 'Test content',
      };

      expect(props.className).toBe('test-class');
      expect(props['data-testid']).toBe('test-component');
      expect(typeof props.onClick).toBe('function');
      expect(props.children).toBe('Test content');
    });

    it('EventHandler 타입이 이벤트 핸들러를 올바르게 정의해야 한다', () => {
      const clickHandler: EventHandler<MouseEvent> = event => {
        expect(event).toBeDefined();
        expect(event.type).toBeDefined();
      };

      const mockEvent = new MouseEvent('click');
      clickHandler(mockEvent);
    });

    it('제네릭 타입들이 타입 안전성을 보장해야 한다', () => {
      // Result 제네릭 테스트
      const stringResult: Result<string> = { success: true, data: 'test' };
      const numberResult: Result<number> = { success: true, data: 123 };
      const booleanResult: Result<boolean> = { success: false, error: new Error() };

      expect(typeof stringResult.data).toBe('string');
      expect(typeof numberResult.data).toBe('number');
      expect(booleanResult.success).toBe(false);
    });
  });
});
