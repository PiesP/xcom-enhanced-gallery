/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Gallery Toolbar Component
 * @version 6.0.0 - Phase 3 StandardProps 시스템 적용
 */

import type { ViewMode } from '@shared/types';
import { PERCENTAGE, FRACTIONS } from '../../../../constants';
import { getPreact, getPreactHooks, type VNode } from '@shared/external/vendors';
import { memo } from '@shared/utils/optimization/memo';
import {
  useToolbarState,
  getToolbarDataState,
  getToolbarClassName,
} from '@shared/hooks/useToolbarState';
import { rafThrottle } from '@shared/utils/performance/unified-performance-utils';
import { ComponentStandards } from '../standard-props';
import { ToolbarButton } from './components/ToolbarButton';
import { ToolbarGroup } from './components/ToolbarGroup';
import { UnifiedDarkModeStyleSystem } from '@shared/styles/unified-dark-mode-style-system';
import styles from './Toolbar.module.css';

// 통합된 Toolbar Props - 구체적인 타입 정의
export interface ToolbarProps {
  /** 현재 인덱스 */
  currentIndex: number;
  /** 전체 개수 */
  totalCount: number;
  /** 다운로드 진행 상태 */
  isDownloading?: boolean;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 현재 뷰 모드 */
  currentViewMode?: ViewMode;
  /** 뷰 모드 변경 콜백 */
  onViewModeChange?: (mode: ViewMode) => void;
  /** 이전 버튼 콜백 */
  onPrevious: () => void;
  /** 다음 버튼 콜백 */
  onNext: () => void;
  /** 현재 항목 다운로드 콜백 */
  onDownloadCurrent: () => void;
  /** 전체 다운로드 콜백 */
  onDownloadAll: () => void;
  /** 미디어 다시 불러오기 콜백 (제공 시 새로고침 버튼 표시) */
  onReload?: () => void;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 설정 열기 콜백 */
  onOpenSettings?: () => void;
  /** 툴바 위치 */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** 추가 클래스명 */
  className?: string;
  /** 테스트 ID */
  'data-testid'?: string;
  /** 접근성 레이블 */
  'aria-label'?: string;
  /** ARIA 속성들 */
  'aria-describedby'?: string;
  /** 접근성 역할 */
  role?: string;
  /** 탭 인덱스 */
  tabIndex?: number;
  /** ImageFitCallbacks 지원 */
  onFitOriginal?: (event?: Event) => void;
  onFitWidth?: (event?: Event) => void;
  onFitHeight?: (event?: Event) => void;
  onFitContainer?: (event?: Event) => void;
  /** 수동 새로고침 로딩 상태 */
  isReloading?: boolean;
  /** 새로고침 가능 여부 */
  canReload?: boolean;
  // 표준 이벤트 핸들러들
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
}

// 호환성을 위한 별칭
export type GalleryToolbarProps = ToolbarProps;

function ToolbarCore({
  currentIndex,
  totalCount,
  isDownloading = false,
  disabled = false,
  className = '',
  onPrevious,
  onNext,
  onDownloadCurrent,
  onDownloadAll,
  onReload,
  onClose,
  onOpenSettings,
  onFitOriginal,
  onFitHeight,
  onFitWidth,
  onFitContainer,
  isReloading = false,
  canReload = true,
  'data-testid': testId,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  role,
  tabIndex,
  onFocus,
  onBlur,
  onKeyDown: onKeyDownProp,
}: ToolbarProps): VNode {
  const { h } = getPreact();
  const { useMemo, useCallback, useEffect, useRef } = getPreactHooks();

  // 통합 다크모드 스타일 시스템 인스턴스 (CSS 변수 관리용)
  UnifiedDarkModeStyleSystem.getInstance();

  // 새로운 상태 관리 훅 사용
  const [toolbarState, toolbarActions] = useToolbarState();
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  // 표준화된 클래스명 생성 - 통합 클래스 추가
  const toolbarClass = ComponentStandards.createClassName(
    styles.toolbar,
    'xeg-unified-toolbar', // 통합 시스템 클래스 추가
    getToolbarClassName(toolbarState, styles.galleryToolbar || ''),
    className
  );

  // Props에서 받은 isDownloading 상태를 내부 상태와 동기화
  useEffect(() => {
    toolbarActions.setDownloading(isDownloading);
  }, [isDownloading, toolbarActions]);

  // 배경 밝기 감지 및 자동 대비 조정 - 개선된 다중 포인트 샘플링
  useEffect(() => {
    const detectBackgroundBrightness = (): void => {
      if (!toolbarRef.current) {
        return;
      }

      const toolbar = toolbarRef.current;
      const rect = toolbar.getBoundingClientRect();

      // 더 정확한 배경 감지를 위한 다중 포인트 샘플링
      const samplePoints = [
        {
          x: rect.left + rect.width * FRACTIONS.QUARTER,
          y: rect.top + rect.height / 2,
        },
        {
          x: rect.left + rect.width * FRACTIONS.HALF,
          y: rect.top + rect.height / 2,
        },
        {
          x: rect.left + rect.width * FRACTIONS.THREE_QUARTERS,
          y: rect.top + rect.height / 2,
        },
      ];

      let lightBackgroundCount = 0;

      samplePoints.forEach(point => {
        const elementsBelow = document.elementsFromPoint(point.x, point.y);
        const hasLight = elementsBelow.some((el: Element) => {
          const computedStyles = window.getComputedStyle(el);
          const bgColor = computedStyles.backgroundColor;
          return (
            bgColor.includes('rgb(255') || bgColor.includes('white') || bgColor.includes('rgba(255')
          );
        });
        if (hasLight) {
          lightBackgroundCount++;
        }
      });

      // 3개 중 2개 이상이 밝으면 고대비 모드 활성화
      toolbarActions.setNeedsHighContrast(lightBackgroundCount >= 2);
    };

    // 초기 감지
    detectBackgroundBrightness();

    // 스크롤 시 재감지 - RAF throttle로 성능 최적화
    const throttledDetect = rafThrottle(() => {
      requestAnimationFrame(detectBackgroundBrightness);
    }); // RAF 기반으로 최적화된 스크롤 감지

    window.addEventListener('scroll', throttledDetect, { passive: true });
    return (): void => {
      window.removeEventListener('scroll', throttledDetect);
    };
  }, []);

  // 네비게이션 가능 여부 계산
  const canGoNext = useMemo(() => currentIndex < totalCount - 1, [currentIndex, totalCount]);
  const canGoPrevious = useMemo(() => currentIndex > 0, [currentIndex, totalCount]);

  // 크기 조절 버튼 핸들러 - 이벤트 전파 차단 추가
  const handleFitMode = useCallback(
    (
      event:
        | undefined
        | Partial<Pick<Event, 'preventDefault' | 'stopPropagation' | 'stopImmediatePropagation'>>,
      mode: string,
      action?: () => void
    ) => {
      try {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        // 일부 환경에서는 stopImmediatePropagation이 없을 수 있음
        (event as { stopImmediatePropagation?: () => void })?.stopImmediatePropagation?.();
      } catch {
        // 이벤트 객체가 불완전해도 무시하고 계속 진행
      }

      toolbarActions.setCurrentFitMode(mode);
      if (action && !disabled) action();
    },
    [toolbarActions, disabled]
  );

  // 키보드 단축키 핸들러 (PC 전용 인터랙션)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) {
        if (onKeyDownProp) onKeyDownProp(e);
        return;
      }

      const key = e.key;
      switch (key) {
        case 'ArrowLeft':
          e.preventDefault();
          e.stopPropagation();
          if (canGoPrevious) onPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          e.stopPropagation();
          if (canGoNext) onNext();
          break;
        case 'PageUp':
          e.preventDefault();
          e.stopPropagation();
          if (canGoPrevious) onPrevious();
          break;
        case 'PageDown':
          e.preventDefault();
          e.stopPropagation();
          if (canGoNext) onNext();
          break;
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          onClose();
          break;
        case '1':
          if (onFitOriginal) handleFitMode(e as unknown as Event, 'original', onFitOriginal);
          break;
        case '2':
          if (onFitWidth) handleFitMode(e as unknown as Event, 'fitWidth', onFitWidth);
          break;
        case '3':
          if (onFitHeight) handleFitMode(e as unknown as Event, 'fitHeight', onFitHeight);
          break;
        case '4':
          if (onFitContainer) handleFitMode(e as unknown as Event, 'fitContainer', onFitContainer);
          break;
        default:
          break;
      }

      if (onKeyDownProp) onKeyDownProp(e);
    },
    [
      disabled,
      canGoPrevious,
      canGoNext,
      onPrevious,
      onNext,
      onClose,
      onFitOriginal,
      onFitWidth,
      onFitHeight,
      onFitContainer,
      handleFitMode,
      onKeyDownProp,
    ]
  );

  // NOTE: 직관적인 마크업 유지 (과도한 제네릭 헬퍼로 인한 TS VNode 호환성 이슈 제거)

  return h(
    'div',
    {
      ref: toolbarRef,
      className: toolbarClass,
      role: role || 'toolbar',
      'aria-label': ariaLabel || '갤러리 도구모음',
      'aria-describedby': ariaDescribedBy,
      'aria-disabled': disabled,
      'data-testid': testId,
      'data-gallery-element': 'toolbar',
      'data-state': getToolbarDataState(toolbarState),
      'data-disabled': disabled,
      'data-high-contrast': toolbarState.needsHighContrast,
      tabIndex,
      onFocus,
      onBlur,
      onKeyDown: handleKeyDown,
    } as Record<string, unknown>,
    h(
      'div',
      {
        className: styles.toolbarContent,
        'data-gallery-element': 'toolbar-content',
      },
      [
        // 좌측 정렬 그룹: 이전 미디어, 인디케이터, 다음 미디어
        h(
          'div',
          {
            className: `${styles.toolbarSection} ${styles.toolbarLeft}`,
            'data-gallery-element': 'left-group',
            key: 'toolbar-left',
          },
          [
            h('div', { className: styles.groupBox, key: 'left-group-box' }, [
              h(ToolbarButton, {
                icon: 'arrow-left',
                variant: 'secondary',
                size: 'lg',
                disabled: disabled || !canGoPrevious,
                onClick: () => onPrevious(),
                'aria-label': '이전 미디어',
                'data-testid': 'nav-previous',
                title: '이전 미디어',
                context: 'previous',
              }),
              h(
                'div',
                { className: styles.mediaCounterWrapper, key: 'media-counter-wrapper-left' },
                [
                  h(
                    'span',
                    {
                      className: styles.mediaCounter,
                      'aria-live': 'polite',
                      'data-gallery-element': 'counter',
                      title: `${totalCount > 0 ? Math.round(((currentIndex + 1) / totalCount) * PERCENTAGE.MULTIPLIER) : 0}%`,
                      key: 'counter-text-left',
                    },
                    [
                      h(
                        'span',
                        { className: styles.currentIndex, key: 'current-left' },
                        currentIndex + 1
                      ),
                      h('span', { className: styles.separator, key: 'separator-left' }, '/'),
                      h('span', { className: styles.totalCount, key: 'total-left' }, totalCount),
                    ]
                  ),
                  h(
                    'div',
                    { className: styles.progressBar, key: 'progress-bar-left' },
                    h('div', {
                      className: styles.progressFill,
                      style: {
                        width: `${totalCount > 0 ? ((currentIndex + 1) / totalCount) * PERCENTAGE.MULTIPLIER : 0}%`,
                      },
                      key: 'progress-fill-left',
                    })
                  ),
                ]
              ),
              h(ToolbarButton, {
                icon: 'arrow-right',
                variant: 'secondary',
                size: 'lg',
                disabled: disabled || !canGoNext,
                onClick: () => onNext(),
                'aria-label': '다음 미디어',
                'data-testid': 'nav-next',
                title: '다음 미디어',
                context: 'next',
              }),
            ]),
          ]
        ),

        // 중앙 정렬 그룹: 핏 모드(원본/가로/세로/창)
        h(
          'div',
          {
            className: `${styles.toolbarSection} ${styles.toolbarCenter}`,
            'data-gallery-element': 'fit-mode-center',
            key: 'toolbar-center',
          },
          h('div', { className: styles.fitModeGroup, key: 'fit-mode-group-center' }, [
            h(ToolbarButton, {
              icon: 'maximize-2',
              variant: toolbarState.currentFitMode === 'original' ? 'primary' : 'secondary',
              size: 'lg',
              disabled: disabled || !onFitOriginal,
              onClick: () => onFitOriginal && handleFitMode({} as Event, 'original', onFitOriginal),
              'aria-label': '원본 크기',
              title: '원본 크기',
              'data-testid': 'fit-original',
              context: 'toolbar-fit-original',
              key: 'fit-original-center',
            }),
            h(ToolbarButton, {
              icon: 'move-horizontal',
              variant: toolbarState.currentFitMode === 'fitWidth' ? 'primary' : 'secondary',
              size: 'lg',
              disabled: disabled || !onFitWidth,
              onClick: () => onFitWidth && handleFitMode({} as Event, 'fitWidth', onFitWidth),
              'aria-label': '가로에 맞춤',
              title: '가로에 맞추기',
              'data-testid': 'fit-width',
              context: 'toolbar-fit-width',
              key: 'fit-width-center',
            }),
            h(ToolbarButton, {
              icon: 'move-vertical',
              variant: toolbarState.currentFitMode === 'fitHeight' ? 'primary' : 'secondary',
              size: 'lg',
              disabled: disabled || !onFitHeight,
              onClick: () => onFitHeight && handleFitMode({} as Event, 'fitHeight', onFitHeight),
              'aria-label': '세로에 맞춤',
              title: '세로에 맞추기',
              'data-testid': 'fit-height',
              context: 'toolbar-fit-height',
              key: 'fit-height-center',
            }),
            h(ToolbarButton, {
              icon: 'minimize-2',
              variant: toolbarState.currentFitMode === 'fitContainer' ? 'primary' : 'secondary',
              size: 'lg',
              disabled: disabled || !onFitContainer,
              onClick: () =>
                onFitContainer && handleFitMode({} as Event, 'fitContainer', onFitContainer),
              'aria-label': '창에 맞춤',
              title: '창에 맞추기',
              'data-testid': 'fit-container',
              context: 'toolbar-fit-container',
              key: 'fit-container-center',
            }),
          ])
        ),

        // 우측 정렬 그룹: 다운로드/설정/닫기
        h(
          'div',
          {
            className: `${styles.toolbarSection} ${styles.toolbarRight}`,
            'data-gallery-element': 'actions-right',
            key: 'toolbar-right',
          },
          [
            // 새로고침 그룹 (있을 경우)
            onReload
              ? h(
                  ToolbarGroup,
                  { label: '데이터 동기화', key: 'reload-group' },
                  h(ToolbarButton, {
                    icon: 'reload',
                    variant: 'secondary',
                    size: 'lg',
                    disabled: disabled || isReloading || !canReload,
                    loading: isReloading,
                    onClick: () => !disabled && !isReloading && canReload && onReload(),
                    'aria-label': '미디어 다시 불러오기',
                    'aria-busy': isReloading || undefined,
                    'data-testid': 'toolbar-reload-button',
                    title: '미디어 다시 불러오기',
                    context: 'reload',
                  })
                )
              : null,
            // 다운로드 그룹
            h(
              'div',
              {
                className: styles.groupBox,
                role: 'group',
                'aria-label': '다운로드',
                key: 'download-group',
              },
              [
                h(ToolbarButton, {
                  icon: 'file-down',
                  variant: 'secondary',
                  size: 'lg',
                  disabled: disabled || isDownloading,
                  loading: isDownloading,
                  onClick: () => onDownloadCurrent(),
                  'aria-label': '현재 파일 다운로드',
                  'data-testid': 'download-current',
                  title: '현재 파일 다운로드',
                  context: 'download-current',
                }),
                totalCount > 1
                  ? h('div', {
                      className: styles.groupDivider,
                      'aria-hidden': 'true',
                      key: 'dl-div',
                    })
                  : null,
                totalCount > 1
                  ? h(ToolbarButton, {
                      icon: 'folder-down',
                      variant: 'secondary',
                      size: 'lg',
                      disabled: disabled || isDownloading,
                      loading: isDownloading,
                      onClick: () => onDownloadAll(),
                      'aria-label': `전체 ${totalCount}개 파일 ZIP 다운로드`,
                      'data-testid': 'download-all',
                      title: `전체 ${totalCount}개 파일 ZIP 다운로드`,
                      context: 'download-all',
                    })
                  : null,
              ]
            ),
            // 설정 그룹 (옵션)
            onOpenSettings
              ? h(
                  'div',
                  {
                    className: styles.groupBox,
                    role: 'group',
                    'aria-label': '설정',
                    key: 'settings-group',
                  },
                  [
                    h(ToolbarButton, {
                      icon: 'settings',
                      variant: 'secondary',
                      size: 'lg',
                      disabled,
                      onClick: () => onOpenSettings(),
                      'aria-label': '설정 열기',
                      'data-testid': 'settings',
                      title: '설정',
                      context: 'settings',
                    }),
                  ]
                )
              : null,
            // 닫기 그룹
            h(
              'div',
              {
                className: styles.groupBox,
                role: 'group',
                'aria-label': '닫기',
                key: 'close-group',
              },
              [
                h(ToolbarButton, {
                  icon: 'x',
                  variant: 'secondary',
                  size: 'lg',
                  disabled,
                  onClick: () => onClose(),
                  'aria-label': '갤러리 닫기',
                  'data-testid': 'close',
                  title: '갤러리 닫기 (Esc)',
                  context: 'close',
                }),
              ]
            ),
          ]
        ),
      ]
    )
  );
}

/**
 * Props 비교 함수 - Toolbar 최적화
 */
export const compareToolbarProps = (prevProps: ToolbarProps, nextProps: ToolbarProps): boolean => {
  // 핵심 상태 props 비교
  if (prevProps.currentIndex !== nextProps.currentIndex) return false;
  if (prevProps.totalCount !== nextProps.totalCount) return false;
  if (prevProps.isDownloading !== nextProps.isDownloading) return false;
  if (prevProps.disabled !== nextProps.disabled) return false;
  if (prevProps.className !== nextProps.className) return false;

  // ViewMode 비교
  if (prevProps.currentViewMode !== nextProps.currentViewMode) return false;

  // 함수 props 참조 비교
  if (prevProps.onPrevious !== nextProps.onPrevious) return false;
  if (prevProps.onNext !== nextProps.onNext) return false;
  if (prevProps.onDownloadCurrent !== nextProps.onDownloadCurrent) return false;
  if (prevProps.onDownloadAll !== nextProps.onDownloadAll) return false;
  if (prevProps.onReload !== nextProps.onReload) return false;
  if (prevProps.onClose !== nextProps.onClose) return false;
  if (prevProps.onViewModeChange !== nextProps.onViewModeChange) return false;

  // ImageFit 콜백들
  if (prevProps.onFitOriginal !== nextProps.onFitOriginal) return false;
  if (prevProps.onFitWidth !== nextProps.onFitWidth) return false;
  if (prevProps.onFitHeight !== nextProps.onFitHeight) return false;
  if (prevProps.onFitContainer !== nextProps.onFitContainer) return false;
  if (prevProps.isReloading !== nextProps.isReloading) return false;
  if (prevProps.canReload !== nextProps.canReload) return false;

  // 이벤트 핸들러들
  if (prevProps.onFocus !== nextProps.onFocus) return false;
  if (prevProps.onBlur !== nextProps.onBlur) return false;
  if (prevProps.onKeyDown !== nextProps.onKeyDown) return false;

  return true;
};

// memo 적용
const MemoizedToolbar = memo(ToolbarCore, compareToolbarProps);

// displayName 설정
Object.defineProperty(MemoizedToolbar, 'displayName', {
  value: 'memo(Toolbar)',
  writable: false,
  configurable: true,
});

// 메모이제이션된 컴포넌트를 export
export const Toolbar = MemoizedToolbar;

export default Toolbar;
