/**
 * Scan test: F1-c — features/gallery barrel must not export classes/components
 *
 * Rule (scoped to gallery only):
 *  - src/features/gallery/index.ts must not export runtime implementations
 *    (classes/components/functions). Only type exports and `export * from './types'`
 *    are allowed.
 *
 * Rationale:
 *  - Keep public surface minimal and stable. Consumers should directly import
 *    concrete modules if needed; barrels expose types/factory only.
 */

import { readFileSync } from 'fs';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { resolve } from 'path';

function stripComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
    .replace(/\/\/.*$/gm, ''); // line comments
}

describe('lint: F1-c gallery barrel class/impl exports forbidden', () => {
  setupGlobalTestIsolation();

  it('gallery barrel must only export types (no runtime exports)', () => {
    const repoRoot = resolve(process.cwd());
    const file = resolve(repoRoot, 'src/features/gallery/index.ts');
    const raw = readFileSync(file, 'utf8');
    const content = stripComments(raw);
    const lines = content.split(/\r?\n/);

    const violations: { line: number; snippet: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // allow: export * from './types'
      if (/^export\s+\*\s+from\s+['"]\.\/types['"];?$/m.test(line)) continue;

      // allow: export type { ... } from '...'
      if (/^export\s+type\s+\{[\s\S]*?\}\s+from\s+['"][^'"]+['"];?$/m.test(line)) continue;

      // Any other export from gallery barrel is considered a violation in F1-c
      if (/^export\s+\{[\s\S]*?\}\s+from\s+['"][^'"]+['"];?$/m.test(line)) {
        violations.push({ line: i + 1, snippet: line });
      }
    }

    if (violations.length > 0) {
      const details = violations.map(v => ` - line ${v.line}: ${v.snippet}`).join('\n');
      throw new Error(
        [
          'Gallery barrel must not export runtime implementations (F1-c). Allowed only: types and factory.',
          details,
        ].join('\n')
      );
    }
  });
});
