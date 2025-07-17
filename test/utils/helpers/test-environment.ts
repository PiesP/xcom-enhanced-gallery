/**
 * 통합 테스트 환경 설정 헬퍼
 * 모든 Mock과 환경 설정을 통합 관리
 */

import { vi } from 'vitest';
import {
  setupDOMEnvironment,
  cleanupDOMEnvironment,
  createMockElement,
  createMockImageElement,
  createMockVideoElement,
} from '../mocks/dom-mocks';
import {
  setupBrowserExtensionEnvironment,
  cleanupBrowserExtensionEnvironment,
} from '../mocks/browser-mocks';
import { setupVendorMocks, cleanupVendorMocks } from '../mocks/vendor-mocks';

// ================================
// Re-exports for convenience
// ================================

export {
  createMockElement,
  createMockImageElement,
  createMockVideoElement,
} from '../mocks/dom-mocks';

// ================================
// 통합 테스트 환경 설정
// ================================

/**
 * 전체 테스트 환경 설정
 * DOM, 브라우저 확장, Vendor 라이브러리 모든 Mock 설정
 */
export function setupTestEnvironment() {
  // 1. DOM 환경 설정
  setupDOMEnvironment();

  // 2. 브라우저 확장 환경 설정
  const browserMock = setupBrowserExtensionEnvironment();

  // 3. Vendor 라이브러리 Mock 설정
  const vendorMock = setupVendorMocks();

  // 4. 추가 Web API Mock
  setupAdditionalWebAPIs();

  return {
    browserMock,
    vendorMock,
  };
}

/**
 * 전체 테스트 환경 정리
 */
export function cleanupTestEnvironment() {
  // 역순으로 정리
  cleanupVendorMocks();
  cleanupBrowserExtensionEnvironment();
  cleanupDOMEnvironment();
  cleanupAdditionalWebAPIs();

  // 모든 Mock 초기화
  vi.clearAllMocks();
}

// ================================
// 추가 Web API Mock 설정
// ================================

/**
 * 추가 Web API Mock 설정
 */
function setupAdditionalWebAPIs() {
  // Console Mock (선택적)
  if (!global.console) {
    global.console = {
      log: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      group: vi.fn(),
      groupEnd: vi.fn(),
      groupCollapsed: vi.fn(),
      clear: vi.fn(),
      count: vi.fn(),
      countReset: vi.fn(),
      assert: vi.fn(),
      dir: vi.fn(),
      dirxml: vi.fn(),
      table: vi.fn(),
      time: vi.fn(),
      timeEnd: vi.fn(),
      timeLog: vi.fn(),
      timeStamp: vi.fn(),
      trace: vi.fn(),
      profile: vi.fn(),
      profileEnd: vi.fn(),
    } as any;
  }

  // Performance Mock
  if (!global.performance) {
    global.performance = {
      now: vi.fn().mockReturnValue(Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
      getEntries: vi.fn().mockReturnValue([]),
      getEntriesByName: vi.fn().mockReturnValue([]),
      getEntriesByType: vi.fn().mockReturnValue([]),
      navigation: {
        type: 0,
        redirectCount: 0,
      },
      timing: {
        navigationStart: Date.now(),
        loadEventEnd: Date.now(),
      },
    } as any;
  }

  // Crypto Mock (간단한 구현)
  if (!global.crypto) {
    global.crypto = {
      getRandomValues: vi.fn().mockImplementation(array => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      }),
      randomUUID: vi.fn().mockImplementation(() => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }),
    } as any;
  }

  // Blob Mock
  if (!global.Blob) {
    global.Blob = class MockBlob {
      size = 0;
      type = '';

      constructor(blobParts = [], options = {}) {
        this.type = (options as any).type || '';
        this.size = blobParts.reduce((size, part) => {
          if (typeof part === 'string') {
            return size + part.length;
          }
          return size + (part.byteLength || part.length || 0);
        }, 0);
      }

      slice() {
        return new MockBlob();
      }

      stream() {
        return new ReadableStream();
      }

      async text() {
        return '';
      }

      async arrayBuffer() {
        return new ArrayBuffer(0);
      }
    } as any;
  }

  // File Mock
  if (!global.File) {
    global.File = class MockFile extends global.Blob {
      name = '';
      lastModified = Date.now();
      webkitRelativePath = '';

      constructor(fileBits, fileName, options = {}) {
        super(fileBits, options);
        this.name = fileName;
        this.lastModified = (options as any).lastModified || Date.now();
      }
    } as any;
  }
}

/**
 * 추가 Web API Mock 정리
 */
function cleanupAdditionalWebAPIs() {
  delete (global as any).performance;
  delete (global as any).crypto;
  delete (global as any).Blob;
  delete (global as any).File;
}

// ================================
// 개별 환경 설정 함수들
// ================================

/**
 * 최소한의 테스트 환경 설정 (DOM만)
 */
export function setupMinimalTestEnvironment() {
  setupDOMEnvironment();
  return { cleanup: cleanupDOMEnvironment };
}

/**
 * 브라우저 전용 테스트 환경 설정
 */
export function setupBrowserTestEnvironment() {
  setupDOMEnvironment();
  const browserMock = setupBrowserExtensionEnvironment();

  return {
    browserMock,
    cleanup: () => {
      cleanupBrowserExtensionEnvironment();
      cleanupDOMEnvironment();
    },
  };
}

/**
 * 컴포넌트 테스트 환경 설정 (Preact 포함)
 */
export function setupComponentTestEnvironment() {
  setupDOMEnvironment();
  const vendorMock = setupVendorMocks();

  return {
    vendorMock,
    cleanup: () => {
      cleanupVendorMocks();
      cleanupDOMEnvironment();
    },
  };
}
