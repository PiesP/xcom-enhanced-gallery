/**
 * @fileoverview Design Tokens - Spacing & Border Radius
 *
 * 일관된 디자인 시스템을 위한 spacing 및 border-radius 토큰 정의
 * 8px 기반 grid 시스템 + 4px 보조 단위 사용
 */

/**
 * Spacing Scale (8px 기반)
 * - 접근성을 위해 최소 4px 단위 사용
 * - 터치 타겟 크기 고려 (최소 44px)
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
 * CSS Custom Properties 정의
 * 런타임에서 동적으로 사용 가능한 CSS 변수
 */
export const CSS_SPACING_VARS = {
  '--spacing-xs': SPACING_TOKENS.xs,
  '--spacing-sm': SPACING_TOKENS.sm,
  '--spacing-md': SPACING_TOKENS.md,
  '--spacing-lg': SPACING_TOKENS.lg,
  '--spacing-xl': SPACING_TOKENS.xl,
  '--spacing-xxl': SPACING_TOKENS.xxl,
  '--spacing-xxxl': SPACING_TOKENS.xxxl,
} as const;

export const CSS_RADIUS_VARS = {
  '--radius-none': RADIUS_TOKENS.none,
  '--radius-xs': RADIUS_TOKENS.xs,
  '--radius-sm': RADIUS_TOKENS.sm,
  '--radius-md': RADIUS_TOKENS.md,
  '--radius-lg': RADIUS_TOKENS.lg,
  '--radius-full': RADIUS_TOKENS.full,
} as const;

/**
 * Legacy 값에서 새 토큰으로의 마이그레이션 맵
 */
export const SPACING_MIGRATION_MAP = {
  // 현재 사용 중인 값들을 표준 토큰으로 매핑
  '2px': 'xs', // 유지 (이미 표준)
  '4px': 'sm', // 유지 (이미 표준)
  '6px': 'md', // 6px -> 8px (md)
  '8px': 'md', // 유지 (이미 표준)
  '10px': 'lg', // 10px -> 12px (lg)
  '12px': 'lg', // 유지 (이미 표준)
  '16px': 'xl', // 유지 (이미 표준)
  '20px': 'xxl', // 20px -> 24px (xxl)
  '24px': 'xxl', // 유지 (이미 표준)
  '32px': 'xxxl', // 유지 (이미 표준)
} as const;

export const RADIUS_MIGRATION_MAP = {
  '0': 'none',
  '2px': 'xs',
  '4px': 'sm',
  '6px': 'sm', // 6px -> 4px (sm)
  '8px': 'md',
  '12px': 'lg',
  '50%': 'full',
} as const;

/**
 * 토큰 타입 정의
 */
export type SpacingToken = keyof typeof SPACING_TOKENS;
export type RadiusToken = keyof typeof RADIUS_TOKENS;

/**
 * 토큰 값 반환 헬퍼 함수
 */
export function getSpacing(token: SpacingToken): string {
  return SPACING_TOKENS[token];
}

export function getRadius(token: RadiusToken): string {
  return RADIUS_TOKENS[token];
}

/**
 * CSS 변수명 반환 헬퍼 함수
 */
export function getSpacingVar(token: SpacingToken): string {
  return `var(--spacing-${token})`;
}

export function getRadiusVar(token: RadiusToken): string {
  return `var(--radius-${token})`;
}

/**
 * 전체 CSS 변수 객체 (스타일 주입용)
 */
export const ALL_CSS_VARS = {
  ...CSS_SPACING_VARS,
  ...CSS_RADIUS_VARS,
} as const;
