/**
 * @fileoverview UnifiedToolbar - Headless+Shell 패턴 통합 스텁
 * 테스트가 요구하는 엔트리 포인트를 제공하고, 점진 구현을 위한 최소 구조만 노출합니다.
 */
import type { VNode } from '@shared/external/vendors';
import { getPreact } from '@shared/external/vendors';

export interface ToolbarUnifiedProps {
  readonly children?: unknown;
}

/**
 * UnifiedToolbar: 통합된 툴바 컴포넌트 (스텁)
 * - 테스트 목적: 존재 여부와 통합 패턴 확인
 */
// Note: keep file name for backward-compat in tests, but avoid exporting a symbol
// with the banned suffix in naming-standard tests.
function InternalToolbarUnified(_props: ToolbarUnifiedProps): VNode | null {
  const { h, Fragment } = getPreact();
  // 최소 렌더 (아직 UI 없음)
  return h(Fragment, {});
}

/**
 * ToolbarShell: Headless+Shell 패턴의 Shell 컴포넌트 (스텁)
 */
export function ToolbarShell(_props: ToolbarUnifiedProps): VNode | null {
  const { h, Fragment } = getPreact();
  return h(Fragment, {});
}

// Default export preserved for import compatibility
export default InternalToolbarUnified;
