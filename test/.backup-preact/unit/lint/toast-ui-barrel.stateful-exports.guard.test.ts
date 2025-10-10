/**
 * Guard: UI barrel must not export stateful Toast APIs
 * - src/shared/components/ui/index.ts must not export
 *   addToast | removeToast | clearAllToasts | toasts
 *
 * Rationale:
 *  - Toast state/APIs are single-sourced by UnifiedToastManager (service layer)
 *  - UI barrel should expose only presentational components/types
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('lint: UI barrel surface (Toast stateful exports forbidden)', () => {
  it('src/shared/components/ui/index.ts must not export stateful toast APIs', () => {
    const repoRoot = resolve(process.cwd());
    const barrelPath = resolve(repoRoot, 'src/shared/components/ui/index.ts');
    const content = readFileSync(barrelPath, 'utf8');

    // Look for explicit named export of forbidden identifiers
    const forbidden = ['addToast', 'removeToast', 'clearAllToasts', 'toasts'];
    const lines = content.split(/\r?\n/);
    const violations: { line: number; text: string; symbol: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Only consider export lines to avoid false positives in comments
      if (!/\bexport\b/.test(line)) continue;
      for (const sym of forbidden) {
        // named export object or type export without type-only is still forbidden for these runtime symbols
        const re = new RegExp(`\\bexport\\s+(?:type\\s+)?\\{[^}]*\\b${sym}\\b[^}]*\\}`);
        if (re.test(line)) {
          violations.push({ line: i + 1, text: line.trim(), symbol: sym });
        }
      }
    }

    if (violations.length > 0) {
      const details = violations
        .map(v => ` - line ${v.line}: ${v.text} (symbol: ${v.symbol})`)
        .join('\n');
      throw new Error(
        [
          'UI barrel must not export stateful Toast APIs (use UnifiedToastManager in services):',
          details,
        ].join('\n')
      );
    }
  });
});
