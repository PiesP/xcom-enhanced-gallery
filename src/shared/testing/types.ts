/**
 * @fileoverview 테스트 전략 통합 타입 정의
 * TDD Phase 5c: Testing Strategy Unification - Type System
 */

// 테스트 컨텍스트 타입
export interface TestContext {
  scenarioName: string;
  startTime: number;
  dom: Document;
  window: Window;
  mocks: Map<string, unknown>;
  cleanup: () => Promise<void>;
}

export type TestContextType = TestContext;

// Mock 설정 타입
export interface MockConfig {
  type: 'dom' | 'service' | 'api' | 'custom';
  name: string;
  implementation?: unknown;
  autoCleanup?: boolean;
}

export type MockConfigType = MockConfig;

// 테스트 환경 설정
export interface TestEnvironmentConfig {
  scenario: string;
  mocks: string[];
  timeout?: number;
  isolated?: boolean;
}

// 테스트 결과 타입
export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: Error;
  metadata?: TestMetadata;
}

// 테스트 메타데이터
export interface TestMetadata {
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  author?: string;
  description?: string;
  timeout?: number;
}

// 테스트 스위트 결과
export interface TestSuiteResult {
  name: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestResult[];
}

// 성능 테스트 결과
export interface PerformanceTestResult {
  duration: number;
  memoryUsage: {
    used: number;
    total: number;
  };
  operations?: number;
  throughput?: number;
}

// 스냅샷 타입
export interface Snapshot {
  type: 'dom' | 'data' | 'image';
  content: string;
  timestamp: number;
  match: (content: string) => boolean;
}
