import { execSync } from 'node:child_process';

/**
 * DEPS-GOV P1: 순환 의존 감소 예산 테스트
 * 목표: 기존 13 warnings -> P1 직후 11 이하 유지 (UI barrel cycle 1개 제거 예상)
 * 추가 감소는 P2 이후 단계에서 조정
 */

describe('architecture: dependency circular budget', () => {
  test('circular warnings within P1 budget (<=11)', () => {
    const stdout = execSync('npm run deps:check', { encoding: 'utf-8' });
    const circularLines = stdout.split(/\r?\n/).filter(l => l.includes('warn no-circular-deps:'));
    // 예산 상한
    expect(circularLines.length).toBeLessThanOrEqual(11);
  });
});
