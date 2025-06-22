/**
 * @fileoverview Video State Tracker - 비디오 상태 추적
 * @version 1.0.0
 */

import { logger } from '@infrastructure/logging/logger';

/**
 * 트래킹된 비디오 정보
 */
interface TrackedVideo {
  element: HTMLVideoElement;
  tweetId?: string;
  initialState: {
    currentTime: number;
    volume: number;
    muted: boolean;
    paused: boolean;
  };
  lastUpdate: number;
  eventListeners: Map<string, EventListener>;
}

/**
 * 비디오 이벤트 정보
 */
export interface VideoEvent {
  type: 'play' | 'pause' | 'ended' | 'timeupdate' | 'volumechange' | 'error';
  video: HTMLVideoElement;
  tweetId?: string;
  timestamp: number;
  data?: unknown;
}

/**
 * Video State Tracker
 * 비디오 상태 변화를 추적하고 이벤트를 발생시킵니다.
 */
export class VideoStateTracker {
  private readonly trackedVideos = new Map<HTMLVideoElement, TrackedVideo>();
  private readonly eventCallbacks = new Map<string, Set<(event: VideoEvent) => void>>();
  private mutationObserver: MutationObserver | null = null;
  private isTracking = false;

  /**
   * 비디오 추적을 시작합니다.
   */
  public startTracking(): void {
    if (this.isTracking) {
      return;
    }

    this.isTracking = true;
    this.setupMutationObserver();
    this.trackExistingVideos();

    logger.debug('[VideoStateTracker] Started tracking videos');
  }

  /**
   * 비디오 추적을 중지합니다.
   */
  public stopTracking(): void {
    if (!this.isTracking) {
      return;
    }

    this.isTracking = false;
    this.cleanup();

    logger.debug('[VideoStateTracker] Stopped tracking videos');
  }

  /**
   * 특정 비디오를 추적 대상에 추가합니다.
   */
  public trackVideo(video: HTMLVideoElement, tweetId?: string): void {
    if (this.trackedVideos.has(video)) {
      return;
    }

    const trackedVideo: TrackedVideo = {
      element: video,
      initialState: {
        currentTime: video.currentTime,
        volume: video.volume,
        muted: video.muted,
        paused: video.paused,
      },
      lastUpdate: Date.now(),
      eventListeners: new Map(),
    };

    if (tweetId) {
      trackedVideo.tweetId = tweetId;
    }

    this.setupVideoEventListeners(video, trackedVideo);
    this.trackedVideos.set(video, trackedVideo);

    logger.debug('[VideoStateTracker] Started tracking video', {
      tweetId,
      src: video.src || video.currentSrc,
    });
  }

  /**
   * 특정 비디오 추적을 중지합니다.
   */
  public untrackVideo(video: HTMLVideoElement): boolean {
    const trackedVideo = this.trackedVideos.get(video);
    if (!trackedVideo) {
      return false;
    }

    // 이벤트 리스너 제거
    for (const [eventType, listener] of trackedVideo.eventListeners) {
      video.removeEventListener(eventType, listener);
    }

    this.trackedVideos.delete(video);

    logger.debug('[VideoStateTracker] Stopped tracking video', {
      tweetId: trackedVideo.tweetId,
      src: video.src || video.currentSrc,
    });

    return true;
  }

  /**
   * 이벤트 리스너를 등록합니다.
   */
  public addEventListener(eventType: string, callback: (event: VideoEvent) => void): void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, new Set());
    }
    const callbacks = this.eventCallbacks.get(eventType);
    if (callbacks) {
      callbacks.add(callback);
    }
  }

  /**
   * 이벤트 리스너를 제거합니다.
   */
  public removeEventListener(eventType: string, callback: (event: VideoEvent) => void): void {
    const callbacks = this.eventCallbacks.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.eventCallbacks.delete(eventType);
      }
    }
  }

  /**
   * 현재 추적 중인 비디오 목록을 반환합니다.
   */
  public getTrackedVideos(): HTMLVideoElement[] {
    return Array.from(this.trackedVideos.keys());
  }

  /**
   * 특정 비디오의 추적 정보를 반환합니다.
   */
  public getVideoInfo(video: HTMLVideoElement): TrackedVideo | undefined {
    return this.trackedVideos.get(video);
  }

  /**
   * 추적 상태 조회
   */
  public getStatus() {
    return {
      isTracking: this.isTracking,
      trackedVideosCount: this.trackedVideos.size,
      eventCallbacksCount: Array.from(this.eventCallbacks.values()).reduce(
        (sum, callbacks) => sum + callbacks.size,
        0
      ),
    };
  }

  /**
   * 정리 작업
   */
  public cleanup(): void {
    // 모든 비디오 추적 중지
    for (const video of this.trackedVideos.keys()) {
      this.untrackVideo(video);
    }

    // MutationObserver 정리
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    // 이벤트 콜백 정리
    this.eventCallbacks.clear();

    logger.debug('[VideoStateTracker] Cleanup completed');
  }

  // Private 메서드들

  /**
   * MutationObserver 설정
   */
  private setupMutationObserver(): void {
    this.mutationObserver = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // 새로 추가된 비디오 추적
          for (const addedNode of mutation.addedNodes) {
            if (addedNode.nodeType === Node.ELEMENT_NODE) {
              const element = addedNode as Element;
              const videos =
                element.tagName === 'VIDEO'
                  ? [element as HTMLVideoElement]
                  : Array.from(element.querySelectorAll('video'));

              for (const video of videos) {
                this.trackVideo(video);
              }
            }
          }

          // 제거된 비디오 추적 중지
          for (const removedNode of mutation.removedNodes) {
            if (removedNode.nodeType === Node.ELEMENT_NODE) {
              const element = removedNode as Element;
              const videos =
                element.tagName === 'VIDEO'
                  ? [element as HTMLVideoElement]
                  : Array.from(element.querySelectorAll('video'));

              for (const video of videos) {
                this.untrackVideo(video);
              }
            }
          }
        }
      }
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * 기존 비디오들을 추적 대상에 추가
   */
  private trackExistingVideos(): void {
    const videos = document.querySelectorAll('video');
    for (const video of videos) {
      this.trackVideo(video);
    }
  }

  /**
   * 비디오 이벤트 리스너 설정
   */
  private setupVideoEventListeners(video: HTMLVideoElement, trackedVideo: TrackedVideo): void {
    const eventTypes = ['play', 'pause', 'ended', 'timeupdate', 'volumechange', 'error'] as const;

    for (const eventType of eventTypes) {
      const listener = (event: Event) => {
        this.handleVideoEvent(video, eventType, event, trackedVideo);
      };

      video.addEventListener(eventType, listener);
      trackedVideo.eventListeners.set(eventType, listener);
    }
  }

  /**
   * 비디오 이벤트 처리
   */
  private handleVideoEvent(
    video: HTMLVideoElement,
    eventType: string,
    event: Event,
    trackedVideo: TrackedVideo
  ): void {
    trackedVideo.lastUpdate = Date.now();

    const videoEvent: VideoEvent = {
      type: eventType as VideoEvent['type'],
      video,
      timestamp: Date.now(),
      data: event,
    };

    if (trackedVideo.tweetId) {
      videoEvent.tweetId = trackedVideo.tweetId;
    }

    // 등록된 콜백들에게 이벤트 전파
    const callbacks = this.eventCallbacks.get(eventType);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(videoEvent);
        } catch (error) {
          logger.warn(`[VideoStateTracker] Error in event callback for ${eventType}:`, error);
        }
      }
    }

    // 모든 이벤트 리스너들에게도 전파
    const allCallbacks = this.eventCallbacks.get('*');
    if (allCallbacks) {
      for (const callback of allCallbacks) {
        try {
          callback(videoEvent);
        } catch (error) {
          logger.warn('[VideoStateTracker] Error in global event callback:', error);
        }
      }
    }
  }
}
