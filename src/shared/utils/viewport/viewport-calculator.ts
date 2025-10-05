/**
 * Viewport Calculator
 * Sub-Epic 2: CONTAINER-SIZE-OPTIMIZATION
 *
 * 동적 뷰포트 계산: 툴바 상태에 따라 가용 공간을 최대한 활용
 *
 * TDD Phase: GREEN
 */

/**
 * 뷰포트 차원 정보
 */
export interface ViewportDimensions {
  /** 뷰포트 너비 (px) */
  width: number;
  /** 뷰포트 높이 (px) */
  height: number;
  /** 가용 높이 (툴바 제외, px) */
  availableHeight: number;
  /** 툴바 높이 (px) */
  toolbarHeight: number;
}

/**
 * 최소 미디어 영역 높이 (px)
 * 작은 화면에서도 이 값 이하로 떨어지지 않음
 * @deprecated 하위 호환성을 위해 유지, calculateAdaptiveMinHeight 사용 권장
 */
export const MIN_MEDIA_HEIGHT = 400;

/**
 * 기본 툴바 높이 (px)
 * CSS 변수 --xeg-toolbar-height에서 가져오지 못할 경우 사용
 */
export const DEFAULT_TOOLBAR_HEIGHT = 80;

/**
 * 하단 패딩 (px)
 * 스크롤바 및 여백을 위한 공간
 */
export const BOTTOM_PADDING = 16;

/**
 * 뷰포트 높이 기반 적응형 최소 높이를 계산합니다.
 *
 * @param viewportHeight - 뷰포트 높이 (px)
 * @returns 적응형 최소 높이 (px)
 */
export function calculateAdaptiveMinHeight(viewportHeight: number): number {
  // 뷰포트 높이의 60% 최소 확보
  const ratio = 0.6;
  const calculated = Math.floor(viewportHeight * ratio);

  // 절대 최소값: 300px
  const ABSOLUTE_MIN = 300;

  return Math.max(calculated, ABSOLUTE_MIN);
}

/**
 * 툴바 호버 영역 높이를 계산합니다.
 * Sub-Epic 3: TOOLBAR-HOVER-EXPANSION
 *
 * @param viewportHeight - 뷰포트 높이 (px)
 * @returns 호버 영역 높이 (px)
 */
export function calculateHoverZoneHeight(viewportHeight: number): number {
  // 뷰포트 높이의 15% (최소 80px, 최대 200px)
  const ratio = 0.15;
  const calculated = Math.floor(viewportHeight * ratio);

  const MIN_HOVER_ZONE = 80;
  const MAX_HOVER_ZONE = 200;

  return Math.max(MIN_HOVER_ZONE, Math.min(calculated, MAX_HOVER_ZONE));
}

/**
 * CSS 변수에서 툴바 높이를 추출합니다.
 *
 * @returns 툴바 높이 (px), 파싱 실패 시 DEFAULT_TOOLBAR_HEIGHT 반환
 */
function getToolbarHeightFromCSS(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return DEFAULT_TOOLBAR_HEIGHT;
  }

  const cssValue = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue('--xeg-toolbar-height')
    .trim();

  if (!cssValue) {
    return DEFAULT_TOOLBAR_HEIGHT;
  }

  // '80px' -> 80
  const parsed = parseFloat(cssValue);
  return isNaN(parsed) || parsed < 0 ? DEFAULT_TOOLBAR_HEIGHT : parsed;
}

/**
 * 뷰포트 차원을 계산합니다.
 *
 * @param toolbarVisible - 툴바 표시 여부 (기본값: true)
 * @returns 뷰포트 차원 정보
 */
export function calculateViewportDimensions(toolbarVisible: boolean = true): ViewportDimensions {
  if (typeof window === 'undefined') {
    // 테스트 환경 또는 SSR
    return {
      width: 0,
      height: 0,
      availableHeight: 0,
      toolbarHeight: 0,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const toolbarHeight = toolbarVisible ? getToolbarHeightFromCSS() : 0;

  // 가용 높이 계산: 뷰포트 높이 - 툴바 높이 - 하단 패딩
  let availableHeight = height - toolbarHeight - BOTTOM_PADDING;

  // 적응형 최소 높이 계산 (뷰포트 높이의 60%, 최소 300px)
  const adaptiveMinHeight = calculateAdaptiveMinHeight(height);

  // 적응형 최소 높이 적용
  availableHeight = Math.max(availableHeight, adaptiveMinHeight);

  // 음수 방지 (비정상적인 상황)
  availableHeight = Math.max(availableHeight, 0);

  return {
    width,
    height,
    availableHeight,
    toolbarHeight,
  };
}

/**
 * 계산된 뷰포트 차원을 CSS 변수로 적용합니다.
 *
 * @param dimensions - 뷰포트 차원 정보
 */
export function applyViewportVariables(dimensions: ViewportDimensions): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;

  // --xeg-media-max-height: 미디어 요소의 최대 높이
  if (dimensions.toolbarHeight > 0) {
    root.style.setProperty('--xeg-media-max-height', `calc(100vh - ${dimensions.toolbarHeight}px)`);
  } else {
    root.style.setProperty('--xeg-media-max-height', '100vh');
  }

  // --xeg-viewport-height-constrained: 수직 갤러리용 제한된 높이
  root.style.setProperty(
    '--xeg-viewport-height-constrained',
    `calc(100vh - ${dimensions.toolbarHeight}px)`
  );
}

/**
 * 툴바 가시성에 따라 뷰포트를 업데이트합니다.
 *
 * @param toolbarVisible - 툴바 표시 여부
 */
export function updateViewportForToolbar(toolbarVisible: boolean): void {
  const dimensions = calculateViewportDimensions(toolbarVisible);
  applyViewportVariables(dimensions);
}
