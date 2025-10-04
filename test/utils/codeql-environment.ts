/**
 * CodeQL 환경 감지 유틸리티
 *
 * Epic: CODEQL-LOCAL-ENHANCEMENT
 * Phase: 1 (RED)
 *
 * 목적: GitHub Advanced Security 활성화 여부 감지
 */

import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..', '..');
const sarifPath = resolve(projectRoot, 'codeql-results.sarif');

/**
 * GitHub Advanced Security 활성화 여부 감지
 *
 * 감지 로직:
 * 1. SARIF 파일 존재 확인
 * 2. js/로 시작하는 실제 보안 규칙 400개 이상 확인
 * 3. 표준 쿼리 팩 실행 흔적 확인
 *
 * @returns true: Advanced Security 활성화됨 (표준 쿼리 팩 사용)
 *          false: 미활성화 (Fallback 쿼리 팩 사용)
 */
export function hasAdvancedSecurity(): boolean {
  // SARIF 파일 없으면 false
  if (!existsSync(sarifPath)) {
    return false;
  }

  try {
    const sarifContent = readFileSync(sarifPath, 'utf8');
    const sarif = JSON.parse(sarifContent);

    // SARIF 구조 검증
    if (!sarif.runs || !Array.isArray(sarif.runs) || sarif.runs.length === 0) {
      return false;
    }

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

    // 표준 쿼리 팩: 400+ 규칙
    // Fallback 쿼리 팩: 50+ 규칙
    // 임계값: 200 (중간값)
    return jsSecurityRules.length >= 200;
  } catch (error) {
    // SARIF 파싱 실패 시 false
    return false;
  }
}

/**
 * CodeQL 쿼리 팩 종류 감지
 *
 * @returns 'standard': codeql/javascript-security-and-quality (400+ 규칙)
 *          'fallback': codeql/javascript-queries (50+ 규칙)
 *          'unknown': SARIF 없음 또는 파싱 실패
 */
export function detectQueryPackType(): 'standard' | 'fallback' | 'unknown' {
  if (!existsSync(sarifPath)) {
    return 'unknown';
  }

  try {
    const sarifContent = readFileSync(sarifPath, 'utf8');
    const sarif = JSON.parse(sarifContent);

    if (!sarif.runs || !Array.isArray(sarif.runs) || sarif.runs.length === 0) {
      return 'unknown';
    }

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

    if (jsSecurityRules.length >= 200) {
      return 'standard';
    } else if (jsSecurityRules.length >= 10) {
      return 'fallback';
    } else {
      return 'unknown';
    }
  } catch (error) {
    return 'unknown';
  }
}

/**
 * CodeQL 환경 정보 조회
 *
 * @returns CodeQL 환경 상세 정보
 */
export interface CodeQLEnvironmentInfo {
  hasAdvancedSecurity: boolean;
  queryPackType: 'standard' | 'fallback' | 'unknown';
  totalRules: number;
  jsSecurityRules: number;
  sarifExists: boolean;
  sarifSizeKB: number;
}

export function getCodeQLEnvironmentInfo(): CodeQLEnvironmentInfo {
  const sarifExists = existsSync(sarifPath);

  if (!sarifExists) {
    return {
      hasAdvancedSecurity: false,
      queryPackType: 'unknown',
      totalRules: 0,
      jsSecurityRules: 0,
      sarifExists: false,
      sarifSizeKB: 0,
    };
  }

  try {
    const stats = statSync(sarifPath);
    const sizeKB = stats.size / 1024;

    const sarifContent = readFileSync(sarifPath, 'utf8');
    const sarif = JSON.parse(sarifContent);

    const ruleIds = new Set<string>();

    if (sarif.runs && Array.isArray(sarif.runs)) {
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
    }

    const jsSecurityRules = Array.from(ruleIds).filter(id => id.startsWith('js/')).length;
    const hasAdvSec = jsSecurityRules >= 200;
    const queryPackType = hasAdvSec ? 'standard' : jsSecurityRules >= 10 ? 'fallback' : 'unknown';

    return {
      hasAdvancedSecurity: hasAdvSec,
      queryPackType,
      totalRules: ruleIds.size,
      jsSecurityRules,
      sarifExists: true,
      sarifSizeKB: sizeKB,
    };
  } catch (error) {
    return {
      hasAdvancedSecurity: false,
      queryPackType: 'unknown',
      totalRules: 0,
      jsSecurityRules: 0,
      sarifExists: true,
      sarifSizeKB: 0,
    };
  }
}
