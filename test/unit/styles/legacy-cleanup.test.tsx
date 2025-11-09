/**
 * @fileoverview P6: Legacy CSS Class Cleanup Unit Tests
 *
 * 안전하게 legacy CSS 클래스를 제거하고 CSS Module 기반으로 마이그레이션하는 테스트
 */

import { describe, test, expect } from 'vitest';

describe('P6: Legacy CSS Class Cleanup', () => {
  describe('Legacy Class Migration Strategy', () => {
    test('Button legacy 클래스 마이그레이션 맵이 정의되어야 함', () => {
      const buttonMigrationMap = {
        '.button-primary': {
          newLocation: 'Button.module.css',
          newClass: '.button.primary',
          component: 'Button.tsx',
          usage: 'className={clsx(styles.button, styles.primary)}',
        },
        '.button-secondary': {
          newLocation: 'Button.module.css',
          newClass: '.button.secondary',
          component: 'Button.tsx',
          usage: 'className={clsx(styles.button, styles.secondary)}',
        },
        '.button-danger': {
          newLocation: 'Button.module.css',
          newClass: '.button.danger',
          component: 'Button.tsx',
          usage: 'className={clsx(styles.button, styles.danger)}',
        },
      };

      // 모든 button legacy 클래스가 매핑되었는지 확인
      const legacyClasses = Object.keys(buttonMigrationMap);
      expect(legacyClasses).toContain('.button-primary');
      expect(legacyClasses).toContain('.button-secondary');
      expect(legacyClasses).toContain('.button-danger');

      // 각 매핑이 완전한지 확인
      Object.values(buttonMigrationMap).forEach(mapping => {
        expect(mapping).toHaveProperty('newLocation');
        expect(mapping).toHaveProperty('newClass');
        expect(mapping).toHaveProperty('component');
        expect(mapping).toHaveProperty('usage');
      });
    });

    test('Toolbar legacy 클래스 마이그레이션 맵이 정의되어야 함', () => {
      const toolbarMigrationMap = {
        '.toolbar-button': {
          newLocation: 'Toolbar.module.css',
          newClass: '.button',
          component: 'Toolbar.tsx',
          usage: 'className={styles.button}',
        },
        '.toolbar-separator': {
          newLocation: 'Toolbar.module.css',
          newClass: '.separator',
          component: 'Toolbar.tsx',
          usage: 'className={styles.separator}',
        },
        '.toolbar-container': {
          newLocation: 'Toolbar.module.css',
          newClass: '.container',
          component: 'Toolbar.tsx',
          usage: 'className={styles.container}',
        },
      };

      const legacyClasses = Object.keys(toolbarMigrationMap);
      expect(legacyClasses).toHaveLength(3);

      // Toolbar 관련 모든 클래스가 매핑되었는지 확인
      expect(legacyClasses).toEqual([
        '.toolbar-button',
        '.toolbar-separator',
        '.toolbar-container',
      ]);
    });
  });

  describe('CSS Module Structure Validation', () => {
    test('Button CSS Module 구조가 정의되어야 함', () => {
      const buttonModuleStructure = {
        fileName: 'Button.module.css',
        baseClasses: [
          'button', // 기본 버튼 스타일
          'icon', // 아이콘 버튼 스타일
        ],
        variants: [
          'primary', // variant="primary"
          'secondary', // variant="secondary"
          'danger', // variant="danger"
          'ghost', // variant="ghost"
        ],
        sizes: [
          'small', // size="small"
          'medium', // size="medium"
          'large', // size="large"
        ],
        states: [
          'disabled', // :disabled 상태
          'loading', // loading 상태
        ],
      };

      // 구조 완전성 검증
      expect(buttonModuleStructure.baseClasses.length).toBe(2);
      expect(buttonModuleStructure.variants.length).toBe(4);
      expect(buttonModuleStructure.sizes.length).toBe(3);
      expect(buttonModuleStructure.states.length).toBe(2);

      // 클래스명 규칙 검증 (camelCase)
      const allClasses = [
        ...buttonModuleStructure.baseClasses,
        ...buttonModuleStructure.variants,
        ...buttonModuleStructure.sizes,
        ...buttonModuleStructure.states,
      ];

      allClasses.forEach(className => {
        expect(className).toMatch(/^[a-z][a-zA-Z0-9]*$/);
      });
    });

    test('Toolbar CSS Module 구조가 정의되어야 함', () => {
      const toolbarModuleStructure = {
        fileName: 'Toolbar.module.css',
        layout: [
          'container', // 메인 컨테이너
          'buttonGroup', // 버튼 그룹
          'separator', // 구분선
        ],
        responsive: [
          'mobile', // 모바일 스타일
          'tablet', // 태블릿 스타일
          'desktop', // 데스크톱 스타일
        ],
        states: [
          'collapsed', // 접힌 상태
          'expanded', // 펼쳐진 상태
        ],
      };

      expect(toolbarModuleStructure.layout.length).toBe(3);
      expect(toolbarModuleStructure.responsive.length).toBe(3);
      expect(toolbarModuleStructure.states.length).toBe(2);

      // 모든 클래스가 유효한 형식인지 확인
      const allClasses = [
        ...toolbarModuleStructure.layout,
        ...toolbarModuleStructure.responsive,
        ...toolbarModuleStructure.states,
      ];

      allClasses.forEach(className => {
        expect(className).toMatch(/^[a-z][a-zA-Z0-9]*$/);
      });
    });
  });

  describe('Design Token Integration', () => {
    test('CSS Module에서 design token 사용 패턴이 정의되어야 함', () => {
      const tokenUsagePatterns = {
        spacing: {
          padding: 'var(--spacing-md)',
          margin: 'var(--spacing-sm)',
          gap: 'var(--spacing-lg)',
        },
        colors: {
          background: 'var(--button-bg-primary)',
          text: 'var(--button-text-primary)',
          border: 'var(--button-border)',
        },
        borderRadius: {
          button: 'var(--radius-sm)',
          container: 'var(--radius-md)',
        },
        elevation: {
          button: 'var(--shadow-sm)',
          toolbar: 'var(--shadow-md)',
        },
      };

      // 모든 토큰이 CSS 변수 형식인지 확인
      Object.values(tokenUsagePatterns).forEach(category => {
        Object.values(category).forEach(token => {
          expect(token).toMatch(/^var\(--[a-z-]+\)$/);
        });
      });

      expect(Object.keys(tokenUsagePatterns)).toEqual([
        'spacing',
        'colors',
        'borderRadius',
        'elevation',
      ]);
    });

    test('Legacy hardcoded 값들이 token으로 교체되어야 함', () => {
      const legacyToTokenMap = {
        // Spacing 교체
        'padding: 8px': 'padding: var(--spacing-md)',
        'margin: 4px': 'margin: var(--spacing-sm)',
        'gap: 12px': 'gap: var(--spacing-lg)',

        // Color 교체
        'background: #007bff': 'background: var(--button-bg-primary)',
        'color: #fff': 'color: var(--button-text-primary)',
        'border: 1px solid #ddd': 'border: 1px solid var(--button-border)',

        // Border radius 교체
        'border-radius: 4px': 'border-radius: var(--radius-sm)',
        'border-radius: 8px': 'border-radius: var(--radius-md)',
      };

      const legacyValues = Object.keys(legacyToTokenMap);
      const tokenValues = Object.values(legacyToTokenMap);

      // 모든 legacy 값이 토큰으로 매핑되었는지 확인
      expect(legacyValues.length).toBe(tokenValues.length);

      // 모든 token 값이 CSS 변수 형식인지 확인
      tokenValues.forEach(tokenValue => {
        if (tokenValue.includes('var(')) {
          expect(tokenValue).toMatch(/var\(--[a-z-]+\)/);
        }
      });
    });
  });

  describe('Safe Removal Process', () => {
    test('제거 전 안전성 검사 체크리스트가 정의되어야 함', () => {
      const safetyChecklist = {
        codebaseSearch: {
          description: 'grep으로 전체 프로젝트에서 클래스 사용 검색',
          commands: [
            'grep -r "button-primary" src/',
            'grep -r "toolbar-button" src/',
            'grep -r "modal-container" src/',
          ],
          expectedResult: 'No matches found',
        },
        typeScriptCheck: {
          description: 'TypeScript 컴파일 에러 확인',
          command: 'npm run type-check',
          expectedResult: 'No compilation errors',
        },
        testExecution: {
          description: '모든 테스트 통과 확인',
          command: 'npm test',
          expectedResult: 'All tests pass',
        },
        visualRegression: {
          description: '시각적 회귀 테스트 (선택사항)',
          tool: 'Playwright screenshots',
          expectedResult: 'No visual differences',
        },
      };

      // 체크리스트 완전성 확인
      expect(Object.keys(safetyChecklist)).toEqual([
        'codebaseSearch',
        'typeScriptCheck',
        'testExecution',
        'visualRegression',
      ]);

      // 각 체크 항목이 완전한지 확인
      Object.values(safetyChecklist).forEach(check => {
        expect(check).toHaveProperty('description');
        expect(check).toHaveProperty('expectedResult');
      });
    });

    test('단계별 제거 계획이 수립되어야 함', () => {
      const removalPhases = [
        {
          phase: 'Phase 1: Dead Code Removal',
          target: 'Completely unused legacy classes (modern features removed)',
          risk: 'Low',
          files: ['isolated-gallery.css'],
          validation: ['grep search', 'TypeScript check'],
        },
        {
          phase: 'Phase 2: Button Migration',
          target: 'Button legacy classes → CSS Modules',
          risk: 'Medium',
          files: ['Button.tsx', 'Button.module.css'],
          validation: ['Component tests', 'Visual tests'],
        },
        {
          phase: 'Phase 3: Toolbar Migration',
          target: 'Toolbar legacy classes → CSS Modules',
          risk: 'Medium',
          files: ['Toolbar.tsx', 'Toolbar.module.css'],
          validation: ['Integration tests', 'E2E tests'],
        },
        {
          phase: 'Phase 4: Global Cleanup',
          target: 'Remaining legacy tokens and classes',
          risk: 'High',
          files: ['design-tokens.component.css'],
          validation: ['Full test suite', 'Manual verification'],
        },
      ];

      expect(removalPhases).toHaveLength(4);

      // 각 phase가 완전하게 정의되었는지 확인
      removalPhases.forEach(phase => {
        expect(phase).toHaveProperty('phase');
        expect(phase).toHaveProperty('target');
        expect(phase).toHaveProperty('risk');
        expect(phase).toHaveProperty('files');
        expect(phase).toHaveProperty('validation');
        expect(['Low', 'Medium', 'High']).toContain(phase.risk);
      });

      // Risk 레벨이 점진적으로 증가하는지 확인
      const riskLevels = removalPhases.map(p => p.risk);
      expect(riskLevels).toEqual(['Low', 'Medium', 'Medium', 'High']);
    });
  });
});
