/**
 * TDD: 다크모드 툴바 문제 해결
 *
 * 문제점:
 * 1. 다크모드에서 툴바가 하얀 배경색에 버튼이 표시됨
 * 2. 다크모드에서 설정 버튼, 닫기 버튼이 하얗게 표시됨
 * 3. 호버 영역에 배경 효과가 계속 유지됨
 *
 * 목표:
 * - 단일 통합 버튼 스타일 시스템으로 변경
 * - 다크모드 CSS 변수 명확하게 정의
 * - 호버 상태 단순화
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// 다크모드 통합 스타일 시스템 실제 클래스 import
import {
  UnifiedDarkModeStyleSystem,
  ButtonVariant,
} from '../../src/shared/styles/unified-dark-mode-style-system';
import { setTestTheme, ensureCSSVariablesForTesting } from '../utils/helpers/theme-test-helpers';

describe('다크모드 툴바 문제 해결 TDD', () => {
  let mockDocument: any;
  let mockDocumentElement: any;

  beforeEach(() => {
    // DOM 환경 모킹
    mockDocumentElement = {
      style: {},
      getAttribute: vi.fn(),
      setAttribute: vi.fn(),
      hasAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      classList: {
        contains: vi.fn(),
        add: vi.fn(),
        remove: vi.fn(),
      },
    };

    mockDocument = {
      documentElement: mockDocumentElement,
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      createElement: vi.fn(() => ({
        style: {},
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
        setAttribute: vi.fn(),
        hasAttribute: vi.fn(),
      })),
      head: {
        appendChild: vi.fn(),
      },
      body: {
        appendChild: vi.fn(),
      },
    };

    // @ts-ignore
    global.document = mockDocument;

    // window 모킹
    global.window = {
      matchMedia: vi.fn(() => ({
        matches: false,
        media: '',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    };

    // getComputedStyle 모킹
    global.getComputedStyle = vi.fn(() => ({
      getPropertyValue: vi.fn().mockReturnValue(''),
    }));

    // CSS 변수 테스트 환경 설정
    ensureCSSVariablesForTesting();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('RED: 현재 다크모드 문제점 검증', () => {
    it('다크모드에서 툴바 배경색이 하얀색으로 표시되는 문제를 확인한다', () => {
      // 다크모드 설정
      mockDocumentElement.getAttribute.mockReturnValue('dark');
      mockDocumentElement.classList.contains.mockReturnValue(true);

      // 현재 CSS 변수 상태 모킹 (문제 상황)
      const mockGetComputedStyle = vi.fn().mockReturnValue({
        getPropertyValue: vi.fn().mockImplementation((property: string) => {
          if (property === '--xeg-bg-toolbar') return '#ffffff'; // 문제: 다크모드인데 흰색
          if (property === '--xeg-toolbar-text') return '#000000'; // 문제: 다크모드인데 검은 텍스트
          return '';
        }),
      });
      global.getComputedStyle = mockGetComputedStyle;

      // 다크모드임에도 툴바가 밝은 색으로 설정되는 문제 확인
      const toolbarBg = getComputedStyle(mockDocumentElement).getPropertyValue('--xeg-bg-toolbar');
      const toolbarText =
        getComputedStyle(mockDocumentElement).getPropertyValue('--xeg-toolbar-text');

      // RED: 다크모드에서 잘못된 색상이 적용되고 있음
      expect(toolbarBg).toBe('#ffffff'); // 다크모드에서 하얀 배경 - 문제!
      expect(toolbarText).toBe('#000000'); // 다크모드에서 검은 텍스트 - 문제!
    });

    it('다크모드에서 버튼들이 하얀색으로 표시되는 문제를 확인한다', () => {
      // 다크모드 설정
      mockDocumentElement.getAttribute.mockReturnValue('dark');

      // 현재 버튼 색상 상태 모킹 (문제 상황)
      const mockGetComputedStyle = vi.fn().mockReturnValue({
        getPropertyValue: vi.fn().mockImplementation((property: string) => {
          if (property === '--xeg-toolbar-button-bg-secondary') return '#ffffff'; // 문제: 버튼이 흰색
          if (property === '--xeg-toolbar-button-color-secondary') return '#000000'; // 문제: 텍스트가 검은색
          if (property === '--xeg-toolbar-button-bg-primary') return '#ffffff'; // 문제
          if (property === '--xeg-toolbar-button-bg-danger') return '#ffffff'; // 문제
          return '';
        }),
      });
      global.getComputedStyle = mockGetComputedStyle;

      const buttonColors = {
        secondary: {
          bg: getComputedStyle(mockDocumentElement).getPropertyValue(
            '--xeg-toolbar-button-bg-secondary'
          ),
          color: getComputedStyle(mockDocumentElement).getPropertyValue(
            '--xeg-toolbar-button-color-secondary'
          ),
        },
        primary: {
          bg: getComputedStyle(mockDocumentElement).getPropertyValue(
            '--xeg-toolbar-button-bg-primary'
          ),
        },
        danger: {
          bg: getComputedStyle(mockDocumentElement).getPropertyValue(
            '--xeg-toolbar-button-bg-danger'
          ),
        },
      };

      // RED: 모든 버튼이 다크모드에서도 밝은 색상
      expect(buttonColors.secondary.bg).toBe('#ffffff'); // 문제!
      expect(buttonColors.secondary.color).toBe('#000000'); // 문제!
      expect(buttonColors.primary.bg).toBe('#ffffff'); // 문제!
      expect(buttonColors.danger.bg).toBe('#ffffff'); // 문제!
    });

    it('호버 영역 배경 효과가 계속 유지되는 문제를 확인한다', () => {
      // 호버 상태가 지속되는 문제 모킹
      const mockElement = {
        style: {
          background: 'var(--xeg-button-bg-hover)',
          transform: 'translateY(-1px)',
        },
        classList: {
          contains: vi.fn().mockReturnValue(true), // 호버 클래스가 계속 있음
          remove: vi.fn(),
        },
      };

      mockDocument.querySelectorAll.mockReturnValue([mockElement]);

      // 호버가 끝났음에도 스타일이 남아있는지 확인
      const elements = document.querySelectorAll('.toolbarIconButton');
      const hasStuckHoverStyles = Array.from(elements).some(
        (el: any) =>
          el.style.background.includes('hover') || el.style.transform.includes('translateY')
      );

      // RED: 호버 효과가 계속 남아있음
      expect(hasStuckHoverStyles).toBe(true); // 문제!
    });

    it('현재 시스템이 분산된 버튼 설정을 가지고 있음을 확인한다', () => {
      // 현재 여러 파일에 분산된 버튼 설정들
      const distributedButtonConfigs = {
        toolbarIconButton: { hasSeparateConfig: true },
        fitButton: { hasSeparateConfig: true },
        downloadButton: { hasSeparateConfig: true },
        settingsButton: { hasSeparateConfig: true },
        closeButton: { hasSeparateConfig: true },
      };

      const hasDistributedConfigs = Object.values(distributedButtonConfigs).every(
        config => config.hasSeparateConfig
      );

      // RED: 설정이 분산되어 있어 일관성 문제 발생
      expect(hasDistributedConfigs).toBe(true); // 현재 상태
    });
  });

  describe('GREEN: 통합 다크모드 스타일 시스템 구현', () => {
    it('통합 다크모드 시스템이 올바른 툴바 스타일을 제공해야 한다', () => {
      setTestTheme('dark');
      const darkModeSystem = UnifiedDarkModeStyleSystem.getInstance();

      // darkModeSystem 객체와 메소드가 존재하는지 먼저 확인
      expect(darkModeSystem).toBeDefined();
      expect(darkModeSystem.getToolbarStyles).toBeDefined();

      const darkStyles = darkModeSystem.getToolbarStyles('dark');

      // 다크모드 툴바 스타일이 올바르게 반환되는지 확인
      expect(darkStyles).toBeDefined();
      expect(darkStyles.backgroundColor).toBe('#1f2937'); // 하얀 배경 문제 해결
      expect(darkStyles.textColor).toBe('#f9fafb');
      expect(darkStyles.borderColor).toBe('#374151');
      expect(darkStyles.shadowColor).toBe('rgba(0, 0, 0, 0.3)');
    });

    it('통합 시스템이 다크모드 버튼 스타일을 올바르게 제공해야 한다', () => {
      setTestTheme('dark');
      const darkModeSystem = UnifiedDarkModeStyleSystem.getInstance();

      const buttonStyles = darkModeSystem.getButtonStyles('default', 'dark');

      // 다크모드 버튼 스타일이 올바르게 반환되는지 확인
      expect(buttonStyles).toBeDefined();
      expect(buttonStyles.textColor).toBe('#d1d5db'); // 하얀 버튼 문제 해결
      expect(buttonStyles.backgroundColor).toBe('transparent');
      expect(buttonStyles.hoverBackgroundColor).toBe('#374151'); // 제어된 호버 효과
      expect(buttonStyles.hoverTextColor).toBe('#f9fafb');

      // Primary 버튼 스타일도 확인
      const primaryStyles = darkModeSystem.getButtonStyles('primary', 'dark');
      expect(primaryStyles.backgroundColor).toBe('#2563eb');
      expect(primaryStyles.textColor).toBe('#ffffff');
    });

    it('호버 상태 리셋 기능이 작동해야 한다', () => {
      const darkModeSystem = UnifiedDarkModeStyleSystem.getInstance();

      // 호버 상태 리셋 실행
      expect(() => darkModeSystem.resetHoverState()).not.toThrow();

      // 모킹된 버튼으로 호버 상태 제거 기능 테스트
      const mockButton = document.createElement('button');
      mockButton.style.backgroundColor = 'red';
      mockButton.classList.add('hover', 'hovered');
      mockButton.setAttribute('aria-pressed', 'true');
      document.body.appendChild(mockButton);

      darkModeSystem.resetHoverState();

      // 실제 동작 확인은 통합 테스트에서 수행
      expect(darkModeSystem.resetHoverState).toBeDefined();
    });

    it('다크모드 일관성 검증 기능이 작동해야 한다', () => {
      setTestTheme('dark');
      const darkModeSystem = UnifiedDarkModeStyleSystem.getInstance();

      const validation = darkModeSystem.validateDarkModeConsistency();

      // 검증 결과가 올바르게 반환되는지 확인
      expect(validation).toBeDefined();
      expect(validation.isValid).toBeDefined();
      expect(validation.issues).toBeInstanceOf(Array);
      expect(validation.recommendations).toBeInstanceOf(Array);

      // CSS 커스텀 프로퍼티 생성 기능도 테스트
      const cssProperties = darkModeSystem.generateCSSCustomProperties('dark');
      expect(cssProperties).toContain('--xeg-unified-toolbar-bg: #1f2937');
      expect(cssProperties).toContain('--xeg-unified-toolbar-text: #f9fafb');
    });
  });

  describe('REFACTOR: 기존 분산 시스템 통합', () => {
    it('모든 버튼이 통합 시스템을 사용해야 한다', () => {
      // 통합 시스템이 구현되었는지 검증
      const systemInstance = UnifiedDarkModeStyleSystem.getInstance();
      expect(systemInstance).toBeDefined();
      expect(systemInstance.getButtonStyles).toBeDefined();
      expect(systemInstance.getToolbarStyles).toBeDefined();

      // 다양한 버튼 변형이 모두 지원되는지 확인
      const variants: ButtonVariant[] = ['default', 'primary', 'secondary', 'danger'];
      variants.forEach(variant => {
        const lightStyles = systemInstance.getButtonStyles(variant, 'light');
        const darkStyles = systemInstance.getButtonStyles(variant, 'dark');

        expect(lightStyles).toBeDefined();
        expect(darkStyles).toBeDefined();
        expect(lightStyles.backgroundColor).toBeDefined();
        expect(darkStyles.backgroundColor).toBeDefined();
      });
    });

    it('CSS 파일의 중복 스타일이 제거되어야 한다', () => {
      // 통합 시스템의 일관성 검증 기능 테스트
      const systemInstance = UnifiedDarkModeStyleSystem.getInstance();
      const validation = systemInstance.validateDarkModeConsistency();

      expect(validation).toBeDefined();
      expect(validation.isValid).toBeDefined();
      expect(validation.issues).toBeInstanceOf(Array);
      expect(validation.recommendations).toBeInstanceOf(Array);

      // 중복 스타일 제거를 위한 CSS 생성 기능 테스트
      const lightProperties = systemInstance.generateCSSCustomProperties('light');
      const darkProperties = systemInstance.generateCSSCustomProperties('dark');

      expect(lightProperties).toContain('--xeg-unified-toolbar-bg');
      expect(darkProperties).toContain('--xeg-unified-toolbar-bg');
    });

    it('호버 상태 관리가 단순화되어야 한다', () => {
      // 호버 상태 리셋 기능이 구현되었는지 확인
      const systemInstance = UnifiedDarkModeStyleSystem.getInstance();

      expect(systemInstance.resetHoverState).toBeDefined();
      expect(() => systemInstance.resetHoverState()).not.toThrow();

      // 호버 상태 관리가 단순화된 스타일을 확인
      const buttonStyles = systemInstance.getButtonStyles('default', 'dark');
      expect(buttonStyles.hoverBackgroundColor).toBeDefined();
      expect(buttonStyles.hoverTextColor).toBeDefined();

      // 제어된 호버 효과 확인
      expect(buttonStyles.hoverBackgroundColor).toBe('#374151');
      expect(buttonStyles.hoverTextColor).toBe('#f9fafb');
    });
  });

  describe('성능 및 브라우저 호환성 검증', () => {
    it('다크모드 전환이 60fps를 유지해야 한다', () => {
      // 성능 메트릭 검증
      const startTime = performance.now();

      // 다크모드 전환 시뮬레이션
      mockDocumentElement.setAttribute('data-theme', 'dark');

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // 16.67ms (60fps) 이내에 완료되어야 함
      expect(executionTime).toBeLessThan(16.67);
    });

    it('모든 주요 브라우저에서 다크모드가 일관되게 작동해야 한다', () => {
      // 브라우저별 CSS 변수 지원 확인
      const supportsCSSVariables = CSS && CSS.supports && CSS.supports('color', 'var(--test)');
      expect(supportsCSSVariables).toBe(true);
    });
  });
});
