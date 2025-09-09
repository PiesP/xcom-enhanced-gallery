/**
 * @fileoverview 배경 토큰 정의 검증 테스트
 * @description 누락된 배경 토큰들이 semantic 토큰에 정의되어야 함을 검증
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

describe('Background Token Definition', () => {
  it('should have --xeg-gallery-bg token defined in semantic tokens', () => {
    const semanticPath = join(
      process.cwd(),
      'src',
      'shared',
      'styles',
      'design-tokens.semantic.css'
    );
    const semanticContent = readFileSync(semanticPath, 'utf-8');

    // 갤러리 배경 토큰이 정의되어야 함
    expect(semanticContent).toMatch(/--xeg-gallery-bg/);
  });

  it('should have --xeg-bg-toolbar token defined in semantic tokens', () => {
    const semanticPath = join(
      process.cwd(),
      'src',
      'shared',
      'styles',
      'design-tokens.semantic.css'
    );
    const semanticContent = readFileSync(semanticPath, 'utf-8');

    // 툴바 배경 토큰이 정의되어야 함
    expect(semanticContent).toMatch(/--xeg-bg-toolbar/);
  });

  it('should have dark/light theme support for gallery background', () => {
    const semanticPath = join(
      process.cwd(),
      'src',
      'shared',
      'styles',
      'design-tokens.semantic.css'
    );
    const semanticContent = readFileSync(semanticPath, 'utf-8');

    // 다크/라이트 테마 지원 확인
    expect(semanticContent).toMatch(/\[data-theme=['"]dark['"]\][\s\S]*--xeg-gallery-bg/);
  });
});
