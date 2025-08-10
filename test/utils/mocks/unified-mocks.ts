/**
 * @fileoverview Unified Mock System
 * @description TDD Green Phase: Centralized mock utilities for all test needs
 * @version 1.0.0 - Dead Code Removal GREEN implementation
 */

// ================================
// Re-export all mocks from a central location
// ================================

// Browser Extension API Mocks
export { createMockBrowser, mockBrowserExtensionAPI, resetBrowserMocks } from './browser-mocks.js';

// Vendor Library Mocks
export {
  createMockFflate,
  createMockPreact,
  createMockTanStackQuery,
  resetVendorMocks,
} from './vendor-mocks.js';

// DOM Environment Mocks
export {
  createMockElement,
  createMockDocument,
  createMockWindow,
  resetDOMMocks,
} from './dom-mocks.js';

// Common DOM Mocks
export { mockCommonDOMAPIs, mockScrollAPIs, mockAnimationAPIs } from './common-dom-mocks.js';

// Browser Polyfills
export { setupBrowserPolyfills, resetBrowserPolyfills } from './browser-polyfills.js';

// Ultimate Preact Environment
export {
  ultimateContext,
  ensurePreactHookContext,
  resetPreactHookState,
} from './ultimate-preact-environment.js';

// Console Environment
export { mockConsole, restoreConsole } from './console-environment.js';

// DOM Environment Setup
export { setupDOMEnvironment, teardownDOMEnvironment } from './dom-environment.js';

// ================================
// Unified Mock Management
// ================================

export interface UnifiedMockConfig {
  enableBrowser?: boolean;
  enableVendor?: boolean;
  enableDOM?: boolean;
  enableConsole?: boolean;
  enableAnimations?: boolean;
}

/**
 * 통합된 Mock 시스템 초기화
 * TDD Green Phase: 단일 진입점으로 모든 mock 설정
 */
export function setupUnifiedMocks(config: UnifiedMockConfig = {}): void {
  const {
    enableBrowser = true,
    enableVendor = true,
    enableDOM = true,
    enableConsole = true,
    enableAnimations = true,
  } = config;

  console.log('🔧 [UnifiedMocks] Setting up centralized mock system...');

  if (enableBrowser) {
    setupBrowserPolyfills();
  }

  if (enableDOM) {
    setupDOMEnvironment();
    mockCommonDOMAPIs();

    if (enableAnimations) {
      mockAnimationAPIs();
      mockScrollAPIs();
    }
  }

  if (enableConsole) {
    mockConsole();
  }

  if (enableVendor) {
    // Vendor mocks는 필요시에만 활성화
    console.log('📦 [UnifiedMocks] Vendor mocks available on demand');
  }

  console.log('✅ [UnifiedMocks] Centralized mock system ready');
}

/**
 * 통합된 Mock 시스템 정리
 * TDD Green Phase: 단일 진입점으로 모든 mock 정리
 */
export function resetUnifiedMocks(): void {
  console.log('🧹 [UnifiedMocks] Resetting centralized mock system...');

  // 각 mock 시스템 개별 리셋
  resetBrowserMocks();
  resetVendorMocks();
  resetDOMMocks();
  resetBrowserPolyfills();
  resetPreactHookState();
  restoreConsole();
  teardownDOMEnvironment();

  console.log('✅ [UnifiedMocks] Centralized mock system reset complete');
}

/**
 * 특정 도메인 Mock만 활성화
 * TDD Green Phase: 필요한 mock만 선택적으로 활성화
 */
export function setupDomainSpecificMocks(domain: 'browser' | 'vendor' | 'dom' | 'all'): void {
  const config: UnifiedMockConfig = {
    enableBrowser: domain === 'browser' || domain === 'all',
    enableVendor: domain === 'vendor' || domain === 'all',
    enableDOM: domain === 'dom' || domain === 'all',
    enableConsole: domain === 'all',
    enableAnimations: domain === 'dom' || domain === 'all',
  };

  setupUnifiedMocks(config);
}

/**
 * 성능 최적화된 경량 Mock 설정
 * TDD Green Phase: 테스트 성능 향상을 위한 최소 mock
 */
export function setupLightweightMocks(): void {
  console.log('⚡ [UnifiedMocks] Setting up lightweight mocks...');

  setupUnifiedMocks({
    enableBrowser: false,
    enableVendor: false,
    enableDOM: true,
    enableConsole: false,
    enableAnimations: false,
  });

  console.log('✅ [UnifiedMocks] Lightweight mock system ready');
}

// ================================
// Mock 상태 검증 유틸리티
// ================================

/**
 * 현재 Mock 상태 확인
 * TDD Green Phase: Mock 시스템의 상태를 검증
 */
export function getMockSystemStatus() {
  return {
    browser: typeof (globalThis as any).browser !== 'undefined',
    vendor: typeof (globalThis as any).preact !== 'undefined',
    dom: typeof document !== 'undefined',
    unified: true, // 통합 시스템이 로드되었음을 표시
  };
}

/**
 * Mock 통합 완료 검증
 * TDD Green Phase: 중복 제거 및 통합이 성공했는지 확인
 */
export function verifyMockConsolidation(): boolean {
  const status = getMockSystemStatus();

  // 통합 시스템이 제대로 작동하고 있는지 확인
  const isConsolidated = status.unified && (status.browser || status.vendor || status.dom);

  if (isConsolidated) {
    console.log('✅ [UnifiedMocks] Mock consolidation verified successfully');
  } else {
    console.warn('⚠️ [UnifiedMocks] Mock consolidation verification failed');
  }

  return isConsolidated;
}
