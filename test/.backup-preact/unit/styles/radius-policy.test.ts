import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

/**
 * Radius Policy Contract Test
 * - Toolbar / Button CSS 내 하드코딩 px radius 또는 혼합 사용을 방지
 */

describe('Radius Policy', () => {
  const projectRoot = process.cwd();
  const toolbarCss = readFileSync(
    join(projectRoot, 'src', 'shared', 'components', 'ui', 'Toolbar', 'Toolbar.module.css'),
    'utf-8'
  );
  const buttonCss = readFileSync(
    join(projectRoot, 'src', 'shared', 'components', 'ui', 'Button', 'Button.module.css'),
    'utf-8'
  );

  test('Toolbar/Button: px 기반 radius 하드코딩 금지', () => {
    const hardcoded = /(border-radius:\s*(?:[0-9]+px))/g;
    const toolbarMatches = [...toolbarCss.matchAll(hardcoded)].map(m => m[1]);
    const buttonMatches = [...buttonCss.matchAll(hardcoded)].map(m => m[1]);
    expect(toolbarMatches).toEqual([]);
    expect(buttonMatches).toEqual([]);
  });

  test('Toolbar: 허용된 토큰만 사용', () => {
    // 허용 토큰 목록 (필요시 확장)
    const allowed = [
      '--xeg-radius-sm',
      '--xeg-radius-md',
      '--xeg-radius-lg',
      '--xeg-radius-pill',
      '--xeg-radius-full',
    ];
    const tokenUsage = Array.from(
      toolbarCss.matchAll(/border-radius:\s*var\((--[a-z0-9-]+)\)/g)
    ).map(m => m[1]);
    const disallowed = tokenUsage.filter(t => !allowed.includes(t));
    expect(disallowed).toEqual([]);
  });

  test('Button: primary 변형 radius 정책 준수 (md/lg 조합 허용 범위)', () => {
    const buttonTokenUsage = Array.from(
      buttonCss.matchAll(/border-radius:\s*var\((--[a-z0-9-]+)\)/g)
    ).map(m => m[1]);
    // 버튼은 sm/md/lg/pill/full 일부 상황 허용
    const allowed = [
      '--xeg-radius-sm',
      '--xeg-radius-md',
      '--xeg-radius-lg',
      '--xeg-radius-pill',
      '--xeg-radius-full',
    ];
    const invalid = buttonTokenUsage.filter(t => !allowed.includes(t));
    expect(invalid).toEqual([]);
  });
});
