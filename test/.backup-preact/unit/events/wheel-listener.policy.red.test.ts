import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

/**
 * Wheel listener policy: disallow direct addEventListener('wheel', ...) usages
 * outside of the central utility, to guarantee passive/consumption rules.
 */
describe('R2: wheel-listener policy (no direct addEventListener)', () => {
  const SRC_ROOT = join(cwd(), 'src');

  // Allow list: central wheel utility file(s)
  const allowList = new Set<string>([
    join(SRC_ROOT, 'shared', 'utils', 'events', 'wheel.ts').replace(/\\/g, '/'),
  ]);

  function* walk(dir: string): Generator<string> {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, name.name);
      if (name.isDirectory()) {
        yield* walk(abs);
      } else if (name.isFile() && /\.(ts|tsx)$/.test(name.name)) {
        yield abs;
      }
    }
  }

  it('should not contain direct addEventListener("wheel", ...) in src (except allowlist)', () => {
    const offenders: string[] = [];
    for (const filePath of walk(SRC_ROOT)) {
      const normalized = filePath.replace(/\\/g, '/');
      if (allowList.has(normalized)) continue;
      const content = readFileSync(filePath, 'utf8');
      if (content.match(/addEventListener\(\s*['"]wheel['"]/)) {
        offenders.push(normalized.replace(SRC_ROOT.replace(/\\/g, '/') + '/', ''));
      }
    }

    expect(offenders).toEqual([]);
  });
});
