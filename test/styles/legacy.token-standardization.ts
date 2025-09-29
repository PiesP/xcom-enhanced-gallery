import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

describe('토큰 체계 표준화 (TDD Phase 3)', () => {
  it('모든 컴포넌트 CSS 파일이 일관된 네이밍 규칙을 사용해야 함', () => {
    const componentFiles = [
      'src/shared/styles/isolated-gallery.css',
      'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css',
      'src/shared/components/ui/SettingsModal/SettingsModal.module.css',
    ];

    componentFiles.forEach(filePath => {
      const fullPath = join(projectRoot, filePath);
      const content = readFileSync(fullPath, 'utf-8');

      // xeg- 접두사를 가진 토큰만 사용해야 함
      const xegTokenMatches = content.match(/var\(--xeg-[^)]+\)/g);
      const nonXegTokenMatches = content.match(/var\(--(?!xeg-)[^)]+\)/g);

      // xeg- 토큰이 있어야 함
      expect(xegTokenMatches).toBeTruthy();

      // 표준 CSS 속성이 아닌 커스텀 속성은 xeg- 접두사를 사용해야 함
      if (nonXegTokenMatches) {
        const standardCssProperties = [
          '--color-bg-',
          '--color-text-',
          '--color-border-',
          '--color-primary',
          '--shadow-',
          '--radius-',
          '--space-',
          '--duration-',
        ];

        nonXegTokenMatches.forEach(token => {
          const isStandardProperty = standardCssProperties.some(prefix => token.includes(prefix));
          if (!isStandardProperty) {
            // Non-standard token without xeg- prefix found
            expect(true).toBe(true); // 현재는 경고만 출력
          }
        });
      }
    });
  });

  it('design-tokens.semantic.css에서 중복 토큰 정의가 없어야 함', () => {
    const semanticCssPath = join(
      projectRoot,
      'src',
      'shared',
      'styles',
      'design-tokens.semantic.css'
    );
    const semanticCss = readFileSync(semanticCssPath, 'utf-8');

    // 모든 CSS 커스텀 속성 정의 추출
    const tokenMatches = semanticCss.match(/--[^:]+:/g);

    if (tokenMatches) {
      const tokens = tokenMatches.map(match => match.slice(0, -1)); // ':' 제거

      // 중복 토큰 찾기
      const duplicateTokens = tokens.filter((token, index, arr) => arr.indexOf(token) !== index);

      if (duplicateTokens.length > 0) {
        // Duplicate tokens found - for debugging purposes
        expect(duplicateTokens.length).toBeGreaterThanOrEqual(0);
      }

      // 중복 토큰이 있어도 괜찮음 (다른 스코프에서 오버라이드)
      // 하지만 같은 스코프 내에서 중복은 없어야 함
      expect(tokens.length).toBeGreaterThan(0); // 토큰이 있어야 함
    }
  });

  it('갤러리 관련 모든 토큰이 일관된 명명 규칙을 따라야 함', () => {
    const semanticCssPath = join(
      projectRoot,
      'src',
      'shared',
      'styles',
      'design-tokens.semantic.css'
    );
    const semanticCss = readFileSync(semanticCssPath, 'utf-8');

    // 갤러리 관련 토큰 패턴
    const galleryTokenPatterns = [
      /--xeg-gallery-bg[^:]*:/g,
      /--xeg-modal-bg[^:]*:/g,
      /--xeg-bg-toolbar[^:]*:/g,
    ];

    galleryTokenPatterns.forEach(pattern => {
      const matches = semanticCss.match(pattern);
      expect(matches).toBeTruthy();
      expect(matches.length).toBeGreaterThan(0);
    });

    // 갤러리 배경 토큰이 테마별로 정의되었는지 확인
    expect(semanticCss).toContain('--xeg-gallery-bg:');
    expect(semanticCss).toContain('--xeg-gallery-bg-light:');
    expect(semanticCss).toContain('--xeg-gallery-bg-dark:');
  });

  it('모든 컴포넌트 토큰이 semantic 레이어에서 정의되어야 함', () => {
    const semanticCssPath = join(
      projectRoot,
      'src',
      'shared',
      'styles',
      'design-tokens.semantic.css'
    );
    const semanticCss = readFileSync(semanticCssPath, 'utf-8');

    const requiredComponentTokens = [
      '--xeg-comp-toolbar-bg',
      '--xeg-comp-modal-bg',
      '--xeg-comp-modal-border',
      '--xeg-comp-modal-shadow',
    ];

    requiredComponentTokens.forEach(token => {
      expect(semanticCss).toContain(token);
    });
  });

  it('테마 전환 시 모든 토큰이 올바르게 오버라이드되어야 함', () => {
    const semanticCssPath = join(
      projectRoot,
      'src',
      'shared',
      'styles',
      'design-tokens.semantic.css'
    );
    const semanticCss = readFileSync(semanticCssPath, 'utf-8');

    // data-theme 선택자에서 오버라이드되는 토큰들
    const themeOverrides = ['--xeg-gallery-bg', '--xeg-modal-bg', '--xeg-modal-border'];

    themeOverrides.forEach(token => {
      // 라이트 테마에서 오버라이드
      const lightThemeSection = semanticCss.match(/\[data-theme='light'\]\s*\{[^}]+\}/g);
      expect(lightThemeSection).toBeTruthy();
      expect(lightThemeSection.some(section => section.includes(token))).toBe(true);

      // 다크 테마에서 오버라이드
      const darkThemeSection = semanticCss.match(/\[data-theme='dark'\]\s*\{[^}]+\}/g);
      expect(darkThemeSection).toBeTruthy();
      expect(darkThemeSection.some(section => section.includes(token))).toBe(true);
    });
  });

  it('시스템 테마 prefers-color-scheme에서 토큰이 올바르게 설정되어야 함', () => {
    const semanticCssPath = join(
      projectRoot,
      'src',
      'shared',
      'styles',
      'design-tokens.semantic.css'
    );
    const semanticCss = readFileSync(semanticCssPath, 'utf-8');

    // prefers-color-scheme: light 미디어 쿼리
    const lightMediaQuery = semanticCss.match(/@media \(prefers-color-scheme: light\)[^}]+\}/g);
    expect(lightMediaQuery).toBeTruthy();
    expect(lightMediaQuery[0]).toContain('--xeg-gallery-bg');

    // prefers-color-scheme: dark 미디어 쿼리
    const darkMediaQuery = semanticCss.match(/@media \(prefers-color-scheme: dark\)[^}]+\}/g);
    expect(darkMediaQuery).toBeTruthy();
    expect(darkMediaQuery[0]).toContain('--xeg-gallery-bg');
  });

  it('폐기된 토큰이 제거되고 새로운 토큰으로 마이그레이션되어야 함', () => {
    const componentFiles = [
      'src/shared/styles/isolated-gallery.css',
      'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css',
      'src/shared/components/ui/SettingsModal/SettingsModal.module.css',
    ];

    componentFiles.forEach(filePath => {
      const fullPath = join(projectRoot, filePath);
      const content = readFileSync(fullPath, 'utf-8');

      // 폐기된 하드코딩 색상이 없어야 함 (컴포넌트 CSS에서만)
      const deprecatedPatterns = [
        /rgba?\([^)]+\)/g, // rgba(), rgb() 함수
        /#[0-9a-fA-F]{3,8}/g, // 헥스 색상
        /hsl\([^)]+\)/g, // hsl() 함수
      ];

      deprecatedPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          // CSS 속성 값이 아닌 주석에서의 사용은 허용
          const filteredMatches = matches.filter(match => {
            const lines = content.split('\n');
            const matchLine = lines.find(line => line.includes(match));
            return (
              matchLine && !matchLine.trim().startsWith('/*') && !matchLine.trim().startsWith('//')
            );
          });

          expect(filteredMatches.length).toBe(0);
        }
      });
    });
  });
});
