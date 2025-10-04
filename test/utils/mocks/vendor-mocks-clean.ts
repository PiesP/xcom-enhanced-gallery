/**
 * Vendor 라이브러리 모킹 유틸리티 (SolidJS 전용 - Clean)
 * Phase D: Preact 레거시 모킹 제거 완료
 * 프로젝트의 vendors getter 패턴에 맞는 테스트 Mock
 */

import { vi } from 'vitest';

// ================================
// Mock Vendor Implementations
// ================================

/**
 * Mock Motion API 생성
 */
export function createMockMotion() {
  return {
    animate: vi.fn().mockImplementation(async (element, keyframes, options) => {
      // 즉시 완료되는 애니메이션 시뮬레이션
      if (element && typeof element === 'object' && 'style' in element) {
        Object.assign(element.style, keyframes);
      }
      return Promise.resolve();
    }),

    scroll: vi.fn().mockImplementation((onScroll, options) => {
      // 스크롤 이벤트 시뮬레이션
      const handler = () => onScroll({ scrollY: 0, scrollX: 0 });
      return vi.fn(); // cleanup function
    }),

    timeline: vi.fn().mockImplementation(async (keyframes, options) => {
      // 타임라인 애니메이션 즉시 완료
      return Promise.resolve();
    }),

    stagger: vi.fn().mockImplementation((duration = 0.1, options) => {
      return vi.fn().mockImplementation(index => index * duration);
    }),
  };
}

// ================================
// Vendor Manager Mock (SolidJS Only)
// ================================

/**
 * Vendor Manager Mock 클래스
 * Phase D: SolidJS 전용으로 정리됨
 */
export class MockVendorManager {
  static instance = null;
  cache = new Map();

  static getInstance() {
    MockVendorManager.instance ??= new MockVendorManager();
    return MockVendorManager.instance;
  }

  static resetInstance() {
    MockVendorManager.instance = null;
  }

  getMotion() {
    if (!this.cache.has('motion')) {
      this.cache.set('motion', createMockMotion());
    }
    return this.cache.get('motion');
  }

  // 테스트 헬퍼 메서드
  clearCache() {
    this.cache.clear();
  }
}

// ================================
// Vendor Mock Setup Functions
// ================================

/**
 * 전역 vendor getter Mock 설정 (SolidJS 전용)
 */
export function setupVendorMocks() {
  const mockManager = MockVendorManager.getInstance();

  // @shared/external/vendors 모듈 Mock
  vi.doMock('@shared/external/vendors', () => ({
    __esModule: true,
    getMotion: () => mockManager.getMotion(),
  }));

  return mockManager;
}

/**
 * Vendor Mock 정리
 */
export function cleanupVendorMocks() {
  MockVendorManager.resetInstance();
  vi.clearAllMocks();
}
