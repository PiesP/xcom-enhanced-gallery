/**
 * FilenameService 단위 테스트
 *
 * 파일명 생성 형식 검증:
 * - 미디어: username_tweetId_index.ext
 * - ZIP: username_tweetId.zip
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import {
  generateMediaFilename,
  generateZipFilename,
  isValidMediaFilename,
  isValidZipFilename,
} from '../../../src/shared/services/file-naming/filename-service';
import type { MediaInfo } from '../../../src/shared/types/media.types';

describe('FilenameService - Username/TweetId Format', () => {
  setupGlobalTestIsolation();

  describe('generateMediaFilename', () => {
    it('미디어 파일명: username_tweetId_index.ext 형식', () => {
      const media: MediaInfo = {
        id: 'media_media_0', // 0기반 인덱스 → 1로 변환됨
        url: 'https://example.com/image.jpg',
        type: 'image',
        tweetId: '1234567890',
        tweetUsername: 'piesp',
      };

      const filename = generateMediaFilename(media, {
        index: 1,
      });

      expect(filename).toBe('piesp_1234567890_1.jpg');
      expect(isValidMediaFilename(filename)).toBe(true);
    });

    it('media.id에서 index 추출하여 기본값 결정', () => {
      const media: MediaInfo = {
        id: 'user123_media_0', // /_media_(\d+)$/ 패턴에 맞음 → 0 추출 → 1로 변환
        url: 'https://example.com/image.png',
        type: 'image',
        tweetId: '1234567890',
        tweetUsername: 'user123',
      };

      const filename = generateMediaFilename(media);

      expect(filename).toBe('user123_1234567890_1.png');
      expect(isValidMediaFilename(filename)).toBe(true);
    });

    it('다양한 index 값을 지원', () => {
      const filenames = [1, 2, 10, 99].map(idx => {
        const media: MediaInfo = {
          id: `tweet_${idx}_media_${idx - 1}`,
          url: `https://example.com/image-${idx}.jpg`,
          type: 'image',
          tweetId: '1234567890',
          tweetUsername: 'test',
        };
        return generateMediaFilename(media);
      });

      expect(filenames).toEqual([
        'test_1234567890_1.jpg',
        'test_1234567890_2.jpg',
        'test_1234567890_10.jpg',
        'test_1234567890_99.jpg',
      ]);

      filenames.forEach(filename => {
        expect(isValidMediaFilename(filename)).toBe(true);
      });
    });

    it('확장자 override 지원', () => {
      const extensions = ['jpg', 'png', 'gif', 'mp4'];
      const media: MediaInfo = {
        id: 'media_0',
        url: 'https://example.com/file.jpg',
        type: 'image',
        tweetId: '1234567890',
        tweetUsername: 'user',
      };

      extensions.forEach(ext => {
        const filename = generateMediaFilename(media, {
          index: 1,
          extension: ext,
        });

        expect(filename).toBe(`user_1234567890_0.${ext}`);
        expect(isValidMediaFilename(filename)).toBe(true);
      });
    });

    it('fallback 사용자명 사용', () => {
      const media: MediaInfo = {
        id: 'media_media_0',
        url: 'https://example.com/image.jpg',
        type: 'image',
        tweetId: '1234567890',
      };

      const filename = generateMediaFilename(media, {
        index: 1,
        fallbackUsername: 'fallback_user',
      });

      expect(filename).toBe('fallback_user_1234567890_1.jpg');
      expect(isValidMediaFilename(filename)).toBe(true);
    });

    it('URL에서 사용자명 추출', () => {
      const media: MediaInfo = {
        id: 'media_media_0',
        url: 'https://x.com/extracted_user/status/1234567890/photo/1',
        originalUrl: 'https://x.com/extracted_user/status/1234567890/photo/1',
        type: 'image',
        tweetId: '1234567890',
      };

      const filename = generateMediaFilename(media, {
        index: 1,
      });

      expect(filename).toBe('extracted_user_1234567890_1.jpg');
      expect(isValidMediaFilename(filename)).toBe(true);
    });

    it('기존 유효한 파일명 유지', () => {
      const existingFilename = 'existing_1234567890_1.jpg';
      const media: MediaInfo = {
        id: 'media_0',
        url: 'https://example.com/image.jpg',
        type: 'image',
        filename: existingFilename,
      };

      const result = generateMediaFilename(media);

      expect(result).toBe(existingFilename);
    });
  });

  describe('generateZipFilename', () => {
    it('ZIP 파일명: username_tweetId.zip 형식', () => {
      const media: MediaInfo = {
        id: 'media_0',
        url: 'https://example.com/image.jpg',
        type: 'image',
        tweetId: '1234567890',
        tweetUsername: 'piesp',
      };

      const filename = generateZipFilename([media], { fallbackPrefix: 'xcom' });

      expect(filename).toBe('piesp_1234567890.zip');
      expect(isValidZipFilename(filename)).toBe(true);
    });

    it('복수 미디어 아이템에서 첫 번째 정보 사용', () => {
      const medias: MediaInfo[] = [
        {
          id: 'media_0',
          url: 'https://example.com/image1.jpg',
          type: 'image',
          tweetId: '1234567890',
          tweetUsername: 'user1',
        },
        {
          id: 'media_1',
          url: 'https://example.com/image2.jpg',
          type: 'image',
          tweetId: '9876543210',
          tweetUsername: 'user2',
        },
      ];

      const filename = generateZipFilename(medias);

      expect(filename).toBe('user1_1234567890.zip');
      expect(isValidZipFilename(filename)).toBe(true);
    });

    it('인용 트윗 미디어는 quoted 정보 사용', () => {
      const media: MediaInfo = {
        id: 'media_0',
        url: 'https://example.com/image.jpg',
        type: 'image',
        tweetId: '9999999999',
        tweetUsername: 'retweeter',
        sourceLocation: 'quoted',
        quotedTweetId: '1234567890',
        quotedUsername: 'original_author',
      };

      const filename = generateZipFilename([media]);

      expect(filename).toBe('original_author_1234567890.zip');
      expect(isValidZipFilename(filename)).toBe(true);
    });

    it('미디어 정보 없을 때 폴백 형식 사용', () => {
      const medias: MediaInfo[] = [
        {
          id: 'media_0',
          url: 'https://example.com/image.jpg',
          type: 'image',
        },
      ];

      const filename = generateZipFilename(medias, { fallbackPrefix: 'backup' });

      expect(filename).toMatch(/^backup_\d+\.zip$/);
    });
  });

  describe('isValidMediaFilename', () => {
    it('유효한 미디어 파일명 검증', () => {
      const validFilenames = [
        'user_1234567890_1.jpg',
        'piesp_9876543210_99.png',
        'test_user_1234567890_5.mp4',
      ];

      validFilenames.forEach(filename => {
        expect(isValidMediaFilename(filename)).toBe(true);
      });
    });

    it('유효하지 않은 미디어 파일명 거부', () => {
      const invalidFilenames = [
        'user_1234567890.jpg', // index 없음
        'user_12345_1.jpg', // tweetId 길이 짧음
        '_1234567890_1.jpg', // username 없음
        'user_1234567890_index.jpg', // 숫자가 아닌 index
        'user-1234567890_1.jpg', // 허용되지 않는 문자
      ];

      invalidFilenames.forEach(filename => {
        expect(isValidMediaFilename(filename)).toBe(false);
      });
    });
  });

  describe('isValidZipFilename', () => {
    it('유효한 ZIP 파일명 검증', () => {
      const validFilenames = [
        'user_1234567890.zip',
        'piesp_9876543210.zip',
        'test_user_1234567890.zip',
      ];

      validFilenames.forEach(filename => {
        expect(isValidZipFilename(filename)).toBe(true);
      });
    });

    it('유효하지 않은 ZIP 파일명 거부', () => {
      const invalidFilenames = [
        'user_1234567890_1.zip', // index가 포함됨
        'user_1234567890_2025.zip', // 불필요한 suffix
        'user_123.zip', // tweetId 길이 짧음
        '_1234567890.zip', // username 없음
        'user_1234567890.tar.gz', // .zip 아님
      ];

      invalidFilenames.forEach(filename => {
        expect(isValidZipFilename(filename)).toBe(false);
      });
    });
  });

  describe('포맷 일관성', () => {
    it('미디어 파일과 ZIP 파일이 동일한 prefix 공유', () => {
      const medias: MediaInfo[] = [
        {
          id: 'media_0',
          url: 'https://example.com/image1.jpg',
          type: 'image',
          tweetId: '1234567890',
          tweetUsername: 'user',
        },
        {
          id: 'media_1',
          url: 'https://example.com/image2.jpg',
          type: 'image',
          tweetId: '1234567890',
          tweetUsername: 'user',
        },
      ];

      const mediaFilename1 = generateMediaFilename(medias[0], {
        index: 1,
      });
      const mediaFilename2 = generateMediaFilename(medias[1], {
        index: 2,
      });
      const zipFilename = generateZipFilename(medias);

      expect(mediaFilename1).toBe('user_1234567890_0.jpg');
      expect(mediaFilename2).toBe('user_1234567890_1.jpg');
      expect(zipFilename).toBe('user_1234567890.zip');
    });

    it('특수 문자 정규화 테스트', () => {
      const media: MediaInfo = {
        id: 'media_media_0',
        url: 'https://example.com/image.jpg',
        type: 'image',
        tweetId: '1234567890',
        tweetUsername: 'user<test>', // 특수 문자
      };

      const filename = generateMediaFilename(media, {
        index: 1,
      });

      // 특수 문자가 제거되고 올바른 형식
      expect(isValidMediaFilename(filename)).toBe(true);
      expect(filename).toContain('1234567890_1');
    });
  });

  describe('에지 케이스', () => {
    it('옵션 없이도 index 기본값 1 유지', () => {
      const media: MediaInfo = {
        id: 'tweet_123_media_0', // _media_ 패턴: 0기반 → 1로 변환
        url: 'https://example.com/image.jpg',
        type: 'image',
        tweetId: '1234567890',
        tweetUsername: 'user',
      };

      const filename = generateMediaFilename(media);

      expect(filename).toBe('user_1234567890_1.jpg');
      expect(isValidMediaFilename(filename)).toBe(true);
    });

    it('빈 미디어 배열 처리', () => {
      const filename = generateZipFilename([]);

      expect(filename).toMatch(/^xcom_gallery_\d+\.zip$/);
    });

    it('미디어 정보 없을 때 폴백', () => {
      const media: MediaInfo = {
        id: 'media_0',
        url: 'https://example.com/image.jpg',
        type: 'image',
      };

      const filename = generateMediaFilename(media, {
        index: 1,
        fallbackPrefix: 'fallback',
      });

      // 폴백이지만 유효한 형식이어야 함
      expect(filename).toMatch(/^fallback_\d+_0\.jpg$/);
    });
  });

  // Phase 375: 인용 트윗 대응 테스트
  describe('인용 트윗 파일명 생성 (Phase 375)', () => {
    it('sourceLocation이 "quoted"이면 인용된 원본 트윗 정보 사용', () => {
      const media: MediaInfo = {
        id: 'media_media_0',
        url: 'https://example.com/image.jpg',
        type: 'image',
        tweetId: '9999999999', // 인용 트윗 작성자 ID
        tweetUsername: 'quoting_user', // 인용 트윗 작성자
        sourceLocation: 'quoted',
        quotedTweetId: '1111111111', // 인용된 원본 트윗 ID
        quotedUsername: 'original_author', // 인용된 원본 작성자
      };

      const filename = generateMediaFilename(media, {
        index: 1,
      });

      // 인용된 원본 작성자의 정보가 파일명에 사용되어야 함
      expect(filename).toBe('original_author_1111111111_1.jpg');
      expect(isValidMediaFilename(filename)).toBe(true);
    });

    it('sourceLocation이 "original"이면 인용 트윗 작성자 정보 사용', () => {
      const media: MediaInfo = {
        id: 'media_media_0',
        url: 'https://example.com/image.jpg',
        type: 'image',
        tweetId: '9999999999', // 인용 트윗 작성자 ID
        tweetUsername: 'quoting_user', // 인용 트윗 작성자
        sourceLocation: 'original',
        quotedTweetId: '1111111111',
        quotedUsername: 'original_author',
      };

      const filename = generateMediaFilename(media, {
        index: 1,
      });

      // 인용 트윗 작성자의 정보가 파일명에 사용되어야 함
      expect(filename).toBe('quoting_user_9999999999_1.jpg');
      expect(isValidMediaFilename(filename)).toBe(true);
    });

    it('sourceLocation이 없으면 기존 로직 사용 (후방 호환성)', () => {
      const media: MediaInfo = {
        id: 'media_media_0',
        url: 'https://example.com/image.jpg',
        type: 'image',
        tweetId: '1234567890',
        tweetUsername: 'regular_user',
      };

      const filename = generateMediaFilename(media, {
        index: 1,
      });

      expect(filename).toBe('regular_user_1234567890_1.jpg');
      expect(isValidMediaFilename(filename)).toBe(true);
    });

    it('sourceLocation이 "quoted"지만 quotedUsername이 없으면 폴백', () => {
      const media: MediaInfo = {
        id: 'media_media_0',
        url: 'https://example.com/image.jpg',
        type: 'image',
        tweetId: '9999999999',
        tweetUsername: 'quoting_user',
        sourceLocation: 'quoted',
        // quotedUsername과 quotedTweetId가 없음
      };

      const filename = generateMediaFilename(media, {
        index: 1,
      });

      // 인용 트윗 작성자 정보로 폴백
      expect(filename).toBe('quoting_user_9999999999_1.jpg');
      expect(isValidMediaFilename(filename)).toBe(true);
    });

    it('다중 인용 트윗 미디어의 인덱스 처리', () => {
      const medias = [0, 1, 2].map(idx => ({
        id: `quoted_media_${idx}`,
        url: 'https://example.com/image.jpg',
        type: 'image' as const,
        tweetId: '9999999999',
        tweetUsername: 'quoting_user',
        sourceLocation: 'quoted' as const,
        quotedTweetId: '1111111111',
        quotedUsername: 'original_author',
      }));

      const filenames = medias.map((media, idx) =>
        generateMediaFilename(media, {
          index: idx + 1,
        })
      );

      expect(filenames).toEqual([
        'original_author_1111111111_1.jpg',
        'original_author_1111111111_2.jpg',
        'original_author_1111111111_3.jpg',
      ]);

      filenames.forEach(filename => {
        expect(isValidMediaFilename(filename)).toBe(true);
      });
    });

    it('인용 트윗 ZIP 파일명 생성', () => {
      const media: MediaInfo = {
        id: 'media_0',
        url: 'https://example.com/image.jpg',
        type: 'image',
        tweetId: '9999999999',
        tweetUsername: 'quoting_user',
        sourceLocation: 'quoted',
        quotedTweetId: '1111111111',
        quotedUsername: 'original_author',
      };

      const zipFilename = generateZipFilename([media]);

      // ZIP은 인용된 원본 작성자 정보 사용
      expect(zipFilename).toBe('original_author_1111111111.zip');
      expect(isValidZipFilename(zipFilename)).toBe(true);
    });
  });
});
