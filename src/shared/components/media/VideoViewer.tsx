/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * VideoViewer Component - 임시 다운로드를 통한 동영상 재생
 */

import { logger } from '@infrastructure/logging/logger';
import type { MediaInfo } from '@shared/types/media.types';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import styles from './VideoViewer.module.css';

interface VideoViewerProps {
  media: MediaInfo;
  autoPlay?: boolean;
  controls?: boolean;
  muted?: boolean;
  className?: string;
  isActive?: boolean; // 현재 활성화된 아이템인지
  isVisible?: boolean; // 화면에 보이는지
}

interface TempVideoData {
  url: string;
  blob: Blob;
}

/**
 * 임시 다운로드를 통한 동영상 뷰어
 */
export function VideoViewer({
  media,
  autoPlay: _autoPlay = false, // 사용하지 않지만 props 일관성을 위해 유지
  controls = true,
  muted = true,
  className = '',
  isActive = false,
  isVisible = false,
}: VideoViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tempVideoData, setTempVideoData] = useState<TempVideoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);

  // 임시 다운로드 함수
  const downloadTempVideo = useCallback(async (mediaUrl: string): Promise<TempVideoData | null> => {
    try {
      setIsLoading(true);
      setError(null);

      logger.debug('Starting temp video download:', mediaUrl);

      const response = await fetch(mediaUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const tempUrl = URL.createObjectURL(blob);

      logger.debug('Temp video download completed');
      return { url: tempUrl, blob };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Failed to download temp video:', errorMessage);
      setError(`동영상 로드 실패: ${errorMessage}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 뷰포트 감지 (Intersection Observer)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry) {
          setIsInViewport(entry.isIntersecting);
        }
      },
      {
        threshold: 0.5, // 50% 이상 보일 때
        rootMargin: '0px',
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  // 재생 조건 결정
  useEffect(() => {
    const shouldStartPlaying = !!(isActive && isVisible && isInViewport && tempVideoData);
    setShouldPlay(shouldStartPlaying);
    logger.debug('Video play conditions:', {
      isActive,
      isVisible,
      isInViewport,
      tempVideoData: !!tempVideoData,
      shouldPlay: shouldStartPlaying,
    });
  }, [isActive, isVisible, isInViewport, tempVideoData]);

  // 비디오 재생/정지 제어
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !tempVideoData) {
      return;
    }

    const handlePlayback = async () => {
      try {
        if (shouldPlay) {
          // 재생 시작
          if (video.paused) {
            await video.play();
            logger.debug('Video started playing');
          }
        } else {
          // 재생 정지
          if (!video.paused) {
            video.pause();
            logger.debug('Video paused');
          }
        }
      } catch (err) {
        logger.debug('Video playback control error:', err);
      }
    };

    handlePlayback();
  }, [shouldPlay, tempVideoData]);

  // 컴포넌트 언마운트 시 비디오 정지 및 정리
  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (video && !video.paused) {
        video.pause();
        video.currentTime = 0;
        logger.debug('Video stopped on unmount');
      }
    };
  }, []);
  // 컴포넌트 마운트 시 임시 다운로드 시작 (활성화되고 보이는 경우에만)
  useEffect(() => {
    if (!media.url || isDownloaded || !isActive || !isVisible) {
      return;
    }

    const startDownload = async () => {
      const tempData = await downloadTempVideo(media.url);
      if (tempData) {
        setTempVideoData(tempData);
        setIsDownloaded(true);
      }
    };

    startDownload();
  }, [media.url, downloadTempVideo, isDownloaded, isActive, isVisible]);

  // 컴포넌트 언마운트 시 임시 URL 정리
  useEffect(() => {
    return () => {
      if (tempVideoData?.url) {
        URL.revokeObjectURL(tempVideoData.url);
        logger.debug('Temp video URL revoked');
      }
    };
  }, [tempVideoData]);

  // 비디오 로드 핸들러
  const handleVideoLoad = useCallback(() => {
    logger.debug('Video loaded successfully');
  }, []);

  // 비디오 에러 핸들러
  const handleVideoError = useCallback(() => {
    setError('동영상 재생 중 오류가 발생했습니다');
    logger.error('Video playback error');
  }, []);

  if (error) {
    return (
      <div className={`${styles.errorContainer} ${className}`}>
        <div className={styles.errorMessage}>
          <div className={styles.errorIcon}>⚠️</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  if (isLoading || !tempVideoData) {
    return (
      <div className={`${styles.loadingContainer} ${className}`}>
        <div className={styles.loadingSpinner}></div>
        <div className={styles.loadingText}>동영상 로딩 중...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`${styles.videoContainer} ${className}`}>
      <video
        ref={videoRef}
        src={tempVideoData.url}
        autoPlay={false}
        controls={controls}
        muted={muted}
        onLoad={handleVideoLoad}
        onError={handleVideoError}
        className={styles.video}
        preload='metadata'
        playsInline
        loop={false}
      >
        <source src={tempVideoData.url} type='video/mp4' />
        브라우저가 동영상 재생을 지원하지 않습니다.
      </video>
    </div>
  );
}
