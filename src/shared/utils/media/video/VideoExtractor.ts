/**
 * @fileoverview Video Extractor - 비디오 추출 기능
 * @version 1.0.0
 */

import { logger } from '@infrastructure/logging/logger';

/**
 * 비디오 미디어 정보
 */
export interface VideoMediaInfo {
  type: 'video';
  url: string;
  poster_url?: string;
  sources?: Array<{ src: string; type: string }>;
  duration?: number;
  width?: number;
  height?: number;
  element: HTMLVideoElement;
}

/**
 * Video Extractor
 * 비디오 요소에서 미디어 정보를 추출합니다.
 */
export class VideoExtractor {
  /**
   * 비디오 요소로부터 미디어 정보 추출
   */
  public static extractMediaFromVideoElement(videoElement: HTMLVideoElement): VideoMediaInfo {
    try {
      const poster = videoElement.poster;
      const src = videoElement.src || videoElement.currentSrc;

      // video의 source 요소들도 확인
      const sources = Array.from(videoElement.querySelectorAll('source'));
      const videoSources = sources.map(source => ({
        src: source.src,
        type: source.type,
      }));

      const mediaInfo: VideoMediaInfo = {
        type: 'video' as const,
        url: src,
        element: videoElement,
      };

      if (poster) {
        mediaInfo.poster_url = poster;
      }

      if (videoSources.length > 0) {
        mediaInfo.sources = videoSources;
      }

      if (videoElement.duration) {
        mediaInfo.duration = videoElement.duration;
      }

      if (videoElement.videoWidth || videoElement.width) {
        mediaInfo.width = videoElement.videoWidth || videoElement.width;
      }

      if (videoElement.videoHeight || videoElement.height) {
        mediaInfo.height = videoElement.videoHeight || videoElement.height;
      }

      logger.debug('[VideoExtractor] Extracted video media info:', mediaInfo);
      return mediaInfo;
    } catch (error) {
      logger.error('[VideoExtractor] Failed to extract media from video element:', error);
      return {
        type: 'video' as const,
        url: videoElement.src || videoElement.currentSrc || '',
        element: videoElement,
      };
    }
  }

  /**
   * 여러 비디오 요소들로부터 미디어 정보 추출
   */
  public static extractMediaFromVideoElements(videoElements: HTMLVideoElement[]): VideoMediaInfo[] {
    return videoElements.map(video => this.extractMediaFromVideoElement(video));
  }

  /**
   * 컨테이너 내의 모든 비디오에서 미디어 정보 추출
   */
  public static extractMediaFromContainer(container: HTMLElement): VideoMediaInfo[] {
    const videoElements = Array.from(container.querySelectorAll('video'));
    return this.extractMediaFromVideoElements(videoElements);
  }
}
