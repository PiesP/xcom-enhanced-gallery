/**
 * CodeQL 로컬 워크플로 개선 테스트 (조건부 검증)
 *
 * Epic: CODEQL-LOCAL-ENHANCEMENT
 * Phase: 1 (RED)
 *
 * 목적: GitHub Advanced Security 활성화 여부에 따라 적절한 검증 수행
 *
 * 검증 모드:
 * - 엄격 모드 (Advanced Security 활성화): 표준 쿼리 팩 (400+ 규칙)
 * - Relaxed 모드 (미활성화): Fallback 쿼리 팩 (50+ 규칙)
 *
 * Acceptance:
 * - Advanced Security 감지 함수 구현 (`hasAdvancedSecurity()`)
 * - 조건부 테스트 GREEN (로컬/CI 자동 대응)
 * - 환경별 명확한 에러 메시지
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  hasAdvancedSecurity,
  detectQueryPackType,
  getCodeQLEnvironmentInfo,
} from '../utils/codeql-environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..', '..');
const sarifPath = resolve(projectRoot, 'codeql-results.sarif');
const improvementPlanPath = resolve(projectRoot, 'codeql-improvement-plan.md');

describe('CodeQL 로컬 워크플로 개선 (Epic: CODEQL-LOCAL-ENHANCEMENT)', () => {
  describe('Task 1: 환경 감지 함수 구현', () => {
    it('hasAdvancedSecurity() 함수가 정의되어야 함', () => {
      expect(typeof hasAdvancedSecurity).toBe('function');
    });

    it('detectQueryPackType() 함수가 정의되어야 함', () => {
      expect(typeof detectQueryPackType).toBe('function');
    });

    it('getCodeQLEnvironmentInfo() 함수가 정의되어야 함', () => {
      expect(typeof getCodeQLEnvironmentInfo).toBe('function');
    });

    it('hasAdvancedSecurity()가 boolean을 반환해야 함', () => {
      const result = hasAdvancedSecurity();
      expect(typeof result).toBe('boolean');
    });

    it('detectQueryPackType()이 올바른 타입을 반환해야 함', () => {
      const result = detectQueryPackType();
      expect(['standard', 'fallback', 'unknown']).toContain(result);
    });

    it('getCodeQLEnvironmentInfo()가 올바른 구조를 반환해야 함', () => {
      const info = getCodeQLEnvironmentInfo();
      expect(info).toHaveProperty('hasAdvancedSecurity');
      expect(info).toHaveProperty('queryPackType');
      expect(info).toHaveProperty('totalRules');
      expect(info).toHaveProperty('jsSecurityRules');
      expect(info).toHaveProperty('sarifExists');
      expect(info).toHaveProperty('sarifSizeKB');

      expect(typeof info.hasAdvancedSecurity).toBe('boolean');
      expect(['standard', 'fallback', 'unknown']).toContain(info.queryPackType);
      expect(typeof info.totalRules).toBe('number');
      expect(typeof info.jsSecurityRules).toBe('number');
      expect(typeof info.sarifExists).toBe('boolean');
      expect(typeof info.sarifSizeKB).toBe('number');
    });
  });

  describe('Task 2: 조건부 SARIF 검증', () => {
    it('SARIF 파일이 존재해야 함', () => {
      expect(
        existsSync(sarifPath),
        `CodeQL SARIF 파일이 존재하지 않습니다: ${sarifPath}\n` +
          'npm run codeql:scan 명령을 먼저 실행하세요.'
      ).toBe(true);
    });

    it('SARIF 파일 크기가 적절해야 함 (환경별 임계값)', () => {
      const stats = statSync(sarifPath);
      const sizeKB = stats.size / 1024;
      const hasAdvSec = hasAdvancedSecurity();

      // 표준 쿼리 팩: 100KB 이상
      // Fallback 쿼리 팩: 10KB 이상
      const minSizeKB = hasAdvSec ? 100 : 10;

      expect(
        sizeKB,
        `SARIF 파일 크기가 너무 작습니다: ${sizeKB.toFixed(2)} KB\n` +
          `현재 환경: ${hasAdvSec ? 'Advanced Security (표준 쿼리 팩)' : 'Fallback 쿼리 팩'}\n` +
          `최소 크기: ${minSizeKB} KB\n` +
          `실제 크기: ${sizeKB.toFixed(2)} KB`
      ).toBeGreaterThanOrEqual(minSizeKB);
    });

    it('SARIF에 JavaScript 보안 규칙이 포함되어야 함 (환경별 임계값)', () => {
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

      const jsSecurityRules = Array.from(ruleIds).filter(id => id.startsWith('js/'));
      const hasAdvSec = hasAdvancedSecurity();

      // 표준 쿼리 팩: 400+ 규칙
      // Fallback 쿼리 팩: 50+ 규칙
      const minRules = hasAdvSec ? 400 : 50;

      expect(
        jsSecurityRules.length,
        `JavaScript 보안 규칙 수가 부족합니다.\n` +
          `현재 환경: ${hasAdvSec ? 'Advanced Security (표준 쿼리 팩)' : 'Fallback 쿼리 팩'}\n` +
          `최소 규칙: ${minRules}개\n` +
          `실제 규칙: ${jsSecurityRules.length}개\n` +
          `발견된 규칙: ${jsSecurityRules.slice(0, 10).join(', ')}${jsSecurityRules.length > 10 ? '...' : ''}\n\n` +
          (hasAdvSec
            ? '표준 쿼리 팩이 제대로 실행되지 않았습니다.'
            : 'Fallback 쿼리 팩이 제대로 실행되지 않았습니다.')
      ).toBeGreaterThanOrEqual(minRules);
    });

    it('테스트 쿼리만 있는 상태를 감지해야 함', () => {
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

      const testQueryRules = Array.from(ruleIds).filter(
        id => id === 'javascript/example/hello-world'
      );
      const nonTestRules = Array.from(ruleIds).filter(
        id => id !== 'javascript/example/hello-world'
      );

      expect(
        nonTestRules.length,
        `테스트 쿼리만 발견되었습니다.\n` +
          `테스트 쿼리: ${testQueryRules.length}개\n` +
          `실제 규칙: ${nonTestRules.length}개\n` +
          `전체 규칙: ${Array.from(ruleIds).join(', ')}\n\n` +
          '해결 방법:\n' +
          '1. codeql-custom-queries-javascript/example.ql 삭제\n' +
          '2. npm run codeql:scan 재실행'
      ).toBeGreaterThan(0);
    });
  });

  describe('Task 3: 환경 정보 로깅', () => {
    it('환경 정보가 올바르게 수집되어야 함', () => {
      const info = getCodeQLEnvironmentInfo();

      // 콘솔 출력 (테스트 실행 시 환경 확인)
      console.log('\n=== CodeQL 환경 정보 ===');
      console.log(`Advanced Security: ${info.hasAdvancedSecurity ? 'YES' : 'NO'}`);
      console.log(`쿼리 팩 종류: ${info.queryPackType}`);
      console.log(`전체 규칙 수: ${info.totalRules}개`);
      console.log(`JS 보안 규칙: ${info.jsSecurityRules}개`);
      console.log(`SARIF 존재: ${info.sarifExists ? 'YES' : 'NO'}`);
      console.log(`SARIF 크기: ${info.sarifSizeKB.toFixed(2)} KB`);
      console.log('========================\n');

      // 기본 검증
      if (info.sarifExists) {
        expect(info.totalRules).toBeGreaterThan(0);
        expect(info.jsSecurityRules).toBeGreaterThan(0);
        expect(info.sarifSizeKB).toBeGreaterThan(0);
      }
    });

    it('쿼리 팩 종류가 감지되어야 함', () => {
      const queryPackType = detectQueryPackType();

      expect(['standard', 'fallback', 'unknown']).toContain(queryPackType);

      console.log(`\n=== 감지된 쿼리 팩: ${queryPackType} ===`);
      if (queryPackType === 'standard') {
        console.log('표준 쿼리 팩 (codeql/javascript-security-and-quality) 실행 중');
        console.log('예상 규칙 수: 400+ 개');
      } else if (queryPackType === 'fallback') {
        console.log('Fallback 쿼리 팩 (codeql/javascript-queries) 실행 중');
        console.log('예상 규칙 수: 50+ 개');
      } else {
        console.log('쿼리 팩 종류를 감지할 수 없습니다.');
        console.log('npm run codeql:scan을 실행하여 SARIF를 생성하세요.');
      }
      console.log('=====================================\n');
    });
  });

  describe('Task 4: 개선 계획 조건부 검증', () => {
    it('개선 계획 파일이 존재해야 함', () => {
      expect(
        existsSync(improvementPlanPath),
        `CodeQL 개선 계획 파일이 존재하지 않습니다: ${improvementPlanPath}`
      ).toBe(true);
    });

    it('개선 계획에 의미 있는 내용이 포함되어야 함 (환경별)', () => {
      const content = readFileSync(improvementPlanPath, 'utf8');
      const hasAdvSec = hasAdvancedSecurity();

      // "Hello, world!" 발생 횟수
      const helloWorldMatches = content.match(/Hello, world!/gi);
      const helloWorldCount = helloWorldMatches ? helloWorldMatches.length : 0;

      // js/ 보안 규칙 발생 횟수
      const jsRuleMatches = content.match(/\bjs\/[\w-]+/gi);
      const jsRuleCount = jsRuleMatches ? jsRuleMatches.length : 0;

      if (hasAdvSec) {
        // 엄격 모드: 표준 쿼리 팩 실행 시 의미 있는 보안 권고 필수
        expect(
          jsRuleCount,
          `개선 계획에 실제 보안 규칙이 부족합니다 (표준 쿼리 팩).\n` +
            `"Hello, world!" 발생: ${helloWorldCount}회\n` +
            `js/ 보안 규칙 발생: ${jsRuleCount}회\n\n` +
            `표준 쿼리 팩 실행 시 수십 개 이상의 보안 권고가 포함되어야 합니다.`
        ).toBeGreaterThanOrEqual(10);
      } else {
        // Relaxed 모드: Fallback 쿼리 팩도 일부 권고 포함
        expect(
          jsRuleCount,
          `개선 계획에 보안 규칙이 전혀 없습니다 (Fallback 쿼리 팩).\n` +
            `"Hello, world!" 발생: ${helloWorldCount}회\n` +
            `js/ 보안 규칙 발생: ${jsRuleCount}회\n\n` +
            `Fallback 쿼리 팩도 일부 기본 권고를 포함해야 합니다.`
        ).toBeGreaterThanOrEqual(1);
      }
    });

    it('"Hello, world!" 테스트 메시지 비율이 적절해야 함', () => {
      const content = readFileSync(improvementPlanPath, 'utf8');
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
          `테스트 메시지가 전체 내용의 대부분을 차지하면 안 됩니다.`
      ).toBeLessThan(0.5); // 50% 미만
    });
  });
});
