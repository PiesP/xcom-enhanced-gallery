/**
 * Guard: No external icon library static imports (UI-ICN-01)
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { cwd } from 'node:process';

function scanSources(root: string, patterns: RegExp[]): string[] {
  // Extremely lightweight static scan of a few known entry points
  const files = [
    join(root, 'src', 'shared', 'components', 'ui', 'Icon', 'index.ts'),
    join(root, 'src', 'shared', 'components', 'ui', 'Icon', 'icons', 'index.ts'),
    join(root, 'src', 'shared', 'components', 'ui', 'Toolbar', 'Toolbar.tsx'),
  ];
  const hits: string[] = [];
  for (const f of files) {
    if (!existsSync(f)) continue; // 파일이 없으면 스캔 생략 (경로 변경/삭제 대비)
    const src = readFileSync(f, 'utf8');
    for (const re of patterns) {
      if (re.test(src)) hits.push(`${f} :: ${re}`);
    }
  }
  return hits;
}

describe('Deps Guard - No external icon library static imports', () => {
  it('should not import external icon libraries directly', () => {
    const patterns = [
      /from\s+['"]@tabler\/icons[^'"]*['"]/g,
      /from\s+['"]react-icons[^'"]*['"]/g,
      /from\s+['"]@material-design-icons[^'"]*['"]/g,
    ];
    const hits = scanSources(cwd(), patterns);
    expect(hits, `Unexpected external icon imports found:\n${hits.join('\n')}`).toHaveLength(0);
  });
});
