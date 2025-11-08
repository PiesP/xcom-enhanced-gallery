import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guard: ensure no production source imports or references createZipFromItems
 * outside of the zip adapter itself. Only allowed in the adapter module and its index barrel.
 */

describe('ZIP API surface — createZipFromItems not used in prod src/**', () => {
  setupGlobalTestIsolation();

  it('src/** should not import or reference createZipFromItems (except adapter files)', () => {
    const root = process.cwd();
    // Note: workspace root is the project folder; src path resolves from there
    const filesToScan: Array<{ path: string; content: string }> = [];

    // Minimal recursive scan implemented inline to avoid extra deps
    function walk(dir: string) {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const p = join(dir, e.name);
        if (e.isDirectory()) {
          // skip dist/build/coverage/node_modules
          if (/node_modules|dist|build|coverage|test/.test(p)) continue;
          walk(p);
        } else if (e.isFile() && p.endsWith('.ts')) {
          const content = readFileSync(p, 'utf8');
          filesToScan.push({ path: p, content });
        }
      }
    }

    walk(join(root, 'src'));

    const violations = filesToScan
      .filter(f => {
        const isAdapter =
          /src\\shared\\external\\zip\\(zip-creator|index)\.ts$/.test(f.path) ||
          /src\/shared\/external\/zip\/(zip-creator|index)\.ts$/.test(f.path);
        if (isAdapter) return false; // allowed in adapter files
        // detect imports or direct identifiers
        return /createZipFromItems\b/.test(f.content);
      })
      .map(f => f.path.replace(/\\/g, '/'));

    expect(violations, `Unexpected createZipFromItems usage in: ${violations.join(', ')}`).toEqual(
      []
    );
  });
});
