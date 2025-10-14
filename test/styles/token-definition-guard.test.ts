/**
 * @fileoverview Token Definition Guard Tests (Phase 55.2)
 * @description 디자인 토큰 정의 누락 재발 방지 가드 테스트
 *
 * Purpose:
 * - CSS 모듈에서 사용된 모든 컴포넌트 토큰이 design-tokens.semantic.css에 정의되어 있는지 검증
 * - 라이트/다크 모드 변형(-light/-dark)이 적절히 정의되었는지 확인
 * - 테마 토큰과 시스템 테마 토큰의 일관성 검증
 *
 * Coverage:
 * - ModalShell, KeyboardHelpOverlay의 --xeg-modal-* 토큰
 * - 향후 추가되는 컴포넌트별 토큰
 */

import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { readdirSync, readFileSync, statSync } from 'node:fs';

describe('token-definition-guard (Phase 55.2)', () => {
  const projectRoot = process.cwd();
  const semanticTokensPath = join(projectRoot, 'src/shared/styles/design-tokens.semantic.css');

  /**
   * CSS 모듈 파일에서 사용된 모든 CSS 변수 추출
   */
  function extractCssVariables(cssContent: string): string[] {
    const varPattern = /var\((--[\w-]+)/g;
    const variables = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = varPattern.exec(cssContent)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  /**
   * 특정 디렉터리에서 .module.css 파일을 재귀 탐색
   */
  function findModuleCssFiles(dir: string): string[] {
    const files: string[] = [];

    try {
      const entries = readdirSync(dir);

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          files.push(...findModuleCssFiles(fullPath));
        } else if (entry.endsWith('.module.css')) {
          files.push(fullPath);
        }
      }
    } catch (_error) {
      // 디렉터리 접근 실패 시 빈 배열 반환
    }

    return files;
  }

  /**
   * design-tokens.semantic.css에서 정의된 토큰 추출
   */
  function extractDefinedTokens(semanticCss: string): Set<string> {
    const definitionPattern = /(--[\w-]+):\s*.+?;/g;
    const defined = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = definitionPattern.exec(semanticCss)) !== null) {
      defined.add(match[1]);
    }

    return defined;
  }

  it('모든 컴포넌트 CSS 모듈에서 사용된 --xeg-modal-* 토큰이 semantic.css에 정의되어야 함 (Phase 55)', () => {
    // 1. semantic 토큰 파일 읽기
    const semanticCss = readFileSync(semanticTokensPath, 'utf-8');
    const definedTokens = extractDefinedTokens(semanticCss);

    // 2. Modal 관련 컴포넌트만 검증 (Phase 55 범위)
    const modalFiles = [
      join(projectRoot, 'src/shared/components/ui/ModalShell/ModalShell.module.css'),
      join(
        projectRoot,
        'src/features/gallery/components/KeyboardHelpOverlay/KeyboardHelpOverlay.module.css'
      ),
    ];

    // 3. 각 모듈 파일에서 사용된 --xeg-modal-* 토큰 검증
    const missingTokensPerFile: { file: string; tokens: string[] }[] = [];

    for (const file of modalFiles) {
      const content = readFileSync(file, 'utf-8');
      const usedTokens = extractCssVariables(content);

      // --xeg-modal- 접두사 토큰만 필터링 (Phase 55 범위)
      const modalTokens = usedTokens.filter(token => token.startsWith('--xeg-modal-'));

      const missing = modalTokens.filter(token => !definedTokens.has(token));

      if (missing.length > 0) {
        missingTokensPerFile.push({
          file: file.replace(projectRoot, '').replace(/\\/g, '/'),
          tokens: missing,
        });
      }
    }

    // 4. 미정의 토큰 리포트
    if (missingTokensPerFile.length > 0) {
      const report = missingTokensPerFile
        .map(({ file, tokens }) => `  ${file}:\n    ${tokens.join('\n    ')}`)
        .join('\n\n');

      throw new Error(
        `다음 모달 컴포넌트에서 미정의 --xeg-modal-* 토큰이 발견되었습니다:\n\n${report}\n\n` +
          `→ 해결 방법: src/shared/styles/design-tokens.semantic.css에 토큰을 정의하세요.`
      );
    }

    expect(missingTokensPerFile).toHaveLength(0);
  });

  it('라이트/다크 모드 변형 토큰(-light/-dark)이 모두 정의되어야 함', () => {
    const semanticCss = readFileSync(semanticTokensPath, 'utf-8');
    const definedTokens = extractDefinedTokens(semanticCss);

    // 변형이 필요한 토큰 패턴
    const variantTokenPatterns = [
      '--xeg-modal-bg',
      '--xeg-modal-border',
      // 향후 추가: --xeg-toolbar-bg, --xeg-settings-bg 등
    ];

    const missingVariants: string[] = [];

    for (const baseToken of variantTokenPatterns) {
      const lightVariant = `${baseToken}-light`;
      const darkVariant = `${baseToken}-dark`;

      if (!definedTokens.has(lightVariant)) {
        missingVariants.push(lightVariant);
      }

      if (!definedTokens.has(darkVariant)) {
        missingVariants.push(darkVariant);
      }
    }

    if (missingVariants.length > 0) {
      throw new Error(
        `다음 변형 토큰이 누락되었습니다:\n  ${missingVariants.join('\n  ')}\n\n` +
          `→ 해결 방법: design-tokens.semantic.css에 -light/-dark 변형을 추가하세요.`
      );
    }

    expect(missingVariants).toHaveLength(0);
  });

  it('[data-theme="dark"] 블록에 모든 다크 변형 토큰이 오버라이드되어야 함', () => {
    const semanticCss = readFileSync(semanticTokensPath, 'utf-8');

    // [data-theme='dark'] 블록 추출
    const darkThemeMatch = semanticCss.match(/\[data-theme=['"]dark['"]\]\s*\{[^}]+\}/);
    expect(darkThemeMatch, '[data-theme="dark"] 블록이 존재해야 합니다').not.toBeNull();

    const darkThemeBlock = darkThemeMatch![0];

    // 필수 다크 변형 토큰
    const requiredDarkTokens = [
      '--xeg-modal-bg-dark',
      '--xeg-modal-border-dark',
      '--xeg-modal-bg:', // 오버라이드
      '--xeg-modal-border:', // 오버라이드
    ];

    const missingTokens = requiredDarkTokens.filter(token => !darkThemeBlock.includes(token));

    if (missingTokens.length > 0) {
      throw new Error(
        `[data-theme="dark"] 블록에 다음 토큰이 누락되었습니다:\n  ${missingTokens.join('\n  ')}\n\n` +
          `→ 해결 방법: [data-theme='dark'] 블록에 토큰 오버라이드를 추가하세요.`
      );
    }

    expect(missingTokens).toHaveLength(0);
  });

  it('@media (prefers-color-scheme: dark)에 시스템 다크 모드 토큰이 정의되어야 함', () => {
    const semanticCss = readFileSync(semanticTokensPath, 'utf-8');

    // prefers-color-scheme: dark 블록 추출
    const prefersMatch = semanticCss.match(
      /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[^}]+:root:not\(\[data-theme=['"]light['"]\]\)[^}]+\}/
    );
    expect(
      prefersMatch,
      '@media (prefers-color-scheme: dark) 블록이 존재해야 합니다'
    ).not.toBeNull();

    const prefersBlock = prefersMatch![0];

    // 필수 시스템 다크 모드 토큰
    const requiredSystemTokens = [
      '--xeg-modal-bg-dark',
      '--xeg-modal-border-dark',
      '--xeg-modal-bg:',
      '--xeg-modal-border:',
    ];

    const missingTokens = requiredSystemTokens.filter(token => !prefersBlock.includes(token));

    if (missingTokens.length > 0) {
      throw new Error(
        `@media (prefers-color-scheme: dark)에 다음 토큰이 누락되었습니다:\n  ${missingTokens.join('\n  ')}\n\n` +
          `→ 해결 방법: prefers-color-scheme: dark 블록에 토큰을 추가하세요.`
      );
    }

    expect(missingTokens).toHaveLength(0);
  });

  it('컴포넌트별 토큰이 semantic 레이어의 "Component Scope Tokens" 섹션에 정의되어야 함', () => {
    const semanticCss = readFileSync(semanticTokensPath, 'utf-8');

    // Component Scope Tokens 섹션 추출
    const sectionMatch = semanticCss.match(
      /\/\*\s*Component Scope Tokens\s*\*\/[\s\S]*?(?=\/\*\s*===|$)/
    );
    expect(sectionMatch, '/* Component Scope Tokens */ 섹션이 존재해야 합니다').not.toBeNull();

    const componentSection = sectionMatch![0];

    // 필수 컴포넌트 토큰 (Phase 55 기준)
    const requiredComponentTokens = [
      '--xeg-modal-bg-light:',
      '--xeg-modal-border-light:',
      '--xeg-modal-bg:',
      '--xeg-modal-border:',
    ];

    const missingTokens = requiredComponentTokens.filter(
      token => !componentSection.includes(token)
    );

    if (missingTokens.length > 0) {
      throw new Error(
        `Component Scope Tokens 섹션에 다음 토큰이 누락되었습니다:\n  ${missingTokens.join('\n  ')}\n\n` +
          `→ 해결 방법: /* Component Scope Tokens */ 섹션에 토큰을 정의하세요.`
      );
    }

    expect(missingTokens).toHaveLength(0);
  });

  it('gray-800 primitive 토큰이 정의되어야 함 (Phase 55.3)', () => {
    const primitiveTokensPath = join(projectRoot, 'src/shared/styles/design-tokens.primitive.css');
    const primitiveTokens = readFileSync(primitiveTokensPath, 'utf-8');

    // gray-800이 정의되어 있는지 확인
    expect(primitiveTokens).toMatch(/--color-gray-800:\s*oklch\(/);

    // gray-700과 gray-900 사이에 정의되어 있는지 확인
    const grayScaleSection = primitiveTokens.match(
      /\/\* Gray Scale \*\/[\s\S]*?\/\* Red Scale \*\//
    );

    expect(grayScaleSection).toBeTruthy();
    expect(grayScaleSection![0]).toContain('--color-gray-700:');
    expect(grayScaleSection![0]).toContain('--color-gray-800:');
    expect(grayScaleSection![0]).toContain('--color-gray-900:');
  });

  it('semantic 토큰에서 하드코딩된 fallback 값이 제거되어야 함 (Phase 55.3)', () => {
    const semanticTokens = readFileSync(semanticTokensPath, 'utf-8');

    // 하드코딩된 hex 값 패턴 (fallback 용도로 사용된 것들)
    const hardcodedFallbacks = [
      /#2a2a2a/gi, // gray-800 fallback
      /#4a4a4a/gi, // gray-700 fallback
    ];

    const foundHardcoded: string[] = [];

    for (const pattern of hardcodedFallbacks) {
      const matches = semanticTokens.match(pattern);
      if (matches) {
        foundHardcoded.push(...matches);
      }
    }

    if (foundHardcoded.length > 0) {
      throw new Error(
        `semantic 토큰에서 하드코딩된 fallback 값을 발견했습니다:\n  ${foundHardcoded.join('\n  ')}\n\n` +
          `→ 해결 방법: primitive 토큰을 정의하고 fallback 없이 사용하세요.`
      );
    }

    expect(foundHardcoded).toHaveLength(0);
  });

  it('고대비 모드용 툴바 토큰이 정의되어야 함 (Phase 56)', () => {
    const semanticTokens = readFileSync(semanticTokensPath, 'utf-8');
    const definedTokens = extractDefinedTokens(semanticTokens);

    // 필수 고대비 툴바 토큰
    const requiredHighContrastTokens = [
      '--xeg-toolbar-bg-high-contrast-light',
      '--xeg-toolbar-bg-high-contrast-dark',
      '--xeg-toolbar-border-high-contrast-light',
      '--xeg-toolbar-border-high-contrast-dark',
      '--xeg-toolbar-button-bg-high-contrast-light',
      '--xeg-toolbar-button-bg-high-contrast-dark',
      '--xeg-toolbar-button-border-high-contrast-light',
      '--xeg-toolbar-button-border-high-contrast-dark',
    ];

    const missingTokens = requiredHighContrastTokens.filter(token => !definedTokens.has(token));

    if (missingTokens.length > 0) {
      throw new Error(
        `고대비 모드용 툴바 토큰이 누락되었습니다:\n  ${missingTokens.join('\n  ')}\n\n` +
          `→ 해결 방법: design-tokens.semantic.css의 Component Scope Tokens 섹션에 토큰을 추가하세요.`
      );
    }

    expect(missingTokens).toHaveLength(0);
  });

  it('[data-theme="light"] 블록에 고대비 라이트 변형이 오버라이드되어야 함 (Phase 56)', () => {
    const semanticTokens = readFileSync(semanticTokensPath, 'utf-8');

    // [data-theme='light'] 블록 추출 (있는 경우)
    const lightThemeMatch = semanticTokens.match(/\[data-theme=['"]light['"]\]\s*\{[^}]+\}/);

    if (lightThemeMatch) {
      const lightThemeBlock = lightThemeMatch[0];

      // 필수 고대비 라이트 오버라이드 (있는 경우)
      const requiredTokens = [
        '--xeg-toolbar-bg-high-contrast:',
        '--xeg-toolbar-border-high-contrast:',
      ];

      const missingTokens = requiredTokens.filter(token => !lightThemeBlock.includes(token));

      if (missingTokens.length > 0) {
        throw new Error(
          `[data-theme="light"] 블록에 다음 고대비 토큰이 누락되었습니다:\n  ${missingTokens.join('\n  ')}\n\n` +
            `→ 해결 방법: [data-theme='light'] 블록에 고대비 토큰 오버라이드를 추가하세요.`
        );
      }

      expect(missingTokens).toHaveLength(0);
    }
  });

  it('[data-theme="dark"] 블록에 고대비 다크 변형이 오버라이드되어야 함 (Phase 56)', () => {
    const semanticTokens = readFileSync(semanticTokensPath, 'utf-8');

    const darkThemeMatch = semanticTokens.match(/\[data-theme=['"]dark['"]\]\s*\{[^}]+\}/);
    expect(darkThemeMatch, '[data-theme="dark"] 블록이 존재해야 합니다').not.toBeNull();

    const darkThemeBlock = darkThemeMatch![0];

    // 필수 고대비 다크 오버라이드
    const requiredTokens = [
      '--xeg-toolbar-bg-high-contrast-dark',
      '--xeg-toolbar-border-high-contrast-dark',
      '--xeg-toolbar-bg-high-contrast:',
      '--xeg-toolbar-border-high-contrast:',
    ];

    const missingTokens = requiredTokens.filter(token => !darkThemeBlock.includes(token));

    if (missingTokens.length > 0) {
      throw new Error(
        `[data-theme="dark"] 블록에 다음 고대비 토큰이 누락되었습니다:\n  ${missingTokens.join('\n  ')}\n\n` +
          `→ 해결 방법: [data-theme='dark'] 블록에 고대비 토큰 오버라이드를 추가하세요.`
      );
    }

    expect(missingTokens).toHaveLength(0);
  });
});
