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

    // Phase D-5: 레거시 hooks 정리 후 2개만 허용
    expect(orphanLines.length).toBeLessThanOrEqual(2);

    const allowed = new Set([
      'src/shared/polyfills/solid-jsx-dev-runtime.ts', // 개발 전용 폴리필 (필수)
      'src/features/gallery/utils/visible-navigation.ts', // 순수 유틸 (향후 사용 예정)
    ]);

    for (const line of orphanLines) {
      const file = line.split('info no-orphans:').pop()!.trim();
      expect(allowed.has(file)).toBe(true);
    }
  });
});
