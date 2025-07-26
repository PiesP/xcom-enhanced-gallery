/**
 * Vitest 테스트 환경 설정
 * 새로운 모듈화된 테스트 인프라 사용
 */

import '@testing-library/jest-dom';
import { beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from './utils/helpers/test-environment';

// ================================
// 전역 테스트 환경 설정
// ================================

/**
 * 각 테스트 전에 기본 환경 설정
 * 모든 테스트가 깨끗한 환경에서 실행되도록 보장
 */
beforeEach(async () => {
  // 기본 테스트 환경 설정 (minimal)
  await setupTestEnvironment('minimal');
});

/**
 * 각 테스트 후에 환경 정리
 * 메모리 누수 방지 및 테스트 격리 보장
 */
afterEach(async () => {
  await cleanupTestEnvironment();
});

// ================================
// 환경 사용 가이드
// ================================
// 이 파일은 vitest.config.ts의 setupFiles에서 자동으로 로드됩니다
// 개별 테스트에서 특별한 환경이 필요한 경우:
// - setupTestEnvironment('component') : DOM + 브라우저 확장 + 컴포넌트 환경
// - setupTestEnvironment('browser') : DOM + 브라우저 확장 환경
// - setupTestEnvironment('full') : 모든 환경 + 샘플 데이터
// - setupTestEnvironment('minimal') : 기본 환경 (기본값)
