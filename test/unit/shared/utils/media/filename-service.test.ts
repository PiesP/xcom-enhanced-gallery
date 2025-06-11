/**
 * Media Filename Service 유닛 테스트
 *
 * @description 미디어 파일명 생성 및 검증 기능을 테스트합니다.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  FilenameOptions,
  ZipFilenameOptions,
} from '../../../../../src/shared/utils/media/filename-service';
import {
  generateMediaFilename,
  generateZipFilename,
  isValidMediaFilename,
  isValidZipFilename,
  MediaFilenameService,
} from '../../../../../src/shared/utils/media/filename-service';

describe('Media Filename Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Date.now() 모킹으로 일관된 테스트
    vi.spyOn(Date, 'now').mockReturnValue(1640995200000); // 2022-01-01 00:00:00 GMT
  });

  describe('generateMediaFilename', () => {
    it('기본 이미지 파일명을 생성해야 함', () => {
      const url = 'https://pbs.twimg.com/media/test.jpg';
      const filename = generateMediaFilename(url);

      // 수정된 형식: media_타임스탬프_인덱스 (유저ID와 트윗ID가 없을 때)
      expect(filename).toMatch(/^media_\d+_1\.jpg$/);
    });

    it('확장자가 없는 URL에 대해 기본 확장자를 추가해야 함', () => {
      const url = 'https://pbs.twimg.com/media/test';
      const filename = generateMediaFilename(url, { defaultExtension: 'jpg' });

      expect(filename).toMatch(/\.jpg$/);
    });

    it('트윗 정보가 포함된 파일명을 생성해야 함', () => {
      const url = 'https://pbs.twimg.com/media/test.jpg';
      const options: FilenameOptions = {
        tweetId: '123456789',
        username: 'testuser',
        includeTimestamp: true,
      };

      const filename = generateMediaFilename(url, options);

      expect(filename).toContain('testuser');
      expect(filename).toContain('123456789');
    });

    it('타임스탬프가 포함된 파일명을 생성해야 함', () => {
      const url = 'https://pbs.twimg.com/media/test.jpg';
      const filename = generateMediaFilename(url, { includeTimestamp: true });

      expect(filename).toMatch(/\d{4}-\d{2}-\d{2}/); // YYYY-MM-DD 형식
    });

    it('인덱스가 포함된 파일명을 생성해야 함', () => {
      const url = 'https://pbs.twimg.com/media/test.jpg';
      const filename = generateMediaFilename(url, { index: 5 });

      expect(filename).toContain('5');
    });

    it('특수문자를 안전한 문자로 치환해야 함', () => {
      const url = 'https://pbs.twimg.com/media/test file.jpg';
      const filename = generateMediaFilename(url);

      expect(filename).not.toContain(' ');
      expect(filename).toMatch(/media_\d+_1\.jpg/);
    });

    it('커스텀 접두사와 접미사를 적용해야 함', () => {
      const url = 'https://pbs.twimg.com/media/test.jpg';
      const options: FilenameOptions = {
        prefix: 'gallery',
        suffix: 'enhanced',
      };

      const filename = generateMediaFilename(url, options);

      expect(filename).toMatch(/^gallery.*enhanced.*\.jpg$/);
    });

    it('최대 길이 제한을 적용해야 함', () => {
      const url = 'https://pbs.twimg.com/media/' + 'a'.repeat(200) + '.jpg';
      const filename = generateMediaFilename(url, { maxLength: 50 });

      expect(filename.length).toBeLessThanOrEqual(50);
      expect(filename).toMatch(/\.jpg$/); // 확장자는 유지
    });
  });

  describe('generateZipFilename', () => {
    it('기본 ZIP 파일명을 생성해야 함', () => {
      const filename = generateZipFilename();

      expect(filename).toMatch(/^twitter-gallery-\d{4}-\d{2}-\d{2}\.zip$/);
    });

    it('트윗 정보가 포함된 ZIP 파일명을 생성해야 함', () => {
      const options: ZipFilenameOptions = {
        tweetId: '123456789',
        username: 'testuser',
      };

      const filename = generateZipFilename(options);

      expect(filename).toContain('testuser');
      expect(filename).toContain('123456789');
      expect(filename).toMatch(/\.zip$/);
    });

    it('미디어 개수가 포함된 ZIP 파일명을 생성해야 함', () => {
      const options: ZipFilenameOptions = {
        mediaCount: 15,
      };

      const filename = generateZipFilename(options);

      expect(filename).toContain('15');
    });

    it('커스텀 접두사를 적용해야 함', () => {
      const options: ZipFilenameOptions = {
        prefix: 'custom-gallery',
      };

      const filename = generateZipFilename(options);

      expect(filename).toMatch(/^custom-gallery/);
    });
  });

  describe('isValidMediaFilename', () => {
    it('유효한 미디어 파일명을 확인해야 함', () => {
      const validFilenames = [
        'test.jpg',
        'image_001.png',
        'video-2022-01-01.mp4',
        'gallery_testuser_123456789_1.webp',
      ];

      validFilenames.forEach(filename => {
        expect(isValidMediaFilename(filename)).toBe(true);
      });
    });

    it('무효한 미디어 파일명을 거부해야 함', () => {
      const invalidFilenames = [
        '',
        '.jpg',
        'test',
        'test.txt',
        'file with spaces.jpg',
        'file<>with|invalid*chars.png',
      ];

      invalidFilenames.forEach(filename => {
        expect(isValidMediaFilename(filename)).toBe(false);
      });
    });

    it('파일명 길이 제한을 확인해야 함', () => {
      const longFilename = 'a'.repeat(300) + '.jpg';
      expect(isValidMediaFilename(longFilename)).toBe(false);
    });
  });

  describe('isValidZipFilename', () => {
    it('유효한 ZIP 파일명을 확인해야 함', () => {
      const validFilenames = [
        'gallery.zip',
        'twitter-gallery-2022-01-01.zip',
        'testuser_media_15items.zip',
      ];

      validFilenames.forEach(filename => {
        expect(isValidZipFilename(filename)).toBe(true);
      });
    });

    it('무효한 ZIP 파일명을 거부해야 함', () => {
      const invalidFilenames = ['', '.zip', 'file', 'file.txt', 'file with spaces.zip'];

      invalidFilenames.forEach(filename => {
        expect(isValidZipFilename(filename)).toBe(false);
      });
    });
  });

  describe('MediaFilenameService', () => {
    let service: MediaFilenameService;

    beforeEach(() => {
      service = new MediaFilenameService();
    });

    it('서비스 인스턴스를 생성할 수 있어야 함', () => {
      expect(service).toBeInstanceOf(MediaFilenameService);
    });

    it('일관된 파일명을 생성해야 함', () => {
      const url = 'https://pbs.twimg.com/media/test.jpg';
      const options: FilenameOptions = {
        tweetId: '123456789',
        username: 'testuser',
      };

      const filename1 = service.generateFilename(url, options);
      const filename2 = service.generateFilename(url, options);

      expect(filename1).toBe(filename2);
    });

    it('충돌 방지 기능이 동작해야 함', () => {
      const url = 'https://pbs.twimg.com/media/test.jpg';

      const filename1 = service.generateUniqueFilename(url);
      const filename2 = service.generateUniqueFilename(url);

      expect(filename1).not.toBe(filename2);
    });

    it('파일명 히스토리를 추적해야 함', () => {
      const url = 'https://pbs.twimg.com/media/test.jpg';

      service.generateFilename(url);
      const history = service.getGeneratedFilenames();

      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toMatch(/media_\d+_1\.jpg/);
    });

    it('캐시된 파일명을 반환해야 함', () => {
      const url = 'https://pbs.twimg.com/media/test.jpg';
      const options: FilenameOptions = { tweetId: '123456789' };

      const filename1 = service.generateFilename(url, options);
      const filename2 = service.getCachedFilename(url, options);

      expect(filename1).toBe(filename2);
    });
  });

  describe('Edge Cases', () => {
    it('매우 긴 URL을 처리해야 함', () => {
      const longUrl = 'https://pbs.twimg.com/media/' + 'a'.repeat(1000) + '.jpg';

      expect(() => generateMediaFilename(longUrl)).not.toThrow();

      const filename = generateMediaFilename(longUrl, { maxLength: 100 });
      expect(filename.length).toBeLessThanOrEqual(100);
    });

    it('특수 문자가 많은 URL을 안전하게 처리해야 함', () => {
      const specialUrl = 'https://pbs.twimg.com/media/파일명-with-특수문자!@#$%^&*().jpg';

      const filename = generateMediaFilename(specialUrl, { sanitize: true });

      expect(filename).toMatch(/^[a-zA-Z0-9._-]+\.jpg$/);
    });

    it('빈 옵션 객체를 처리해야 함', () => {
      const url = 'https://pbs.twimg.com/media/test.jpg';

      expect(() => generateMediaFilename(url, {})).not.toThrow();
    });

    it('null 또는 undefined URL을 안전하게 처리해야 함', () => {
      expect(() => generateMediaFilename(null as any)).not.toThrow();
      expect(() => generateMediaFilename(undefined as any)).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('대량의 파일명 생성을 효율적으로 처리해야 함', () => {
      const baseUrl = 'https://pbs.twimg.com/media/test';
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        generateMediaFilename(`${baseUrl}${i}.jpg`, { index: i });
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // 1초 이내
    });
  });

  describe('Internationalization', () => {
    it('다양한 언어의 사용자명을 처리해야 함', () => {
      const usernames = ['testuser', '사용자', 'ユーザー', 'пользователь'];
      const url = 'https://pbs.twimg.com/media/test.jpg';

      usernames.forEach(username => {
        const filename = generateMediaFilename(url, {
          username,
          sanitize: true,
        });

        expect(filename).toBeDefined();
        expect(filename.length).toBeGreaterThan(0);
      });
    });
  });
});
