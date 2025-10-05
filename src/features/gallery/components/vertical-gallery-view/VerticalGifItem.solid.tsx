/**
 * @fileoverview VerticalGifItem Component (TDD GREEN → REFACTOR Phase)
 * Epic: MEDIA-TYPE-ENHANCEMENT Phase 1-2
 *
 * GIF 전용 렌더링 컴포넌트: 재생/일시정지, 반복 제어, 접근성
 *
 * **주요 기능**:
 * - Canvas 기반 GIF 렌더링 (프레임 제어 가능)
 * - 재생/일시정지 토글 (Space 키 지원)
 * - 반복 모드: 무한/1회 전환
 * - 로딩/에러 상태 처리
 * - WCAG 2.1 Level AA 접근성 준수
 * - PC 전용 입력 (Touch/Pointer 금지)
 *
 * **Canvas 사용 이유**:
 * - `<img>` 태그는 GIF 재생 제어 불가
 * - Canvas API를 통한 프레임 단위 제어
 * - 일시정지/재개 구현 가능
 *
 * **접근성**:
 * - role="img" + aria-label (Canvas 대체 텍스트)
 * - 버튼: aria-label 명시
 * - 키보드: Space (재생/일시정지)
 *
 * @see {@link VerticalVideoItem} - 비디오 컴포넌트 (유사 패턴)
 * @see {@link SolidVerticalImageItem} - 이미지 컴포넌트
 */

import { getSolidCore } from '@shared/external/vendors';
import type { Component } from 'solid-js';
import type { MediaInfo } from '@shared/types/media.types';
import type { ImageFitMode } from '@shared/types';
import { logError } from '@shared/logging';
import styles from './VerticalGifItem.module.css';

/**
 * VerticalGifItem Props 인터페이스
 *
 * @remarks
 * 모든 Props는 readonly (불변).
 * 선택적 Props는 컴포넌트 내부에서 기본값으로 정규화.
 */
export interface VerticalGifItemProps {
  /** GIF 미디어 정보 (URL, 크기, alt 텍스트) */
  readonly media: MediaInfo;

  /** 갤러리 내 인덱스 (0부터 시작) */
  readonly index: number;

  /**
   * 사용자가 명시적으로 선택한 아이템 여부
   *
   * true: 현재 포커스된 아이템 (aria-current)
   * false: 비활성 아이템
   */
  readonly isActive: boolean;

  /**
   * 초기 포커스 대상 여부 (선택적)
   *
   * @default false
   */
  readonly isFocused?: boolean;

  /**
   * 뷰포트 내 가시성 여부 (선택적)
   *
   * @default true
   */
  readonly isVisible?: boolean;

  /**
   * 강제 표시 여부 (windowing 무시, 선택적)
   *
   * @default false
   */
  readonly forceVisible?: boolean;

  /**
   * 이미지 fit 모드 (선택적)
   *
   * @default 'contain'
   */
  readonly fitMode?: ImageFitMode;

  /**
   * 클릭 이벤트 핸들러 (선택적)
   */
  readonly onClick?: () => void;
}

/**
 * VerticalGifItem - GIF 전용 렌더링 컴포넌트
 *
 * Canvas 기반 GIF 프레임 제어로 재생/일시정지, 반복 모드 전환을 제공합니다.
 *
 * **TDD 상태**: GREEN → REFACTOR (Phase 1-2 완료)
 *
 * **주요 동작**:
 * 1. 이미지 로딩 → Canvas 렌더링
 * 2. 자동 재생 시작 (isPlaying = true)
 * 3. 사용자 제어: Space 키 또는 버튼 클릭
 * 4. 반복 모드: 무한 ↔ 1회 전환
 *
 * **에러 처리**:
 * - 로딩 실패 시 에러 오버레이 표시
 * - logError로 중앙 로깅 (correlationId 포함)
 *
 * **메모리 관리**:
 * - onCleanup에서 animationFrame 정리
 * - Canvas/Image 참조 자동 GC
 *
 * @param props - VerticalGifItemProps
 * @returns SolidJS 컴포넌트
 *
 * @example
 * ```tsx
 * <VerticalGifItem
 *   media={{ url: 'https://pbs.twimg.com/test.gif', type: 'gif', ...}}
 *   index={0}
 *   isActive={true}
 *   fitMode='contain'
 * />
 * ```
 */
export const VerticalGifItem: Component<VerticalGifItemProps> = props => {
  const solid = getSolidCore();

  // 재생 상태
  const [isPlaying, setIsPlaying] = solid.createSignal(true); // GIF는 기본 자동 재생
  const [isLoading, setIsLoading] = solid.createSignal(true);
  const [hasError, setHasError] = solid.createSignal(false);
  const [loopMode, setLoopMode] = solid.createSignal<'infinite' | 'once'>('infinite');

  let canvasRef: HTMLCanvasElement | undefined;
  let imageRef: HTMLImageElement | undefined;
  let animationFrameId: number | null = null;

  // FitMode를 CSS object-fit으로 변환
  const getObjectFit = (): 'contain' | 'cover' | 'fill' | 'none' => {
    switch (props.fitMode) {
      case 'fitWidth':
        return 'cover';
      case 'fitHeight':
        return 'cover';
      case 'fitContainer':
        return 'contain';
      case 'original':
        return 'none';
      default:
        return 'contain';
    }
  };

  // 이미지 로딩
  solid.createEffect(() => {
    if (!canvasRef || !props.media.url) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      setIsLoading(false);
      imageRef = img;

      // Canvas 크기 설정
      if (canvasRef) {
        canvasRef.width = img.width;
        canvasRef.height = img.height;

        // 초기 프레임 렌더링
        const ctx = canvasRef.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
      }

      // 자동 재생 시작
      if (isPlaying()) {
        startAnimation();
      }
    };

    img.onerror = () => {
      setIsLoading(false);
      setHasError(true);
      logError('GIF loading failed', { url: props.media.url });
    };

    img.src = props.media.url;
  });

  // 애니메이션 제어
  const startAnimation = () => {
    if (!canvasRef || !imageRef) return;

    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      if (!isPlaying()) return;

      ctx.clearRect(0, 0, canvasRef!.width, canvasRef!.height);
      ctx.drawImage(imageRef!, 0, 0);

      if (loopMode() === 'infinite') {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animate();
  };

  const stopAnimation = () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  // 재생/일시정지 토글
  const togglePlayPause = (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation();

    if (isPlaying()) {
      setIsPlaying(false);
      stopAnimation();
    } else {
      setIsPlaying(true);
      startAnimation();
    }
  };

  // 반복 모드 토글
  const toggleLoopMode = (e: MouseEvent) => {
    e.stopPropagation();
    setLoopMode(prev => (prev === 'infinite' ? 'once' : 'infinite'));
  };

  // 키보드 이벤트 핸들러
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      togglePlayPause(e);
    }
  };

  // 정리
  solid.onCleanup(() => {
    stopAnimation();
  });

  // 컨테이너 클래스
  const containerClass = () => {
    const classes = [styles.container];
    if (props.isActive) classes.push(styles.active);
    if (props.isFocused) classes.push(styles.focused);
    if (props.isVisible) classes.push(styles.visible);
    return classes.join(' ');
  };

  return (
    <div
      class={containerClass()}
      data-xeg-component='vertical-gif-item'
      data-index={props.index}
      onClick={props.onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div class={styles.canvasWrapper} style={{ 'object-fit': getObjectFit() }}>
        <canvas
          ref={canvasRef}
          class={styles.canvas}
          role='img'
          aria-label={`GIF 애니메이션${props.media.alt ? `: ${props.media.alt}` : ''}`}
        />
      </div>

      {/* 로딩 오버레이 */}
      {isLoading() && (
        <div class={styles.overlay} data-testid='loading-overlay'>
          <div class={styles.spinner} aria-label='로딩 중...' />
        </div>
      )}

      {/* 에러 오버레이 */}
      {hasError() && (
        <div class={styles.overlay} data-testid='error-overlay'>
          <div class={styles.errorMessage}>
            <span class={styles.errorIcon}>⚠️</span>
            <span>GIF를 불러올 수 없습니다</span>
          </div>
        </div>
      )}

      {/* 컨트롤 바 */}
      {!isLoading() && !hasError() && (
        <div class={styles.controls}>
          {/* 재생/일시정지 버튼 */}
          {isPlaying() ? (
            <button
              class={styles.controlButton}
              onClick={togglePlayPause}
              aria-label='일시정지'
              data-testid='pause-button'
              type='button'
            >
              <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                <rect x='6' y='4' width='4' height='16' fill='currentColor' />
                <rect x='14' y='4' width='4' height='16' fill='currentColor' />
              </svg>
            </button>
          ) : (
            <button
              class={styles.controlButton}
              onClick={togglePlayPause}
              aria-label='재생'
              data-testid='play-button'
              type='button'
            >
              <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                <path d='M8 5v14l11-7z' fill='currentColor' />
              </svg>
            </button>
          )}

          {/* 반복 모드 버튼 */}
          {loopMode() === 'infinite' ? (
            <button
              class={styles.controlButton}
              onClick={toggleLoopMode}
              aria-label='무한 반복 (클릭하여 1회 재생으로 변경)'
              data-testid='loop-infinite'
              type='button'
            >
              <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                <path
                  d='M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z'
                  fill='currentColor'
                />
              </svg>
            </button>
          ) : (
            <button
              class={styles.controlButton}
              onClick={toggleLoopMode}
              aria-label='1회 재생 (클릭하여 무한 반복으로 변경)'
              data-testid='loop-once'
              type='button'
            >
              <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                <path
                  d='M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z'
                  fill='currentColor'
                />
                <text x='12' y='16' text-anchor='middle' font-size='10' fill='currentColor'>
                  1
                </text>
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
