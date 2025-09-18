import { execSync } from 'node:child_process';

/**
 * DEPS-GOV: orphan 모듈 노이즈 감소 가드
 * 허용 orphan: core-icons.ts (순환 회피 상수/타입 분리 용도) 또는 향후 placeholder (progressive-loader.ts, icon-types.ts)
 * 현재 목표: info no-orphans <= 2
 */

describe('architecture: dependency orphan guard', () => {
  test('orphan info count within threshold', () => {
    // 실행 시간 최소화를 위해 validate만 호출 (deps:check)
    const stdout = execSync('npm run deps:check', { encoding: 'utf-8' });

    const orphanLines = stdout.split(/\r?\n/).filter(l => l.includes('info no-orphans:'));

    // 허용 한도
    expect(orphanLines.length).toBeLessThanOrEqual(2);

    const allowed = new Set([
      'src/shared/services/core-icons.ts',
      'src/shared/services/icon-types.ts',
      'src/shared/loader/progressive-loader.ts',
    ]);

    for (const line of orphanLines) {
      const file = line.split('info no-orphans:').pop()!.trim();
      expect(allowed.has(file)).toBe(true);
    }
  });
});
