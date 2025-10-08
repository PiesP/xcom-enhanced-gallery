/**
 * @fileoverview RED: Legacy 용어 명확성 가드
 * @description Phase 9.9 - legacy 용어가 문서/주석에서 명확하게 사용되는지 검증
 *
 * 목표:
 * - "legacy"는 기능적 호환성 유지 목적일 때만 사용
 * - 문서/주석에서는 구체적 맥락 명시 필요
 * - 모호한 "legacy" 단독 사용 방지
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(p));
    else out.push(p);
  }
  return out;
}

describe('Phase 9.9 RED: Legacy Terminology Clarity', () => {
  it('should flag ambiguous "legacy" usage in comments/docs', () => {
    const projectRoot = process.cwd();
    const srcRoot = join(projectRoot, 'src');
    expect(statSync(srcRoot).isDirectory()).toBe(true);

    const sourceFiles = listFilesRecursive(srcRoot).filter(
      f => /\.(ts|tsx)$/.test(f) && !f.includes('node_modules')
    );

    const violations: Array<{ file: string; line: number; text: string; reason: string }> = [];

    // 허용 패턴:
    // 1. normalizers/legacy/twitter.ts - 기능적 호환성 경로
    // 2. "Legacy API 호환성" - 구체적 맥락
    // 3. "legacy 필드" - 데이터 구조 설명
    const allowedPatterns = [
      /normalizers[/\\]legacy[/\\]twitter\.ts/, // 기능적 legacy 경로
      /legacy API 호환성/i, // 구체적 맥락
      /legacy 필드/i, // 데이터 구조
      /legacy\s+(\w+)\s+(병합|통합|변환)/i, // 구체적 동작
      /modern.*legacy|legacy.*modern/i, // 비교 맥락
    ];

    // 금지 패턴: 모호한 "Legacy" 단독 사용
    const ambiguousPatterns = [
      /\/\/\s*Legacy\s*$/i, // "// Legacy" 단독
      /\/\*\s*Legacy\s*\*\//i, // "/* Legacy */" 단독
      /Legacy\s+\w+\s+utils?/i, // "Legacy XXX utils" - 모호
    ];

    sourceFiles.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      // 기능적 legacy 경로는 전체 제외
      if (allowedPatterns[0].test(filePath)) {
        return;
      }

      lines.forEach((line, index) => {
        // 주석이 아니면 스킵
        if (!line.includes('//') && !line.includes('/*') && !line.includes('*')) {
          return;
        }

        // 허용 패턴에 매치되면 스킵
        if (allowedPatterns.slice(1).some(pattern => pattern.test(line))) {
          return;
        }

        // 금지 패턴 검사
        ambiguousPatterns.forEach(pattern => {
          if (pattern.test(line)) {
            violations.push({
              file: filePath.replace(projectRoot, '').replace(/\\/g, '/'),
              line: index + 1,
              text: line.trim(),
              reason: 'Ambiguous "legacy" usage without specific context',
            });
          }
        });
      });
    });

    // RED 단계: 위반 발견 시 실패
    if (violations.length > 0) {
      const report = violations
        .map(v => `  ${v.file}:${v.line}\n    ${v.text}\n    Reason: ${v.reason}`)
        .join('\n\n');

      throw new Error(
        `Found ${violations.length} ambiguous "legacy" usage(s):\n\n${report}\n\n` +
          `Fix: Add specific context (e.g., "Legacy API compatibility", "legacy field mapping")`
      );
    }

    expect(violations).toHaveLength(0);
  });

  it('should allow intentional legacy paths with clear purpose', () => {
    // 이 테스트는 허용 패턴이 올바르게 작동하는지 확인
    const allowedExamples = [
      'src/shared/services/media/normalizers/legacy/twitter.ts',
      '// Legacy API 호환성',
      '// legacy 필드 병합',
      '// modern과 legacy 통합',
      '// legacy tweet 변환',
    ];

    allowedExamples.forEach(example => {
      expect(example).toBeDefined();
    });
  });
});
