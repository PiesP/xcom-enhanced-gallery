/**
 * 성능 최적화된 글래스모피즘 시스템
 * @description GPU 가속 및 접근성을 고려한 글래스모피즘 효과
 */

/**
 * 글래스모피즘 효과 옵션
 */
interface GlassmorphismOptions {
  /** 배경 블러 강도 (기본: 12px) */
  readonly blur?: number;
  /** 배경 투명도 (0-1, 기본: 0.8) */
  readonly opacity?: number;
  /** 테두리 투명도 (0-1, 기본: 0.2) */
  readonly borderOpacity?: number;
  /** GPU 가속 사용 여부 (기본: true) */
  readonly useGPUAcceleration?: boolean;
  /** 접근성 고려 모드 (기본: true) */
  readonly respectAccessibility?: boolean;
}

/**
 * 글래스모피즘 CSS 생성
 */
export function generateGlassmorphismCSS(options: GlassmorphismOptions = {}): string {
  const {
    blur = 12,
    opacity = 0.8,
    borderOpacity = 0.2,
    useGPUAcceleration = true,
    respectAccessibility = true,
  } = options;

  const baseStyles = `
    background: rgba(255, 255, 255, ${opacity});
    border: 1px solid rgba(255, 255, 255, ${borderOpacity});
    backdrop-filter: blur(${blur}px);
    -webkit-backdrop-filter: blur(${blur}px);
  `;

  const gpuAcceleration = useGPUAcceleration
    ? `
    transform: translateZ(0);
    will-change: backdrop-filter;
    isolation: isolate;
  `
    : '';

  const accessibilityOverrides = respectAccessibility
    ? `
    /* 모션 감소 선호도 지원 */
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }

    /* 투명도 감소 선호도 지원 */
    @media (prefers-reduced-transparency: reduce) {
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      background: rgba(255, 255, 255, 0.95);
    }

    /* 고대비 모드 지원 */
    @media (prefers-contrast: high) {
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      background: var(--xeg-color-surface-solid, #ffffff);
      border: 2px solid var(--xeg-color-border-high-contrast, #000000);
    }

    /* 다크 테마 고대비 모드 */
    @media (prefers-color-scheme: dark) and (prefers-contrast: high) {
      background: var(--xeg-color-surface-dark-solid, #000000);
      border: 2px solid var(--xeg-color-border-dark-high-contrast, #ffffff);
    }
  `
    : '';

  return `${baseStyles}${gpuAcceleration}${accessibilityOverrides}`;
}

/**
 * 성능 최적화된 글래스모피즘 클래스 생성
 */
export function createOptimizedGlassClasses(): string {
  return `
/* 기본 글래스모피즘 */
.xeg-glass {
  ${generateGlassmorphismCSS()}
}

/* 라이트 글래스모피즘 */
.xeg-glass-light {
  ${generateGlassmorphismCSS({ opacity: 0.6, blur: 8 })}
}

/* 헤비 글래스모피즘 */
.xeg-glass-heavy {
  ${generateGlassmorphismCSS({ opacity: 0.9, blur: 16 })}
}

/* 툴바 전용 글래스모피즘 */
.xeg-glass-toolbar {
  ${generateGlassmorphismCSS({
    opacity: 0.85,
    blur: 10,
    borderOpacity: 0.15,
  })}
}

/* 폴백 지원 (backdrop-filter 미지원 브라우저) */
@supports not (backdrop-filter: blur(10px)) {
  .xeg-glass,
  .xeg-glass-light,
  .xeg-glass-heavy,
  .xeg-glass-toolbar {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

/* 다크 테마 글래스모피즘 */
@media (prefers-color-scheme: dark) {
  .xeg-glass {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .xeg-glass-light {
    background: rgba(0, 0, 0, 0.6);
    border-color: rgba(255, 255, 255, 0.08);
  }

  .xeg-glass-heavy {
    background: rgba(0, 0, 0, 0.9);
    border-color: rgba(255, 255, 255, 0.15);
  }

  .xeg-glass-toolbar {
    background: rgba(0, 0, 0, 0.85);
    border-color: rgba(255, 255, 255, 0.12);
  }
}

/* 성능 최적화 - 애니메이션 완료 후 will-change 제거 */
.xeg-glass:not(:hover):not(:focus):not(.xeg-animating) {
  will-change: auto;
}
`;
}

/**
 * 글래스모피즘 스타일 주입
 */
export function injectGlassmorphismStyles(): void {
  // 🔧 FIX: 테스트 환경에서 CSS 파싱 오류 방지
  if (typeof document === 'undefined') {
    return;
  }

  const existingStyle = document.getElementById('xeg-glassmorphism-styles');
  if (existingStyle) {
    existingStyle.remove();
  }

  const styleElement = document.createElement('style');
  styleElement.id = 'xeg-glassmorphism-styles';

  try {
    styleElement.textContent = createOptimizedGlassClasses();
    document.head?.appendChild(styleElement);
  } catch (error) {
    // 테스트 환경에서 CSS 파싱 실패 시 조용히 무시
    console.warn('CSS 스타일 주입 실패 (테스트 환경):', error);
  }
}

/**
 * 동적 글래스모피즘 적용
 */
import StyleManager from '@shared/styles/StyleManager';
import type { GlassmorphismIntensity } from '@shared/styles/StyleManager';

/**
 * @deprecated StyleManager.applyGlassmorphism를 직접 사용하세요
 */
export function applyGlassmorphism(
  element: HTMLElement,
  options: { intensity?: GlassmorphismIntensity } = {}
): void {
  const intensity = options.intensity || 'medium';
  StyleManager.applyGlassmorphism(element, intensity);
}

/**
 * 글래스모피즘 제거
 */
export function removeGlassmorphism(element: HTMLElement): void {
  const propertiesToRemove = [
    'backdrop-filter',
    '-webkit-backdrop-filter',
    'transform',
    'will-change',
    'isolation',
  ];

  propertiesToRemove.forEach(property => {
    element.style.removeProperty(property);
  });
}
