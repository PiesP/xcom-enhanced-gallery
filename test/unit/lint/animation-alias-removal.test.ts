import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import fs from 'node:fs';
import path from 'node:path';

/**
 * S4: 애니메이션 별칭 제거 가드 테스트
 * 금지 심볼: animateToolbarShow, animateToolbarHide, animateImageLoad
 */

describe('Lint: animation alias removal', () => {
  setupGlobalTestIsolation();

  it('should not contain deprecated animation aliases in source', () => {
    const root = path.resolve(process.cwd(), 'src');

    const disallowed = ['animateToolbarShow', 'animateToolbarHide', 'animateImageLoad'];

    const scan = (dir: string): string[] => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      let hits: string[] = [];
      for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
          hits = hits.concat(scan(p));
        } else if (e.isFile() && /\.(ts|tsx)$/.test(e.name)) {
          const text = fs.readFileSync(p, 'utf-8');
          for (const word of disallowed) {
            if (text.includes(word)) {
              hits.push(`${p} => ${word}`);
            }
          }
        }
      }
      return hits;
    };

    const hits = scan(root);
    expect(hits, `Found disallowed aliases: \n${hits.join('\n')}`).toEqual([]);
  });
});
