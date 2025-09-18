import { execSync } from 'node:child_process';

/**
 * DEPS-GOV: orphan 모듈 노이즈 감소 가드
 * 허용 orphan: (placeholder) progressive-loader.ts, icon-types.ts
 * core-icons.ts 통합 완료 → whitelist 제거
 * 현재 목표(P1 이후): info no-orphans <= 1
 */

describe('architecture: dependency orphan guard', () => {
  test('orphan info count within threshold', () => {
    // 실행 시간 최소화를 위해 validate만 호출 (deps:check)
    const stdout = execSync('npm run deps:check', { encoding: 'utf-8' });

    const orphanLines = stdout.split(/\r?\n/).filter(l => l.includes('info no-orphans:'));

    // 허용 한도 (core-icons.ts 제거 후 1 이하)
    expect(orphanLines.length).toBeLessThanOrEqual(1);

    const allowed = new Set([
      'src/shared/services/icon-types.ts',
      'src/shared/loader/progressive-loader.ts',
    ]);

    for (const line of orphanLines) {
      const file = line.split('info no-orphans:').pop()!.trim();
      expect(allowed.has(file)).toBe(true);
    }
  });
});
