/**
 * @fileoverview 테스트 전략 통합 - 메인 export
 * TDD Phase 5c: Testing Strategy Unification - Main Exports
 */

import { TestHarness } from './TestHarness';
import { StandardMockFactory } from './StandardMockFactory';
import { TestReporter } from './TestReporter';

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
export const DEFAULT_TEST_CONFIG = {
  timeout: 30000,
  retries: 2,
  isolation: true,
  parallel: true,
} as const;

// 테스트 환경 초기화 헬퍼
export async function initializeTestingFramework(): Promise<{
  harness: TestHarness;
  mockFactory: StandardMockFactory;
  reporter: TestReporter;
}> {
  const harness = new TestHarness();
  const mockFactory = new StandardMockFactory();
  const reporter = new TestReporter();

  await harness.setup();

  return { harness, mockFactory, reporter };
}
