/**
 * Guard: UI components must not define local Toast state/APIs
 *  - No local `signal([...])` or arrays named toasts within UI Toast files
 *  - Enforce service-only type usage for ToastItem via type-only import
 *
 * Scope: src/shared/components/ui/Toast/*.tsx
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, sep } from 'path';

function listToastFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = resolve(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) continue;
    if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

function toPosix(p: string): string {
  return p.split(sep).join('/');
}

describe('lint: UI Toast components (no local state, type-only import)', () => {
  it('must not define local toast state/functions and must type-only import ToastItem from service', () => {
    const root = resolve(process.cwd());
    const toastDir = resolve(root, 'src/shared/components/ui/Toast');
    const files = listToastFiles(toastDir);

    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      const posix = toPosix(file);

      // 1) No local state signals named toasts or array literals assigned to toasts
      const localStatePatterns = [
        /const\s+toasts\s*=\s*signal\(/,
        /let\s+toasts\s*=\s*\[/,
        /const\s+toasts\s*:\s*[^=]+=\s*\[/,
        /export\s+(?:const|let|var)\s+toasts\b/,
        /export\s+\{[^}]*\baddToast\b[^}]*\}/,
        /export\s+\{[^}]*\bremoveToast\b[^}]*\}/,
        /export\s+\{[^}]*\bclearAllToasts\b[^}]*\}/,
      ];
      if (localStatePatterns.some(re => re.test(content))) {
        violations.push(`${posix}: local toast state/API export detected`);
      }

      // 2) ToastItem must be imported type-only from service (no runtime import)
      //    Allow: `import type { ToastItem } from '@/shared/services/UnifiedToastManager'`
      //    Forbid: `import { ToastItem } from '@/shared/services/UnifiedToastManager'` (without type)
      const badTypeImport =
        /import\s+\{\s*ToastItem\s*\}\s+from\s+['"]@\/shared\/services\/UnifiedToastManager['"];?/;
      if (badTypeImport.test(content)) {
        violations.push(`${posix}: ToastItem must be imported with 'type' modifier`);
      }
    }

    if (violations.length > 0) {
      throw new Error(
        ['Toast UI components policy violations:', ...violations.map(v => ` - ${v}`)].join('\n')
      );
    }
  });
});
