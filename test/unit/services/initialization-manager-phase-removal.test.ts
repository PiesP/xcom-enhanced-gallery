/**
 * @fileoverview InitializationManager APP 단계 제거 테스트
 * @description TDD RED Phase - APP 단계 제거 후 phase 수 검증
 */

import { describe, it, expect } from 'vitest';
import { InitializationManager, InitializationPhase } from '@shared/services/InitializationManager';

describe('InitializationManager APP Phase Removal (RED)', () => {
  it('should only have VENDOR and STYLES phases after APP removal', () => {
    // APP 단계가 제거된 후 enum 값 확인
    const phases = Object.values(InitializationPhase);

    expect(phases).toContain(InitializationPhase.VENDOR);
    expect(phases).toContain(InitializationPhase.STYLES);
    expect(phases).not.toContain('app'); // APP 단계는 더 이상 존재하지 않아야 함
    expect(phases.length).toBe(2); // VENDOR, STYLES만 남아야 함
  });

  it('should report only 2 phases in status report', async () => {
    const manager = new InitializationManager(true);

    // 순차 초기화 실행
    await manager.initializeSequentially();

    const report = manager.getStatusReport();
    const reportLines = report.split('\n').filter(line => line.trim());

    // 2개 phase만 리포트되어야 함 (VENDOR, STYLES)
    expect(reportLines.length).toBe(2);
    expect(report).toContain('vendor:');
    expect(report).toContain('styles:');
    expect(report).not.toContain('app:');
  });

  it('should complete sequential initialization with 2 phases only', async () => {
    const manager = new InitializationManager(true);

    const success = await manager.initializeSequentially();

    expect(success).toBe(true);

    // 내부 상태 확인 (private이지만 성공 여부로 추론)
    const report = manager.getStatusReport();
    const successfulPhases = (report.match(/success/g) || []).length;

    expect(successfulPhases).toBe(2); // VENDOR, STYLES 만 성공해야 함
  });
});
