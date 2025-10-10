/**
 * Scan test: Enforce vendor getter-only usage for Preact APIs
 * - Forbid importing { h, render, Component, Fragment } directly from '@shared/external/vendors'
 * - Allow: using getPreact().h / getPreact().render etc.
 * - Allow: tests/mocks in allowlist paths
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

function toPosix(p: string) {
  return p.split(sep).join('/');
}

const projectRoot = process.cwd();
const srcRoot = join(projectRoot, 'src');

// 허용 경로(테스트/모크 등)
const ALLOWLIST_SUBSTRINGS = ['/test/', '/__mocks__/'];

function isAllowlisted(pathPosix: string) {
  return ALLOWLIST_SUBSTRINGS.some(s => pathPosix.includes(s));
}

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(name)) yield full;
  }
}

describe('lint: vendor getter strict (no direct preact function exports import)', () => {
  it('src/** must not import {h,render,Component,Fragment} from @shared/external/vendors', () => {
    const offenders: string[] = [];

    for (const file of walk(srcRoot)) {
      const posix = toPosix(file);
      if (isAllowlisted(posix)) continue;
      const content = readFileSync(file, 'utf-8');

      // import { h, render, Component, Fragment } from '@shared/external/vendors'
      const pattern =
        /import\s*\{[^}]*\b(h|render|Component|Fragment)\b[^}]*\}\s*from\s*['"]@shared\/external\/vendors['"];?/g;
      if (pattern.test(content)) {
        offenders.push(posix);
      }
    }

    expect(
      offenders,
      `Forbidden direct vendor function imports found:\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
