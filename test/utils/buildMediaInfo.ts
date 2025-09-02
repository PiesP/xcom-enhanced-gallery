import type { MediaInfo } from '@shared/types/media.types';

/**
 * 테스트용 MediaInfo 배열 생성 헬퍼
 * width/height 기본값과 literal media type 강제
 */
export function buildMediaInfo(count: number, prefix = 'm'): MediaInfo[] {
  const items: MediaInfo[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: `${prefix}-${i}`,
      url: `https://example.com/${prefix}/${i}.jpg`,
      type: 'image',
      filename: `${prefix}_${i}.jpg`,
      width: 100,
      height: 100,
    });
  }
  return items;
}

export function singleMedia(id = 'single'): MediaInfo {
  return buildMediaInfo(1, id)[0];
}
