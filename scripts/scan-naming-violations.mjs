#!/usr/bin/env node

/**
 * @file scripts/scan-naming-violations.mjs
 * @description Epic NAMING-001 Phase A: 명명 규칙 위반 스캔 스크립트
 *
 * 목표: 불필요한 수식어, boolean 접두사, 동사 패턴, 도메인 용어 사용률을 스캔하고
 *       마이그레이션 맵을 생성합니다.
 */

/* global process, console */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ===== 상수 =====

const UNNECESSARY_MODIFIERS = ['simple', 'optimized', 'basic', 'improved'];
const ALLOWED_MODIFIERS = ['enhanced', 'advanced', 'unified'];

const BOOLEAN_PREFIXES = ['is', 'has', 'can', 'should', 'will', 'check', 'validate'];

const STANDARD_VERBS = [
  'create',
  'get',
  'set',
  'add',
  'remove',
  'update',
  'delete',
  'find',
  'filter',
  'map',
  'reduce',
  'validate',
  'check',
  'is',
  'has',
  'can',
  'should',
  'will',
  'handle',
  'process',
  'init',
  'load',
  'save',
  'clear',
  'reset',
];

const GALLERY_TERMS = ['gallery', 'media', 'image', 'thumbnail', 'slide', 'carousel'];
const A11Y_TERMS = [
  'aria',
  'role',
  'label',
  'description',
  'live',
  'atomic',
  'contrast',
  'luminance',
  'focus',
  'tabindex',
  'screen',
  'reader',
  'keyboard',
  'navigation',
];

// ===== 스캔 함수 =====

/**
 * 불필요한 수식어를 검출합니다.
 * @param {string} code - 스캔할 코드
 * @param {string} file - 파일 경로
 * @returns {Array}
 */
export function scanUnnecessaryModifiers(code, file) {
  const violations = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();

    // 코멘트 스킵
    if (
      trimmedLine.startsWith('//') ||
      trimmedLine.startsWith('*') ||
      trimmedLine.startsWith('/*')
    ) {
      return;
    }

    // @deprecated 체크 (이전 5줄 확인)
    const isDeprecated = lines
      .slice(Math.max(0, index - 5), index)
      .some(prevLine => prevLine.includes('@deprecated'));
    if (isDeprecated) return;

    // export된 함수/클래스/const 검출
    const exportMatch = line.match(
      /export\s+(function|const|class)\s+(\w*(?:simple|optimized|basic|improved)\w*)/gi
    );

    if (exportMatch) {
      const match = exportMatch[0];
      const identifier = match.match(/\s+(\w+)$/)?.[1] || match;

      // 허용된 수식어 체크
      const hasAllowedModifier = ALLOWED_MODIFIERS.some(allowed =>
        identifier.toLowerCase().includes(allowed.toLowerCase())
      );

      if (!hasAllowedModifier) {
        const modifier = UNNECESSARY_MODIFIERS.find(mod =>
          identifier.toLowerCase().includes(mod.toLowerCase())
        );

        violations.push({
          file,
          type: 'unnecessary-modifier',
          pattern: identifier,
          line: lineNumber,
          context: line.trim(),
          severity: 'MEDIUM',
          modifier,
        });
      }
    }
  });

  return violations;
}

/**
 * Boolean 함수 접두사를 검증합니다.
 * @param {string} code - 스캔할 코드
 * @param {string} file - 파일 경로
 * @returns {Array}
 */
export function scanBooleanPrefixes(code, file) {
  const violations = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // boolean 반환 타입 검출
    const booleanMatch = line.match(/export\s+(?:function|const)\s+(\w+)[\s\S]*?:\s*boolean/);

    if (booleanMatch) {
      const functionName = booleanMatch[1];

      const hasValidPrefix = BOOLEAN_PREFIXES.some(prefix =>
        functionName.toLowerCase().startsWith(prefix.toLowerCase())
      );

      if (!hasValidPrefix) {
        violations.push({
          file,
          type: 'boolean-prefix-missing',
          pattern: functionName,
          line: lineNumber,
          context: line.trim(),
          severity: 'HIGH',
        });
      }
    }
  });

  return violations;
}

/**
 * 동사 패턴 일관성을 검증합니다.
 * @param {string} code - 스캔할 코드
 * @param {string} file - 파일 경로
 * @returns {Array}
 */
export function scanVerbPatterns(code, file) {
  const violations = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // export된 함수 검출
    const functionMatch = line.match(/export\s+(?:function|const)\s+(\w+)/);

    if (functionMatch) {
      const functionName = functionMatch[1];

      // 상수/타입 제외 (대문자로 시작하거나 모두 대문자)
      if (
        functionName === functionName.toUpperCase() ||
        functionName.endsWith('Type') ||
        functionName.endsWith('Config')
      ) {
        return;
      }

      const hasValidVerb = STANDARD_VERBS.some(verb =>
        functionName.toLowerCase().startsWith(verb.toLowerCase())
      );

      if (!hasValidVerb && functionName.length > 3) {
        violations.push({
          file,
          type: 'verb-pattern-inconsistent',
          pattern: functionName,
          line: lineNumber,
          context: line.trim(),
          severity: 'MEDIUM',
        });
      }
    }
  });

  return violations;
}

/**
 * 도메인 용어 사용률을 측정합니다.
 * @param {string} code - 스캔할 코드
 * @param {string} file - 파일 경로
 * @param {string} domain - 도메인 타입 ('gallery' | 'accessibility')
 * @returns {Object}
 */
export function measureDomainTerms(code, file, domain) {
  const domainTerms = domain === 'gallery' ? GALLERY_TERMS : A11Y_TERMS;

  const functionMatches = code.match(/export\s+(?:function|const)\s+(\w+)/g) || [];
  const total = functionMatches.length;

  const withDomainTerms = functionMatches.filter(match => {
    const functionName = match.match(/\s+(\w+)$/)?.[1] || '';
    return domainTerms.some(term => functionName.toLowerCase().includes(term.toLowerCase()));
  }).length;

  return {
    file,
    domain,
    total,
    withDomainTerms,
    ratio: total > 0 ? withDomainTerms / total : 0,
    domainTerms,
  };
}

/**
 * 우선순위를 분류합니다.
 * @param {Object} violation - 위반 정보
 * @returns {string} 'HIGH' | 'MEDIUM' | 'LOW'
 */
export function classifyPriority(violation) {
  const { file, type, isExported, usageCount } = violation;

  // HIGH: public API (services), boolean prefix 누락, 사용 빈도 높음
  if (
    type === 'boolean-prefix-missing' ||
    (file.includes('/services/') && isExported && usageCount > 10)
  ) {
    return 'HIGH';
  }

  // LOW: 테스트 파일, deprecated, 사용 빈도 낮음
  if (file.includes('/test/') || usageCount < 2) {
    return 'LOW';
  }

  return 'MEDIUM';
}

/**
 * 디렉터리를 재귀적으로 스캔합니다.
 * @param {string} dirPath - 스캔할 디렉터리 경로
 * @returns {Promise<Object>} 스캔 결과
 */
export async function scanDirectory(dirPath) {
  const violations = [];
  const fileList = [];

  function walkDir(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        fileList.push(fullPath);

        try {
          const code = readFileSync(fullPath, 'utf-8');
          const relativePath = relative(process.cwd(), fullPath);

          violations.push(...scanUnnecessaryModifiers(code, relativePath));
          violations.push(...scanBooleanPrefixes(code, relativePath));
          violations.push(...scanVerbPatterns(code, relativePath));
        } catch (err) {
          console.error(`Error scanning ${fullPath}:`, err.message);
        }
      }
    }
  }

  walkDir(dirPath);

  // 요약 생성
  const byType = {};
  const bySeverity = {};

  violations.forEach(v => {
    byType[v.type] = (byType[v.type] || 0) + 1;
    bySeverity[v.severity] = (bySeverity[v.severity] || 0) + 1;
  });

  return {
    violations,
    summary: {
      totalFiles: fileList.length,
      totalViolations: violations.length,
      byType,
      bySeverity,
    },
  };
}

/**
 * CLI 메인 함수
 */
export async function main() {
  const args = process.argv.slice(2);
  const dirIndex = args.indexOf('--dir');
  const outputIndex = args.indexOf('--output');

  const targetDir = dirIndex >= 0 ? args[dirIndex + 1] : 'src';
  const outputFile = outputIndex >= 0 ? args[outputIndex + 1] : 'docs/naming-violations-map.json';

  console.log(`🔍 Scanning directory: ${targetDir}`);

  const result = await scanDirectory(targetDir);

  console.log(`\n📊 Summary:`);
  console.log(`   - Files scanned: ${result.summary.totalFiles}`);
  console.log(`   - Total violations: ${result.summary.totalViolations}`);
  console.log(`   - By type:`, result.summary.byType);
  console.log(`   - By severity:`, result.summary.bySeverity);

  writeFileSync(outputFile, JSON.stringify(result, null, 2));
  console.log(`\n📄 Report saved to: ${outputFile}`);

  return 0;
}

// CLI 실행
if (import.meta.url.startsWith('file://')) {
  const scriptPath = fileURLToPath(import.meta.url);
  const isMainModule = process.argv[1] && resolve(process.argv[1]) === scriptPath;
  
  if (isMainModule) {
    main().catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
  }
}
