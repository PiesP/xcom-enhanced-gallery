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
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { readAllDesignTokens } from '../shared/design-token-helpers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM 환경에서 __dirname 대체
const currentFileUrl = import.meta.url;
const currentFilePath = fileURLToPath(currentFileUrl);
const currentDir = path.dirname(currentFilePath);

/**
 * 테스트 환경 설정
 * happy-dom 환경에서 직접 실행 (JSDOM 제거)
 */
const setupTestEnvironment = () => {
  // happy-dom이 기본 제공하므로 추가 설정 불필요
  // globalThis.window, document, HTMLElement 모두 자동으로 설정됨
};

beforeEach(() => {
  setupTestEnvironment();
  vi.clearAllMocks();
});

describe('Icon 컴포넌트 최적화 (TDD)', () => {
  setupGlobalTestIsolation();

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

    it('디자인 토큰이 design token 계층에 정의되어야 한다', async () => {
      const tokensContent = readAllDesignTokens();

      // Icon 관련 디자인 토큰들이 존재해야 함
      expect(tokensContent).toMatch(/--xeg-icon-stroke-width:/);
      expect(tokensContent).toMatch(/--xeg-icon-size:/);
      expect(tokensContent).toMatch(/--xeg-icon-line-height:/);
    });
  });

  describe('GREEN Phase: CSS 변수 기반 구현', () => {
    it('Icon 컴포넌트가 CSS 변수를 사용하여 렌더링되어야 한다', async () => {
      // 동적 import로 Icon 컴포넌트 로드
      const mockPreact = {
        h: vi.fn((tag, props, ...children) => ({
          type: tag,
          props: { ...props, children },
        })),
      };

      vi.doMock('@shared/external/vendors', () => ({
        getSolid: () => mockPreact,
      }));

      const { Icon } = await import('../../src/shared/components/ui/Icon/Icon');

      Icon({
        'aria-label': '테스트 아이콘',
        children: [],
      });

      expect(mockPreact.h).toHaveBeenCalledWith(
        'svg',
        expect.objectContaining({
          'stroke-width': 'var(--xeg-icon-stroke-width)',
          width: 'var(--xeg-icon-size)',
          height: 'var(--xeg-icon-size)',
        }),
        []
      );
    });

    it('다양한 크기에서 일관된 비율을 유지해야 한다', async () => {
      const mockPreact = {
        h: vi.fn((tag, props, ...children) => ({
          type: tag,
          props: { ...props, children },
        })),
      };

      vi.doMock('@shared/external/vendors', () => ({
        getSolid: () => mockPreact,
      }));

      const { Icon } = await import('../../src/shared/components/ui/Icon/Icon');

      // 작은 크기
      Icon({ size: 16 });
      // 기본 크기
      Icon({});
      // 큰 크기
      Icon({ size: 32 });

      const calls = mockPreact.h.mock.calls.filter(call => call[0] === 'svg');

      // 모든 호출에서 viewBox가 일관되게 24x24여야 함
      calls.forEach(call => {
        expect(call[1].viewBox).toBe('0 0 24 24');
      });
    });

    it('접근성 속성이 올바르게 설정되어야 한다', async () => {
      const mockPreact = {
        h: vi.fn((tag, props, ...children) => ({
          type: tag,
          props: { ...props, children },
        })),
      };

      // Mock을 다시 설정
      vi.doMock('@shared/external/vendors', () => ({
        getSolid: () => mockPreact,
      }));

      // 모듈 캐시 삭제 후 재로드
      vi.resetModules();
      const { Icon } = await import('../../src/shared/components/ui/Icon/Icon');

      // aria-label이 있는 경우 테스트
      Icon({ 'aria-label': '다운로드' });

      const svgCalls = mockPreact.h.mock.calls.filter(call => call[0] === 'svg');
      expect(svgCalls.length).toBeGreaterThan(0);

      if (svgCalls.length > 0) {
        const lastSvgCall = svgCalls[svgCalls.length - 1];
        expect(lastSvgCall[1]).toMatchObject({
          role: 'img',
          'aria-label': '다운로드',
        });
      }

      mockPreact.h.mockClear();

      // aria-label이 없는 경우 테스트
      Icon({});

      const svgCallsWithoutLabel = mockPreact.h.mock.calls.filter(call => call[0] === 'svg');
      expect(svgCallsWithoutLabel.length).toBeGreaterThan(0);

      if (svgCallsWithoutLabel.length > 0) {
        const lastSvgCall = svgCallsWithoutLabel[svgCallsWithoutLabel.length - 1];
        expect(lastSvgCall[1]).toMatchObject({
          'aria-hidden': 'true',
        });
      }
    });
  });

  describe('디자인 시스템 일관성', () => {
    it('Icon 컴포넌트가 Toolbar, Button과 동일한 디자인 토큰을 사용해야 한다', async () => {
      const tokensContent = readAllDesignTokens();

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
      const iconsDir = path.resolve(currentDir, '../../src/shared/components/ui/Icon/hero');
      const iconFiles = fs.readdirSync(iconsDir).filter(file => file.endsWith('.tsx'));

      for (const file of iconFiles) {
        const filePath = path.join(iconsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // 모든 아이콘 파일이 기본 Icon 컴포넌트를 사용해야 함
        expect(content).toMatch(/import.*Icon.*from.*Icon/);
        // 포맷팅에 의해 '(' 다음 줄바꿈이 들어갈 수 있으므로 공백 허용
        expect(content).toMatch(/h\(\s*Icon,/);
      }
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
    it('Icon 컴포넌트가 불필요한 re-render를 방지해야 한다', async () => {
      const mockPreact = {
        h: vi.fn((tag, props, ...children) => ({
          type: tag,
          props: { ...props, children },
        })),
      };

      vi.doMock('@shared/external/vendors', () => ({
        getSolid: () => mockPreact,
      }));

      vi.resetModules();
      const { Icon } = await import('../../src/shared/components/ui/Icon/Icon');

      const props = { size: 24, className: 'test-icon' };

      // 동일한 props로 여러 번 렌더링
      Icon(props);
      Icon(props);

      // h 함수가 올바르게 호출되었는지 확인
      const svgCalls = mockPreact.h.mock.calls.filter(call => call[0] === 'svg');
      expect(svgCalls.length).toBe(2);

      // 같은 속성으로 렌더링되는지 확인
      if (svgCalls.length >= 2) {
        expect(svgCalls[0][1]).toEqual(svgCalls[1][1]);
      }
    });

    it('CSS 변수 fallback 값이 설정되어야 한다', async () => {
      const tokensContent = readAllDesignTokens();

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
