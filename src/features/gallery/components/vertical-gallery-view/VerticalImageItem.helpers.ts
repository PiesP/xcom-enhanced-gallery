/**
 * @file VerticalImageItem 유틸리티 함수
 */

import type { MediaInfo } from '@shared/types/media.types';

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi'] as const;

export function cleanFilename(filename?: string): string {
  if (!filename) {
    return 'Untitled';
  }

  let cleaned = filename
    .replace(/^twitter_media_\d{8}T\d{6}_\d+\./, '')
    .replace(/^\/media\//, '')
    .replace(/^\.\//g, '')
    .replace(/[\\/]/g, '_');

  if (cleaned.length > 40 || !cleaned) {
    const match = filename.match(/([a-zA-Z0-9_-]+)$/);
    cleaned = match?.[1] ?? 'Image';
  }

  return cleaned;
}

export function isVideoMedia(media: MediaInfo): boolean {
  const urlLowerCase = media.url.toLowerCase();

  if (VIDEO_EXTENSIONS.some(ext => urlLowerCase.includes(ext))) {
    return true;
  }

  if (media.filename) {
    const filenameLowerCase = media.filename.toLowerCase();
    if (VIDEO_EXTENSIONS.some(ext => filenameLowerCase.endsWith(ext))) {
      return true;
    }
  }

  // URL 호스트 검증으로 보안 강화
  try {
    const url = new URL(media.url);
    return url.hostname === 'video.twimg.com' || urlLowerCase.includes('/video/');
  } catch {
    // URL 파싱 실패 시 폴백 (상대 경로 등)
    return urlLowerCase.includes('video.twimg.com') || urlLowerCase.includes('/video/');
  }
}
