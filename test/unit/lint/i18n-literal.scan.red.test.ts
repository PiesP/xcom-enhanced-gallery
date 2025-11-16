// Guard: Forbid user-facing string literals in JSX text nodes (features/components)
// Scope: src/features/**/* .tsx, src/shared/components/**/* .tsx (globs spaced to avoid comment terminator)
// Allowed: Resource tables (LanguageService), tests/docs; This scan only checks JSX text nodes
// ("> some text <"), not attributes or string literals in non-JSX code.
import { describe, it } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(p));
    else out.push(p);
  }
  return out;
}

function findJsxTextLiterals(src: string): string[] {
  const offenders: string[] = [];
  // Remove comments and imports/exports to reduce noise.
  const stripped = src
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
    .replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, '$1') // line comments
    .replace(/^[\t ]*(import|export)\b.*$/gm, ''); // imports/exports

  // Match actual JSX element text nodes only:
  // <Tag ...> TEXT </Tag>
  // - Captures the tag name and ensures a matching closing tag
  // - Avoids false positives from TypeScript generics like Foo<Bar>() or type T = X<Y>
  const jsxTextRegex = /<([A-Za-z][A-Za-z0-9_.:-]*)(?:\s[^>]*)?>\s*([^<{][^<]*)\s*<\/\1\s*>/g;
  let m: RegExpExecArray | null;
  while ((m = jsxTextRegex.exec(stripped))) {
    const text = (m[2] || '').trim();
    if (!text) continue;
    // Skip JSX expressions or code-like content
    if (/[{}]/.test(text)) continue;
    // Ignore nodes that are only punctuation/symbols/marks/whitespace (e.g., ×, •, ⚠️, ⬇️)
    if (/^[\p{P}\p{S}\p{M}\s]+$/u.test(text)) continue;
    offenders.push(text);
  }
  return offenders;
}

describe('Guard: i18n literals should not appear directly in JSX text nodes', () => {
  setupGlobalTestIsolation();

  it('features/components TSX files should not contain raw text nodes', () => {
    const ROOT = join(process.cwd(), 'src');
    if (!statSync(ROOT).isDirectory()) return;

    const includeDirs = [join(ROOT, 'features'), join(ROOT, 'shared', 'components')];

    const offenders: { file: string; snippet: string }[] = [];

    for (const base of includeDirs) {
      if (!statSync(base).isDirectory()) continue;
      for (const file of listFilesRecursive(base)) {
        if (!file.endsWith('.tsx')) continue;
        const rel = relative(process.cwd(), file).replace(/\\/g, '/');
        // Skip story/mock/example files if any
        if (/\.(stories|examples?)\.tsx$/.test(rel)) continue;
        const src = readFileSync(file, 'utf8');
        const texts = findJsxTextLiterals(src);
        if (texts.length > 0) {
          offenders.push({ file: rel, snippet: texts.slice(0, 2).join(' | ') });
        }
      }
    }

    if (offenders.length > 0) {
      const details = offenders.map(o => `- ${o.file}: ${o.snippet}`).join('\n');
      throw new Error(
        `User-facing raw literals detected in JSX text nodes. Use languageService.translate(). Offenders:\n${details}`
      );
    }
  });
});
