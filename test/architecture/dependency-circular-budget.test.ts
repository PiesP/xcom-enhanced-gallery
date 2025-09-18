import { execSync } from 'node:child_process';

/**
 * DEPS-GOV P2: 순환 의존 감소 예산 테스트
 * P1 결과: 13 -> 11
 * P2 목표: 11 -> 8 이하 (UI barrel + selective unbarreling 적용)
 */

describe('architecture: dependency circular budget', () => {
  test('circular warnings within P4 budget (<=5)', () => {
    const stdout = execSync('npm run deps:check', { encoding: 'utf-8' });
    const circularLines = stdout.split(/\r?\n/).filter(l => l.includes('warn no-circular-deps:'));
    // 예산 상한 (P4)
    expect(circularLines.length).toBeLessThanOrEqual(5);
  });
});
