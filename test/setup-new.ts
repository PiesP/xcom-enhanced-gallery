/**
 * Vitest 테스트 환경 설정 (간소화된 버전)
 * 필수적인 전역 설정만 포함, 나머지는 테스트별로 개별 설정
 */

import '@testing-library/jest-dom';
import { beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from './utils';

// ================================
// 전역 테스트 환경 설정
// ================================

// 각 테스트 실행 전 환경 설정
beforeEach(() => {
  // Mock 초기화
  vi.clearAllMocks();

  // 기본 테스트 환경 설정
  setupTestEnvironment();
});

// 각 테스트 실행 후 정리
afterEach(() => {
  // 테스트 환경 정리
  cleanupTestEnvironment();
});
