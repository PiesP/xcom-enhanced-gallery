/**
 * @fileoverview VerticalVideoItem Component (TDD REFACTOR Phase)
 * Epic: MEDIA-TYPE-ENHANCEMENT Phase 1-1
 *
 * 비디오 전용 렌더링 컴포넌트: 재생 컨트롤, 진행바, 키보드 네비게이션, 접근성
 */

import { getSolidCore } from '@shared/external/vendors';
import type { Component } from 'solid-js';
import type { MediaInfo } from '@shared/types/media.types';
import type { ImageFitMode } from '@shared/types';
import { logError } from '@shared/logging';
import styles from './VerticalVideoItem.module.css';
export interface VerticalVideoItemProps {
  readonly media: MediaInfo;
  readonly index: number;
  readonly isActive: boolean;
  readonly isFocused?: boolean;
  readonly isVisible?: boolean;
  readonly forceVisible?: boolean;
  readonly fitMode?: ImageFitMode;
  readonly onClick?: () => void;
}

export const VerticalVideoItem: Component<VerticalVideoItemProps> = props => {
  const solid = getSolidCore();

  // 재생 상태
  const [isPlaying, setIsPlaying] = solid.createSignal(false);
  const [isLoading, setIsLoading] = solid.createSignal(false);
  const [hasError, setHasError] = solid.createSignal(false);
  const [currentTime, setCurrentTime] = solid.createSignal(0);
  const [duration, setDuration] = solid.createSignal(0);

  let videoRef: HTMLVideoElement | undefined;

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

  // 재생/일시정지 토글
  const togglePlayPause = async () => {
    if (!videoRef) return;

    try {
      if (isPlaying()) {
        videoRef.pause();
        setIsPlaying(false);
      } else {
        await videoRef.play();
        setIsPlaying(true);
      }
    } catch (error) {
      logError('Video playback error', { error: String(error) });
      setHasError(true);
    }
  };

  // 볼륨 조절
  const adjustVolume = (delta: number) => {
    if (!videoRef) return;
    const newVolume = Math.max(0, Math.min(1, videoRef.volume + delta));
    videoRef.volume = newVolume;
  };

  // 키보드 핸들러
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!props.isActive) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'ArrowUp':
        e.preventDefault();
        adjustVolume(0.1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        adjustVolume(-0.1);
        break;
    }
  };

  // 비디오 이벤트 핸들러
  const handleLoadStart = () => setIsLoading(true);
  const handleWaiting = () => setIsLoading(true);
  const handleCanPlay = () => setIsLoading(false);
  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };
  const handleTimeUpdate = () => {
    if (!videoRef) return;
    setCurrentTime(videoRef.currentTime);
  };
  const handleLoadedMetadata = () => {
    if (!videoRef) return;
    setDuration(videoRef.duration);
  };

  // 진행바 클릭 핸들러
  const handleProgressBarClick = (e: MouseEvent) => {
    if (!videoRef) return;

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * videoRef.duration;

    videoRef.currentTime = newTime;
  };

  // 시간 포맷팅 (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 컨테이너 클래스 생성 (isVisible 상태 반영)
  const containerClass = solid.createMemo(() => {
    const classes = [styles.container];
    if (props.isVisible) {
      classes.push(styles.visible);
    }
    return classes.join(' ');
  });

  return (
    <div
      data-testid='video-container'
      data-xeg-component='vertical-video-item'
      class={containerClass()}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={props.onClick}
      aria-label={props.media.alt || '비디오 콘텐츠'}
      aria-current={props.isVisible ? 'true' : undefined}
    >
      {/* 비디오 요소 */}
      <video
        ref={videoRef}
        class={styles.video}
        src={props.media.url}
        aria-label={props.media.alt || '비디오 콘텐츠'}
        onLoadStart={handleLoadStart}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        style={{
          'object-fit': getObjectFit(),
        }}
      />

      {/* 로딩 스피너 */}
      {isLoading() && (
        <div data-testid='loading-spinner' class={styles.loadingOverlay}>
          로딩 중...
        </div>
      )}

      {/* 에러 메시지 */}
      {hasError() && (
        <div data-testid='error-message' class={styles.errorOverlay}>
          비디오를 로드할 수 없습니다
        </div>
      )}

      {/* 컨트롤 오버레이 */}
      {props.isActive && !hasError() && (
        <div class={styles.controls}>
          {/* 진행바 */}
          <div
            data-testid='progress-bar'
            class={styles.progressBar}
            onClick={handleProgressBarClick}
          >
            <div
              class={styles.progressFill}
              style={{
                width: duration() > 0 ? `${(currentTime() / duration()) * 100}%` : '0%',
              }}
            />
          </div>

          {/* 컨트롤 버튼 + 시간 표시 */}
          <div class={styles.controlButtons}>
            {/* 재생/일시정지 버튼 */}
            <button
              data-testid={isPlaying() ? 'pause-button' : 'play-button'}
              class={styles.playButton}
              onClick={e => {
                e.stopPropagation();
                togglePlayPause();
              }}
              aria-label={isPlaying() ? '일시정지' : '재생'}
            >
              {isPlaying() ? '⏸' : '▶'}
            </button>

            {/* 시간 표시 */}
            <div data-testid='time-display' class={styles.timeDisplay}>
              {formatTime(currentTime())} / {formatTime(duration())}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
