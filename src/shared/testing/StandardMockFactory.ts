/**
 * @fileoverview 표준 Mock 팩토리
 * TDD Phase 5c: Testing Strategy Unification - Mock System
 */

import type { MockConfig } from './types';

// Mock 함수 타입 정의
interface MockFunction {
  (...args: unknown[]): unknown;
  mockReturnValue: (value: unknown) => MockFunction;
  mockResolvedValue: (value: unknown) => MockFunction;
  mockImplementation: (impl: (...args: unknown[]) => unknown) => MockFunction;
}

/**
 * 간단한 Mock 함수 생성
 */
function createMockFunction(): MockFunction {
  const fn = (..._args: unknown[]) => undefined;

  fn.mockReturnValue = (value: unknown) => {
    Object.defineProperty(fn, 'returnValue', { value, configurable: true });
    return fn;
  };

  fn.mockResolvedValue = (value: unknown) => {
    Object.defineProperty(fn, 'resolvedValue', {
      value: Promise.resolve(value),
      configurable: true,
    });
    return fn;
  };

  fn.mockImplementation = (impl: (...args: unknown[]) => unknown) => {
    Object.defineProperty(fn, 'implementation', { value: impl, configurable: true });
    return fn;
  };

  return fn as MockFunction;
}

/**
 * StandardMockFactory - 일관된 Mock 생성 도구
 */
export class StandardMockFactory {
  private readonly mocks = new Map<string, unknown>();

  /**
   * 서비스 Mock 생성
   */
  createService(serviceName: string): {
    getInstance: MockFunction;
    resetInstance: MockFunction;
  } {
    const mockService = {
      getInstance: createMockFunction().mockReturnValue({}),
      resetInstance: createMockFunction(),
    };

    this.mocks.set(`service:${serviceName}`, mockService);
    return mockService;
  }

  /**
   * API Mock 생성
   */
  createAPI(apiName: string): {
    get: MockFunction;
    post: MockFunction;
    put: MockFunction;
    delete: MockFunction;
  } {
    const mockAPI = {
      get: createMockFunction().mockResolvedValue({ data: {} }),
      post: createMockFunction().mockResolvedValue({ data: {} }),
      put: createMockFunction().mockResolvedValue({ data: {} }),
      delete: createMockFunction().mockResolvedValue({ data: {} }),
    };

    this.mocks.set(`api:${apiName}`, mockAPI);
    return mockAPI;
  }

  /**
   * 설정 기반 Mock 생성
   */
  createMock(config: MockConfig): unknown {
    const { type, name, implementation } = config;

    let mock: unknown;
    switch (type) {
      case 'service':
        mock = this.createService(name);
        break;
      case 'api':
        mock = this.createAPI(name);
        break;
      case 'dom':
        mock = this.createDOMMock();
        break;
      case 'custom':
        mock = implementation || {};
        break;
      default:
        mock = {};
    }

    this.mocks.set(`${type}:${name}`, mock);
    return mock;
  }

  /**
   * DOM Mock 생성
   */
  private createDOMMock(): {
    createElement: MockFunction;
    querySelector: MockFunction;
    addEventListener: MockFunction;
  } {
    return {
      createElement: createMockFunction().mockImplementation((args: unknown) => {
        const tag = typeof args === 'string' ? args : 'div';
        return {
          tagName: tag,
          setAttribute: createMockFunction(),
          getAttribute: createMockFunction(),
          addEventListener: createMockFunction(),
          removeEventListener: createMockFunction(),
        };
      }),
      querySelector: createMockFunction().mockReturnValue(null),
      addEventListener: createMockFunction(),
    };
  }

  /**
   * Mock 조회
   */
  getMock(key: string): unknown {
    return this.mocks.get(key);
  }

  /**
   * 모든 Mock 정리
   */
  clearAll(): void {
    this.mocks.clear();
  }
}
