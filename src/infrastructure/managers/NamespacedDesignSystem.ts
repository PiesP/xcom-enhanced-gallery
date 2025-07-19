/**
 * @fileoverview 네임스페이스된 디자인 시스템
 * @description 트위터 페이지와 격리된 디자인 시스템
 * @version 1.0.0
 */

import { logger } from '../logging';
import type { Cleanupable } from '../types/lifecycle.types';

/**
 * 트위터 페이지와 격리된 디자인 시스템
 *
 * @description
 * 기존 DesignSystem과 달리 다음 사항을 개선:
 * - 모든 CSS를 네임스페이스 내부로 격리
 * - 전역 CSS 변수 주입 방지
 * - 트위터 페이지 스타일에 영향 없음
 * - Shadow DOM 지원 준비
 */
export class NamespacedDesignSystem implements Cleanupable {
  private static readonly NAMESPACE = 'xeg-gallery';
  private static readonly STYLE_ID = 'xeg-namespaced-styles';
  private static instance: NamespacedDesignSystem | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): NamespacedDesignSystem {
    if (!NamespacedDesignSystem.instance) {
      NamespacedDesignSystem.instance = new NamespacedDesignSystem();
    }
    return NamespacedDesignSystem.instance;
  }

  /**
   * 네임스페이스된 디자인 시스템 초기화
   */
  public initialize(): void {
    if (this.isInitialized) {
      logger.debug('[NamespacedDesignSystem] Already initialized, skipping');
      return;
    }

    const existingStyle = document.getElementById(NamespacedDesignSystem.STYLE_ID);
    if (existingStyle) {
      logger.debug('[NamespacedDesignSystem] Style already exists, removing old');
      existingStyle.remove();
    }

    const namespacedCSS = this.generateNamespacedCSS();
    const styleElement = document.createElement('style');
    styleElement.id = NamespacedDesignSystem.STYLE_ID;
    styleElement.textContent = namespacedCSS;
    document.head.appendChild(styleElement);

    this.isInitialized = true;
    logger.info('🎨 [NamespacedDesignSystem] Namespaced design system initialized');
  }

  /**
   * 네임스페이스된 CSS 생성
   */
  private generateNamespacedCSS(): string {
    const namespace = NamespacedDesignSystem.NAMESPACE;

    return `
/* ===== XEG 갤러리 네임스페이스된 스타일 ===== */
/* 모든 스타일이 .${namespace} 내부에서만 적용됨 */

.${namespace} {
  /* ===== CSS 변수 (갤러리 내부에서만 적용) ===== */
  --xeg-color-primary: #1d9bf0;
  --xeg-color-background: #000000;
  --xeg-color-surface: rgba(255, 255, 255, 0.05);
  --xeg-color-text: #ffffff;
  --xeg-color-text-secondary: rgba(255, 255, 255, 0.7);
  --xeg-color-border: rgba(255, 255, 255, 0.1);

  /* 간격 */
  --xeg-spacing-xs: 0.25rem;
  --xeg-spacing-sm: 0.5rem;
  --xeg-spacing-md: 1rem;
  --xeg-spacing-lg: 1.5rem;
  --xeg-spacing-xl: 2rem;

  /* 모서리 */
  --xeg-radius-sm: 4px;
  --xeg-radius-md: 8px;
  --xeg-radius-lg: 12px;

  /* 전환 */
  --xeg-transition-fast: 0.15s ease;
  --xeg-transition-normal: 0.25s ease;
  --xeg-transition-slow: 0.35s ease;

  /* 그림자 */
  --xeg-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --xeg-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --xeg-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* 블러 */
  --xeg-blur-light: blur(8px);
  --xeg-blur-medium: blur(12px);
  --xeg-blur-heavy: blur(16px);

  /* Z-인덱스 */
  --xeg-z-gallery: 2147483647;
  --xeg-z-overlay: 2147483646;
  --xeg-z-modal: 2147483645;

  /* ===== 기본 갤러리 컨테이너 스타일 ===== */
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: var(--xeg-z-gallery) !important;
  background: var(--xeg-color-background) !important;
  display: flex !important;
  flex-direction: column !important;
  pointer-events: auto !important;
  isolation: isolate !important;
  contain: layout style paint !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  color: var(--xeg-color-text) !important;

  /* 블러 효과 */
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
}

/* ===== 갤러리 내부 요소 리셋 ===== */
.${namespace} *,
.${namespace} *::before,
.${namespace} *::after {
  box-sizing: border-box !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  outline: none !important;
  background: transparent !important;
  text-decoration: none !important;
  list-style: none !important;
  font-family: inherit !important;
  color: inherit !important;
}

/* ===== 갤러리 컴포넌트 스타일 ===== */

/* 툴바 */
.${namespace} .xeg-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: var(--xeg-blur-light);
  -webkit-backdrop-filter: var(--xeg-blur-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--xeg-spacing-md);
  z-index: var(--xeg-z-overlay);
  transition: var(--xeg-transition-fast);
  border-bottom: 1px solid var(--xeg-color-border);
}

.${namespace} .xeg-toolbar-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--xeg-radius-sm);
  color: var(--xeg-color-text);
  padding: var(--xeg-spacing-sm) var(--xeg-spacing-md);
  cursor: pointer;
  transition: var(--xeg-transition-fast);
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: var(--xeg-spacing-xs);
}

.${namespace} .xeg-toolbar-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.${namespace} .xeg-toolbar-button:active {
  transform: translateY(0);
}

.${namespace} .xeg-toolbar-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 뷰어 영역 - 갤러리 내부 스크롤만 허용 */
.${namespace} .xeg-viewer {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--xeg-spacing-lg);
  overflow-y: auto;
  overflow-x: hidden;
}

/* 미디어 아이템 */
.${namespace} .xeg-media-item {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: var(--xeg-radius-md);
  box-shadow: var(--xeg-shadow-lg);
  transition: var(--xeg-transition-normal);
}

/* 네비게이션 버튼 */
.${namespace} .xeg-nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: var(--xeg-color-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: var(--xeg-transition-fast);
  z-index: var(--xeg-z-overlay);
  backdrop-filter: var(--xeg-blur-light);
  -webkit-backdrop-filter: var(--xeg-blur-light);
}

.${namespace} .xeg-nav-button:hover {
  background: rgba(0, 0, 0, 0.8);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-50%) scale(1.1);
}

.${namespace} .xeg-nav-left {
  left: var(--xeg-spacing-md);
}

.${namespace} .xeg-nav-right {
  right: var(--xeg-spacing-md);
}

/* 로딩/에러 상태 */
.${namespace} .xeg-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--xeg-color-text-secondary);
}

.${namespace} .xeg-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ff6b6b;
  text-align: center;
  padding: var(--xeg-spacing-lg);
}

/* ===== 반응형 디자인 ===== */
@media (max-width: 768px) {
  .${namespace} .xeg-toolbar {
    height: 50px;
    padding: 0 var(--xeg-spacing-sm);
  }

  .${namespace} .xeg-toolbar-button {
    padding: var(--xeg-spacing-xs) var(--xeg-spacing-sm);
    font-size: 12px;
  }

  .${namespace} .xeg-nav-button {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }

  .${namespace} .xeg-viewer {
    padding: var(--xeg-spacing-sm);
  }
}

/* ===== 접근성 ===== */
@media (prefers-reduced-motion: reduce) {
  .${namespace} * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 고대비 모드 */
@media (prefers-contrast: high) {
  .${namespace} {
    --xeg-color-background: #000000;
    --xeg-color-text: #ffffff;
    --xeg-color-border: #ffffff;
  }

  .${namespace} .xeg-toolbar-button {
    border: 2px solid var(--xeg-color-border);
  }
}

/* ===== 트위터 페이지와의 완전한 격리 ===== */
/* 이 스타일들은 .${namespace} 외부에는 절대 영향을 주지 않음 */
`;
  }

  /**
   * 네임스페이스 클래스명 반환
   */
  public getNamespace(): string {
    return NamespacedDesignSystem.NAMESPACE;
  }

  /**
   * 초기화 상태 확인
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * CSS 변수 값 가져오기 (네임스페이스 내부에서만)
   */
  public getCSSVariable(name: string, element?: HTMLElement): string {
    const targetElement = element || document.documentElement;
    const fullName = name.startsWith('--xeg-') ? name : `--xeg-${name}`;

    return getComputedStyle(targetElement).getPropertyValue(fullName).trim();
  }

  /**
   * 진단 정보 반환
   */
  public getDiagnostics() {
    const styleElement = document.getElementById(NamespacedDesignSystem.STYLE_ID);

    return {
      isInitialized: this.isInitialized,
      namespace: NamespacedDesignSystem.NAMESPACE,
      styleId: NamespacedDesignSystem.STYLE_ID,
      styleElementExists: !!styleElement,
      styleElementSize: styleElement?.textContent?.length || 0,
    };
  }

  /**
   * 정리 (Cleanupable 인터페이스 구현)
   */
  public cleanup(): void {
    const styleElement = document.getElementById(NamespacedDesignSystem.STYLE_ID);
    if (styleElement) {
      styleElement.remove();
      logger.debug('[NamespacedDesignSystem] Style element removed');
    }

    this.isInitialized = false;
    NamespacedDesignSystem.instance = null;

    logger.info('[NamespacedDesignSystem] Cleanup completed');
  }
}

/**
 * 편의 함수: 싱글톤 인스턴스 접근
 */
export const namespacedDesignSystem = NamespacedDesignSystem.getInstance();
