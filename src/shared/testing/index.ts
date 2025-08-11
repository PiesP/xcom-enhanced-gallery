/**
 * @fileoverview 테스트 전략 통합 - 메인 export
 * TDD Phase 5c: Testing Strategy Unification - Main Exports
 */

// 순수 배럴 유지: 구현/초기화 로직은 init.ts로 이동

// 핵심 클래스들
export { TestHarness } from './TestHarness';
export { StandardMockFactory } from './StandardMockFactory';
export { TestSuite } from './TestSuite';
export { TestReporter } from './TestReporter';

// 유틸리티 함수들
export { createTestEnvironment } from './environment';
export { createDOMMock, createServiceMock, createAPIMock, createEventMock } from './mocks';

// 성능 테스트
export { performanceTest, benchmarkTest, throughputTest, validatePerformance } from './performance';

// 메타데이터 시스템
export {
  addTestMetadata,
  getTestMetadata,
  getAllTestMetadata,
  filterTestsByMetadata,
  clearTestMetadata,
  createTestMetadataDecorator,
} from './metadata';

// 카테고리 시스템
export { TestCategory, CATEGORY_CONFIG } from './categories';

export type {
  TestContext,
  TestContextType,
  MockConfig,
  MockConfigType,
  TestEnvironmentConfig,
  TestResult,
  TestMetadata,
  TestSuiteResult,
  PerformanceTestResult,
  Snapshot,
} from './types';

export type { TestReport } from './TestReporter';

// 기본 설정
export { DEFAULT_TEST_CONFIG, initializeTestingFramework } from './init';
