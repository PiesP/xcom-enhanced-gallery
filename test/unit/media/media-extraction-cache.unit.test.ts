// @vitest-environment node
import { buildMediaInfo } from '../../utils/buildMediaInfo.js';
import { describe, it, expect } from 'vitest';
import { MediaExtractionCache } from '@shared/services/media-extraction/MediaExtractionCache';

function makeResult(id) {
  return {
    success: true,
    mediaItems: buildMediaInfo(1, id),
    clickedIndex: 0,
    metadata: { extractedAt: Date.now(), sourceType: 'api-first', strategy: 'media-extraction' },
    tweetInfo: {
      tweetId: id,
      username: 'u',
      tweetUrl: '',
      extractionMethod: 'mock',
      confidence: 1,
    },
  };
}

describe('MediaExtractionCache (LRU + TTL)', () => {
  it('기본 set/get 동작 및 TTL 만료 후 undefined 반환', async () => {
    const cache = new MediaExtractionCache({ ttlMs: 30 });
    cache.set('a', makeResult('a'));
    // buildMediaInfo(1, 'a') => id 'a-0'
    expect(cache.get('a')?.mediaItems[0].id).toBe('a-0');
    // TTL 지나도록 대기
    await new Promise(r => globalThis.setTimeout(r, 40));
    expect(cache.get('a')).toBeUndefined();
  });

  it('LRU 초과 시 가장 오래된 항목 제거', () => {
    const cache = new MediaExtractionCache({ maxEntries: 2, ttlMs: 1000 });
    cache.set('a', makeResult('a'));
    cache.set('b', makeResult('b'));
    // a,b 접근순서 유지 후 c 추가 → a 제거 예상
    cache.set('c', makeResult('c'));
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeDefined();
    expect(cache.get('c')).toBeDefined();
  });

  it('LRU 갱신: get 후 set 새 항목 추가 시 최근 접근된 항목 유지', () => {
    const cache = new MediaExtractionCache({ maxEntries: 2, ttlMs: 1000 });
    cache.set('a', makeResult('a'));
    cache.set('b', makeResult('b'));
    // a 조회로 a를 최근으로
    expect(cache.get('a')).toBeDefined();
    // c 추가 → b 제거되어야 함
    cache.set('c', makeResult('c'));
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBeDefined();
    expect(cache.get('c')).toBeDefined();
  });
});
