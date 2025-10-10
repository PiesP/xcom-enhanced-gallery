/**
 * GUARD-02 — Prevent internal modules from importing shared barrel (cycle/ripple guard)
 *
 * Rule:
 *  - Files under src/shared/** must not import from 'src/shared/index.ts' (or '@shared/index')
 *    to avoid barrel re-imports and potential cycles.
 *  - Allow: type-only imports may be considered later if necessary; start strict (block all).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

function toPosix(p: string) {
  return p.split(sep).join('/');
}

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(name)) yield full;
  }
}

describe('lint: shared internal modules must not import shared barrel (GUARD-02)', () => {
  it('src/shared/** should not import from @shared/index or src/shared/index.ts', () => {
    const offenders: string[] = [];
    const root = process.cwd();
    const sharedRoot = join(root, 'src', 'shared');

    const importReAlias = /from\s+['"]@shared(?:\/index)?['"];?/g;
    const importReRel = /from\s+['"]\.\.\/index['"];?/g;

    for (const file of walk(sharedRoot)) {
      const posix = toPosix(file);
      const content = readFileSync(file, 'utf8');
      if (importReAlias.test(content) || importReRel.test(content)) {
        offenders.push(posix);
      }
    }

    expect(
      offenders,
      `Internal shared modules must not import the shared barrel. Found:\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
