/**
 * FilenameService 단위 테스트
 *
 * 파일명 생성 형식 검증:
 * - 미디어: username_tweetId_YYYYMMDD_index.ext
 * - ZIP: username_tweetId_YYYYMMDD.zip
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import {
  generateMediaFilename,
  generateZipFilename,
  isValidMediaFilename,
  isValidZipFilename,
} from '../../../src/shared/services/file-naming/filename-service';
import type { MediaInfo } from '../../../src/shared/types/media.types';

describe('FilenameService - YYYYMMDD Format (v3)', () => {
  setupGlobalTestIsolation();

  let testDate: Date;

  beforeEach(() => {
    // 테스트 용 고정 날짜: 2025-01-01
    testDate = new Date('2025-01-01');
  });

  describe('generateMediaFilename', () => {
    it('미디어 파일명: username_tweetId_YYYYMMDD_index.ext 형식', () => {
      const media: MediaInfo = {
        id: 'media_media_0', // 0기반 인덱스 → 1로 변환됨
        url: 'https://example.com/image.jpg',
        type: 'image',
        tweetId: '1234567890',
        tweetUsername: 'piesp',
      };

      const filename = generateMediaFilename(media, {
        index: 1,
        date: testDate,
      });

      expect(filename).toBe('piesp_1234567890_20250101_1.jpg');
      expect(isValidMediaFilename(filename)).toBe(true);
    });

    it('index가 없을 때 기본값 1 사용', () => {
      const media: MediaInfo = {
        id: 'user123_media_0', // /_media_(\d+)$/ 패턴에 맞음 → 0 추출 → 1로 변환
        url: 'https://example.com/image.png',
        type: 'image',
        tweetId: '1234567890',
        tweetUsername: 'user123',
      };

      const filename = generateMediaFilename(media, { date: testDate });

      expect(filename).toBe('user123_1234567890_20250101_1.png');
      expect(isValidMediaFilename(filename)).toBe(true);
    });

    it('다양한 index 값 처리', () => {
      const filenames = [1, 2, 10, 99].map(idx => {
        // 각 index에 해당하는 media.id 생성 (_media_ 패턴: 0기반 → 1기반 변환)
        const media: MediaInfo = {
          id: `tweet_${Math.random()}_media_${idx - 1}`, // 0기반 인덱스 (idx - 1) → idx로 변환
          url: 'https://example.com/image.jpg',
          type: 'image',
          tweetId: '1234567890',
          tweetUsername: 'test',
        };
        return generateMediaFilename(media, { date: testDate });
      });

      expect(filenames).toEqual([
        'test_1234567890_20250101_1.jpg',
        'test_1234567890_20250101_2.jpg',
        'test_1234567890_20250101_10.jpg',
        'test_1234567890_20250101_99.jpg',
      ]);

      filenames.forEach(filename => {
        expect(isValidMediaFilename(filename)).toBe(true);
      });
    });

    it('다양한 확장자 추출', () => {
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
          date: testDate,
        });

        expect(filename).toMatch(new RegExp(`\\.${ext}$`));
        expect(isValidMediaFilename(filename)).toBe(true);
      });
    });

    it('폴백 사용자명 사용', () => {
      const media: MediaInfo = {
        id: 'media_media_0',
        url: 'https://example.com/image.jpg',
        type: 'image',
        tweetId: '1234567890',
      };

      const filename = generateMediaFilename(media, {
        index: 1,
        fallbackUsername: 'fallback_user',
        date: testDate,
      });

      expect(filename).toBe('fallback_user_1234567890_20250101_1.jpg');
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
        date: testDate,
      });

      expect(filename).toContain('extracted_user_1234567890_20250101_1');
      expect(isValidMediaFilename(filename)).toBe(true);
    });

    it('기존 유효한 파일명 유지', () => {
      const existingFilename = 'existing_1234567890_20250101_1.jpg';
      const media: MediaInfo = {
        id: 'media_0',
        url: 'https://example.com/image.jpg',
        type: 'image',
        filename: existingFilename,
      };

      const result = generateMediaFilename(media, { date: testDate });

      expect(result).toBe(existingFilename);
    });
  });

  describe('generateZipFilename', () => {
    it('ZIP 파일명: username_tweetId_YYYYMMDD.zip 형식', () => {
      const media: MediaInfo = {
        id: 'media_0',
        url: 'https://example.com/image.jpg',
        type: 'image',
        tweetId: '1234567890',
        tweetUsername: 'piesp',
      };

      const filename = generateZipFilename([media], { fallbackPrefix: 'xcom' });

      expect(filename).toMatch(/^piesp_1234567890_\d{8}\.zip$/);
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

      expect(filename).toMatch(/^user1_1234567890_\d{8}\.zip$/);
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
        'user_1234567890_20250101_1.jpg',
        'piesp_9876543210_20250101_99.png',
        'test_user_1234567890_20250101_5.mp4',
      ];

      validFilenames.forEach(filename => {
        expect(isValidMediaFilename(filename)).toBe(true);
      });
    });

    it('유효하지 않은 미디어 파일명 거부', () => {
      const invalidFilenames = [
        'user_1234567890_1.jpg', // YYYYMMDD 없음
        'user_1234567890_202501_1.jpg', // 잘못된 날짜 형식
        'user_20250101_1.jpg', // tweetId 없음
        '_1234567890_20250101_1.jpg', // username 없음
        'user_1234567890_20250101.jpg', // index 없음
      ];

      invalidFilenames.forEach(filename => {
        expect(isValidMediaFilename(filename)).toBe(false);
      });
    });
  });

  describe('isValidZipFilename', () => {
    it('유효한 ZIP 파일명 검증', () => {
      const validFilenames = [
        'user_1234567890_20250101.zip',
        'piesp_9876543210_20250101.zip',
        'test_user_1234567890_20250101.zip',
      ];

      validFilenames.forEach(filename => {
        expect(isValidZipFilename(filename)).toBe(true);
      });
    });

    it('유효하지 않은 ZIP 파일명 거부', () => {
      const invalidFilenames = [
        'user_1234567890.zip', // YYYYMMDD 없음
        'user_1234567890_202501.zip', // 잘못된 날짜 형식
        'user_20250101.zip', // tweetId 없음
        '_1234567890_20250101.zip', // username 없음
        'user_1234567890_20250101.tar.gz', // .zip 아님
      ];

      invalidFilenames.forEach(filename => {
        expect(isValidZipFilename(filename)).toBe(false);
      });
    });
  });

  describe('포맷 일관성', () => {
    it('미디어 파일과 ZIP 파일이 같은 날짜 정보 공유', () => {
      const testDate = new Date('2025-06-15');
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
        date: testDate,
      });
      const mediaFilename2 = generateMediaFilename(medias[1], {
        index: 2,
        date: testDate,
      });
      const zipFilename = generateZipFilename(medias);

      expect(mediaFilename1).toContain('20250615');
      expect(mediaFilename2).toContain('20250615');

      // ZIP 파일명도 같은 날짜 사용 (동일 시간)
      expect(zipFilename).toMatch(/user_1234567890_\d{8}\.zip/);
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
        date: testDate,
      });

      // 특수 문자가 제거되고 올바른 형식
      expect(isValidMediaFilename(filename)).toBe(true);
      expect(filename).toContain('1234567890_20250101_1');
    });
  });

  describe('에지 케이스', () => {
    it('날짜 옵션이 없으면 현재 시간 사용', () => {
      const media: MediaInfo = {
        id: 'tweet_123_media_0', // _media_ 패턴: 0기반 → 1로 변환
        url: 'https://example.com/image.jpg',
        type: 'image',
        tweetId: '1234567890',
        tweetUsername: 'user',
      };

      const filename = generateMediaFilename(media);

      // YYYYMMDD 형식으로 8자리 숫자 포함, index는 1
      expect(filename).toMatch(/user_1234567890_\d{8}_1\.jpg/);
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
        date: testDate,
      });

      // 폴백이지만 유효한 형식이어야 함
      expect(filename).toContain('fallback');
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
        date: testDate,
      });

      // 인용된 원본 작성자의 정보가 파일명에 사용되어야 함
      expect(filename).toBe('original_author_1111111111_20250101_1.jpg');
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
        date: testDate,
      });

      // 인용 트윗 작성자의 정보가 파일명에 사용되어야 함
      expect(filename).toBe('quoting_user_9999999999_20250101_1.jpg');
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
        date: testDate,
      });

      expect(filename).toBe('regular_user_1234567890_20250101_1.jpg');
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
        date: testDate,
      });

      // 인용 트윗 작성자 정보로 폴백
      expect(filename).toBe('quoting_user_9999999999_20250101_1.jpg');
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
          date: testDate,
        })
      );

      expect(filenames).toEqual([
        'original_author_1111111111_20250101_1.jpg',
        'original_author_1111111111_20250101_2.jpg',
        'original_author_1111111111_20250101_3.jpg',
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

      // ZIP은 첫 번째 미디어의 tweetUsername/tweetId를 사용 (인용 트윗 작성자)
      // Note: ZIP 파일명은 sourceLocation을 고려하지 않음 (컬렉션 레벨)
      expect(zipFilename).toMatch(/^quoting_user_9999999999_\d{8}\.zip$/);
      expect(isValidZipFilename(zipFilename)).toBe(true);
    });
  });
});
