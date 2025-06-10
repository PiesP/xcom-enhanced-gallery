/**
 * Video Control Utility
 *
 * 트위터 페이지의 동영상 재생 상태를 제어하여
 * 갤러리와의 상호작용 문제를 해결합니다.
 */

import { logger } from '@infrastructure/logging/logger';

interface VideoState {
  element: HTMLVideoElement;
  wasPlaying: boolean;
  currentTime: number;
}

export class VideoControlUtil {
  private static instance: VideoControlUtil;
  private pausedVideos: Map<HTMLVideoElement, VideoState> = new Map();
  private mutationObserver: MutationObserver | null = null;

  private constructor() {}

  public static getInstance(): VideoControlUtil {
    return (this.instance ??= new VideoControlUtil());
  }

  /**
   * 페이지의 모든 동영상을 일시정지합니다
   */
  public pauseAllVideos(): void {
    const videos = document.querySelectorAll('video');

    logger.debug(`VideoControlUtil: ${videos.length}개 동영상 일시정지 시작`);

    videos.forEach(video => {
      if (!video.paused) {
        const videoState: VideoState = {
          element: video,
          wasPlaying: true,
          currentTime: video.currentTime,
        };

        this.pausedVideos.set(video, videoState);
        video.pause();

        logger.debug('VideoControlUtil: 동영상 일시정지됨', {
          src: video.src,
          currentTime: video.currentTime,
        });
      }
    });

    logger.info(`VideoControlUtil: ${this.pausedVideos.size}개 동영상 일시정지 완료`);
  }

  /**
   * 이전에 재생 중이던 동영상들을 복원합니다
   */
  public resumePausedVideos(): void {
    logger.debug(`VideoControlUtil: ${this.pausedVideos.size}개 동영상 재생 복원 시작`);

    this.pausedVideos.forEach((videoState, video) => {
      if (videoState.wasPlaying && document.contains(video)) {
        try {
          video.currentTime = videoState.currentTime;
          video.play().catch(error => {
            logger.warn('VideoControlUtil: 동영상 재생 복원 실패:', error);
          });

          logger.debug('VideoControlUtil: 동영상 재생 복원됨', {
            src: video.src,
            currentTime: video.currentTime,
          });
        } catch (error) {
          logger.warn('VideoControlUtil: 동영상 복원 중 오류:', error);
        }
      }
    });

    this.pausedVideos.clear();
    logger.info('VideoControlUtil: 동영상 재생 복원 완료');
  }

  /**
   * 특정 컨테이너 내의 동영상만 일시정지합니다
   */
  public pauseVideosInContainer(container: HTMLElement): HTMLVideoElement[] {
    const videos = container.querySelectorAll('video');
    const pausedVideos: HTMLVideoElement[] = [];

    videos.forEach(video => {
      if (!video.paused) {
        const videoState: VideoState = {
          element: video,
          wasPlaying: true,
          currentTime: video.currentTime,
        };

        this.pausedVideos.set(video, videoState);
        video.pause();
        pausedVideos.push(video);
      }
    });

    logger.debug(`VideoControlUtil: 컨테이너 내 ${pausedVideos.length}개 동영상 일시정지`);
    return pausedVideos;
  }

  /**
   * 동영상 DOM 변화를 감지하고 갤러리 트리거를 유지합니다
   */
  public startVideoMutationObserver(callback?: (mutations: MutationRecord[]) => void): void {
    if (this.mutationObserver) {
      return; // 이미 실행 중
    }

    this.mutationObserver = new MutationObserver(mutations => {
      let hasVideoChanges = false;

      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          // 동영상 요소가 추가되거나 제거된 경우
          const addedVideos = Array.from(mutation.addedNodes).filter(
            node => node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'VIDEO'
          );

          const removedVideos = Array.from(mutation.removedNodes).filter(
            node => node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'VIDEO'
          );

          if (addedVideos.length > 0 || removedVideos.length > 0) {
            hasVideoChanges = true;
            logger.debug('VideoControlUtil: 동영상 DOM 변화 감지', {
              added: addedVideos.length,
              removed: removedVideos.length,
            });
          }
        }

        if (mutation.type === 'attributes' && (mutation.target as Element).tagName === 'VIDEO') {
          hasVideoChanges = true;
          logger.debug('VideoControlUtil: 동영상 속성 변화 감지');
        }
      });

      if (hasVideoChanges && callback) {
        callback(mutations);
      }
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'poster', 'controls'],
    });

    logger.info('VideoControlUtil: 동영상 변화 감지 시작');
  }

  /**
   * 동영상 변화 감지를 중지합니다
   */
  public stopVideoMutationObserver(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
      logger.info('VideoControlUtil: 동영상 변화 감지 중지');
    }
  }

  /**
   * 동영상 요소에서 미디어 정보를 추출합니다
   */
  public extractMediaFromVideoElement(videoElement: HTMLVideoElement): {
    url: string;
    thumbnailUrl?: string;
    type: 'video';
  } | null {
    try {
      // blob URL이나 src 속성에서 URL 추출
      const videoUrl = videoElement.src || videoElement.currentSrc;
      const posterUrl = videoElement.poster;

      if (!videoUrl) {
        return null;
      }

      return {
        url: videoUrl,
        thumbnailUrl: posterUrl || undefined,
        type: 'video' as const,
      };
    } catch (error) {
      logger.error('VideoControlUtil: 동영상 요소에서 미디어 추출 실패:', error);
      return null;
    }
  }

  /**
   * 리소스 정리
   */
  public cleanup(): void {
    this.stopVideoMutationObserver();
    this.resumePausedVideos();
    logger.info('VideoControlUtil: 정리 완료');
  }
}
