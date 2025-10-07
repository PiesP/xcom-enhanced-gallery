/**
 * Vendor 라이브러리 모킹 유틸리티
 * Solid.js 중심으로 프로젝트의 vendors getter 패턴에 맞는 테스트 Mock 제공
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
    animate: vi.fn().mockImplementation(async (element, keyframes) => {
      // 즉시 완료되는 애니메이션 시뮬레이션
      if (element && typeof element === 'object' && 'style' in element) {
        Object.assign(element.style, keyframes);
      }
      return Promise.resolve();
    }),

    scroll: vi.fn().mockImplementation(onScroll => {
      // 스크롤 이벤트 시뮬레이션
      onScroll({ scrollY: 0, scrollX: 0 });
      return vi.fn(); // cleanup function
    }),

    timeline: vi.fn().mockImplementation(async () => {
      // 타임라인 애니메이션 즉시 완료
      return Promise.resolve();
    }),

    stagger: vi.fn().mockImplementation((duration = 0.1) => {
      return vi.fn().mockImplementation(index => index * duration);
    }),
  };
}

// ================================
// Vendor Manager Mock
// ================================

/**
 * Vendor Manager Mock 클래스
 * 실제 프로젝트의 VendorManager와 호환되는 인터페이스 (Solid.js 전용)
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
 * 전역 vendor getter Mock 설정
 */
export function setupVendorMocks() {
  const mockManager = MockVendorManager.getInstance();

  // @shared/external/vendors 모듈 Mock
  vi.doMock('@shared/external/vendors', () => ({
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
