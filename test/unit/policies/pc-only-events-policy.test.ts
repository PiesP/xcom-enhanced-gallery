/**
 * @fileoverview PC-Only Events Policy - Unified event usage enforcement
 *
 * This test enforces PC-only input policy across the entire codebase:
 * 1. No touch/pointer event handlers or types in UI code
 * 2. No deprecated event utilities (DOMEventManager, GalleryEventManager)
 * 3. No direct document/window keyboard listeners (must use EventManager)
 *
 * Consolidates checks from:
 * - pc-only-events.scan.red.test.tsx
 * - event-deprecated-removal.test.ts
 * - keyboard-listener.centralization.policy.test.ts
 *
 * Design rationale:
 * - This project is PC-only (no mobile support by design)
 * - Touch/pointer events add unnecessary complexity and bundle size
 * - Centralized event management improves testability and lifecycle control
 */
import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}

function listFilesRecursive(dir: string, extensions: Set<string>): string[] {
  const out: string[] = [];
  try {
    if (!statSync(dir, { throwIfNoEntry: false as any })) return [];
  } catch {
    return [];
  }

  const stack: string[] = [dir];
  while (stack.length) {
    const cur = stack.pop()!;
    const entries = readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const p = join(cur, e.name);
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
        stack.push(p);
      } else if (extensions.has(extname(p))) {
        out.push(p);
      }
    }
  }
  return out;
}

describe('PC-Only Events Policy - Unified', () => {
  setupGlobalTestIsolation();

  const ROOT = process.cwd();
  const SRC = join(ROOT, 'src');
  const UI_ROOTS = [
    join(SRC, 'features'),
    join(SRC, 'shared', 'components'),
    join(SRC, 'shared', 'hooks'),
  ];

  describe('1. No touch/pointer events in UI code', () => {
    it('should not contain touch/pointer handlers or event types', () => {
      const files = UI_ROOTS.flatMap(dir => listFilesRecursive(dir, new Set(['.ts', '.tsx'])));

      // Banned tokens: Touch/Pointer events/types/handlers
      const BANNED = [
        // React/Preact handlers
        'onTouch',
        'onPointer',
        // DOM event types
        'TouchEvent',
        'PointerEvent',
        // addEventListener forms
        'touchstart',
        'touchend',
        'touchmove',
        'touchcancel',
        'pointerdown',
        'pointerup',
        'pointermove',
        'pointerenter',
        'pointerleave',
        'pointercancel',
      ];

      const offenders: Array<{ file: string; line: number; snippet: string; token: string }> = [];

      for (const file of files) {
        const content = readFileSync(file, 'utf8');
        const lines = content.split(/\r?\n/);

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();

          // Ignore eslint and ts pragma comments to reduce false positives
          if (trimmed.startsWith('// eslint') || trimmed.startsWith('// ts-')) continue;

          for (const token of BANNED) {
            if (line.includes(token)) {
              offenders.push({
                file: toPosix(file).replace(toPosix(ROOT) + '/', ''),
                line: i + 1,
                snippet: line.slice(0, 200),
                token,
              });
            }
          }
        }
      }

      if (offenders.length > 0) {
        throw new Error(
          'Touch/pointer events forbidden (PC-only project):\n' +
            offenders
              .map(o => `  - ${o.file}:${o.line} contains '${o.token}'\n    ${o.snippet.trim()}`)
              .join('\n') +
            '\n\nUse mouse/keyboard events only (click, keydown, wheel, etc.)'
        );
      }
    });
  });

  describe('2. No deprecated event utilities', () => {
    it('should not import deprecated DOMEventManager or specific managers', () => {
      const files = listFilesRecursive(SRC, new Set(['.ts', '.tsx', '.js', '.jsx']));

      // Disallowed import patterns
      const DISALLOWED = [
        // DOMEventManager direct imports
        /from\s+['"]@shared\/dom\/DOMEventManager['"]/,
        /from\s+['"][./].*shared\/dom\/DOMEventManager['"]/,
        // Specific manager imports from events
        /from\s+['"]@shared\/utils\/events['"][^;]*\bGalleryEventManager\b/,
        /from\s+['"][./].*shared\/utils\/events['"][^;]*\bGalleryEventManager\b/,
        /from\s+['"]@shared\/utils\/events['"][^;]*\bTwitterEventManager\b/,
        /from\s+['"][./].*shared\/utils\/events['"][^;]*\bTwitterEventManager\b/,
        // Deprecated symbols via event-managers barrel
        /from\s+['"]@shared\/services\/event-managers['"][^;]*\b(DOMEventManager|GalleryEventManager|TwitterEventManager)\b/,
        // TwitterEventManager via EventManager direct
        /from\s+['"]@shared\/services\/EventManager['"][^;]*\bTwitterEventManager\b/,
        /from\s+['"][./].*shared\/services\/EventManager['"][^;]*\bTwitterEventManager\b/,
      ];

      const offenders: Array<{ file: string; pattern: string }> = [];

      for (const file of files) {
        const content = readFileSync(file, 'utf8');

        for (const rx of DISALLOWED) {
          if (rx.test(content)) {
            offenders.push({
              file: toPosix(file).replace(toPosix(ROOT) + '/', ''),
              pattern: String(rx),
            });
          }
        }
      }

      // Allow:
      // 1. Internal definitions within the deprecated modules themselves
      // 2. Test files (test/unit/**, test/browser/**)
      // 3. Utility modules in shared/utils/** (allowed for infrastructure)
      // 4. EventManager adapter
      const filtered = offenders.filter(o => {
        const isModuleSelf =
          /shared[/\\]dom[/\\]DOMEventManager\.ts$/.test(o.file) ||
          /shared[/\\]utils[/\\]events\.ts$/.test(o.file) ||
          /shared[/\\]utils[/\\]events[/\\]index\.ts$/.test(o.file);
        const isUnifiedAdapter = /shared[/\\]services[/\\]EventManager\.ts$/.test(o.file);
        const isTestFile = /^test[/\\]/.test(o.file);
        const isUtilityModule = /^src[/\\]shared[/\\]utils[/\\]/.test(o.file);
        return !(isModuleSelf || isUnifiedAdapter || isTestFile || isUtilityModule);
      });

      if (filtered.length > 0) {
        throw new Error(
          'Deprecated event utilities found in UI/feature code:\n' +
            filtered.map(o => `  - ${o.file}\n    matched ${o.pattern}`).join('\n') +
            '\n\nUse unified EventManager instead. (Allowed in: test/, shared/utils/, services/)'
        );
      }
    });
  });

  describe('3. Centralized keyboard listener policy', () => {
    it('should not attach keydown/keyup directly on document/window', () => {
      const files = UI_ROOTS.flatMap(dir => listFilesRecursive(dir, new Set(['.ts', '.tsx'])));

      const BANNED_REGEX = [
        /document\.(addEventListener|onkeydown|onkeyup)\s*\(\s*['"](keydown|keyup)/,
        /window\.(addEventListener|onkeydown|onkeyup)\s*\(\s*['"](keydown|keyup)/,
      ];

      // Known exceptions: useFocusTrap uses direct listeners by design
      const EXCEPTIONS = new Set([toPosix(join(SRC, 'shared/hooks/useFocusTrap.ts'))]);

      const offenders: Array<{ file: string; line: number; snippet: string; pattern: string }> = [];

      for (const file of files) {
        const posixFile = toPosix(file);
        if (EXCEPTIONS.has(posixFile)) continue;

        const content = readFileSync(file, 'utf8');
        const lines = content.split(/\r?\n/);

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();

          // Ignore comments
          if (trimmed.startsWith('// eslint') || trimmed.startsWith('// ts-')) continue;

          for (const rx of BANNED_REGEX) {
            if (rx.test(line)) {
              offenders.push({
                file: posixFile.replace(toPosix(ROOT) + '/', ''),
                line: i + 1,
                snippet: line.slice(0, 200),
                pattern: String(rx),
              });
            }
          }
        }
      }

      if (offenders.length > 0) {
        throw new Error(
          'Direct document/window keyboard listeners forbidden:\n' +
            offenders.map(o => `  - ${o.file}:${o.line}\n    ${o.snippet.trim()}`).join('\n') +
            '\n\nUse EventManager for centralized keyboard event handling.'
        );
      }
    });
  });
});
