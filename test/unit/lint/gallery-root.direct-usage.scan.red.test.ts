import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// RED scan: runtime src/** must not directly reference '#xeg-gallery-root'
// Allowed: tests/, docs/, release/ only

describe('RED: forbid direct usage of #xeg-gallery-root in runtime sources', () => {
  const __filename = fileURLToPath(import.meta.url);
  const ROOT = path.resolve(path.dirname(__filename), '..', '..', '..');
  const SRC_DIR = path.join(ROOT, 'src');

  function walk(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name === 'dist') continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) files.push(...walk(p));
      else if (e.isFile()) files.push(p);
    }
    return files;
  }

  it("src/** does not contain '#xeg-gallery-root' literal", () => {
    const offenders: string[] = [];
    const files = walk(SRC_DIR).filter(f => /\.(ts|tsx|css|html|js|mjs|cjs)$/.test(f));
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      if (text.includes('#xeg-gallery-root')) {
        offenders.push(path.relative(ROOT, file));
      }
    }
    expect(offenders, `offenders found:\n${offenders.join('\n')}`).toEqual([]);
  });
});
