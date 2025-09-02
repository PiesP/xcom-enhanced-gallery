/**
 * @typedef {import('../../src/shared/types/media.types').MediaInfo} MediaInfo
 */

/**
 * 테스트용 MediaInfo 배열 생성 헬퍼
 * @param {number} count
 * @param {string} [prefix]
 * @returns {MediaInfo[]}
 */
export function buildMediaInfo(count, prefix = 'm') {
  const items = [];
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

/**
 * 단일 MediaInfo 생성
 * @param {string} [id]
 * @returns {MediaInfo}
 */
export function singleMedia(id = 'single') {
  return buildMediaInfo(1, id)[0];
}
