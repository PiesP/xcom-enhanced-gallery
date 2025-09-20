import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

function collectFiles(dir: string, acc: string[] = []): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip common excludes
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      collectFiles(full, acc);
    } else if (entry.isFile()) {
      const ext = extname(entry.name);
      if (ext === '.ts' || ext === '.tsx') {
        acc.push(full);
      }
    }
  }
  return acc;
}

function stripLiteralsAndComments(source: string): string {
  // Remove block comments
  let out = source.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove template literals (naive but effective for lint purpose)
  out = out.replace(/`[\s\S]*?`/g, '');
  // Remove single and double quoted strings
  out = out.replace(/'([^'\\]|\\.)*'/g, '');
  out = out.replace(/"([^"\\]|\\.)*"/g, '');
  // Remove line comments
  out = out.replace(/(^|\s)\/\/.*$/gm, '');
  return out;
}

describe('no console direct usage in src (use @shared/logging/logger instead)', () => {
  it('should not contain console.(log|info|warn|error|debug) in application code', () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    // project root = test/unit/lint/../../.. from this file
    const projectRoot = join(__dirname, '..', '..', '..');
    const root = join(projectRoot, 'src');
    const files = collectFiles(root);

    const allowlist = new Set<string>(
      [
        // Logger implementation is allowed to touch console internally
        join(projectRoot, 'src', 'shared', 'logging', 'logger.ts'),
      ].map(p => p.replace(/\\/g, '/'))
    );

    const violations: string[] = [];
    const pattern = /\bconsole\.(log|info|warn|error|debug)\b/;

    for (const file of files) {
      const norm = file.replace(/\\/g, '/');
      if (allowlist.has(norm)) continue;

      const content = readFileSync(file, 'utf8');
      const scanned = stripLiteralsAndComments(content);
      if (pattern.test(scanned)) {
        violations.push(norm);
      }
    }

    if (violations.length > 0) {
      // Helpful failure message
      const proj = projectRoot.replace(/\\/g, '/');
      const rel = violations.map(v => v.substring(proj.length + 1));
      expect.fail(
        `Found direct console usage in files (use @shared/logging/logger):\n - ${rel.join('\n - ')}`
      );
    }

    expect(violations.length).toBe(0);
  });
});
