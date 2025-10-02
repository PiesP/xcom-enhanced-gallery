/**
 * @fileoverview Icon 컴포넌트 최적화 테스트 (TDD)
 * @version 1.0.0
 * @description
 * Icon 컴포넌트의 하드코딩된 값들을 디자인 토큰으로 변경하고
 * 다른 컴포넌트들과 일관된 디자인 시스템을 구축하는 TDD 테스트
 *
 * **TDD 사이클**:
 * 1. RED: 하드코딩된 값들을 감지하는 실패하는 테스트 작성
 * 2. GREEN: CSS 변수 기반으로 구현하여 테스트 통과
 * 3. REFACTOR: 성능 최적화 및 코드 개선
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM 환경에서 __dirname 대체
const currentFileUrl = import.meta.url;
const currentFilePath = fileURLToPath(currentFileUrl);
const currentDir = path.dirname(currentFilePath);

/**
 * 테스트 환경 설정
 */
const setupTestEnvironment = () => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable',
  });

  // @ts-expect-error - JSDOM window 설정을 위한 타입 캐스팅
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.SVGElement = dom.window.SVGElement;
};

beforeEach(() => {
  setupTestEnvironment();
  vi.clearAllMocks();
});

describe('Icon 컴포넌트 최적화 (TDD)', () => {
  describe('RED Phase: 하드코딩된 값 검출', () => {
    it('Icon.tsx에서 하드코딩된 stroke-width 값이 없어야 한다', async () => {
      const iconFilePath = path.resolve(currentDir, '../../src/shared/components/ui/Icon/Icon.tsx');
      const iconContent = fs.readFileSync(iconFilePath, 'utf-8');

      // 하드코딩된 stroke-width 감지
      const hardCodedStrokeMatches = iconContent.match(/['"]stroke-width['"]:\s*['"]2['"]/g);

      expect(hardCodedStrokeMatches).toBeNull();

      // CSS 변수 사용 검증
      const cssVariableStrokePattern = /var\(--xeg-icon-stroke-width\)/;
      expect(iconContent).toMatch(cssVariableStrokePattern);
    });

    it('Icon.tsx에서 하드코딩된 기본 크기 값이 없어야 한다', async () => {
      const iconFilePath = path.resolve(currentDir, '../../src/shared/components/ui/Icon/Icon.tsx');
      const iconContent = fs.readFileSync(iconFilePath, 'utf-8');

      // 하드코딩된 size 기본값 감지
      const hardCodedSizeMatches = iconContent.match(/size\s*=\s*24/g);

      expect(hardCodedSizeMatches).toBeNull();

      // em 단위 또는 CSS 변수 사용 검증
      const relativeUnitPattern = /size.*em|size.*rem|var\(--xeg-icon-size\)/;
      expect(iconContent).toMatch(relativeUnitPattern);
    });

    it('디자인 토큰이 design-tokens.css에 정의되어야 한다', async () => {
      const tokensFilePath = path.resolve(currentDir, '../../src/shared/styles/design-tokens.css');
      const tokensContent = fs.readFileSync(tokensFilePath, 'utf-8');

      // Icon 관련 디자인 토큰들이 존재해야 함
      // Epic CSS-TOKEN-UNIFY-001: --xeg-icon-size 제거, semantic layer의 --size-icon-* 직접 사용
      expect(tokensContent).toMatch(/--xeg-icon-stroke-width:/);
      expect(tokensContent).toMatch(/--size-icon-/); // semantic layer에서 정의
      expect(tokensContent).toMatch(/--xeg-icon-line-height:/);
    });
  });

  describe('GREEN Phase: CSS 변수 기반 구현', () => {
    it.skip('Icon 컴포넌트가 CSS 변수를 사용하여 렌더링되어야 한다 - SKIP: Preact 기반 테스트', async () => {
      // SolidJS 전환으로 인해 mockPreact.h 호출 검증은 더 이상 유효하지 않음
      // Icon 컴포넌트는 이제 getSolidCore()만 사용하며, JSX 반환값을 직접 검증해야 함
      // 실제 CSS 변수 사용은 런타임/스냅샷 테스트로 검증 가능
    });

    it.skip('다양한 크기에서 일관된 비율을 유지해야 한다 - SKIP: Preact 기반 테스트', async () => {
      // SolidJS 전환으로 인해 mockPreact.h 호출 검증은 더 이상 유효하지 않음
      // viewBox 일관성은 스냅샷 테스트로 검증 가능
    });

    it.skip('접근성 속성이 올바르게 설정되어야 한다 - SKIP: Preact 기반 테스트', async () => {
      // SolidJS 전환으로 인해 mockPreact.h 호출 검증은 더 이상 유효하지 않음
      // 접근성 속성은 @solidjs/testing-library의 getByRole 등으로 검증 가능
    });
  });

  describe('디자인 시스템 일관성', () => {
    it('Icon 컴포넌트가 Toolbar, Button과 동일한 디자인 토큰을 사용해야 한다', async () => {
      const tokensFilePath = path.resolve(currentDir, '../../src/shared/styles/design-tokens.css');
      const tokensContent = fs.readFileSync(tokensFilePath, 'utf-8');

      // 공통 디자인 토큰 패턴들
      const sharedTokenPatterns = [
        /--xeg-radius-/, // border-radius 계열
        /--xeg-spacing-/, // spacing 계열
        /--xeg-transition-/, // transition 계열
        /--xeg-icon-/, // icon 전용 토큰
      ];

      sharedTokenPatterns.forEach(pattern => {
        expect(tokensContent).toMatch(pattern);
      });
    });

    it('아이콘 컴포넌트들이 일관된 스타일을 사용해야 한다', async () => {
      const iconsDir = path.resolve(currentDir, '../../src/shared/components/ui/Icon/icons');
      const registryPath = path.join(iconsDir, 'registry.ts');

      expect(fs.existsSync(registryPath)).toBe(true);

      const registryContent = fs.readFileSync(registryPath, 'utf-8');

      // 로컬 SVG 아이콘 맵을 통해 createSvgIcon을 사용하고 Hero 아이콘 잔재가 없어야 함
      expect(registryContent).toMatch(/createSvgIcon\(/);
      expect(registryContent).not.toMatch(/Hero/);

      const { XEG_ICON_COMPONENTS } = await import(
        '../../src/shared/components/ui/Icon/icons/registry'
      );

      Object.entries(XEG_ICON_COMPONENTS).forEach(([name, component]) => {
        expect(typeof component).toBe('function');
        expect(name).toMatch(/^[A-Z][A-Za-z0-9]+$/);
      });
    });

    it('빌드된 CSS에서 Icon 관련 하드코딩된 값이 제거되어야 한다', async () => {
      const userScriptPath = path.resolve(
        currentDir,
        '../../dist/xcom-enhanced-gallery.dev.user.js'
      );

      if (fs.existsSync(userScriptPath)) {
        const userScriptContent = fs.readFileSync(userScriptPath, 'utf-8');

        // 하드코딩된 stroke-width 값들이 제거되어야 함
        const hardCodedStrokePatterns = [/stroke-width.*["']2["']/g, /strokeWidth.*["']2["']/g];

        hardCodedStrokePatterns.forEach(pattern => {
          const matches = userScriptContent.match(pattern);
          // SVG 내부의 stroke-width는 허용하되, 스타일에서는 제거되어야 함
          if (matches) {
            matches.forEach(match => {
              // SVG path 내부가 아닌 스타일 정의에서는 하드코딩 금지
              expect(match).not.toMatch(/style|css|Style/i);
            });
          }
        });
      }
    });
  });

  describe('성능 및 최적화', () => {
    it.skip('Icon 컴포넌트가 불필요한 re-render를 방지해야 한다 - SKIP: getSolidCore mock 필요', async () => {
      // SolidJS 전환으로 인해 테스트에서 getSolidCore mock이 필요
      // 또한 SolidJS는 createMemo를 통해 메모이제이션을 다르게 처리
    });

    it('CSS 변수 fallback 값이 설정되어야 한다', async () => {
      const tokensFilePath = path.resolve(currentDir, '../../src/shared/styles/design-tokens.css');
      const tokensContent = fs.readFileSync(tokensFilePath, 'utf-8');

      // CSS 변수들이 fallback 값을 가져야 함
      const iconTokens = tokensContent.match(/--xeg-icon-[^:]+:[^;]+;/g) || [];

      expect(iconTokens.length).toBeGreaterThan(0);

      iconTokens.forEach(token => {
        // 각 토큰이 적절한 단위를 가져야 함
        // - 숫자 + 단위 (px, em, rem, %)
        // - 단위 없는 숫자 (stroke-width, opacity 등)
        // - 키워드 값 (currentColor, var() 등)
        const hasValidValue = token.match(
          /\d+(\.\d+)?(px|em|rem|%)|:\s*\d+(\.\d+)?;|currentColor|var\(/
        );
        expect(hasValidValue).toBeTruthy();
      });
    });
  });
});
