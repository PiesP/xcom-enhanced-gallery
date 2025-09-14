/**
 * Toolbar 설정 스키마 (Deprecated)
 * @deprecated 런타임 경로에서 구성 기반 툴바는 더 이상 사용하지 않습니다.
 *             테스트와 정적 스캔 호환을 위해 최소 타입/값만 유지합니다.
 */
export interface ToolbarActionConfig {
  readonly type: string;
  readonly group: string;
}

/**
 * @deprecated 구성 기반 툴바 정의. 사용 금지(테스트 호환 전용).
 */
export interface ToolbarConfig {
  readonly actionGroups: readonly ToolbarActionConfig[];
}

/**
 * @deprecated 테스트 호환 전용 기본 구성. 런타임에서 참조하지 마세요.
 */
export const defaultToolbarConfig: ToolbarConfig = Object.freeze({
  actionGroups: Object.freeze([
    Object.freeze({ type: 'previous', group: 'navigation' }),
    Object.freeze({ type: 'next', group: 'navigation' }),
    Object.freeze({ type: 'downloadCurrent', group: 'downloads' }),
  ]),
} as const);
