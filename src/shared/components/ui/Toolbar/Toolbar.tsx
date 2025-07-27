/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Gallery Toolbar Component
 * @version 6.0.0 - Phase 3 StandardProps 시스템 적용
 */

import type { ViewMode } from '@shared/types';
import { getPreact, getPreactHooks, type VNode } from '@shared/external/vendors';
import {
  useToolbarState,
  getToolbarDataState,
  getToolbarClassName,
} from '@shared/hooks/useToolbarState';
import { throttleScroll } from '@shared/utils';
import { ComponentStandards } from '../StandardProps';
import type { StandardToolbarProps } from '../StandardProps';
import styles from './Toolbar.module.css';

// 통합된 Toolbar Props (표준 우선, 레거시 fallback)
export interface ToolbarProps extends Omit<StandardToolbarProps, 'onViewModeChange'> {
  // 레거시 호환성을 위한 추가 속성들
  currentViewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  // ImageFitCallbacks 지원
  onFitOriginal?: (event?: Event) => void;
  onFitWidth?: (event?: Event) => void;
  onFitHeight?: (event?: Event) => void;
  onFitContainer?: (event?: Event) => void;
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
  onClose,
  onOpenSettings,
  onFitOriginal,
  onFitHeight,
  onFitWidth,
  onFitContainer,
  'data-testid': testId,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  role,
  tabIndex,
  onFocus,
  onBlur,
  onKeyDown,
}: ToolbarProps): VNode {
  const { h } = getPreact();
  const { useMemo, useCallback, useEffect, useRef } = getPreactHooks();

  // 새로운 상태 관리 훅 사용
  const [toolbarState, toolbarActions] = useToolbarState();
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  // 표준화된 클래스명 생성
  const toolbarClass = ComponentStandards.createClassName(
    styles.toolbar,
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
          x: rect.left + rect.width * 0.25,
          y: rect.top + rect.height / 2,
        },
        {
          x: rect.left + rect.width * 0.5,
          y: rect.top + rect.height / 2,
        },
        {
          x: rect.left + rect.width * 0.75,
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
    const throttledDetect = throttleScroll(() => {
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

  // 버튼 클릭 피드백 - 상태 변경 없이 직접 실행
  const handleButtonClick = useCallback((event: Event, _buttonId: string, action: () => void) => {
    event.stopPropagation();
    action();
  }, []);

  // 크기 조절 버튼 핸들러 - 이벤트 전파 차단 추가
  const handleFitMode = useCallback(
    (event: Event, mode: string, action?: () => void) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation(); // 추가된 강화된 이벤트 차단

      toolbarActions.setCurrentFitMode(mode);
      if (action && !disabled) {
        action();
      }
    },
    [toolbarActions, disabled]
  );

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
      onKeyDown,
    } as Record<string, unknown>,
    h(
      'div',
      {
        className: styles.toolbarContent,
        'data-gallery-element': 'toolbar-content',
      },
      [
        // 좌측 네비게이션 섹션
        h(
          'div',
          {
            className: `${styles.toolbarSection} ${styles.toolbarLeft}`,
            'data-gallery-element': 'navigation-left',
            key: 'toolbar-left',
          },
          [
            h(
              'button',
              {
                type: 'button',
                className: `${styles.toolbarButton} ${styles.navButton}`,
                onClick: (e: Event) => handleButtonClick(e, 'previous', onPrevious),
                disabled: disabled || !canGoPrevious,
                'aria-label': '이전 미디어',
                title: '이전 미디어 (←)',
                'data-gallery-element': 'nav-previous',
                'data-disabled': disabled || !canGoPrevious,
                key: 'previous-button',
              },
              h(
                'svg',
                {
                  width: '18',
                  height: '18',
                  viewBox: '0 0 16 16',
                  fill: 'currentColor',
                },
                h('path', { d: 'M10 2L4 8l6 6V2z' })
              )
            ),
            h(
              'button',
              {
                type: 'button',
                className: `${styles.toolbarButton} ${styles.navButton}`,
                onClick: (e: Event) => handleButtonClick(e, 'next', onNext),
                disabled: disabled || !canGoNext,
                'aria-label': '다음 미디어',
                title: '다음 미디어 (→)',
                'data-gallery-element': 'nav-next',
                'data-disabled': disabled || !canGoNext,
                key: 'next-button',
              },
              h(
                'svg',
                {
                  width: '18',
                  height: '18',
                  viewBox: '0 0 16 16',
                  fill: 'currentColor',
                },
                h('path', { d: 'M6 2l6 6-6 6V2z' })
              )
            ),
          ]
        ),

        // 중앙 카운터 섹션
        h(
          'div',
          {
            className: `${styles.toolbarSection} ${styles.toolbarCenter}`,
            'data-gallery-element': 'counter-section',
            key: 'toolbar-center',
          },
          h(
            'div',
            {
              className: styles.mediaCounterWrapper,
              key: 'media-counter-wrapper',
            },
            [
              h(
                'span',
                {
                  className: styles.mediaCounter,
                  'aria-live': 'polite',
                  'data-gallery-element': 'counter',
                  key: 'counter-text',
                },
                [
                  h('span', { className: styles.currentIndex, key: 'current' }, currentIndex + 1),
                  h('span', { className: styles.separator, key: 'separator' }, '/'),
                  h('span', { className: styles.totalCount, key: 'total' }, totalCount),
                ]
              ),
              h(
                'div',
                {
                  className: styles.progressBar,
                  key: 'progress-bar',
                },
                h('div', {
                  className: styles.progressFill,
                  style: {
                    width: `${totalCount > 0 ? ((currentIndex + 1) / totalCount) * 100 : 0}%`,
                  },
                  key: 'progress-fill',
                })
              ),
            ]
          )
        ),

        // 우측 액션 섹션
        h(
          'div',
          {
            className: `${styles.toolbarSection} ${styles.toolbarRight}`,
            'data-gallery-element': 'actions-right',
            key: 'toolbar-right',
          },
          [
            // 이미지 핏 모드 버튼들
            h(
              'div',
              {
                className: styles.fitModeGroup,
                key: 'fit-mode-group',
              },
              [
                h(
                  'button',
                  {
                    type: 'button',
                    className: `${styles.toolbarButton} ${styles.fitButton}`,
                    onClick: (e: Event) => handleFitMode(e, 'original', onFitOriginal),
                    disabled: disabled || !onFitOriginal,
                    'aria-label': '원본 크기',
                    title: '원본 크기 (1:1)',
                    'data-gallery-element': 'fit-original',
                    'data-selected': toolbarState.currentFitMode === 'original',
                    'data-disabled': disabled || !onFitOriginal,
                    key: 'fit-original',
                  },
                  h(
                    'svg',
                    {
                      width: '16',
                      height: '16',
                      viewBox: '0 0 16 16',
                      fill: 'currentColor',
                    },
                    [
                      h('rect', {
                        x: '2',
                        y: '2',
                        width: '12',
                        height: '12',
                        fill: 'none',
                        stroke: 'currentColor',
                        'stroke-width': '1.5',
                      }),
                      h(
                        'text',
                        {
                          x: '8',
                          y: '9',
                          'text-anchor': 'middle',
                          'font-size': '5',
                          fill: 'currentColor',
                        },
                        '1:1'
                      ),
                    ]
                  )
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: `${styles.toolbarButton} ${styles.fitButton}`,
                    onClick: (e: Event) => handleFitMode(e, 'fitWidth', onFitWidth),
                    disabled: disabled || !onFitWidth,
                    'aria-label': '가로에 맞춤',
                    title: '가로에 맞추기',
                    'data-gallery-element': 'fit-width',
                    'data-selected': toolbarState.currentFitMode === 'fitWidth',
                    'data-disabled': disabled || !onFitWidth,
                    key: 'fit-width',
                  },
                  h(
                    'svg',
                    {
                      width: '16',
                      height: '16',
                      viewBox: '0 0 16 16',
                      fill: 'currentColor',
                    },
                    [
                      h('rect', {
                        x: '2',
                        y: '5',
                        width: '12',
                        height: '6',
                        fill: 'none',
                        stroke: 'currentColor',
                        'stroke-width': '1.5',
                      }),
                      h('path', {
                        d: 'M1 2v2M15 2v2M1 12v2M15 12v2',
                        stroke: 'currentColor',
                        'stroke-width': '1.5',
                      }),
                    ]
                  )
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: `${styles.toolbarButton} ${styles.fitButton}`,
                    onClick: (e: Event) => handleFitMode(e, 'fitHeight', onFitHeight),
                    disabled: disabled || !onFitHeight,
                    'aria-label': '세로에 맞춤',
                    title: '세로에 맞추기',
                    'data-gallery-element': 'fit-height',
                    'data-selected': toolbarState.currentFitMode === 'fitHeight',
                    'data-disabled': disabled || !onFitHeight,
                    key: 'fit-height',
                  },
                  h(
                    'svg',
                    {
                      width: '16',
                      height: '16',
                      viewBox: '0 0 16 16',
                      fill: 'currentColor',
                    },
                    [
                      h('rect', {
                        x: '5',
                        y: '2',
                        width: '6',
                        height: '12',
                        fill: 'none',
                        stroke: 'currentColor',
                        'stroke-width': '1.5',
                      }),
                      h('path', {
                        d: 'M2 1h2M12 1h2M2 15h2M12 15h2',
                        stroke: 'currentColor',
                        'stroke-width': '1.5',
                      }),
                    ]
                  )
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: `${styles.toolbarButton} ${styles.fitButton}`,
                    onClick: (e: Event) => handleFitMode(e, 'fitContainer', onFitContainer),
                    disabled: disabled || !onFitContainer,
                    'aria-label': '창에 맞춤',
                    title: '창에 맞추기',
                    'data-gallery-element': 'fit-container',
                    'data-selected': toolbarState.currentFitMode === 'fitContainer',
                    'data-disabled': disabled || !onFitContainer,
                    key: 'fit-container',
                  },
                  h(
                    'svg',
                    {
                      width: '16',
                      height: '16',
                      viewBox: '0 0 16 16',
                      fill: 'currentColor',
                    },
                    [
                      h('rect', {
                        x: '1',
                        y: '1',
                        width: '14',
                        height: '14',
                        fill: 'none',
                        stroke: 'currentColor',
                        'stroke-width': '1.5',
                      }),
                      h('rect', {
                        x: '4',
                        y: '4',
                        width: '8',
                        height: '8',
                        fill: 'none',
                        stroke: 'currentColor',
                        'stroke-width': '1',
                      }),
                      h('path', {
                        d: 'M2 2l2 2M12 2l2 2M2 14l2-2M14 14l-2-2',
                        stroke: 'currentColor',
                        'stroke-width': '1',
                      }),
                    ]
                  )
                ),
              ]
            ),

            // 다운로드 버튼들
            h(
              'button',
              {
                type: 'button',
                className: `${styles.toolbarButton} ${styles.downloadButton} ${styles.downloadCurrent}`,
                onClick: (e: Event) => handleButtonClick(e, 'download-current', onDownloadCurrent),
                disabled: disabled || isDownloading,
                'aria-label': '현재 파일 다운로드',
                title: '현재 파일 다운로드 (Ctrl+D)',
                'data-gallery-element': 'download-current',
                'data-disabled': disabled || isDownloading,
                'data-loading': isDownloading,
                key: 'download-current',
              },
              [
                h(
                  'svg',
                  {
                    width: '16',
                    height: '16',
                    viewBox: '0 0 16 16',
                    fill: 'currentColor',
                    key: 'download-icon',
                  },
                  [
                    h('path', {
                      d: 'M8 1v10.5L5.5 9 4 10.5 8 14.5l4-4L10.5 9 8 11.5V1z',
                    }),
                    h('path', { d: 'M2 13h12v2H2z' }),
                  ]
                ),
                isDownloading &&
                  h(
                    'span',
                    {
                      className: styles.downloadSpinner,
                      'aria-hidden': 'true',
                      'data-gallery-element': 'spinner',
                      key: 'spinner',
                    },
                    '⟳'
                  ),
              ]
            ),

            totalCount > 1 &&
              h(
                'button',
                {
                  type: 'button',
                  className: `${styles.toolbarButton} ${styles.downloadButton} ${styles.downloadAll}`,
                  onClick: (e: Event) => handleButtonClick(e, 'download-all', onDownloadAll),
                  disabled: disabled || isDownloading,
                  'aria-label': `전체 ${totalCount}개 파일 ZIP 다운로드`,
                  title: `전체 ${totalCount}개 파일 ZIP 다운로드`,
                  'data-gallery-element': 'download-all',
                  'data-disabled': disabled || isDownloading,
                  'data-loading': isDownloading,
                  key: 'download-all',
                },
                h(
                  'svg',
                  {
                    width: '16',
                    height: '16',
                    viewBox: '0 0 16 16',
                    fill: 'currentColor',
                    key: 'download-all-icon',
                  },
                  h('path', {
                    d: 'M2 3h12v1H2V3zm0 3h12v1H2V6zm0 3h12v1H2V9zm6 2v2.5L5.5 11 4 12.5 8 16.5l4-4L10.5 11 8 13.5V11z',
                  })
                )
              ),

            // 설정 버튼
            onOpenSettings &&
              h(
                'button',
                {
                  type: 'button',
                  className: `${styles.toolbarButton} ${styles.settingsButton}`,
                  onClick: (e: Event) => handleButtonClick(e, 'settings', onOpenSettings),
                  disabled,
                  'aria-label': '설정 열기',
                  title: '설정',
                  'data-gallery-element': 'settings',
                  'data-disabled': disabled,
                  key: 'settings',
                },
                h(
                  'svg',
                  {
                    width: '16',
                    height: '16',
                    viewBox: '0 0 16 16',
                    fill: 'currentColor',
                  },
                  [
                    h('path', {
                      d: 'M8 4.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM6.5 8a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z',
                    }),
                    h('path', {
                      d: 'M8.5 1a.5.5 0 00-1 0v1.5a6.5 6.5 0 000 11V15a.5.5 0 001 0v-1.5a6.5 6.5 0 000-11V1z',
                    }),
                  ]
                )
              ),

            // 닫기 버튼
            h(
              'button',
              {
                type: 'button',
                className: `${styles.toolbarButton} ${styles.closeButton}`,
                onClick: (e: Event) => handleButtonClick(e, 'close', onClose),
                disabled,
                'aria-label': '갤러리 닫기',
                title: '갤러리 닫기 (Esc)',
                'data-gallery-element': 'close',
                'data-disabled': disabled,
                key: 'close',
              },
              h(
                'svg',
                {
                  width: '16',
                  height: '16',
                  viewBox: '0 0 16 16',
                  fill: 'currentColor',
                },
                h('path', {
                  d: 'M2.5 2.5L13.5 13.5M13.5 2.5L2.5 13.5',
                  stroke: 'currentColor',
                  'stroke-width': '2',
                  'stroke-linecap': 'round',
                })
              )
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
  if (prevProps.onClose !== nextProps.onClose) return false;
  if (prevProps.onViewModeChange !== nextProps.onViewModeChange) return false;

  // ImageFit 콜백들
  if (prevProps.onFitOriginal !== nextProps.onFitOriginal) return false;
  if (prevProps.onFitWidth !== nextProps.onFitWidth) return false;
  if (prevProps.onFitHeight !== nextProps.onFitHeight) return false;
  if (prevProps.onFitContainer !== nextProps.onFitContainer) return false;

  // 이벤트 핸들러들
  if (prevProps.onFocus !== nextProps.onFocus) return false;
  if (prevProps.onBlur !== nextProps.onBlur) return false;
  if (prevProps.onKeyDown !== nextProps.onKeyDown) return false;

  return true;
};

// memo 적용
import { getPreactCompat } from '@shared/external/vendors';
const { memo } = getPreactCompat();
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
