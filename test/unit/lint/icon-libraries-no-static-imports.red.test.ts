/**
 * Lint Guard: No external icon library static imports (UI-ICN-01)
 *
 * 목적: 아이콘 라이브러리를 정적으로 import 하지 않음.
 * 비용 효율성: 최소한의 파일만 스캔하는 가벼운 정책 검증.
 *
 * Moved from test/unit/deps (Phase 180)
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

/**
 * 가볍고 집중된 스캔: 3개의 진입점만 검사.
 */
function scanIconEntrypoints(root: string, patterns: RegExp[]): string[] {
  const entrypoints = [
    join(root, 'src', 'shared', 'components', 'ui', 'Icon', 'index.ts'),
    join(root, 'src', 'shared', 'components', 'ui', 'Icon', 'Icon.tsx'),
    join(root, 'src', 'shared', 'components', 'ui', 'Toolbar', 'Toolbar.tsx'),
  ];

  const hits: string[] = [];
  for (const file of entrypoints) {
    try {
      const content = readFileSync(file, 'utf8');
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          hits.push(`${file} :: ${pattern}`);
        }
      }
    } catch {
      // 파일 미존재: 스킵
    }
  }
  return hits;
}

describe('Lint Guard - No external icon library static imports', () => {
  it('should not import external icon libraries (@tabler/icons, react-icons, etc.) directly', () => {
    const forbiddenPatterns = [
      /from\s+['"]@tabler\/icons[^'"]*['"]/g,
      /from\s+['"]react-icons[^'"]*['"]/g,
      /from\s+['"]@material-design-icons[^'"]*['"]/g,
    ];

    const violations = scanIconEntrypoints(cwd(), forbiddenPatterns);
    expect(
      violations,
      `Forbidden external icon library imports detected:\n${violations.join('\n')}`
    ).toHaveLength(0);
  });
});
