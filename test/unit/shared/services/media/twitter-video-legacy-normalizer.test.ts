import { describe, it, expect } from 'vitest';
import {
  normalizeTweetLegacy,
  normalizeUserLegacy,
} from '@/shared/services/media/normalizers/TwitterVideoLegacyNormalizer';

describe('TwitterVideoLegacyNormalizer', () => {
  it('legacy 필드를 현대 구조로 병합한다 (tweet)', () => {
    const tweet: any = {
      legacy: {
        extended_entities: {
          media: [
            { id_str: '1', type: 'photo', media_url_https: 'https://pbs.twimg.com/media/abc.jpg' },
          ],
        },
        full_text: 'hello world https://t.co/xyz',
        id_str: '1234567890',
      },
    };

    normalizeTweetLegacy(tweet);

    expect(tweet.extended_entities?.media?.length).toBe(1);
    expect(tweet.full_text).toBe('hello world https://t.co/xyz');
    expect(tweet.id_str).toBe('1234567890');
  });

  it('legacy 필드를 현대 구조로 병합한다 (user)', () => {
    const user: any = {
      legacy: { screen_name: 'alice' },
    };

    normalizeUserLegacy(user);

    expect(user.screen_name).toBe('alice');
  });

  it('이미 현대 필드가 존재하면 유지하고 legacy로 덮어쓰지 않는다', () => {
    const tweet: any = {
      extended_entities: {
        media: [
          { id_str: '2', type: 'photo', media_url_https: 'https://pbs.twimg.com/media/def.jpg' },
        ],
      },
      full_text: 'modern text',
      id_str: '999',
      legacy: {
        extended_entities: {
          media: [
            { id_str: '1', type: 'photo', media_url_https: 'https://pbs.twimg.com/media/abc.jpg' },
          ],
        },
        full_text: 'legacy text',
        id_str: '1234567890',
      },
    };

    normalizeTweetLegacy(tweet);

    // 기존 현대 필드 유지 확인
    expect(tweet.extended_entities.media[0].id_str).toBe('2');
    expect(tweet.full_text).toBe('modern text');
    expect(tweet.id_str).toBe('999');
  });

  it('idempotent: 여러 번 호출해도 동일 결과', () => {
    const tweet: any = {
      legacy: {
        extended_entities: {
          media: [
            { id_str: '1', type: 'photo', media_url_https: 'https://pbs.twimg.com/media/abc.jpg' },
          ],
        },
        full_text: 'text',
        id_str: '1',
      },
    };

    normalizeTweetLegacy(tweet);
    const first = JSON.stringify(tweet);
    normalizeTweetLegacy(tweet);
    const second = JSON.stringify(tweet);

    expect(second).toBe(first);
  });
});
