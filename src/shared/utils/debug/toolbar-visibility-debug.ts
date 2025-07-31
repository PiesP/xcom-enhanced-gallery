/**
 * @fileoverview 툴바 가시성 디버깅 유틸리티
 * @version 1.0.0
 */

interface DebugInfo {
  found: boolean;
  selector: string;
  timestamp: string;
  element?: {
    tagName: string;
    className: string;
    id: string;
    attributes: Record<string, string>;
  };
  computed?: {
    display: string;
    visibility: string;
    opacity: string;
    zIndex: string;
    position: string;
    transform: string;
    width: string;
    height: string;
    top: string;
    left: string;
    right: string;
    bottom: string;
    backgroundColor: string;
    border: string;
    pointerEvents: string;
  };
  boundingRect?: {
    top: number;
    left: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
    x: number;
    y: number;
  };
  viewport?: {
    width: number;
    height: number;
    scrollX: number;
    scrollY: number;
  };
  visibility?: {
    isDisplayed: boolean;
    isVisible: boolean;
    hasOpacity: boolean;
    isInViewport: boolean;
    isClickable: boolean;
  };
  issues?: string[];
  hasIssues?: boolean;
}

interface ConflictElement {
  element: Element;
  zIndex: number;
  className: string;
  tagName: string;
  rect: DOMRect;
}

interface TestResults {
  mouseenter: boolean;
  mouseleave: boolean;
  click: boolean;
  hover: boolean;
}

/**
 * 툴바 가시성 디버깅 정보를 수집하는 유틸리티
 */
export function debugToolbarVisibility(
  selector = '[data-testid="xcom-gallery-toolbar"]'
): DebugInfo {
  const toolbar = document.querySelector(selector);

  if (!toolbar) {
    console.warn('[XEG] Toolbar Debug: 툴바 요소를 찾을 수 없습니다', selector);
    return {
      found: false,
      selector,
      timestamp: new Date().toISOString(),
    };
  }

  const styles = window.getComputedStyle(toolbar);
  const rect = toolbar.getBoundingClientRect();

  const debugInfo: DebugInfo = {
    found: true,
    selector,
    timestamp: new Date().toISOString(),
    element: {
      tagName: toolbar.tagName,
      className: toolbar.className,
      id: toolbar.id,
      attributes: Array.from(toolbar.attributes).reduce((acc: Record<string, string>, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {}),
    },
    computed: {
      display: styles.display,
      visibility: styles.visibility,
      opacity: styles.opacity,
      zIndex: styles.zIndex,
      position: styles.position,
      transform: styles.transform,
      width: styles.width,
      height: styles.height,
      top: styles.top,
      left: styles.left,
      right: styles.right,
      bottom: styles.bottom,
      backgroundColor: styles.backgroundColor,
      border: styles.border,
      pointerEvents: styles.pointerEvents,
    },
    boundingRect: {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      x: rect.x,
      y: rect.y,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    },
    visibility: {
      isDisplayed: styles.display !== 'none',
      isVisible: styles.visibility !== 'hidden',
      hasOpacity: parseFloat(styles.opacity || '1') > 0,
      isInViewport:
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth,
      isClickable: styles.pointerEvents !== 'none',
    },
  };

  // 가시성 문제 진단
  const issues = [];

  if (debugInfo.visibility && !debugInfo.visibility.isDisplayed) {
    issues.push('display: none으로 설정되어 있습니다');
  }

  if (debugInfo.visibility && !debugInfo.visibility.isVisible) {
    issues.push('visibility: hidden으로 설정되어 있습니다');
  }

  if (debugInfo.visibility && !debugInfo.visibility.hasOpacity) {
    issues.push('opacity가 0으로 설정되어 있습니다');
  }

  if (debugInfo.visibility && !debugInfo.visibility.isInViewport) {
    issues.push('뷰포트 범위 밖에 위치합니다');
  }

  if (debugInfo.visibility && !debugInfo.visibility.isClickable) {
    issues.push('pointer-events: none으로 설정되어 있습니다');
  }

  if (debugInfo.computed && parseInt(debugInfo.computed.zIndex) < 1000) {
    issues.push(`z-index가 너무 낮습니다 (최소 1000 권장)`);
  }

  // CSS transform 문제 감지
  if (debugInfo.computed?.transform && debugInfo.computed.transform !== 'none') {
    const transform = debugInfo.computed.transform;
    if (transform.includes('translateY(-100%)') || transform.includes('scale(0)')) {
      issues.push('CSS transform으로 화면 밖으로 이동되었습니다');
    }
  }

  debugInfo.issues = issues;
  debugInfo.hasIssues = issues.length > 0;

  console.group('[XEG] Toolbar Visibility Debug');
  console.log('요소:', toolbar);
  console.log('디버그 정보:', debugInfo);
  if (debugInfo.hasIssues) {
    console.warn('발견된 문제들:', issues);
  } else {
    console.log('✅ 가시성 문제 없음');
  }
  console.groupEnd();

  return debugInfo;
}

/**
 * 툴바 가시성을 강제로 복원하는 유틸리티
 */
export function isForceToolbarVisible(selector = '[data-testid="xcom-gallery-toolbar"]'): boolean {
  const toolbar = document.querySelector(selector) as HTMLElement;

  if (!toolbar) {
    console.warn('[XEG] Force Visible: 툴바 요소를 찾을 수 없습니다');
    return false;
  }

  // 강제 가시성 스타일 적용
  const forceStyles = {
    display: 'flex !important',
    visibility: 'visible !important',
    opacity: '1 !important',
    zIndex: '999999 !important',
    position: 'fixed !important',
    pointerEvents: 'auto !important',
    // 디버깅을 위한 임시 스타일
    border: '2px solid red !important',
    backgroundColor: 'rgba(255, 0, 0, 0.8) !important',
  };

  Object.entries(forceStyles).forEach(([property, value]) => {
    toolbar.style.setProperty(property, value.replace(' !important', ''), 'important');
  });

  console.log('[XEG] 툴바 강제 가시성 적용됨:', toolbar);
  return true;
}

/**
 * CSS 변수 기반 가시성 제어를 위한 유틸리티
 */
export function setToolbarCSSVariables(
  selector = '[data-testid="xcom-gallery-toolbar"]',
  variables: Record<string, string> = {}
): boolean {
  const toolbar = document.querySelector(selector) as HTMLElement;

  if (!toolbar) {
    console.warn('[XEG] CSS Variables: 툴바 요소를 찾을 수 없습니다');
    return false;
  }

  const defaultVariables = {
    '--toolbar-opacity': '1',
    '--toolbar-pointer-events': 'auto',
    '--toolbar-z-index': '999999',
    '--toolbar-bg': 'rgba(15, 20, 25, 0.9)',
    '--toolbar-border': '1px solid rgba(255, 255, 255, 0.1)',
  };

  const finalVariables = { ...defaultVariables, ...variables };

  Object.entries(finalVariables).forEach(([property, value]) => {
    toolbar.style.setProperty(property, value);
  });

  console.log('[XEG] CSS 변수 설정됨:', finalVariables);
  return true;
}

/**
 * 툴바와 다른 요소 간 z-index 충돌을 감지하는 유틸리티
 */
export function detectZIndexConflicts(
  selector = '[data-testid="xcom-gallery-toolbar"]'
): ConflictElement[] {
  const toolbar = document.querySelector(selector);

  if (!toolbar) {
    console.warn('[XEG] Z-Index Conflict: 툴바 요소를 찾을 수 없습니다');
    return [];
  }

  const toolbarRect = toolbar.getBoundingClientRect();
  const toolbarZIndex = parseInt(window.getComputedStyle(toolbar).zIndex) || 0;

  // 툴바와 겹치는 위치의 모든 요소들 검사
  const conflictElements: ConflictElement[] = [];
  const centerX = toolbarRect.left + toolbarRect.width / 2;
  const centerY = toolbarRect.top + toolbarRect.height / 2;

  const elementsAtPoint = document.elementsFromPoint(centerX, centerY);

  elementsAtPoint.forEach(element => {
    if (element === toolbar) return;

    const elementZIndex = parseInt(window.getComputedStyle(element).zIndex) || 0;
    const elementRect = element.getBoundingClientRect();

    // 툴바보다 높은 z-index를 가지면서 겹치는 요소
    if (
      elementZIndex >= toolbarZIndex &&
      elementRect.top < toolbarRect.bottom &&
      elementRect.bottom > toolbarRect.top &&
      elementRect.left < toolbarRect.right &&
      elementRect.right > toolbarRect.left
    ) {
      conflictElements.push({
        element,
        zIndex: elementZIndex,
        className: element.className,
        tagName: element.tagName,
        rect: elementRect,
      });
    }
  });

  if (conflictElements.length > 0) {
    console.warn('[XEG] Z-Index 충돌 감지됨:', conflictElements);
  }

  return conflictElements;
}

/**
 * 툴바 이벤트 리스너가 올바르게 동작하는지 테스트하는 유틸리티
 */
export function testToolbarInteractivity(
  selector = '[data-testid="xcom-gallery-toolbar"]'
): TestResults {
  const toolbar = document.querySelector(selector);

  if (!toolbar) {
    console.warn('[XEG] Interactivity Test: 툴바 요소를 찾을 수 없습니다');
    return {
      mouseenter: false,
      mouseleave: false,
      click: false,
      hover: false,
    };
  }

  const testResults: TestResults = {
    mouseenter: false,
    mouseleave: false,
    click: false,
    hover: false,
  };

  // 임시 이벤트 리스너 추가
  const testHandlers = {
    mouseenter: () => (testResults.mouseenter = true),
    mouseleave: () => (testResults.mouseleave = true),
    click: () => (testResults.click = true),
  };

  Object.entries(testHandlers).forEach(([event, handler]) => {
    toolbar.addEventListener(event, handler, { once: true });
  });

  // 이벤트 시뮬레이션
  setTimeout(() => {
    toolbar.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    setTimeout(() => {
      toolbar.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      setTimeout(() => {
        toolbar.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

        console.log('[XEG] 툴바 인터랙티브 테스트 결과:', testResults);
      }, 10);
    }, 10);
  }, 10);

  return testResults;
}

/**
 * 전체 툴바 진단을 실행하는 종합 유틸리티
 */
export function diagnoseToolbar(selector = '[data-testid="xcom-gallery-toolbar"]') {
  console.group('[XEG] 🔍 툴바 종합 진단 시작');

  const visibility = debugToolbarVisibility(selector);
  const conflicts = detectZIndexConflicts(selector);
  const interactivity = testToolbarInteractivity(selector);

  const diagnosis = {
    timestamp: new Date().toISOString(),
    visibility,
    conflicts,
    interactivity,
    recommendations: [] as string[],
  };

  // 추천 사항 생성
  if (visibility.hasIssues) {
    diagnosis.recommendations.push('forceToolbarVisible() 함수를 사용하여 강제 가시성 적용');
  }

  if (conflicts.length > 0) {
    diagnosis.recommendations.push('z-index 값을 999999 이상으로 증가');
  }

  if (!visibility.visibility?.isInViewport) {
    diagnosis.recommendations.push('툴바 위치를 뷰포트 내부로 조정');
  }

  if (diagnosis.recommendations.length === 0) {
    diagnosis.recommendations.push('현재 가시성 문제 없음 - 다른 원인 조사 필요');
  }

  console.log('📋 종합 진단 결과:', diagnosis);
  console.groupEnd();

  return diagnosis;
}
