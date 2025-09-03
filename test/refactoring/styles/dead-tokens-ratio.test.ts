import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import * as path from 'path';

/**
 * Dead Token Ratio Guard (RED 단계)
 * 목표: design-tokens.css 내 deprecated glass/blur 계열 토큰 비율 < 5%
 * 현재는 glass / surface-glass / glass-blur / glassmorphism 관련 토큰 다수 존재 → 실패(expected FAIL)
 * GREEN 단계: 실제 제거 후 비율 하향.
 */

describe('Phase22: Dead token ratio guard (glass/blur tokens)', () => {
  it('deprecated glass/blur token ratio should be < 5% (현재 RED 기대: 실패)', () => {
    // vitest Node 환경: 현재 테스트 파일 위치 기반으로 design-tokens.css 경로 계산
    const urlPath = decodeURIComponent(new URL(import.meta.url).pathname).replace(
      /^\/([A-Za-z]:)/,
      '$1'
    ); // Windows 드라이브 앞 선행 슬래시 제거
    const thisDir = path.dirname(urlPath);
    // Windows 경로 드라이브 중복 방지: 절대 루트 기준 프로젝트 루트 탐색
    // test/refactoring/styles => 프로젝트 루트까지 3단계 상위
    const projectRoot = path.resolve(thisDir, '../../..');
    const file = path.join(projectRoot, 'src', 'shared', 'styles', 'design-tokens.css');
    const css = readFileSync(file, 'utf8');

    // 추출: --xeg- 로 시작하는 커스텀 속성
    const tokenRegex = /--xeg-[a-z0-9-]+(?=\s*:)/g;
    const all = css.match(tokenRegex) || [];

    // deprecated 후보 패턴: glass, surface-glass, glass-blur, glassmorphism
    const deprecatedPatterns =
      /(glassmorphism|surface-glass|glass-blur|glass\b|blur-strong|blur-medium|blur-light)/;
    const deprecated = all.filter(t => deprecatedPatterns.test(t));

    const ratio = deprecated.length / (all.length || 1);

    // (디버그 로그 제거: lint 클린 유지)

    expect(ratio).toBeLessThan(0.05); // 현재는 초과하여 RED → 향후 토큰 제거 후 GREEN
  });
});
