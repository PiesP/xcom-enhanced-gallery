/**
 * @fileoverview STYLE-ISOLATION-UNIFY P4 - Userscript head 주입 gating 테스트 (RED)
 * 목표:
 *  - vite userscript 플러그인의 styleInjector가 전역 플래그 XEG_STYLE_HEAD_MODE를 존중해야 한다.
 *  - 허용 모드: 'auto' | 'off' | 'defer' (기본 'auto')
 *  - 'defer' 모드에서는 requestAnimationFrame 또는 setTimeout을 통해 지연 주입 코드가 포함되어야 한다.
 *  - 이중 주입 방지: 기존 id='xeg-styles' 처리 로직이 존재하고, 모드 'off'에서는 head 주입을 건너뛸 수 있어야 한다.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

function readViteConfig(): string {
  const p = resolve(process.cwd(), 'vite.config.ts');
  return readFileSync(p, 'utf8');
}

describe('STYLE-ISOLATION-UNIFY P4: head injection gating', () => {
  const src = readViteConfig();

  it('플러그인에 XEG_STYLE_HEAD_MODE 플래그 문자열이 포함되어야 한다', () => {
    expect(src).toMatch(/XEG_STYLE_HEAD_MODE/);
  });

  it("허용 모드 'auto'|'off'|'defer' 문자열이 포함되어야 한다", () => {
    expect(src).toMatch(/'auto'/);
    expect(src).toMatch(/'off'/);
    expect(src).toMatch(/'defer'/);
  });

  it("'defer' 모드에서 requestAnimationFrame 또는 setTimeout을 통한 지연 주입 코드가 있어야 한다", () => {
    // 간단한 휴리스틱: rAF 또는 setTimeout 호출이 styleInjector 스니펫 문자열 내에 존재
    expect(src).toMatch(/requestAnimationFrame|setTimeout/);
  });

  it("이중 주입 방지를 위해 id='xeg-styles'를 검사/처리하는 코드가 포함되어야 한다", () => {
    expect(src).toMatch(/getElementById\(['"]xeg-styles['"]\)/);
  });
});
