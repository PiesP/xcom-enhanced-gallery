import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

/**
 * R2: wheel listener unification policy
 * - Disallow EventManager.addEventListener(..., 'wheel', ...) in src
 * - Modules should use ensureWheelLock/addWheelListener wrappers (directly or via EventManager.addWheelLock)
 */
describe('R2: wheel-listener unified API usage', () => {
  const SRC_ROOT = join(cwd(), 'src');

  function* walk(dir: string): Generator<string> {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        yield* walk(abs);
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        yield abs;
      }
    }
  }

  it("should not call EventManager.addEventListener('wheel', ...) anywhere in src", () => {
    const offenders: string[] = [];
    const pattern = /EventManager\s*\.\s*addEventListener\s*\(\s*[^,]+,\s*['"]wheel['"]/;
    for (const filePath of walk(SRC_ROOT)) {
      const content = readFileSync(filePath, 'utf8');
      if (pattern.test(content)) {
        offenders.push(filePath.replace(SRC_ROOT + '/', ''));
      }
    }

    expect(offenders).toEqual([]);
  });
});
