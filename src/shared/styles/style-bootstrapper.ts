/**
 * @fileoverview 스타일 시스템 부트스트래퍼
 * @description 모든 스타일을 올바른 순서로 초기화
 * @version 1.0.0
 */

import { unifiedStyleManager, StylePriority } from './unified-style-manager';
import { createScopedLogger } from '@shared/logging';
import { generateZIndexCSS } from './z-index-system';

const logger = createScopedLogger('StyleBootstrapper');

/**
 * 스타일 시스템 초기화
 */
export async function initializeStyleSystem(): Promise<void> {
  try {
    logger.info('스타일 시스템 초기화 시작');

    // 1. 기본 리셋 스타일 등록
    await registerResetStyles();

    // 2. 디자인 토큰 등록
    await registerDesignTokens();

    // 3. 기본 컴포넌트 스타일 등록
    await registerBaseComponentStyles();

    // 4. 격리된 갤러리 스타일 등록
    await registerIsolatedGalleryStyles();

    // 5. 테마별 오버라이드 등록
    await registerThemeOverrides();

    // 6. UI 컴포넌트 스타일 등록
    await registerUIComponentStyles();

    // 7. Z-index 시스템 등록
    await registerZIndexStyles();

    // 8. 접근성 스타일 등록
    await registerAccessibilityStyles();

    // 9. 모든 스타일 주입
    await unifiedStyleManager.injectAll();

    logger.info('✅ 스타일 시스템 초기화 완료');
  } catch (error) {
    logger.error('❌ 스타일 시스템 초기화 실패:', error);
    throw error;
  }
}

/**
 * 기본 리셋 스타일 등록
 */
async function registerResetStyles(): Promise<void> {
  try {
    // reset.css 파일을 동적으로 로드
    const resetCSS = await import('@assets/styles/base/reset.css?raw');

    unifiedStyleManager.register('reset-styles', resetCSS.default || '', StylePriority.RESET);
  } catch (error) {
    logger.warn('리셋 스타일 로드 실패:', error);
  }
}

/**
 * 디자인 토큰 등록
 */
async function registerDesignTokens(): Promise<void> {
  try {
    // design-tokens.css 파일을 동적으로 로드
    const tokensCSS = await import('@shared/styles/design-tokens.css?raw');

    unifiedStyleManager.register(
      'design-tokens',
      tokensCSS.default || '',
      StylePriority.DESIGN_TOKENS
    );
  } catch (error) {
    logger.warn('디자인 토큰 로드 실패:', error);
  }
}

/**
 * 기본 컴포넌트 스타일 등록
 */
async function registerBaseComponentStyles(): Promise<void> {
  // 기본 버튼, 폼 등의 스타일
  const baseStyles = `
    /* 기본 버튼 스타일 */
    .xeg-btn-base {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--xeg-spacing-sm) var(--xeg-spacing-md);
      border-radius: var(--xeg-radius-md);
      border: 1px solid transparent;
      font-family: inherit;
      font-size: var(--xeg-font-size-sm);
      font-weight: var(--xeg-font-weight-medium);
      cursor: pointer;
      transition: all var(--xeg-duration-fast) var(--xeg-easing-ease-out);
      user-select: none;
      outline: none;
    }

    .xeg-btn-base:focus-visible {
      outline: 2px solid var(--xeg-color-primary);
      outline-offset: 2px;
    }
  `;

  unifiedStyleManager.register('base-components', baseStyles, StylePriority.BASE_COMPONENTS);
}

/**
 * 격리된 갤러리 스타일 등록
 */
async function registerIsolatedGalleryStyles(): Promise<void> {
  try {
    // isolated-gallery.css 파일을 동적으로 로드
    const isolatedCSS = await import('@shared/styles/isolated-gallery.css?raw');

    unifiedStyleManager.register(
      'isolated-gallery',
      isolatedCSS.default || '',
      StylePriority.ISOLATED_GALLERY
    );
  } catch (error) {
    logger.warn('격리된 갤러리 스타일 로드 실패:', error);
  }
}

/**
 * 테마별 오버라이드 등록
 */
async function registerThemeOverrides(): Promise<void> {
  // 동적 테마 스타일
  const themeOverrides = `
    /* 라이트 테마 오버라이드 */
    [data-theme='light'] {
      --xeg-toolbar-bg: var(--xeg-bg-toolbar-light);
      --xeg-toolbar-text: var(--xeg-color-text-primary);
      --xeg-toolbar-border: var(--xeg-border-light);
    }

    /* 다크 테마 오버라이드 */
    [data-theme='dark'] {
      --xeg-toolbar-bg: var(--xeg-bg-toolbar-dark);
      --xeg-toolbar-text: var(--xeg-color-text-inverse);
      --xeg-toolbar-border: var(--xeg-border-dark);
    }

    /* 고대비 모드 */
    @media (prefers-contrast: high) {
      .xeg-gallery-toolbar {
        background: var(--xeg-bg-solid-light) !important;
        border: 2px solid var(--xeg-color-text-primary) !important;
      }

      [data-theme='dark'] .xeg-gallery-toolbar {
        background: var(--xeg-bg-solid-dark) !important;
        border: 2px solid var(--xeg-color-text-inverse) !important;
      }
    }
  `;

  unifiedStyleManager.register('theme-overrides', themeOverrides, StylePriority.THEME_OVERRIDES);
}

/**
 * UI 컴포넌트 스타일 등록
 */
async function registerUIComponentStyles(): Promise<void> {
  try {
    logger.info('UI 컴포넌트 스타일 등록 시작');

    // Toast 시스템 스타일
    await registerToastStyles();

    // Button 컴포넌트 스타일
    await registerButtonStyles();

    // Tooltip 컴포넌트 스타일
    await registerTooltipStyles();

    // 기타 공통 UI 컴포넌트 스타일
    await registerCommonUIStyles();

    logger.info('✅ UI 컴포넌트 스타일 등록 완료');
  } catch (error) {
    logger.warn('⚠️ 일부 UI 컴포넌트 스타일 로드 실패:', error);
  }
}

/**
 * Toast 시스템 스타일 등록
 */
async function registerToastStyles(): Promise<void> {
  try {
    const [toastCSS, toastContainerCSS] = await Promise.all([
      import('@shared/components/ui/Toast/Toast.module.css?raw'),
      import('@shared/components/ui/Toast/ToastContainer.module.css?raw'),
    ]);

    const combinedToastStyles = `
      /* Toast 컴포넌트 스타일 */
      ${toastCSS.default || ''}

      /* Toast 컨테이너 스타일 */
      ${toastContainerCSS.default || ''}

      /* Toast 시스템 글로벌 스타일 */
      .xeg-toast-overlay {
        position: fixed;
        top: var(--xeg-spacing-lg);
        right: var(--xeg-spacing-lg);
        z-index: var(--xeg-z-toast-container);
        pointer-events: none;
      }

      .xeg-toast-overlay > * {
        pointer-events: auto;
      }
    `;

    unifiedStyleManager.register('toast-system', combinedToastStyles, StylePriority.UI_COMPONENTS);
  } catch (error) {
    logger.warn('Toast 스타일 로드 실패:', error);
  }
}

/**
 * Button 컴포넌트 스타일 등록
 */
async function registerButtonStyles(): Promise<void> {
  try {
    const buttonCSS = await import('@shared/components/ui/Button/Button.module.css?raw');

    const enhancedButtonStyles = `
      /* Button 컴포넌트 기본 스타일 */
      ${buttonCSS.default || ''}

      /* 글로벌 버튼 클래스 */
      .xeg-btn {
        /* 툴바와 통일된 버튼 기본 스타일 */
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: var(--xeg-spacing-sm) var(--xeg-spacing-md);
        background: var(--xeg-bg-surface-alpha-30);
        border: 1px solid var(--xeg-toolbar-border);
        border-radius: var(--xeg-radius-md);
        color: var(--xeg-toolbar-text);
        font-size: var(--xeg-font-size-sm);
        font-weight: var(--xeg-font-weight-medium);
        cursor: pointer;
        transition: all var(--xeg-duration-fast) var(--xeg-easing-ease-out);
        user-select: none;
        outline: none;
      }

      .xeg-btn:hover:not(:disabled) {
        background: var(--xeg-bg-surface-alpha-40);
        border-color: var(--xeg-color-primary-alpha-30);
        transform: translateY(-1px);
      }

      .xeg-btn:focus-visible {
        outline: 2px solid var(--xeg-color-primary);
        outline-offset: 2px;
      }

      .xeg-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        pointer-events: none;
      }
    `;

    unifiedStyleManager.register(
      'button-system',
      enhancedButtonStyles,
      StylePriority.UI_COMPONENTS
    );
  } catch (error) {
    logger.warn('Button 스타일 로드 실패:', error);
  }
}

/**
 * Tooltip 컴포넌트 스타일 등록
 */
async function registerTooltipStyles(): Promise<void> {
  try {
    const tooltipCSS = await import(
      '@shared/components/ui/EnhancedTooltip/EnhancedTooltip.module.css?raw'
    );

    const enhancedTooltipStyles = `
      /* Tooltip 컴포넌트 스타일 */
      ${tooltipCSS.default || ''}

      /* 글로벌 툴팁 스타일 */
      .xeg-tooltip {
        position: absolute;
        z-index: var(--xeg-z-tooltip);
        background: var(--xeg-bg-tooltip);
        color: var(--xeg-color-text-inverse);
        padding: var(--xeg-spacing-xs) var(--xeg-spacing-sm);
        border-radius: var(--xeg-radius-sm);
        font-size: var(--xeg-font-size-xs);
        font-weight: var(--xeg-font-weight-medium);
        box-shadow: var(--xeg-shadow-lg);
        pointer-events: none;
        white-space: nowrap;
        max-width: 300px;
        line-height: var(--xeg-line-height-tight);
      }

      .xeg-tooltip[data-placement^="top"] {
        margin-bottom: var(--xeg-spacing-xs);
      }

      .xeg-tooltip[data-placement^="bottom"] {
        margin-top: var(--xeg-spacing-xs);
      }

      .xeg-tooltip[data-placement^="left"] {
        margin-right: var(--xeg-spacing-xs);
      }

      .xeg-tooltip[data-placement^="right"] {
        margin-left: var(--xeg-spacing-xs);
      }
    `;

    unifiedStyleManager.register(
      'tooltip-system',
      enhancedTooltipStyles,
      StylePriority.UI_COMPONENTS
    );
  } catch (error) {
    logger.warn('Tooltip 스타일 로드 실패:', error);
  }
}

/**
 * 공통 UI 컴포넌트 스타일 등록
 */
async function registerCommonUIStyles(): Promise<void> {
  try {
    const uiBaseCSS = await import('@shared/components/ui/UIBase/UIBase.module.css?raw');

    const commonUIStyles = `
      /* UIBase 컴포넌트 스타일 */
      ${uiBaseCSS.default || ''}

      /* 공통 폼 컨트롤 스타일 - 툴바와 통일 */
      .xeg-form-control {
        font-family: inherit;
        background: var(--xeg-bg-surface-alpha-30);
        color: var(--xeg-toolbar-text);
        border: 1px solid var(--xeg-toolbar-border);
        border-radius: var(--xeg-radius-md);
        padding: var(--xeg-spacing-sm) var(--xeg-spacing-md);
        font-size: var(--xeg-font-size-sm);
        transition: all var(--xeg-duration-fast) var(--xeg-easing-ease-out);
        outline: none;
      }

      .xeg-form-control:hover {
        background: var(--xeg-bg-surface-alpha-40);
        border-color: var(--xeg-color-primary-alpha-30);
      }

      .xeg-form-control:focus-visible {
        outline: 2px solid var(--xeg-color-primary);
        outline-offset: 2px;
        border-color: var(--xeg-color-primary);
        box-shadow: 0 0 0 3px var(--xeg-color-primary-alpha-20);
      }

      /* 공통 카드 스타일 */
      .xeg-card {
        background: var(--xeg-bg-surface-alpha-20);
        border: 1px solid var(--xeg-toolbar-border);
        border-radius: var(--xeg-radius-lg);
        padding: var(--xeg-spacing-md);
        box-shadow: var(--xeg-shadow-sm);
      }

      /* 공통 구분선 스타일 */
      .xeg-divider {
        height: 1px;
        background: var(--xeg-toolbar-border);
        border: none;
        margin: var(--xeg-spacing-md) 0;
      }
    `;

    unifiedStyleManager.register('common-ui', commonUIStyles, StylePriority.UI_COMPONENTS);
  } catch (error) {
    logger.warn('공통 UI 스타일 로드 실패:', error);
  }
}

/**
 * Z-index 시스템 등록
 */
async function registerZIndexStyles(): Promise<void> {
  const zIndexCSS = generateZIndexCSS();

  unifiedStyleManager.register('z-index-system', zIndexCSS, StylePriority.Z_INDEX_SYSTEM);
}

/**
 * 접근성 스타일 등록
 */
async function registerAccessibilityStyles(): Promise<void> {
  const a11yStyles = `
    /* 모션 감소 선호도 지원 */
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    /* 스크린 리더 전용 */
    .xeg-sr-only {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    }

    /* 포커스 시에만 표시 */
    .xeg-sr-only:focus {
      position: static !important;
      width: auto !important;
      height: auto !important;
      overflow: visible !important;
      clip: auto !important;
      white-space: inherit !important;
    }
  `;

  unifiedStyleManager.register('accessibility', a11yStyles, StylePriority.ACCESSIBILITY);
}

/**
 * 동적 스타일 업데이트
 */
export async function updateDynamicStyles(updates: Record<string, string>): Promise<void> {
  const dynamicCSS = Object.entries(updates)
    .map(([selector, styles]) => `${selector} { ${styles} }`)
    .join('\n');

  await unifiedStyleManager.updateStyle('dynamic-styles', dynamicCSS);
}

/**
 * 테마 변경 처리
 */
export async function updateTheme(theme: 'light' | 'dark' | 'dim'): Promise<void> {
  document.documentElement.setAttribute('data-theme', theme);

  // 테마별 추가 동적 스타일이 필요한 경우
  const themeSpecificStyles = getThemeSpecificStyles(theme);
  if (themeSpecificStyles) {
    await unifiedStyleManager.updateStyle('theme-dynamic', themeSpecificStyles);
  }
}

/**
 * 테마별 동적 스타일 생성
 */
function getThemeSpecificStyles(theme: 'light' | 'dark' | 'dim'): string {
  switch (theme) {
    case 'light':
      return `
        .xeg-gallery-toolbar {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      `;
    case 'dark':
      return `
        .xeg-gallery-toolbar {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }
      `;
    case 'dim':
      return `
        .xeg-gallery-toolbar {
          box-shadow: 0 4px 12px rgba(21, 32, 43, 0.3);
        }
      `;
    default:
      return '';
  }
}

/**
 * 스타일 시스템 정리
 */
export function cleanupStyleSystem(): void {
  unifiedStyleManager.cleanup();
  logger.info('스타일 시스템 정리 완료');
}
