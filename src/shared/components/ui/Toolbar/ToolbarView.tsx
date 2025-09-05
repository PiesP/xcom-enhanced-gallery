/**
 * @fileoverview ToolbarView Presentational Component (Phase P3)
 * @description ToolbarHeadless와 Toexport function ToolbarView({
  state,
  className = '',
  'data-testid': testId,
  'aria-label': ariaLabel = '툴바',
}: ToolbarViewProps): VNode {
  const { h } = getPreact();ton을 결합한 표현 컴포넌트
 */

import { getPreact, type VNode } from '@shared/external/vendors';
import { ToolbarButton } from './ToolbarButton';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileZip,
  Settings,
  X,
  ZoomIn,
  ArrowAutofitWidth,
  ArrowAutofitHeight,
  ArrowsMaximize,
} from '@shared/components/ui/Icon';
import type { ToolbarHeadlessState, ToolbarItem } from './ToolbarHeadless';
import styles from './ToolbarView.module.css';

export interface ToolbarViewProps {
  /** Headless 상태 */
  state: ToolbarHeadlessState;
  /** 추가 클래스명 */
  className?: string;
  /** 테스트 ID */
  'data-testid'?: string;
  /** 접근성 레이블 */
  'aria-label'?: string;
}

// 아이콘 매핑
const ICON_MAP = {
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  download: Download,
  'file-zip': FileZip,
  settings: Settings,
  x: X,
  'zoom-in': ZoomIn,
  'arrow-autofit-width': ArrowAutofitWidth,
  'arrow-autofit-height': ArrowAutofitHeight,
  'arrows-maximize': ArrowsMaximize,
} as const;

/**
 * 아이콘 컴포넌트 렌더링
 */
function renderIcon(iconName: string, size: number = 16): VNode | null {
  const { h } = getPreact();
  const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP];

  if (!IconComponent) {
    console.warn(`Unknown icon: ${iconName}`);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (h as any)(IconComponent, { size });
}

/**
 * 개별 툴바 버튼 렌더링
 */
function renderToolbarButton(item: ToolbarItem, key: string): VNode {
  const { h } = getPreact();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (h as any)(
    ToolbarButton,
    {
      key,
      variant: item.variant || 'secondary',
      size: item.size || 'md',
      disabled: item.disabled,
      loading: item.loading,
      active: item.active,
      iconOnly: true,
      onClick: item.onAction,
      'aria-label': item.label,
      'aria-pressed': item.type === 'toggle' ? item.active : undefined,
      title: item.label,
      'data-testid': `toolbar-${item.id}`,
      'data-gallery-element': item.type,
      'data-disabled': item.disabled,
      'data-loading': item.loading,
      'data-active': item.active,
    },
    renderIcon(item.icon)
  );
}

/**
 * 그룹별 아이템 필터링
 */
function getItemsByGroup(items: ToolbarItem[], groupId: string): ToolbarItem[] {
  return items.filter(item => item.group === groupId);
}

/**
 * ToolbarView - 순수 표현 컴포넌트
 */
export function ToolbarView({
  state,
  className = '',
  'data-testid': testId,
  'aria-label': ariaLabel,
}: ToolbarViewProps): VNode {
  const { h } = getPreact();

  // 그룹별 아이템 분류
  const leftItems = getItemsByGroup(state.items, 'left');
  const centerItems = getItemsByGroup(state.items, 'center');
  const rightItems = getItemsByGroup(state.items, 'right');

  // 클래스명 조합
  const containerClasses = [
    styles.toolbarView,
    'glass-surface', // 통합 glassmorphism 스타일
    state.needsHighContrast && styles.highContrast,
    state.isDownloading && styles.downloading,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // 섹션 구성
  const sections = [
    // 왼쪽 섹션
    leftItems.length > 0 &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (h as any)(
        'div',
        {
          className: styles.leftSection,
          key: 'left-section',
        },
        leftItems.map((item, index) => renderToolbarButton(item, `left-${index}`))
      ),

    // 중앙 섹션 (페이지네이션)
    centerItems.length > 0 &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (h as any)(
        'div',
        {
          className: styles.centerSection,
          key: 'center-section',
        },
        [
          // 현재 인덱스 표시
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (h as any)(
            'div',
            {
              className: styles.pagination,
              key: 'pagination',
            },
            [
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (h as any)(
                'span',
                {
                  className: styles.currentIndex,
                  key: 'current',
                },
                state.currentIndex + 1
              ),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (h as any)(
                'span',
                {
                  className: styles.separator,
                  key: 'separator',
                },
                '/'
              ),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (h as any)(
                'span',
                {
                  className: styles.totalCount,
                  key: 'total',
                },
                state.totalCount
              ),
            ]
          ),
          // 중앙 버튼들
          ...centerItems.map((item, index) => renderToolbarButton(item, `center-${index}`)),
        ]
      ),

    // 오른쪽 섹션
    rightItems.length > 0 &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (h as any)(
        'div',
        {
          className: styles.rightSection,
          key: 'right-section',
        },
        rightItems.map((item, index) => renderToolbarButton(item, `right-${index}`))
      ),
  ].filter(Boolean);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (h as any)(
    'nav',
    {
      className: containerClasses,
      role: 'toolbar',
      'aria-label': ariaLabel,
      'data-testid': testId,
      'data-gallery-element': 'toolbar',
      'data-state': state.isDownloading ? 'downloading' : 'ready',
      'data-high-contrast': state.needsHighContrast,
      'data-mode': state.currentMode,
    },
    sections
  );
}

export default ToolbarView;
