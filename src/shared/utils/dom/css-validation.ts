/**
 * @fileoverview CSS 검증 유틸리티
 * @description CSS 셀렉터 검증과 성능 분석 함수들
 */

/**
 * CSS 셀렉터가 유효한지 검증합니다.
 */
export function isValidCSSSelector(selector: string): boolean {
  if (!selector || typeof selector !== 'string') {
    return false;
  }

  try {
    // 브라우저에서 querySelector를 사용하여 유효성 검증
    document.querySelector(selector);
    return true;
  } catch {
    return false;
  }
}

/**
 * CSS 셀렉터의 복잡도를 계산합니다.
 */
export function calculateSelectorComplexity(selector: string): number {
  if (!selector || typeof selector !== 'string') {
    return 0;
  }

  let complexity = 0;

  // 기본 복잡도 가중치
  const weights = {
    id: 1, // #id
    class: 2, // .class
    attribute: 3, // [attr]
    type: 1, // div
    pseudo: 2, // :hover
    descendant: 1, // space
    child: 2, // >
    sibling: 2, // +, ~
    universal: 1, // *
  };

  // ID 셀렉터
  complexity += (selector.match(/#[\w-]+/g) || []).length * weights.id;

  // 클래스 셀렉터
  complexity += (selector.match(/\.[\w-]+/g) || []).length * weights.class;

  // 속성 셀렉터
  complexity += (selector.match(/\[[^\]]+\]/g) || []).length * weights.attribute;

  // 타입 셀렉터 (태그명)
  complexity += (selector.match(/\b[a-z][a-z0-9]*\b/gi) || []).length * weights.type;

  // 의사 클래스/요소
  complexity += (selector.match(/:[\w-]+(\([^)]*\))?/g) || []).length * weights.pseudo;

  // 콤비네이터들
  complexity += (selector.match(/\s+/g) || []).length * weights.descendant;
  complexity += (selector.match(/>/g) || []).length * weights.child;
  complexity += (selector.match(/[+~]/g) || []).length * weights.sibling;

  // 전체 셀렉터
  complexity += (selector.match(/\*/g) || []).length * weights.universal;

  return complexity;
}

/**
 * CSS 셀렉터에 성능 문제가 있는지 확인합니다.
 */
export function hasPerformanceIssues(selector: string): boolean {
  if (!selector || typeof selector !== 'string') {
    return true;
  }

  // 매우 명백한 성능 문제가 있는 패턴들만 확인
  const severePerformanceIssues = [
    // 전체 셀렉터가 맨 앞에 있는 경우
    /^\s*\*/,
    // 과도하게 많은 descendant combinator (8개 이상)
    /(\s+[^>+~\s]+){8,}/,
  ];

  // 매우 높은 복잡도만 문제로 간주 (150 이상)
  if (calculateSelectorComplexity(selector) > 150) {
    return true;
  }

  // 심각한 성능 문제 패턴만 확인
  return severePerformanceIssues.some(pattern => pattern.test(selector));
}
