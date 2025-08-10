/**
 * @fileoverview 테스트 스위트 관리자
 * TDD Phase 5c: Testing Strategy Unification - Test Suite
 */

import type { TestResult, TestSuiteResult } from './types';

/**
 * TestSuite - 테스트 그룹 관리
 */
export class TestSuite {
  private readonly tests = new Map<string, () => Promise<boolean>>();
  private startTime = 0;

  constructor(private readonly name: string) {}

  /**
   * 테스트 추가
   */
  addTest(testName: string, testFn: () => Promise<boolean>): void {
    this.tests.set(testName, testFn);
  }

  /**
   * 테스트 스위트 실행
   */
  async run(): Promise<TestSuiteResult> {
    this.startTime = Date.now();
    const results: TestResult[] = [];
    let passed = 0;
    let failed = 0;

    for (const [testName, testFn] of this.tests) {
      const testStartTime = Date.now();
      let testResult: TestResult;

      try {
        const success = await testFn();
        const duration = Date.now() - testStartTime;

        testResult = {
          name: testName,
          passed: success,
          duration,
        };

        if (success) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        const duration = Date.now() - testStartTime;
        testResult = {
          name: testName,
          passed: false,
          duration,
          error: error instanceof Error ? error : new Error(String(error)),
        };
        failed++;
      }

      results.push(testResult);
    }

    const totalDuration = Date.now() - this.startTime;

    return {
      name: this.name,
      total: this.tests.size,
      passed,
      failed,
      skipped: 0,
      duration: totalDuration,
      results,
    };
  }

  /**
   * 테스트 개수 조회
   */
  get testCount(): number {
    return this.tests.size;
  }

  /**
   * 테스트 목록 조회
   */
  get testNames(): string[] {
    return Array.from(this.tests.keys());
  }
}
