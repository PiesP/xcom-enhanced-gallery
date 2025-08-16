/**
 * Unified Scroll Key Builder
 * - route / anchor / legacy-anchor 키 스킴 통합
 * - 버전 suffix 중앙 관리 (향후 변경 시 한곳에서 조정)
 */
import { buildRouteScrollKey } from './route-scroll-key-builder';

/** 공개 버전 (마지막 segment 로 붙음) */
export const SCROLL_KEY_VERSION = 'v1';
export const SCROLL_KEY_VERSION_SUFFIX = `:v${SCROLL_KEY_VERSION}`; // ':v1'

// Legacy anchor 사용 형태: `${root}:${path}${VERSION_SUFFIX}` root 기본 'scrollAnchor'
// New anchor scheme: `scroll:anchor:${normalizedPath}${SCROLL_KEY_VERSION_SUFFIX}`

function normalizePath(pathname: string | undefined | null): string {
  if (!pathname) return '/';
  return pathname.replace(/\/+/g, '/');
}

/** 새 Anchor 키 (namespace 고정: scroll:anchor) */
export function buildAnchorScrollKey(pathname?: string): string {
  const path = normalizePath(pathname);
  return `scroll:anchor:${path}${SCROLL_KEY_VERSION_SUFFIX}`;
}

/** 기존 Anchor 키 빌더 (마이그레이션 전용) */
export function buildLegacyAnchorScrollKey(pathname?: string, base = 'scrollAnchor'): string {
  const path = normalizePath(pathname);
  return `${base}:${path}${SCROLL_KEY_VERSION_SUFFIX}`;
}

export { buildRouteScrollKey };

export type UnifiedScrollKeyVariant = 'route' | 'anchor' | 'anchor-legacy';

export interface UnifiedScrollKeyContext {
  variant: UnifiedScrollKeyVariant;
  pathname?: string;
}

/** 단일 디스패처 (현재 단순 mapping) */
export function buildScrollKey(ctx: UnifiedScrollKeyContext): string {
  switch (ctx.variant) {
    case 'route':
      return buildRouteScrollKey(ctx.pathname || '/');
    case 'anchor':
      return buildAnchorScrollKey(ctx.pathname);
    case 'anchor-legacy':
      return buildLegacyAnchorScrollKey(ctx.pathname);
    default:
      return buildRouteScrollKey(ctx.pathname || '/');
  }
}
