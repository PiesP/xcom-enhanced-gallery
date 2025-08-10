/**
 * @fileoverview 테스트 결과 리포터
 * TDD Phase 5c: Testing Strategy Unification - Test Reporter
 */

import type { TestSuiteResult, TestResult } from './types';

export interface TestReport {
  suites: number;
  tests: number;
  passed: number;
  failed: number;
  duration: number;
}

/**
 * TestReporter - 테스트 결과 포매터
 */
export class TestReporter {
  /**
   * 테스트 리포트 생성
   */
  generateReport(stats: TestReport): string {
    const { suites, tests, passed, failed, duration } = stats;
    const successRate = tests > 0 ? ((passed / tests) * 100).toFixed(1) : '0.0';
    const durationInSeconds = (duration / 1000).toFixed(2);

    return [
      '📊 Test Report',
      '================',
      `Test Suites: ${suites}`,
      `Tests: ${tests} total`,
      `✅ Passed: ${passed}`,
      `❌ Failed: ${failed}`,
      `📈 Success Rate: ${successRate}%`,
      `⏱️ Duration: ${durationInSeconds}s`,
      '',
    ].join('\n');
  }

  /**
   * 상세 스위트 리포트 생성
   */
  generateSuiteReport(suiteResult: TestSuiteResult): string {
    const { name, total, passed, failed, duration, results } = suiteResult;
    const lines: string[] = [
      `📋 Suite: ${name}`,
      `Tests: ${total}, Passed: ${passed}, Failed: ${failed}`,
      `Duration: ${(duration / 1000).toFixed(2)}s`,
      '',
    ];

    // 실패한 테스트만 표시
    const failedTests = results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      lines.push('❌ Failed Tests:');
      failedTests.forEach(test => {
        lines.push(`  - ${test.name}: ${test.error?.message || 'Unknown error'}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * JSON 형태 리포트 생성
   */
  generateJSONReport(stats: TestReport): string {
    return JSON.stringify(stats, null, 2);
  }

  /**
   * CSV 형태 리포트 생성
   */
  generateCSVReport(results: TestResult[]): string {
    const headers = ['Test Name', 'Status', 'Duration (ms)', 'Error'];
    const rows = results.map(r => [
      r.name,
      r.passed ? 'PASS' : 'FAIL',
      r.duration.toString(),
      r.error?.message || '',
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  /**
   * 간단한 상태 표시
   */
  generateStatusLine(stats: TestReport): string {
    const { tests, passed, failed } = stats;
    const icon = failed === 0 ? '✅' : '❌';
    return `${icon} ${passed}/${tests} tests passed`;
  }
}
