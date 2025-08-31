/**
 * Copyright © X.com Enhanced Gallery
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
} from '../Icon';
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

  // 표준화된 클래스명 생성 - 통합 glass-surface 클래스 적용
  const toolbarClass = ComponentStandards.createClassName(
    styles.toolbar,
    getToolbarClassName(toolbarState, styles.galleryToolbar || ''),
    'glass-surface', // 통합된 glassmorphism 스타일 적용
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
                className: `${styles.toolbarButton} ${styles.navButton} xeg-glassmorphism button-variant`,
                onClick: (e: Event) => handleButtonClick(e, 'previous', onPrevious),
                disabled: disabled || !canGoPrevious,
                'aria-label': '이전 미디어',
                title: '이전 미디어 (←)',
                'data-gallery-element': 'nav-previous',
                'data-disabled': disabled || !canGoPrevious,
                key: 'previous-button',
              },
              h(ChevronLeft, { size: 18 })
            ),
            h(
              'button',
              {
                type: 'button',
                className: `${styles.toolbarButton} ${styles.navButton} xeg-glassmorphism button-variant`,
                onClick: (e: Event) => handleButtonClick(e, 'next', onNext),
                disabled: disabled || !canGoNext,
                'aria-label': '다음 미디어',
                title: '다음 미디어 (→)',
                'data-gallery-element': 'nav-next',
                'data-disabled': disabled || !canGoNext,
                key: 'next-button',
              },
              h(ChevronRight, { size: 18 })
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                'span' as any,
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
                  h(ZoomIn, { size: 16 })
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
                  h(ArrowAutofitWidth, { size: 16 })
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
                  h(ArrowAutofitHeight, { size: 16 })
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
                  h(ArrowsMaximize, { size: 16 })
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
                h(Download, { size: 16, key: 'download-icon' }),
                isDownloading &&
                  h(
                    'span' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
                h(FileZip, { size: 16, key: 'download-all-icon' })
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
                h(Settings, { size: 16 })
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
              h(X, { size: 16 })
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
