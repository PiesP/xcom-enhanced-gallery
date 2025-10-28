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
  // URL 객체로 파싱 가능한 경우 hostname 검증
  try {
    const url = new URL(media.url);
    return url.hostname === 'video.twimg.com';
  } catch {
    // URL 파싱 실패 시 (상대 경로, data: URL 등)
    // 비디오 확장자로만 판단 (이미 위에서 검사했으므로 여기서는 false 반환)
    return false;
  }
}
