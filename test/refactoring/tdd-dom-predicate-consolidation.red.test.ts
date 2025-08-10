/**
 * 🔴 TDD Phase 2: DOM Predicate Consolidation - RED
 * 목표: 반복되는 matches/closest 패턴을 공용 유틸로 통합하고, 대상 모듈에서 직접 사용을 금지한다.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = process.cwd();

// 검사 대상 파일: 중복 패턴이 자주 나타난 유틸 모듈들
const TARGETS = [
  path.join('src', 'shared', 'utils', 'utils.ts'),
  path.join('src', 'shared', 'utils', 'scroll', 'scroll-utils.ts'),
  path.join('src', 'shared', 'utils', 'media', 'media-click-detector.ts'),
];

function findRawDomPredicates(content: string): string[] {
  const offenders: string[] = [];
  const lines = content.split(/\r?\n/);
  const pattern = /(\.matches\(|\.closest\()/;
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
    if (pattern.test(line) && !line.includes('ALLOW_RAW_DOM_PREDICATE')) {
      offenders.push(`${idx + 1}: ${trimmed}`);
    }
  });
  return offenders;
}

describe('🔴 TDD: DOM predicate consolidation (no raw matches/closest in target files)', () => {
  it('대상 파일에서 raw matches/closest 사용이 없어야 한다', () => {
    const offenders: string[] = [];
    for (const rel of TARGETS) {
      const p = path.join(ROOT, rel);
      if (!fs.existsSync(p)) continue;
      const content = fs.readFileSync(p, 'utf8');
      const found = findRawDomPredicates(content);
      if (found.length > 0) {
        offenders.push(`File: ${rel}\n - ${found.join('\n - ')}`);
      }
    }

    const helpful = offenders.join('\n');
    expect(offenders, `Raw DOM predicate 사용 발견:\n${helpful}`)['toHaveLength'](0);
  });
});
