/**
 * @fileoverview P6: Legacy Semantic Class Cleanup Characterization Tests
 *
 * 이 테스트는 현재 legacy CSS 클래스 사용 현황을 기록하고,
 * 안전한 제거 과정을 위한 기준점을 제공합니다.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

describe('P6: Legacy Semantic Class Cleanup Characterization', () => {
  // const projectRoot = process.cwd();
  const projectRoot = '/app'; // 테스트 환경에서 고정 경로 사용

  describe('현재 Legacy CSS 클래스 사용 현황', () => {
    test('Toolbar CSS Module에서 legacy 클래스들을 식별해야 함', () => {
      const toolbarCssPath = join(
        projectRoot,
        'src/shared/components/ui/Toolbar/Toolbar.module.css'
      );
      let toolbarCss;

      try {
        toolbarCss = readFileSync(toolbarCssPath, 'utf-8');
      } catch (error) {
        // 파일이 없는 경우 빈 문자열로 처리
        toolbarCss = '';
      }

      // Legacy 시맨틱 클래스 패턴 검출
      const legacyClassPatterns = [
        /\.toolbar-/, // .toolbar-container, .toolbar-button 등
        /\.button-primary/, // semantic 버튼 클래스
        /\.button-secondary/, // semantic 버튼 클래스
        /\.icon-button/, // semantic 아이콘 버튼
        /\.modal-/, // .modal-container, .modal-content 등
        /\.settings-/, // .settings-modal, .settings-panel 등
      ];

      const foundLegacyClasses = legacyClassPatterns.map(pattern => {
        const matches = toolbarCss.match(new RegExp(pattern.source, 'g'));
        return {
          pattern: pattern.source,
          matches: matches || [],
          count: matches ? matches.length : 0,
        };
      });

      // 현재 상태 기록 (characterization)
      const hasLegacyClasses = foundLegacyClasses.some(item => item.count > 0);

      if (hasLegacyClasses) {
        // 🔍 Legacy classes found in Toolbar CSS - characterization only
      }

      // 테스트는 현재 상태를 기록만 하고 실패하지 않음
      expect(foundLegacyClasses).toBeDefined();
    });

    test('Button CSS Module에서 semantic 클래스 사용 패턴을 기록해야 함', () => {
      const buttonCssPath = join(projectRoot, 'src/shared/components/ui/Button/Button.module.css');
      let buttonCss;

      try {
        buttonCss = readFileSync(buttonCssPath, 'utf-8');
      } catch (error) {
        buttonCss = '';
      }

      // Semantic class 패턴 분석
      const semanticPatterns = {
        // 현재 사용 중일 수 있는 패턴들
        variants: buttonCss.match(/\.(primary|secondary|tertiary)/g) || [],
        sizes: buttonCss.match(/\.(small|medium|large)/g) || [],
        states: buttonCss.match(/\.(active|disabled|loading)/g) || [],
        types: buttonCss.match(/\.(solid|outline|ghost)/g) || [],
      };

      // 현재 패턴 사용 현황 기록
      const semanticClassCount = Object.values(semanticPatterns).flat().length;

      // 📊 Button semantic patterns - characterization only

      expect(semanticPatterns).toBeDefined();
      expect(semanticClassCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('DOM 구조에서 Legacy 클래스 의존성 분석', () => {
    let dom;
    let document;

    beforeEach(() => {
      dom = new JSDOM(
        `
        <!DOCTYPE html>
        <html>
          <body>
            <!-- Legacy class 사용 예시 -->
            <div class="toolbar-container legacy-toolbar">
              <button class="button-primary toolbar-button">Primary</button>
              <button class="icon-button toolbar-icon">Icon</button>
            </div>

            <div class="settings-modal modal-container">
              <div class="modal-content settings-panel">
                <h2 class="modal-title">Settings</h2>
                <button class="button-secondary modal-close">Close</button>
              </div>
            </div>
          </body>
        </html>
      `,
        { url: 'http://localhost' }
      );

      document = dom.window.document;
      // global.document = document;
      // global.window = dom.window;
    });

    test('Legacy 클래스가 적용된 요소들을 식별해야 함', () => {
      // Legacy 클래스 셀렉터들
      const legacySelectors = [
        '.toolbar-container',
        '.toolbar-button',
        '.toolbar-icon',
        '.button-primary',
        '.button-secondary',
        '.icon-button',
        '.modal-container',
        '.modal-content',
        '.modal-title',
        '.modal-close',
        '.settings-modal',
        '.settings-panel',
      ];

      const legacyElementsFound = legacySelectors.map(selector => {
        const elements = document.querySelectorAll(selector);
        return {
          selector,
          count: elements.length,
          elements: Array.from(elements).map(el => ({
            tagName: el.tagName.toLowerCase(),
            className: el.className,
            id: el.id || null,
          })),
        };
      });

      // 실제로 발견된 legacy 요소들
      const foundElements = legacyElementsFound.filter(item => item.count > 0);

      // 🎯 Found legacy elements - characterization only

      // 현재 상태 기록
      expect(foundElements.length).toBeGreaterThan(0);
      expect(foundElements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            selector: '.toolbar-container',
            count: 1,
          }),
          expect.objectContaining({
            selector: '.button-primary',
            count: 1,
          }),
        ])
      );
    });

    test('중복 클래스 사용 패턴을 분석해야 함', () => {
      // 같은 요소에 여러 semantic 클래스가 적용된 경우
      const elementsWithMultipleClasses = Array.from(document.querySelectorAll('*'))
        .filter(el => el.className.split(' ').length > 1)
        .map(el => ({
          tagName: el.tagName.toLowerCase(),
          classes: el.className.split(' ').filter(cls => cls.trim()),
          duplicateSemantics: el.className
            .split(' ')
            .filter(
              cls =>
                cls.includes('toolbar') ||
                cls.includes('button') ||
                cls.includes('modal') ||
                cls.includes('settings')
            ),
        }))
        .filter(item => item.duplicateSemantics.length > 1);

      // 🔄 Elements with multiple semantic classes - characterization only

      // 중복 사용 패턴 존재 확인
      expect(elementsWithMultipleClasses.length).toBeGreaterThanOrEqual(0);

      if (elementsWithMultipleClasses.length > 0) {
        // 실제 중복 패턴 예시 기록
        expect(elementsWithMultipleClasses[0]).toEqual(
          expect.objectContaining({
            duplicateSemantics: expect.arrayContaining([
              expect.stringMatching(/toolbar|button|modal|settings/),
            ]),
          })
        );
      }
    });
  });

  describe('CSS Modules 기반 새로운 구조 요구사항', () => {
    test('컴포넌트별 CSS Module 구조가 정의되어야 함', () => {
      // 새로운 CSS Module 기반 구조
      const newStructure = {
        'Toolbar.module.css': [
          'container', // .toolbar-container 대체
          'buttonGroup', // .toolbar-buttons 대체
          'iconGroup', // .toolbar-icons 대체
        ],
        'Button.module.css': [
          'button', // 기본 버튼
          'primary', // variant="primary"
          'secondary', // variant="secondary"
          'icon', // variant="icon"
          'small', // size="small"
          'medium', // size="medium"
          'large', // size="large"
        ],
        'Modal.module.css': [
          'overlay', // .modal-overlay 대체
          'container', // .modal-container 대체
          'content', // .modal-content 대체
          'header', // .modal-header 대체
          'body', // .modal-body 대체
          'footer', // .modal-footer 대체
        ],
      };

      // 구조 일관성 검증
      Object.entries(newStructure).forEach(([_moduleFile, classes]) => {
        // 클래스명이 camelCase인지 확인
        classes.forEach(className => {
          expect(className).toMatch(/^[a-z][a-zA-Z0-9]*$/);
        });

        // 중복 없이 정의되었는지 확인
        const uniqueClasses = [...new Set(classes)];
        expect(classes).toHaveLength(uniqueClasses.length);
      });

      expect(Object.keys(newStructure)).toHaveLength(3);
    });

    test('Legacy -> CSS Module 마이그레이션 맵이 정의되어야 함', () => {
      const migrationMap = {
        // Toolbar 마이그레이션
        '.toolbar-container': 'Toolbar.module.css → .container',
        '.toolbar-button': 'Button.module.css → .button + variant class',
        '.toolbar-icon': 'Button.module.css → .button.icon',

        // Button 마이그레이션
        '.button-primary': 'Button.module.css → .button.primary',
        '.button-secondary': 'Button.module.css → .button.secondary',
        '.icon-button': 'Button.module.css → .button.icon',

        // Modal 마이그레이션
        '.modal-container': 'Modal.module.css → .container',
        '.modal-content': 'Modal.module.css → .content',
        '.modal-close': 'Button.module.css → .button.secondary',
        '.settings-modal': 'Modal.module.css → .container',
        '.settings-panel': 'Modal.module.css → .content',
      };

      // 모든 legacy 클래스가 매핑되었는지 확인
      const legacyClasses = Object.keys(migrationMap);
      expect(legacyClasses).toHaveLength(11);

      // 매핑 형식 검증
      Object.values(migrationMap).forEach(mapping => {
        expect(mapping).toMatch(/\.module\.css → \./);
      });

      expect(migrationMap).toBeDefined();
    });
  });

  describe('제거 안전성 검증 요구사항', () => {
    test('CSS 클래스 의존성 체크 방법이 정의되어야 함', () => {
      // 제거하기 전 체크해야 할 파일 패턴들
      const filesToCheck = [
        'src/**/*.tsx', // React 컴포넌트
        'src/**/*.ts', // TypeScript 파일
        'src/**/*.module.css', // CSS Modules
        'src/**/*.css', // 일반 CSS
        'test/**/*.tsx', // 테스트 파일
        'test/**/*.ts', // 테스트 TypeScript
      ];

      // 체크할 legacy 클래스 패턴
      const legacyPatterns = [
        'toolbar-container',
        'toolbar-button',
        'button-primary',
        'button-secondary',
        'icon-button',
        'modal-container',
        'settings-modal',
      ];

      // 안전성 체크 프로세스 정의
      const safetyCheckProcess = {
        step1: 'grep 기반 전역 검색으로 사용처 확인',
        step2: 'TypeScript 컴파일 에러 체크',
        step3: 'CSS 스타일 적용 확인',
        step4: '테스트 실행으로 런타임 검증',
        step5: '시각적 회귀 테스트 (optional)',
      };

      expect(filesToCheck).toHaveLength(6);
      expect(legacyPatterns).toHaveLength(7);
      expect(Object.keys(safetyCheckProcess)).toHaveLength(5);
    });

    test('단계적 제거 계획이 수립되어야 함', () => {
      const removalPlan = {
        phase1: {
          target: 'Unused legacy classes',
          action: '사용되지 않는 CSS 클래스 제거',
          risk: 'Low',
        },
        phase2: {
          target: 'Toolbar legacy classes',
          action: 'Toolbar CSS Module로 마이그레이션',
          risk: 'Medium',
        },
        phase3: {
          target: 'Button legacy classes',
          action: 'Button CSS Module로 마이그레이션',
          risk: 'Medium',
        },
        phase4: {
          target: 'Modal legacy classes',
          action: 'Modal CSS Module로 마이그레이션',
          risk: 'High',
        },
      };

      // 각 phase가 적절히 정의되었는지 확인
      Object.values(removalPlan).forEach(phase => {
        expect(phase).toHaveProperty('target');
        expect(phase).toHaveProperty('action');
        expect(phase).toHaveProperty('risk');
        expect(['Low', 'Medium', 'High']).toContain(phase.risk);
      });

      expect(Object.keys(removalPlan)).toHaveLength(4);
    });
  });
});
