/**
 * @fileoverview 통합 스타일 시스템 테스트
 * @description CSS 아키텍처 단순화 및 스타일 주입 최적화 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UnifiedStyleManager, StylePriority } from '@shared/styles/unified-style-manager';
import { initializeStyleSystem } from '@shared/styles/style-bootstrapper';

// DOM mock 설정
const mockDocument = {
  createElement: vi.fn(),
  head: { appendChild: vi.fn() },
  getElementById: vi.fn(),
};

const mockElement = {
  remove: vi.fn(),
  textContent: '',
  id: '',
};

// 글로벌 DOM 모킹
Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

describe('통합 스타일 시스템', () => {
  let styleManager: UnifiedStyleManager;

  beforeEach(() => {
    vi.clearAllMocks();
    styleManager = new UnifiedStyleManager();

    // DOM 메서드 모킹
    mockDocument.createElement.mockReturnValue(mockElement);
    mockDocument.getElementById.mockReturnValue(null);
  });

  afterEach(() => {
    styleManager.cleanup();
  });

  describe('UnifiedStyleManager', () => {
    it('스타일을 우선순위 순서로 등록해야 함', () => {
      // Given: 다양한 우선순위의 스타일들
      styleManager.register('reset', 'body { margin: 0; }', StylePriority.RESET);
      styleManager.register('tokens', ':root { --color: blue; }', StylePriority.DESIGN_TOKENS);
      styleManager.register('z-index', '.modal { z-index: 1000; }', StylePriority.Z_INDEX_SYSTEM);

      // When: 진단 정보 확인
      const diagnostics = styleManager.getDiagnostics();

      // Then: 3개의 스타일이 등록되어야 함
      expect(diagnostics.totalStyles).toBe(3);
      expect(diagnostics.isInitialized).toBe(false);
    });

    it('스타일을 올바른 순서로 주입해야 함', async () => {
      // Given: 역순으로 스타일 등록
      styleManager.register('high', '.high { color: red; }', StylePriority.Z_INDEX_SYSTEM);
      styleManager.register('low', '.low { color: blue; }', StylePriority.RESET);
      styleManager.register('medium', '.medium { color: green; }', StylePriority.DESIGN_TOKENS);

      // When: 모든 스타일 주입
      await styleManager.injectAll();

      // Then: DOM 메서드가 3번 호출되어야 함 (우선순위 순서대로)
      expect(mockDocument.createElement).toHaveBeenCalledTimes(3);
      expect(mockDocument.head.appendChild).toHaveBeenCalledTimes(3);

      // 진단 정보 확인
      const diagnostics = styleManager.getDiagnostics();
      expect(diagnostics.isInitialized).toBe(true);
      expect(diagnostics.injectedStyles).toHaveLength(3);
    });

    it('조건부 스타일을 올바르게 처리해야 함', async () => {
      // Given: 조건이 false인 스타일
      const falseCondition = () => false;
      styleManager.register(
        'conditional',
        '.test { color: red; }',
        StylePriority.DESIGN_TOKENS,
        falseCondition
      );

      // When: 모든 스타일 주입
      await styleManager.injectAll();

      // Then: DOM 메서드가 호출되지 않아야 함
      expect(mockDocument.createElement).not.toHaveBeenCalled();
      expect(mockDocument.head.appendChild).not.toHaveBeenCalled();
    });

    it('스타일 업데이트가 올바르게 작동해야 함', async () => {
      // Given: 초기 스타일 등록 및 주입
      styleManager.register('test', '.test { color: blue; }', StylePriority.DESIGN_TOKENS);
      await styleManager.injectAll();

      // When: 스타일 업데이트
      await styleManager.updateStyle('test', '.test { color: red; }');

      // Then: DOM 메서드가 추가로 호출되어야 함
      expect(mockDocument.createElement).toHaveBeenCalledTimes(2); // 초기 + 업데이트
    });

    it('스타일 제거가 올바르게 작동해야 함', () => {
      // Given: 스타일 등록
      styleManager.register('test', '.test { color: blue; }', StylePriority.DESIGN_TOKENS);

      // When: 스타일 제거
      styleManager.removeStyle('test');

      // Then: 진단 정보에서 스타일이 제거되어야 함
      const diagnostics = styleManager.getDiagnostics();
      expect(diagnostics.totalStyles).toBe(0);
    });

    it('정리 메서드가 모든 스타일을 제거해야 함', async () => {
      // Given: 여러 스타일 등록 및 주입
      styleManager.register('style1', '.test1 { color: red; }', StylePriority.DESIGN_TOKENS);
      styleManager.register('style2', '.test2 { color: blue; }', StylePriority.BASE_COMPONENTS);
      await styleManager.injectAll();

      // When: 정리 실행
      styleManager.cleanup();

      // Then: 모든 스타일이 제거되고 초기화 플래그가 리셋되어야 함
      const diagnostics = styleManager.getDiagnostics();
      expect(diagnostics.totalStyles).toBe(0);
      expect(diagnostics.isInitialized).toBe(false);
      expect(diagnostics.injectedStyles).toHaveLength(0);
    });
  });

  describe('스타일 부트스트래퍼', () => {
    it('initializeStyleSystem이 에러 없이 실행되어야 함', async () => {
      // When & Then: 에러 없이 완료되어야 함
      await expect(initializeStyleSystem()).resolves.toBeUndefined();
    });
  });

  describe('CSS 변수 시스템', () => {
    it('알파 투명도 변수가 올바른 형식을 가져야 함', () => {
      // Given: CSS 변수 값들
      const variables = [
        '--xeg-color-primary-alpha-10',
        '--xeg-color-primary-alpha-20',
        '--xeg-color-success-alpha-10',
        '--xeg-bg-surface-alpha-20',
      ];

      // When & Then: 변수명이 올바른 패턴을 따라야 함
      variables.forEach(variable => {
        expect(variable).toMatch(/--xeg-[\w-]+-alpha-\d+/);
      });
    });
  });

  describe('StylePriority enum', () => {
    it('우선순위 값이 올바른 순서를 가져야 함', () => {
      // Then: 낮은 번호가 먼저 적용되어야 함
      expect(StylePriority.RESET).toBeLessThan(StylePriority.DESIGN_TOKENS);
      expect(StylePriority.DESIGN_TOKENS).toBeLessThan(StylePriority.BASE_COMPONENTS);
      expect(StylePriority.BASE_COMPONENTS).toBeLessThan(StylePriority.ISOLATED_GALLERY);
      expect(StylePriority.ISOLATED_GALLERY).toBeLessThan(StylePriority.CSS_MODULES);
      expect(StylePriority.CSS_MODULES).toBeLessThan(StylePriority.THEME_OVERRIDES);
      expect(StylePriority.THEME_OVERRIDES).toBeLessThan(StylePriority.DYNAMIC_STYLES);
      expect(StylePriority.DYNAMIC_STYLES).toBeLessThan(StylePriority.Z_INDEX_SYSTEM);
      expect(StylePriority.Z_INDEX_SYSTEM).toBeLessThan(StylePriority.ACCESSIBILITY);
    });
  });
});
