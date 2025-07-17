/**
 * @fileoverview CSS 선택자 검증 유틸리티
 * @description jsdom 환경에서도 작동하는 CSS 선택자 검증 함수들
 */

/**
 * CSS 선택자의 문법적 유효성을 검증합니다
 * @param selector - 검증할 CSS 선택자
 * @returns 유효한 선택자인지 여부
 */
export function isValidCSSSelector(selector: string): boolean {
  if (!selector || typeof selector !== 'string') {
    return false;
  }

  try {
    // 빈 div 요소에 대해 querySelector를 호출하여 문법 검증
    const testElement = document.createElement('div');
    testElement.querySelector(selector);
    return true;
  } catch {
    return false;
  }
}

/**
 * 속성 선택자에서 속성명과 값을 추출합니다
 * @param selector - 속성 선택자 (예: '[data-testid="tweet"]')
 * @returns 속성명과 값 객체 또는 null
 */
export function parseAttributeSelector(selector: string): {
  attribute: string;
  operator: string;
  value: string;
} | null {
  // 속성 선택자 패턴: [attribute operator "value"]
  const attributePattern = /\[([^=~|^$*]+)([*^$~|]?=)"?([^"]+)"?\]/;
  const match = selector.match(attributePattern);

  if (!match?.[1] || !match?.[3]) {
    return null;
  }

  return {
    attribute: match[1].trim(),
    operator: match[2] || '=',
    value: match[3].trim(),
  };
}

/**
 * 선택자 배열에서 가장 구체적인(우선순위 높은) 선택자를 찾습니다
 * @param selectors - 우선순위 순으로 정렬된 선택자 배열
 * @param testElement - 테스트할 DOM 요소
 * @returns 매칭되는 첫 번째 선택자 또는 null
 */
export function findFirstMatchingSelector(
  selectors: string[],
  testElement: Element
): string | null {
  for (const selector of selectors) {
    try {
      if (testElement.matches(selector)) {
        return selector;
      }
    } catch {
      // 선택자가 유효하지 않거나 jsdom에서 지원하지 않는 경우 무시
      continue;
    }
  }
  return null;
}

/**
 * CSS 선택자의 복잡도를 측정합니다
 * @param selector - 측정할 선택자
 * @returns 복잡도 점수 (낮을수록 성능상 유리)
 */
export function calculateSelectorComplexity(selector: string): number {
  let complexity = 0;

  // 기본 요소 선택자 (예: div, span)
  const elementMatches = selector.match(/^[a-zA-Z]+/);
  if (elementMatches) complexity += 1;

  // ID 선택자 (예: #id)
  const idMatches = selector.match(/#[a-zA-Z0-9-_]+/g);
  if (idMatches) complexity += idMatches.length * 10;

  // 클래스 선택자 (예: .class)
  const classMatches = selector.match(/\.[a-zA-Z0-9-_]+/g);
  if (classMatches) complexity += classMatches.length * 5;

  // 속성 선택자 (예: [attr], [attr="value"])
  const attributeMatches = selector.match(/\[[^\]]+\]/g);
  if (attributeMatches) complexity += attributeMatches.length * 2; // 3에서 2로 감소

  // 자식/후손 선택자 (예: >, 공백)
  const descendantMatches = selector.match(/[>\s+~]/g);
  if (descendantMatches) complexity += descendantMatches.length * 1; // 2에서 1로 감소

  // 전체 선택자 (*) - 매우 비효율적 (속성 선택자 내부의 *= 제외)
  const universalMatches = selector.match(/(?<!\[[^*]*)\*(?![^[]*\])/g);
  if (universalMatches) complexity += universalMatches.length * 100;

  return complexity;
}

/**
 * 선택자가 성능상 문제가 될 수 있는지 검사합니다
 * @param selector - 검사할 선택자
 * @returns 성능 문제 여부
 */
export function hasPerformanceIssues(selector: string): boolean {
  // 매우 높은 복잡도 (조정된 임계값)
  if (calculateSelectorComplexity(selector) > 100) {
    return true;
  }

  // 전체 선택자 사용 (속성 선택자 내부의 *= 제외)
  if (selector.includes('*') && !selector.includes('[') && !selector.includes('*=')) {
    return true;
  }

  // 너무 깊은 중첩 (5단계 이상)
  const nestingLevel = (selector.match(/[>\s]/g) || []).length;
  if (nestingLevel > 4) {
    return true;
  }

  return false;
}
