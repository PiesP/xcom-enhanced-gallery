/**
 * @fileoverview Design Tokens - Spacing & Border Radius
 *
 * ⚠️ **참고**: CSS 변수 (design-tokens.*.css 3계층)가 SSOT(Single Source of Truth)입니다.
 * 이 파일은 JS 기반 타입 안정성과 IDE 자동완성 제공을 위해 유지됩니다.
 * 새로운 토큰 추가 시 CSS 변수 먼저 정의한 후, 이 파일을 갱신하세요.
 *
 * 일관된 디자인 시스템을 위한 spacing 및 border-radius 토큰 정의
 * 8px 기반 grid 시스템 + 4px 보조 단위 사용
 */

/**
 * Spacing Scale (8px 기반)
 * - 접근성을 위해 최소 4px 단위 사용
 * - 터치 타겟 크기 고려 (최소 44px)
 * - 기반: CSS 변수 `--xeg-spacing-*`
 */
export const SPACING_TOKENS = {
  /** 2px - 매우 작은 간격 (아이콘 내부 등) */
  xs: '2px',

  /** 4px - 작은 간격 (버튼 내부, 아이콘 margin) */
  sm: '4px',

  /** 8px - 기본 간격 (일반적인 padding/margin) */
  md: '8px',

  /** 12px - 중간 간격 (섹션 사이) */
  lg: '12px',

  /** 16px - 큰 간격 (카드 내부, 중요 섹션) */
  xl: '16px',

  /** 24px - 매우 큰 간격 (모달, 컨테이너) */
  xxl: '24px',

  /** 32px - 최대 간격 (페이지 레벨 여백) */
  xxxl: '32px',
} as const;

/**
 * Border Radius Scale (4px 기반)
 * - 일관된 모서리 스타일
 * - 접근성 고려한 적절한 둥글기
 * - 기반: CSS 변수 `--xeg-radius-*`
 */
export const RADIUS_TOKENS = {
  /** 0 - 모서리 없음 */
  none: '0',

  /** 2px - 매우 작은 둥글기 (입력 필드) */
  xs: '2px',

  /** 4px - 작은 둥글기 (버튼, 태그) */
  sm: '4px',

  /** 8px - 중간 둥글기 (카드, 모달) */
  md: '8px',

  /** 12px - 큰 둥글기 (컨테이너) */
  lg: '12px',

  /** 50% - 완전한 원형 (아이콘, 아바타) */
  full: '50%',
} as const;

/**
 * 토큰 타입 정의
 */
export type SpacingToken = keyof typeof SPACING_TOKENS;
export type RadiusToken = keyof typeof RADIUS_TOKENS;

/**
 * 토큰 값 반환 헬퍼 함수
 * @example
 * ```ts
 * const spacingValue = getSpacing('md'); // '8px'
 * const radiusValue = getRadius('lg');   // '12px'
 * ```
 */
export function getSpacing(token: SpacingToken): string {
  return SPACING_TOKENS[token];
}

export function getRadius(token: RadiusToken): string {
  return RADIUS_TOKENS[token];
}

/**
 * CSS 변수명 반환 헬퍼 함수
 * @example
 * ```ts
 * const spacingVar = getSpacingVar('md');   // 'var(--spacing-md)'
 * const radiusVar = getRadiusVar('lg');     // 'var(--radius-lg)'
 * ```
 */
export function getSpacingVar(token: SpacingToken): string {
  return `var(--spacing-${token})`;
}

export function getRadiusVar(token: RadiusToken): string {
  return `var(--radius-${token})`;
}
