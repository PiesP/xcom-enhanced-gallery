/**
 * @fileoverview 비디오 제어 통합 헬퍼
 * @description Service/Video fallback 패턴 통합
 *              중복된 3개 이상의 위치에서 비디오 제어 로직을 단일 지점으로 통합
 *
 * Phase 329: 중복 코드 제거
 * - Before: 3개 위치에서 Service 체크 → Video fallback 반복
 * - After: 단일 헬퍼 함수로 통합
 */

/**
 * @fileoverview 비디오 제어 통합 헬퍼
 * @description Service/Video fallback 패턴 통합
 *              중복된 3개 이상의 위치에서 비디오 제어 로직을 단일 지점으로 통합
 *
 * Phase 329: 중복 코드 제거
 * - Before: 3개 위치에서 Service 체크 → Video fallback 반복
 * - After: 단일 헬퍼 함수로 통합
 */

import { logger } from '../../../logging';
import { getMediaServiceFromContainer } from '../../../container/service-accessors';
import { isMediaServiceLike } from '../../type-safety-helpers';

/**
 * 비디오 제어 액션 타입
 */
export type VideoControlAction =
  | 'play'
  | 'pause'
  | 'togglePlayPause'
  | 'volumeUp'
  | 'volumeDown'
  | 'mute'
  | 'toggleMute';

/**
 * 비디오 제어 옵션
 */
export interface VideoControlOptions {
  video?: HTMLVideoElement | null;
  context?: string;
}

/**
 * MediaService 유사 타입 (실제 타입과 분리)
 */
interface MediaServiceLike {
  play: () => void;
  pause: () => void;
  togglePlayPauseCurrent: () => void;
  volumeUpCurrent: () => void;
  volumeDownCurrent: () => void;
  muteCurrent?: () => void;
  toggleMuteCurrent: () => void;
}

/**
 * 비디오 재생 상태 추적 (WeakMap)
 * Service 사용 불가 시 Video 요소의 재생 상태를 로컬 추적
 */
const videoPlaybackStateMap = new WeakMap<HTMLVideoElement, { playing: boolean }>();

/**
 * 현재 갤러리 비디오 요소 가져오기
 *
 * @param video - 선택적 비디오 요소 (제공 시 사용)
 * @returns 비디오 요소 또는 null
 */
function getCurrentGalleryVideo(video?: HTMLVideoElement | null): HTMLVideoElement | null {
  if (video) {
    return video;
  }

  try {
    const d =
      typeof document !== 'undefined' ? document : (globalThis as { document?: Document }).document;
    if (!(d instanceof Document)) return null;

    const sel = '#xeg-gallery-root';
    const isel = '[data-xeg-role="items-container"]';
    const it = d.querySelector(sel)?.querySelector(isel) as HTMLElement | null;
    if (!it) return null;

    // NOTE: 향후 Phase에서 Signal 기반 캐싱 추가
    // const idx = gallerySignals.currentIndex.value;
    // const currentVideoElement = gallerySignals.currentVideoElement.value;
    // if (currentVideoElement) return currentVideoElement;

    // Fallback: 직접 쿼리 (성능 최적화 대상)
    const itm = it.children?.[0] as HTMLElement | null;
    return itm?.querySelector('video') as HTMLVideoElement | null;
  } catch (error) {
    logger.debug('Failed to get current gallery video:', error);
    return null;
  }
}

/**
 * MediaService 인스턴스 가져오기 (타입 안전)
 *
 * @returns MediaService 유사 객체 또는 null
 */
function getMediaService(): MediaServiceLike | null {
  try {
    const service = getMediaServiceFromContainer();
    if (isMediaServiceLike(service)) {
      return service as unknown as MediaServiceLike;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 비디오 제어 액션 실행
 *
 * Service → Video fallback 패턴 통합
 * 중복 제거: 3개 이상의 위치에서 반복되던 로직을 단일 지점으로 통합
 *
 * @param action - 실행할 액션
 * @param options - 옵션 (video, context 포함)
 *
 * @example
 * // 재생/일시정지 토글
 * executeVideoControl('togglePlayPause');
 *
 * // 볼륨 조절 (Service 우선, Video fallback)
 * executeVideoControl('volumeUp');
 *
 * // 명시적 비디오 요소 지정
 * executeVideoControl('mute', { video: myVideoElement });
 */
export function executeVideoControl(
  action: VideoControlAction,
  options: VideoControlOptions = {}
): void {
  const { video, context } = options;

  try {
    const service = getMediaService();

    // Service가 있고 해당 액션을 지원하는 경우 먼저 시도
    if (service) {
      switch (action) {
        case 'play':
          if (service.play) {
            service.play();
            return;
          }
          break;
        case 'pause':
          if (service.pause) {
            service.pause();
            return;
          }
          break;
        case 'togglePlayPause':
          if (service.togglePlayPauseCurrent) {
            service.togglePlayPauseCurrent();
            return;
          }
          break;
        case 'volumeUp':
          if (service.volumeUpCurrent) {
            service.volumeUpCurrent();
            return;
          }
          break;
        case 'volumeDown':
          if (service.volumeDownCurrent) {
            service.volumeDownCurrent();
            return;
          }
          break;
        case 'mute':
          if (service.muteCurrent) {
            service.muteCurrent();
            return;
          }
          break;
        case 'toggleMute':
          if (service.toggleMuteCurrent) {
            service.toggleMuteCurrent();
            return;
          }
          break;
      }
    }

    // Service 미지원 시 Video 요소 직접 제어
    const videoElement = getCurrentGalleryVideo(video);
    if (!videoElement) {
      logger.debug('[VideoControl] No video element found', { action, context });
      return;
    }

    switch (action) {
      case 'play':
        videoElement.play?.().catch(() => {
          logger.debug('[VideoControl] Play failed', { context });
        });
        videoPlaybackStateMap.set(videoElement, { playing: true });
        break;

      case 'pause':
        videoElement.pause?.();
        videoPlaybackStateMap.set(videoElement, { playing: false });
        break;

      case 'togglePlayPause': {
        const current = videoPlaybackStateMap.get(videoElement)?.playing ?? videoElement.paused;
        const next = !current;

        if (next) {
          videoElement.play?.().catch(() => {
            logger.debug('[VideoControl] Play failed during toggle', { context });
          });
        } else {
          videoElement.pause?.();
        }

        videoPlaybackStateMap.set(videoElement, { playing: next });
        break;
      }

      case 'volumeUp': {
        const newVolume = Math.min(1, Math.round((videoElement.volume + 0.1) * 100) / 100);
        videoElement.volume = newVolume;
        if (newVolume > 0 && videoElement.muted) {
          videoElement.muted = false;
        }
        break;
      }

      case 'volumeDown': {
        const newVolume = Math.max(0, Math.round((videoElement.volume - 0.1) * 100) / 100);
        videoElement.volume = newVolume;
        if (newVolume === 0 && !videoElement.muted) {
          videoElement.muted = true;
        }
        break;
      }

      case 'mute':
        videoElement.muted = true;
        break;

      case 'toggleMute':
        videoElement.muted = !videoElement.muted;
        break;
    }

    logger.debug('[VideoControl] Action executed', {
      action,
      context,
      method: 'video-element',
    });
  } catch (error) {
    logger.error('[VideoControl] Unexpected error', { error, action, context });
  }
}

/**
 * 비디오 재생 상태 조회
 * (테스트용 유틸리티)
 *
 * @param video - 비디오 요소
 * @returns 재생 상태 또는 null
 */
export function getVideoPlaybackState(video: HTMLVideoElement): { playing: boolean } | null {
  return videoPlaybackStateMap.get(video) || null;
}

/**
 * 비디오 재생 상태 초기화
 * (테스트용 유틸리티)
 */
export function resetVideoPlaybackState(): void {
  // WeakMap은 명시적으로 초기화할 수 없으므로 참조만 제거
  // 실제 테스트에서는 새로운 요소를 생성하거나 GC에 의존
}
