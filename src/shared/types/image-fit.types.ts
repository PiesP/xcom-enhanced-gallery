/**
 * @fileoverview 이미지 맞춤 관련 공통 타입 정의
 *
 * X.com Enhanced Gallery에서 사용되는 이미지 크기 조정 및 맞춤 모드에 대한
 * 통일된 타입 정의를 제공합니다.
 *
 * @author X.com Enhanced Gallery Team
 * @since 1.0.0
 * @version 1.0.0
 */

/**
 * 이미지 맞춤 모드
 *
 * 이미지가 컨테이너에 어떻게 맞춰질지를 정의하는 타입입니다.
 *
 * @public
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const mode: ImageFitMode = 'fitWidth';
 * ```
 */
export type ImageFitMode =
  | 'original' // 원본 크기 (확대/축소 없음)
  | 'fitWidth' // 컨테이너 폭에 맞춤
  | 'fitHeight' // 컨테이너 높이에 맞춤
  | 'fitContainer'; // 컨테이너에 완전히 맞춤 (종횡비 유지)

/**
 * 이미지 맞춤 상태 인터페이스
 *
 * 현재 이미지의 크기 조정 상태를 나타내는 인터페이스입니다.
 *
 * @public
 * @interface ImageFitState
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const state: ImageFitState = {
 *   mode: 'fitWidth',
 *   scale: 1.5,
 *   position: { x: 0, y: 0 }
 * };
 * ```
 */
export interface ImageFitState {
  /** 현재 맞춤 모드 */
  mode: ImageFitMode;

  /** 현재 확대/축소 비율 (1.0이 원본 크기) */
  scale: number;

  /** 현재 이미지 위치 (픽셀 단위) */
  position: {
    /** X축 위치 */
    x: number;
    /** Y축 위치 */
    y: number;
  };
}

/**
 * 이미지 맞춤 콜백 인터페이스
 *
 * 이미지 크기 조정 관련 콜백 함수들을 정의하는 인터페이스입니다.
 *
 * @public
 * @interface ImageFitCallbacks
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const callbacks: ImageFitCallbacks = {
 *   onFitOriginal: () => logger.info('원본 크기'),
 *   onFitWidth: () => logger.info('폭 맞춤'),
 *   onFitHeight: () => logger.info('높이 맞춤'),
 *   onFitContainer: () => logger.info('컨테이너 맞춤'),
 * };
 * ```
 */
export interface ImageFitCallbacks {
  /** 원본 크기로 맞추기 */
  onFitOriginal?: () => void;

  /** 폭에 맞추기 */
  onFitWidth?: () => void;

  /** 높이에 맞추기 */
  onFitHeight?: () => void;

  /** 컨테이너에 맞추기 */
  onFitContainer?: () => void;
}

/**
 * 이미지 맞춤 설정 인터페이스
 *
 * 이미지 맞춤 기능의 설정을 정의하는 인터페이스입니다.
 *
 * @public
 * @interface ImageFitConfig
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const config: ImageFitConfig = {
 *   initialMode: 'fitWidth',
 *   minScale: 0.1,
 *   maxScale: 5.0,
 *   zoomStep: 0.2,
 *   enableAnimation: true,
 *   animationDuration: 300
 * };
 * ```
 */
export interface ImageFitConfig {
  /** 초기 맞춤 모드 */
  initialMode?: ImageFitMode;

  /** 최소 확대/축소 비율 */
  minScale?: number;

  /** 최대 확대/축소 비율 */
  maxScale?: number;

  /** 확대/축소 단계 크기 */
  zoomStep?: number;

  /** 애니메이션 활성화 여부 */
  enableAnimation?: boolean;

  /** 애니메이션 지속 시간 (밀리초) */
  animationDuration?: number;
}
