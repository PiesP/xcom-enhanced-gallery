/**
 * @file Toolbar.solid.tsx
 * @description
 * Gallery Toolbar Component (Solid.js 버전)
 *
 * Preact Toolbar를 Solid.js로 마이그레이션
 *
 * 주요 기능:
 * - 12개 IconButton (Navigation, FitModes, Downloads, Controls)
 * - 배경 밝기 자동 감지 (다중 포인트 샘플링)
 * - Toolbar state 관리 (createToolbarState primitive)
 * - 진행률 바 표시
 * - Position-based layout (top|bottom|left|right)
 *
 * Solid 마이그레이션:
 * - h() → JSX
 * - useToolbarState → createToolbarState ✅
 * - useMemo → createMemo
 * - useCallback → 일반 함수 (자동 메모이제이션)
 * - useEffect → createEffect + onCleanup
 * - useRef → 일반 변수
 * - memo → 제거 (Solid 자동 최적화)
 */

import { createEffect, createMemo, onCleanup, type Component } from 'solid-js';
import { Show } from 'solid-js/web';
import type { ViewMode } from '../../../types';
import {
  createToolbarState,
  getToolbarDataState,
  getToolbarClassName,
} from '../../../primitives/createToolbarState.solid';
import { throttleScroll } from '../../../utils/performance/performance-utils';
import { EventManager } from '../../../services/EventManager';
import { ComponentStandards } from '../StandardProps';
import { HeroChevronLeft } from '../Icon/hero/HeroChevronLeft';
import { HeroChevronRight } from '../Icon/hero/HeroChevronRight';
import { HeroDownload } from '../Icon/hero/HeroDownload';
import { HeroFileZip } from '../Icon/hero/HeroFileZip';
import { HeroSettings } from '../Icon/hero/HeroSettings';
import { HeroX } from '../Icon/hero/HeroX';
import { HeroZoomIn } from '../Icon/hero/HeroZoomIn';
import { HeroArrowAutofitWidth } from '../Icon/hero/HeroArrowAutofitWidth';
import { HeroArrowAutofitHeight } from '../Icon/hero/HeroArrowAutofitHeight';
import { HeroArrowsMaximize } from '../Icon/hero/HeroArrowsMaximize';
import styles from './Toolbar.module.css';
import { IconButton } from '../Button/IconButton';

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
  onFitOriginal?: (event?: any) => void;
  onFitWidth?: (event?: any) => void;
  onFitHeight?: (event?: any) => void;
  onFitContainer?: (event?: any) => void;
  // 표준 이벤트 핸들러들
  onFocus?: (event: any) => void;
  onBlur?: (event: any) => void;
  onKeyDown?: (event: any) => void;
}

// 호환성을 위한 별칭
export type GalleryToolbarProps = ToolbarProps;

export const Toolbar: Component<ToolbarProps> = props => {
  // Toolbar state primitive 사용
  const [toolbarState, toolbarActions] = createToolbarState();
  let toolbarRef: HTMLDivElement | undefined;

  // 표준화된 클래스명 생성 - 컴포넌트 토큰 기반 스타일
  const toolbarClass = () =>
    ComponentStandards.createClassName(
      styles.toolbar,
      getToolbarClassName(toolbarState(), styles.galleryToolbar || ''),
      props.className || ''
    );

  // Props에서 받은 isDownloading 상태를 내부 상태와 동기화
  createEffect(() => {
    toolbarActions.setDownloading(!!props.isDownloading);
  });

  // 배경 밝기 감지 및 자동 대비 조정 - 개선된 다중 포인트 샘플링
  createEffect(() => {
    // 테스트/JSDOM 환경 가드: 필수 브라우저 API가 없으면 감지를 건너뜀
    const canDetect =
      typeof document !== 'undefined' &&
      typeof (document as any).elementsFromPoint === 'function' &&
      typeof window !== 'undefined' &&
      typeof window.getComputedStyle === 'function';

    if (!canDetect) {
      return;
    }

    const detectBackgroundBrightness = (): void => {
      try {
        if (!toolbarRef) {
          return;
        }

        const toolbar = toolbarRef;
        const rect = toolbar.getBoundingClientRect();

        // 실제 렌더 크기가 0이면 감지를 수행하지 않음(JSDOM 등)
        if (!rect || rect.width === 0 || rect.height === 0) {
          toolbarActions.setNeedsHighContrast(false);
          return;
        }

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
          const elementsBelow = (document as any).elementsFromPoint(point.x, point.y) as Element[];
          const hasLight = elementsBelow.some((el: Element) => {
            const computedStyles = window.getComputedStyle(el);
            const bgColor = computedStyles.backgroundColor || '';
            return (
              bgColor.includes('rgb(255') ||
              bgColor.includes('white') ||
              bgColor.includes('rgba(255')
            );
          });
          if (hasLight) {
            lightBackgroundCount++;
          }
        });

        // 3개 중 2개 이상이 밝으면 고대비 모드 활성화
        toolbarActions.setNeedsHighContrast(lightBackgroundCount >= 2);
      } catch {
        // 테스트/폴리필 환경에서 안전 종료
        toolbarActions.setNeedsHighContrast(false);
      }
    };

    // 초기 감지
    detectBackgroundBrightness();

    // 스크롤 시 재감지 - RAF throttle로 성능 최적화
    const throttledDetect = throttleScroll(() => {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(detectBackgroundBrightness);
      } else {
        detectBackgroundBrightness();
      }
    });

    const listenerId = EventManager.getInstance().addListener(
      window,
      'scroll',
      throttledDetect as unknown as EventListener,
      { passive: true }
    );

    onCleanup(() => {
      EventManager.getInstance().removeListener(listenerId);
    });
  });

  // 네비게이션 가능 여부 계산
  const canGoNext = createMemo(() => props.currentIndex < props.totalCount - 1);
  const canGoPrevious = createMemo(() => props.currentIndex > 0);

  // 버튼 클릭 피드백 - 상태 변경 없이 직접 실행
  const handleButtonClick = (event: any, _buttonId: string, action: () => void) => {
    event.stopPropagation();
    action();
  };

  // 크기 조절 버튼 핸들러 - 이벤트 전파 차단 추가
  const handleFitMode = (event: any, mode: string, action?: () => void) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    toolbarActions.setCurrentFitMode(mode);
    if (action && !props.disabled) {
      action();
    }
  };

  return (
    <div
      ref={toolbarRef}
      class={toolbarClass()}
      role={(props.role as any) || 'toolbar'}
      aria-label={props['aria-label'] || '갤러리 도구모음'}
      aria-describedby={props['aria-describedby']}
      aria-disabled={props.disabled}
      data-testid={props['data-testid']}
      data-gallery-element='toolbar'
      data-state={getToolbarDataState(toolbarState())}
      data-disabled={props.disabled}
      data-high-contrast={toolbarState().needsHighContrast}
      tabIndex={props.tabIndex}
      onFocus={props.onFocus}
      onBlur={props.onBlur}
      onKeyDown={props.onKeyDown}
    >
      <div
        class={`${styles.toolbarContent} xeg-center-between xeg-gap-md`}
        data-gallery-element='toolbar-content'
      >
        {/* 좌측 네비게이션 섹션 */}
        <div
          class={`${styles.toolbarSection} ${styles.toolbarLeft} toolbarLeft xeg-row-center xeg-gap-sm`}
          data-gallery-element='navigation-left'
        >
          <IconButton
            size='toolbar'
            aria-label='이전 미디어'
            title='이전 미디어 (←)'
            disabled={!!(props.disabled || !canGoPrevious())}
            onClick={(e: any) => handleButtonClick(e, 'previous', props.onPrevious)}
            data-gallery-element='nav-previous'
            data-disabled={!!(props.disabled || !canGoPrevious())}
          >
            <HeroChevronLeft size={18} />
          </IconButton>
          <IconButton
            size='toolbar'
            aria-label='다음 미디어'
            title='다음 미디어 (→)'
            disabled={!!(props.disabled || !canGoNext())}
            onClick={(e: any) => handleButtonClick(e, 'next', props.onNext)}
            data-gallery-element='nav-next'
            data-disabled={!!(props.disabled || !canGoNext())}
          >
            <HeroChevronRight size={18} />
          </IconButton>
        </div>

        {/* 중앙 카운터 섹션 */}
        <div
          class={`${styles.toolbarSection} ${styles.toolbarCenter} xeg-row-center`}
          data-gallery-element='counter-section'
        >
          <div class={styles.mediaCounterWrapper}>
            <span class={styles.mediaCounter} aria-live='polite' data-gallery-element='counter'>
              <span class={styles.currentIndex}>{props.currentIndex + 1}</span>
              <span class={styles.separator}>/</span>
              <span class={styles.totalCount}>{props.totalCount}</span>
            </span>
            <div class={styles.progressBar}>
              <div
                class={styles.progressFill}
                style={{
                  width: `${props.totalCount > 0 ? ((props.currentIndex + 1) / props.totalCount) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* 우측 액션 섹션 */}
        <div
          class={`${styles.toolbarSection} ${styles.toolbarRight} xeg-row-center xeg-gap-sm`}
          data-gallery-element='actions-right'
        >
          {/* 이미지 핏 모드 버튼들 */}
          <IconButton
            size='toolbar'
            onClick={(e: any) => handleFitMode(e, 'original', props.onFitOriginal)}
            disabled={!!(props.disabled || !props.onFitOriginal)}
            aria-label='원본 크기'
            title='원본 크기 (1:1)'
            data-gallery-element='fit-original'
            data-selected={toolbarState().currentFitMode === 'original'}
            data-disabled={!!(props.disabled || !props.onFitOriginal)}
          >
            <HeroZoomIn size={18} />
          </IconButton>
          <IconButton
            size='toolbar'
            onClick={(e: any) => handleFitMode(e, 'fitWidth', props.onFitWidth)}
            disabled={!!(props.disabled || !props.onFitWidth)}
            aria-label='가로에 맞춤'
            title='가로에 맞추기'
            data-gallery-element='fit-width'
            data-selected={toolbarState().currentFitMode === 'fitWidth'}
            data-disabled={!!(props.disabled || !props.onFitWidth)}
          >
            <HeroArrowAutofitWidth size={18} />
          </IconButton>
          <IconButton
            size='toolbar'
            onClick={(e: any) => handleFitMode(e, 'fitHeight', props.onFitHeight)}
            disabled={!!(props.disabled || !props.onFitHeight)}
            aria-label='세로에 맞춤'
            title='세로에 맞추기'
            data-gallery-element='fit-height'
            data-selected={toolbarState().currentFitMode === 'fitHeight'}
            data-disabled={!!(props.disabled || !props.onFitHeight)}
          >
            <HeroArrowAutofitHeight size={18} />
          </IconButton>
          <IconButton
            size='toolbar'
            onClick={(e: any) => handleFitMode(e, 'fitContainer', props.onFitContainer)}
            disabled={!!(props.disabled || !props.onFitContainer)}
            aria-label='창에 맞춤'
            title='창에 맞추기'
            data-gallery-element='fit-container'
            data-selected={toolbarState().currentFitMode === 'fitContainer'}
            data-disabled={!!(props.disabled || !props.onFitContainer)}
          >
            <HeroArrowsMaximize size={18} />
          </IconButton>

          {/* 다운로드 버튼들 */}
          <IconButton
            size='toolbar'
            loading={!!props.isDownloading}
            onClick={(e: any) => handleButtonClick(e, 'download-current', props.onDownloadCurrent)}
            disabled={!!(props.disabled || props.isDownloading)}
            aria-label='현재 파일 다운로드'
            title='현재 파일 다운로드 (Ctrl+D)'
            data-gallery-element='download-current'
            data-disabled={!!(props.disabled || props.isDownloading)}
            data-loading={!!props.isDownloading}
          >
            <HeroDownload size={18} />
          </IconButton>

          <Show when={props.totalCount > 1}>
            <IconButton
              size='toolbar'
              onClick={(e: any) => handleButtonClick(e, 'download-all', props.onDownloadAll)}
              disabled={!!(props.disabled || props.isDownloading)}
              aria-label={`전체 ${props.totalCount}개 파일 ZIP 다운로드`}
              title={`전체 ${props.totalCount}개 파일 ZIP 다운로드`}
              data-gallery-element='download-all'
              data-disabled={!!(props.disabled || props.isDownloading)}
              data-loading={!!props.isDownloading}
            >
              <HeroFileZip size={18} />
            </IconButton>
          </Show>

          {/* 설정 버튼 */}
          <Show when={props.onOpenSettings}>
            <IconButton
              size='toolbar'
              aria-label='설정 열기'
              title='설정'
              disabled={!!props.disabled}
              onClick={(e: any) => handleButtonClick(e, 'settings', props.onOpenSettings!)}
              onMouseDown={(e: any) => handleButtonClick(e, 'settings', props.onOpenSettings!)}
              data-gallery-element='settings'
              data-disabled={!!props.disabled}
            >
              <HeroSettings size={18} />
            </IconButton>
          </Show>

          {/* 닫기 버튼 */}
          <IconButton
            size='toolbar'
            intent='danger'
            aria-label='갤러리 닫기'
            title='갤러리 닫기 (Esc)'
            disabled={!!props.disabled}
            onClick={(e: any) => handleButtonClick(e, 'close', props.onClose)}
            data-gallery-element='close'
            data-disabled={!!props.disabled}
          >
            <HeroX size={18} />
          </IconButton>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
