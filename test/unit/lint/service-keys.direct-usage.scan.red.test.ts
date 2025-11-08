/**
 * P4: SERVICE_KEYS direct usage reduction
 * - Forbid importing or referencing SERVICE_KEYS outside of approved modules.
 * Approved: constants.ts, shared/container/service-accessors.ts, shared/services/service-initialization.ts,
 *           shared/services/service-diagnostics.ts, shared/container/service-bridge.ts (indirect, not referencing keys),
 *           (runtime createAppContainer implementation removed; test harness only)
 */
import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
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

describe('P4: SERVICE_KEYS direct usage scan', () => {
  setupGlobalTestIsolation();

  it('Only approved modules may reference SERVICE_KEYS', () => {
    const SRC = join(process.cwd(), 'src');
    expect(statSync(SRC).isDirectory()).toBe(true);

    const APPROVED = new Set(
      [
        'src/constants.ts',
        // Constants definition files (where SERVICE_KEYS is defined)
        'src/constants/index.ts',
        'src/constants/service-keys.ts',
        'src/constants/types.ts',
        // Service Layer usage
        'src/shared/container/service-accessors.ts',
        'src/shared/services/service-initialization.ts',
        'src/shared/services/service-diagnostics.ts',
        // Container infrastructure (JSDoc examples only)
        'src/shared/container/core-service-registry.ts',
        'src/shared/container/harness.ts',
        'src/shared/container/index.ts',
        'src/shared/container/service-bridge.ts',
        'src/shared/services/lazy-service-registration.ts',
      ].map(p => p.replace(/\\/g, '/'))
    );

    const offenders: { file: string; line: string }[] = [];
    for (const f of listFilesRecursive(SRC)) {
      if (!/\.(ts|tsx)$/.test(f)) continue;
      const rel = relative(process.cwd(), f).replace(/\\/g, '/');
      const text = readFileSync(f, 'utf8');
      if (!/SERVICE_KEYS/.test(text)) continue;

      if (APPROVED.has(rel)) continue;

      // 개선된 주석 필터링: 여러 줄 블록 주석 제거
      let codeOnly = text;
      // Remove JSDoc and multi-line block comments
      codeOnly = codeOnly.replace(/\/\*[\s\S]*?\*\//g, '');
      // Remove single-line comments
      codeOnly = codeOnly
        .split('\n')
        .map(l => l.replace(/\/\/.*$/, ''))
        .join('\n');

      if (!codeOnly.includes('SERVICE_KEYS')) continue; // Skip if only in comments

      // 실제 코드에서 SERVICE_KEYS가 있는 첫 번째 라인 찾기
      const firstLine =
        text
          .split(/\r?\n/)
          .find(l => {
            const lineCode = l.replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, '');
            return lineCode.includes('SERVICE_KEYS');
          })
          ?.trim() ?? '';

      if (!firstLine) continue;

      offenders.push({ file: rel, line: firstLine });
    }

    if (offenders.length > 0) {
      const details = offenders.map(o => `- ${o.file}: ${o.line}`).join('\n');
      throw new Error(
        `Direct usage of SERVICE_KEYS is forbidden outside approved modules. Offenders:\n${details}`
      );
    }
  });
});
