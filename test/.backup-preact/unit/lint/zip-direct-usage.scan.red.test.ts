/**
 * Guard: Forbid direct fflate.zip/zipSync usage outside official adapter
 * - Allowed only in: src/shared/external/zip/zip-creator.ts
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

function listFilesRecursive(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...listFilesRecursive(p));
    else files.push(p);
  }
  return files;
}

describe('Guard: direct fflate.zip/zipSync usage', () => {
  it('Runtime code must not call fflate.zip/zipSync outside zip-creator', () => {
    const ROOT = join(process.cwd(), 'src');
    expect(statSync(ROOT).isDirectory()).toBe(true);

    const ALLOWLIST_PATHS = new Set<string>(['src/shared/external/zip/zip-creator.ts']);

    const offenders: { file: string; line: string }[] = [];
    for (const f of listFilesRecursive(ROOT)) {
      if (!/\.(ts|tsx)$/.test(f)) continue;
      const rel = relative(process.cwd(), f).replace(/\\/g, '/');
      const text = readFileSync(f, 'utf8');

      if (ALLOWLIST_PATHS.has(rel)) continue;

      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        // Detect fflate.zip( ... ) or any zipSync( ... )
        const hasZipSync = /\bzipSync\s*\(/.test(line);
        const hasFflateZip = /\bfflate\s*\.\s*zip\s*\(/.test(line);
        if (hasZipSync || hasFflateZip) {
          offenders.push({ file: rel, line: line.trim() });
        }
      }
    }

    if (offenders.length > 0) {
      const details = offenders.map(o => `- ${o.file}: ${o.line}`).join('\n');
      throw new Error(
        `Direct usage of fflate.zip/zipSync is forbidden outside zip-creator. Offenders:\n${details}`
      );
    }
  });
});
