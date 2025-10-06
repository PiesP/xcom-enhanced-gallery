/**
 * CodeQL 표준 쿼리 팩 실행 검증 테스트
 *
 * Epic: CODEQL-STANDARD-QUERY-PACKS
 * Phase: 1 (RED)
 *
 * 목적: 현재 CodeQL이 표준 보안 쿼리를 실행하지 않음을 증명
 *
 * CI 전용: 로컬 환경에서는 SARIF 파일이 필요하므로 skip
 *
 * Acceptance:
 * - SARIF에 실제 JavaScript 보안 규칙 존재 (js/로 시작)
 * - "Hello, world!" 테스트 쿼리만 있는 상태 감지
 * - 개선 계획에 의미 있는 보안 권고 포함
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..', '..');
const sarifPath = resolve(projectRoot, 'codeql-results.sarif');
const improvementPlanPath = resolve(projectRoot, 'codeql-improvement-plan.md');

// CI 환경 감지: SARIF 파일이 없으면 skip
const isCI = (typeof process !== 'undefined' && process.env.CI === 'true') || existsSync(sarifPath);
const describeCI = isCI ? describe : describe.skip;

describeCI('CodeQL 표준 쿼리 팩 실행 검증 (Epic: CODEQL-STANDARD-QUERY-PACKS)', () => {
  describe('Task 1.1: SARIF 결과 검증', () => {
    it('codeql-results.sarif 파일이 존재해야 함', () => {
      expect(
        existsSync(sarifPath),
        `CodeQL SARIF 파일이 존재하지 않습니다: ${sarifPath}\n` +
          'npm run codeql:scan 명령을 먼저 실행하세요.'
      ).toBe(true);
    });

    it('SARIF 파일 크기가 100KB 이상이어야 함 (실제 분석 수행 확인)', () => {
      const stats = statSync(sarifPath);
      const sizeKB = stats.size / 1024;

      expect(
        sizeKB,
        `SARIF 파일 크기가 너무 작습니다: ${sizeKB.toFixed(2)} KB\n` +
          '표준 쿼리 팩 실행 시 일반적으로 수백 KB 이상이어야 합니다.'
      ).toBeGreaterThan(100);
    });

    it('SARIF에 실제 JavaScript 보안 규칙이 포함되어야 함 (js/로 시작)', () => {
      const sarifContent = readFileSync(sarifPath, 'utf8');
      const sarif = JSON.parse(sarifContent);

      // SARIF 구조 검증
      expect(sarif.runs).toBeDefined();
      expect(Array.isArray(sarif.runs)).toBe(true);
      expect(sarif.runs.length).toBeGreaterThan(0);

      // 모든 ruleId 수집
      const ruleIds = new Set<string>();

      for (const run of sarif.runs) {
        // 규칙 정의에서 수집
        if (run.tool?.driver?.rules) {
          for (const rule of run.tool.driver.rules) {
            if (rule.id) {
              ruleIds.add(rule.id);
            }
          }
        }

        // 결과에서 수집
        if (run.results) {
          for (const result of run.results) {
            const ruleId = result.ruleId || result.rule?.id;
            if (ruleId) {
              ruleIds.add(ruleId);
            }
          }
        }
      }

      // js/로 시작하는 실제 보안 규칙 필터링
      const jsSecurityRules = Array.from(ruleIds).filter(id => id.startsWith('js/'));

      // 테스트 쿼리 제외
      const testQueryRules = Array.from(ruleIds).filter(
        id => id === 'javascript/example/hello-world'
      );

      expect(
        jsSecurityRules.length,
        `실제 JavaScript 보안 규칙이 발견되지 않았습니다.\n` +
          `발견된 규칙: ${Array.from(ruleIds).join(', ')}\n` +
          `테스트 쿼리만 실행 중입니다 (${testQueryRules.length}개).\n\n` +
          `해결 방법:\n` +
          `1. codeql-custom-queries-javascript/example.ql 삭제\n` +
          `2. npm run codeql:scan 재실행\n` +
          `3. codeql/javascript-security-and-quality 쿼리 팩이 실행되는지 확인\n\n` +
          `예상 규칙 예시: js/unused-local-variable, js/useless-assignment, js/xss 등`
      ).toBeGreaterThan(0);
    });

    it('테스트 쿼리(javascript/example/hello-world)만 있으면 안 됨', () => {
      const sarifContent = readFileSync(sarifPath, 'utf8');
      const sarif = JSON.parse(sarifContent);

      const ruleIds = new Set<string>();

      for (const run of sarif.runs) {
        if (run.tool?.driver?.rules) {
          for (const rule of run.tool.driver.rules) {
            if (rule.id) {
              ruleIds.add(rule.id);
            }
          }
        }
        if (run.results) {
          for (const result of run.results) {
            const ruleId = result.ruleId || result.rule?.id;
            if (ruleId) {
              ruleIds.add(ruleId);
            }
          }
        }
      }

      const nonTestRules = Array.from(ruleIds).filter(
        id => id !== 'javascript/example/hello-world'
      );

      expect(
        nonTestRules.length,
        `테스트 쿼리(javascript/example/hello-world)만 발견되었습니다.\n` +
          `표준 보안 쿼리 팩이 실행되지 않았습니다.\n` +
          `발견된 전체 규칙: ${Array.from(ruleIds).join(', ')}\n\n` +
          `현재 상태: 테스트 쿼리만 ${ruleIds.size}개 규칙\n` +
          `예상 상태: 표준 쿼리 팩 실행 시 400+ 규칙`
      ).toBeGreaterThan(0);
    });
  });

  describe('Task 1.2: 개선 계획 검증', () => {
    it('codeql-improvement-plan.md 파일이 존재해야 함', () => {
      expect(
        existsSync(improvementPlanPath),
        `CodeQL 개선 계획 파일이 존재하지 않습니다: ${improvementPlanPath}`
      ).toBe(true);
    });

    it('개선 계획에 "Hello, world!" 메시지만 있으면 안 됨', () => {
      const content = readFileSync(improvementPlanPath, 'utf8');

      // "Hello, world!" 발생 횟수 계산
      const helloWorldMatches = content.match(/Hello, world!/gi);
      const helloWorldCount = helloWorldMatches ? helloWorldMatches.length : 0;

      // js/로 시작하는 실제 보안 규칙 발생 횟수 계산
      const jsRuleMatches = content.match(/\bjs\/[\w-]+/gi);
      const jsRuleCount = jsRuleMatches ? jsRuleMatches.length : 0;

      expect(
        jsRuleCount,
        `개선 계획에 실제 보안 규칙이 포함되지 않았습니다.\n` +
          `"Hello, world!" 발생: ${helloWorldCount}회\n` +
          `js/ 보안 규칙 발생: ${jsRuleCount}회\n\n` +
          `현재 상태: 테스트 쿼리 결과만 포함\n` +
          `예상 상태: js/unused-local-variable, js/useless-assignment 등 실제 보안 권고 포함`
      ).toBeGreaterThan(0);
    });

    it('개선 계획에 의미 있는 보안 권고가 포함되어야 함', () => {
      const content = readFileSync(improvementPlanPath, 'utf8');

      // "Hello, world!" 메시지가 전체 내용의 대부분을 차지하는지 확인
      const totalLines = content.split('\n').length;
      const helloWorldLines = content
        .split('\n')
        .filter(line => line.includes('Hello, world!')).length;

      const helloWorldRatio = totalLines > 0 ? helloWorldLines / totalLines : 0;

      expect(
        helloWorldRatio,
        `개선 계획의 ${(helloWorldRatio * 100).toFixed(1)}%가 "Hello, world!" 메시지입니다.\n` +
          `전체 줄 수: ${totalLines}줄\n` +
          `"Hello, world!" 줄 수: ${helloWorldLines}줄\n\n` +
          `현재 상태: 의미 없는 테스트 결과만 포함\n` +
          `예상 상태: 실제 보안 취약점 분석 결과 포함`
      ).toBeLessThan(0.5); // 50% 미만이어야 함
    });
  });
});
