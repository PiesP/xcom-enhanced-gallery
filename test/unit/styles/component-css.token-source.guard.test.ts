/**
 * Guard: Component CSS must use design tokens for colors (no raw color literals)
 * Scope: Component CSS under src/shared/components (CSS Modules and component styles only)
 *
 * Allowed values/examples:
 * - CSS variable tokens like var(--xeg-...) or var(--color-...)
 * - currentColor | transparent
 * - System colors in high-contrast contexts: Canvas, CanvasText, HighlightText
 *
 * Forbidden in component CSS:
 * - Hex colors (#fff, #ffffff)
 * - rgb()/rgba(), hsl()/hsla(), oklch(), color-mix()
 * - raw keywords 'white'/'black' in color/background/border properties
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function listFilesRecursive(
  dir: string,
  predicate: (p: string) => boolean,
  acc: string[] = []
): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      listFilesRecursive(full, predicate, acc);
    } else if (e.isFile() && predicate(full)) {
      acc.push(full);
    }
  }
  return acc;
}

describe('Component CSS token source guard', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const ROOT = path.resolve(here, '../../../src/shared/components');
  const files = fs.existsSync(ROOT) ? listFilesRecursive(ROOT, p => p.endsWith('.css')) : [];

  it('should not contain raw color literals in component CSS', () => {
    const violations: Array<{ file: string; match: string }> = [];

    const RAW_COLOR_FUNC = /(#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(|color-mix\()/g;
    const COLOR_PROPS =
      /(^|[;{\n\r\t\s])(background(?:-color)?|color|border(?:-color)?|outline(?:-color)?|box-shadow)\s*:\s*([^;]+);/g;

    const allowedKeywords = [
      'transparent',
      'currentColor',
      'Canvas',
      'CanvasText',
      'HighlightText',
    ];

    // Phase 67 Step 3: Allow specific inline shadow-xs replacement in Button.module.css
    const ALLOWED_INLINE_PATTERNS = [
      {
        file: 'Button.module.css',
        pattern: /box-shadow:\s*0 0 0 1px rgba\(0,\s*0,\s*0,\s*0\.05\)/i,
      },
    ];

    for (const file of files) {
      const css = fs.readFileSync(file, 'utf-8');

      // 1) Raw color functions or hex anywhere in file
      const funcs = css.match(RAW_COLOR_FUNC) || [];
      for (const m of funcs) {
        // Check if this is an allowed inline pattern
        const isAllowed = ALLOWED_INLINE_PATTERNS.some(
          ({ file: allowedFile, pattern }) => file.endsWith(allowedFile) && pattern.test(css)
        );

        if (!isAllowed) {
          // Allow if within a var() function (oklch(from var(--... is still raw)) — forbid
          violations.push({ file, match: m });
        }
      }

      // 2) Disallow white/black keywords in color-like properties (avoid false positives like white-space)
      COLOR_PROPS.lastIndex = 0;
      let propMatch: RegExpExecArray | null;
      while ((propMatch = COLOR_PROPS.exec(css))) {
        const rawValue = propMatch[3];
        if (!rawValue) {
          continue;
        }
        const value = rawValue.trim();
        const usesToken = /var\(\s*--[a-z0-9-]+\s*(?:,[^)]+)?\)/i.test(value);
        const isAllowedKeyword = allowedKeywords.some(k => new RegExp(`\\b${k}\\b`).test(value));
        const hasRawKeyword = /(\bwhite\b|\bblack\b)/i.test(value);
        if (!usesToken && !isAllowedKeyword && hasRawKeyword) {
          violations.push({ file, match: `${propMatch[2]}: ${value}` });
        }
      }
    }

    if (violations.length > 0) {
      const details = violations
        .map(v => `- ${path.relative(path.resolve(here, '../../../'), v.file)} :: ${v.match}`)
        .join('\n');
      console.warn(
        'Found raw color usages in component CSS (use design tokens instead):\n' + details
      );
    }
    expect(violations).toEqual([]);
  });
});
