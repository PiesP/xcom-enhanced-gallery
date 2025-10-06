/**
 * @fileoverview 미디어 타입 감지 유틸리티
 * @description URL 패턴/DOM 속성 기반 미디어 타입 추론
 * @phase Phase 1-2 (GREEN)
 */

/**
 * URL에서 미디어 타입 추론
 *
 * Twitter 미디어 URL 패턴:
 * - 이미지: pbs.twimg.com/media
 * - GIF: pbs.twimg.com/tweet_video
 * - 비디오: video.twimg.com
 */
export function detectMediaTypeFromUrl(url: string): 'image' | 'video' | 'gif' | null {
  if (!url) return null;

  try {
    const urlLower = url.toLowerCase();

    // GIF 패턴 감지 (우선순위 높음)
    if (
      urlLower.includes('tweet_video') ||
      urlLower.includes('/tweet_video_thumb/') ||
      urlLower.includes('/tweet_video/')
    ) {
      return 'gif';
    }

    // 비디오 도메인/경로 감지
    if (
      urlLower.includes('video.twimg.com') ||
      urlLower.includes('ext_tw_video') ||
      urlLower.includes('amplify_video')
    ) {
      // tweet_video가 아닌 video.twimg.com은 일반 비디오
      if (!urlLower.includes('tweet_video')) {
        return 'video';
      }
    }

    // 확장자 기반 감지
    const extension = getExtensionFromUrl(url);
    if (extension) {
      if (extension === 'mp4' || extension === 'm3u8' || extension === 'ts') {
        // tweet_video 경로가 포함된 .mp4는 GIF
        if (urlLower.includes('tweet_video')) {
          return 'gif';
        }
        return 'video';
      }

      if (extension === 'gif') {
        return 'gif';
      }

      if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
        // tweet_video_thumb는 GIF 썸네일
        if (urlLower.includes('tweet_video')) {
          return 'gif';
        }
        return 'image';
      }
    }

    // 기본: 이미지로 추론 (pbs.twimg.com)
    if (urlLower.includes('pbs.twimg.com')) {
      return 'image';
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * HTML Video 요소에서 GIF 감지
 *
 * Twitter는 GIF를 loop + muted + autoplay 속성의 video로 변환
 */
export function detectGifFromVideoElement(video: HTMLVideoElement): boolean {
  // tweet_video URL 패턴 체크
  if (video.src?.toLowerCase().includes('tweet_video')) {
    return true;
  } // GIF 특성: loop + muted + (autoplay 또는 작은 크기)
  const hasLoop = video.hasAttribute('loop') || video.loop;
  const hasMuted = video.hasAttribute('muted') || video.muted;
  const hasAutoplay = video.hasAttribute('autoplay') || video.autoplay;

  // loop + muted는 GIF의 강력한 지표
  if (hasLoop && hasMuted) {
    // autoplay가 있거나 duration이 짧으면 GIF로 판단
    if (hasAutoplay || video.duration < 30) {
      return true;
    }
  }

  return false;
}

/**
 * URL에서 확장자 추출
 */
function getExtensionFromUrl(url: string): string | null {
  try {
    // 쿼리 파라미터 제거
    const urlWithoutParams = url.split('?')[0] || url;

    // 마지막 . 이후 확장자 추출
    const parts = urlWithoutParams.split('.');
    if (parts.length < 2) return null;

    const extension = parts[parts.length - 1];
    if (!extension) return null;

    // 경로 구분자 제거 (예: file.mp4/segment)
    const cleanExtension = extension.split('/')[0];

    return cleanExtension?.toLowerCase() || null;
  } catch {
    return null;
  }
}

/**
 * 비디오 URL인지 확인
 */
export function isVideoUrl(url: string): boolean {
  const type = detectMediaTypeFromUrl(url);
  return type === 'video';
}

/**
 * GIF URL인지 확인
 */
export function isGifUrl(url: string): boolean {
  const type = detectMediaTypeFromUrl(url);
  return type === 'gif';
}

/**
 * 이미지 URL인지 확인
 */
export function isImageUrl(url: string): boolean {
  const type = detectMediaTypeFromUrl(url);
  return type === 'image';
}
