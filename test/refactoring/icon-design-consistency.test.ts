/**
 * @fileoverview Epic THEME-ICON-UNIFY-002 Phase B - 아이콘 디자인 일관성 검증 (RED)
 * @description TDD RED 테스트 - 아이콘 시각적 일관성 및 디자인 토큰 준수
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { XEG_ICONS, type XegIconDefinition } from '@assets/icons/xeg-icons';

describe('[RED] Epic THEME-ICON-UNIFY-002 Phase B - Icon Design Consistency', () => {
  describe('ViewBox Standardization', () => {
    it('모든 아이콘이 24x24 viewBox를 사용해야 한다', () => {
      const iconEntries = Object.entries(XEG_ICONS) as [string, XegIconDefinition][];

      iconEntries.forEach(([name, definition]) => {
        expect(definition.viewBox, `${name} 아이콘의 viewBox가 "0 0 24 24"이 아님`).toBe(
          '0 0 24 24'
        );
      });
    });

    it('모든 아이콘 정의에 올바른 metadata가 있어야 한다', () => {
      const iconEntries = Object.entries(XEG_ICONS) as [string, XegIconDefinition][];

      iconEntries.forEach(([name, definition]) => {
        expect(definition.metadata, `${name} 아이콘의 metadata가 누락됨`).toBeTruthy();
        expect(typeof definition.metadata, `${name} 아이콘의 metadata가 문자열이 아님`).toBe(
          'string'
        );
      });
    });
  });

  describe('Path Attributes Consistency', () => {
    it('모든 아이콘이 일관된 fill 속성을 사용해야 한다', () => {
      const iconEntries = Object.entries(XEG_ICONS) as [string, XegIconDefinition][];

      iconEntries.forEach(([name, definition]) => {
        definition.paths.forEach((path, index) => {
          expect(path.fill, `${name} 아이콘의 path[${index}]에 fill 속성이 누락됨`).toBeDefined();

          expect(path.fill, `${name} 아이콘의 path[${index}]가 currentColor를 사용하지 않음`).toBe(
            'currentColor'
          );
        });
      });
    });

    it('stroke 기반 아이콘은 적절한 stroke 속성을 가져야 한다', () => {
      // 현재는 모든 아이콘이 fill 기반이므로 stroke 속성이 없어야 함
      const iconEntries = Object.entries(XEG_ICONS) as [string, XegIconDefinition][];

      iconEntries.forEach(([name, definition]) => {
        definition.paths.forEach((path, index) => {
          // fill 기반 아이콘은 stroke 관련 속성이 없어야 함
          if (path.fill === 'currentColor') {
            expect(
              path.strokeLinecap,
              `${name} 아이콘의 path[${index}]는 fill 기반인데 strokeLinecap이 있음`
            ).toBeUndefined();

            expect(
              path.strokeLinejoin,
              `${name} 아이콘의 path[${index}]는 fill 기반인데 strokeLinejoin이 있음`
            ).toBeUndefined();
          }
        });
      });
    });
  });

  describe('Visual Balance - Path Complexity', () => {
    it('모든 아이콘이 최소 1개 이상의 path를 가져야 한다', () => {
      const iconEntries = Object.entries(XEG_ICONS) as [string, XegIconDefinition][];

      iconEntries.forEach(([name, definition]) => {
        expect(definition.paths.length, `${name} 아이콘에 path가 없음`).toBeGreaterThan(0);
      });
    });

    it('ChevronLeft와 ChevronRight는 대칭적이어야 한다', () => {
      const chevronLeft = XEG_ICONS.ChevronLeft;
      const chevronRight = XEG_ICONS.ChevronRight;

      // 동일한 개수의 path를 가져야 함
      expect(chevronLeft.paths.length, 'ChevronLeft와 ChevronRight의 path 개수가 다름').toBe(
        chevronRight.paths.length
      );

      // 동일한 viewBox를 가져야 함
      expect(chevronLeft.viewBox, 'ChevronLeft와 ChevronRight의 viewBox가 다름').toBe(
        chevronRight.viewBox
      );
    });
  });

  describe('Design Token Integration', () => {
    it('Icon 컴포넌트가 stroke-width 토큰을 사용해야 한다', async () => {
      // Icon.tsx 소스 파일 직접 읽기
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');

      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      const iconPath = path.resolve(currentDir, '../../src/shared/components/ui/Icon/Icon.tsx');
      const iconSource = fs.readFileSync(iconPath, 'utf-8');

      // Icon 컴포넌트 소스에 --xeg-icon-stroke-width 토큰 사용 확인
      expect(iconSource, 'Icon 컴포넌트가 --xeg-icon-stroke-width 토큰을 사용하지 않음').toContain(
        '--xeg-icon-stroke-width'
      );
    });

    it('디자인 토큰 파일에 아이콘 관련 토큰들이 정의되어야 한다', async () => {
      // Node.js fs 모듈을 사용하여 파일 읽기
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');

      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      const tokensPath = path.resolve(currentDir, '../../src/shared/styles/design-tokens.css');
      const tokensContent = fs.readFileSync(tokensPath, 'utf-8');

      // 필수 토큰 존재 확인
      expect(tokensContent, '--xeg-icon-stroke-width 토큰이 누락됨').toContain(
        '--xeg-icon-stroke-width:'
      );
      expect(tokensContent, '--xeg-icon-line-height 토큰이 누락됨').toContain(
        '--xeg-icon-line-height:'
      );
    });
  });

  describe('Naming Consistency', () => {
    it('모든 아이콘 이름이 PascalCase를 따라야 한다', () => {
      const iconNames = Object.keys(XEG_ICONS);
      const pascalCasePattern = /^[A-Z][a-zA-Z0-9]*$/;

      iconNames.forEach(name => {
        expect(pascalCasePattern.test(name), `${name} 아이콘이 PascalCase를 따르지 않음`).toBe(
          true
        );
      });
    });

    it('모든 아이콘 metadata가 kebab-case를 따라야 한다', () => {
      const iconEntries = Object.entries(XEG_ICONS) as [string, XegIconDefinition][];
      const kebabCasePattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

      iconEntries.forEach(([name, definition]) => {
        expect(
          kebabCasePattern.test(definition.metadata),
          `${name} 아이콘의 metadata "${definition.metadata}"가 kebab-case를 따르지 않음`
        ).toBe(true);
      });
    });
  });

  describe('Icon Set Completeness', () => {
    it('필수 Toolbar 아이콘들이 모두 정의되어야 한다', () => {
      const requiredIcons = ['ChevronLeft', 'ChevronRight', 'Download', 'Settings', 'Close'];

      requiredIcons.forEach(iconName => {
        expect(
          XEG_ICONS[iconName as keyof typeof XEG_ICONS],
          `필수 아이콘 ${iconName}이 누락됨`
        ).toBeDefined();
      });
    });

    it('필수 Gallery 아이콘들이 모두 정의되어야 한다', () => {
      const requiredIcons = ['ZoomIn', 'ArrowAutofitWidth', 'ArrowAutofitHeight', 'ArrowsMaximize'];

      requiredIcons.forEach(iconName => {
        expect(
          XEG_ICONS[iconName as keyof typeof XEG_ICONS],
          `필수 아이콘 ${iconName}이 누락됨`
        ).toBeDefined();
      });
    });

    it('Download 기능 아이콘들이 모두 정의되어야 한다', () => {
      const requiredIcons = ['Download', 'FileZip'];

      requiredIcons.forEach(iconName => {
        expect(
          XEG_ICONS[iconName as keyof typeof XEG_ICONS],
          `필수 아이콘 ${iconName}이 누락됨`
        ).toBeDefined();
      });
    });
  });
});
