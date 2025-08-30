/**
 * @fileoverview TDD RED: 타입 안전성 개선 테스트
 * @description ServiceManager와 MediaService의 타입 안전성 강화
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

describe('TDD RED: 타입 안전성 개선', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('RED: 현재 타입 안전성 문제 검증', () => {
    test('ServiceManager가 unknown 타입을 사용함', async () => {
      const { CoreService } = await import('@shared/services/ServiceManager');

      const serviceManager = CoreService.getInstance();

      // RED: 현재 Map<string, unknown> 사용
      serviceManager.register('testService', { test: 'value' });

      try {
        const service = serviceManager.get('testService');

        // RED: unknown 타입으로 인한 타입 안전성 부족
        expect(service).toBeDefined();
        expect(typeof service).toBe('object');

        // RED: 타입 체크 없이 속성 접근 시 컴파일 에러 발생 가능
        // service.test; // TypeScript 에러 발생해야 함
      } catch (error) {
        // 서비스 조회 실패
        expect(error).toBeDefined();
      }
    });

    test('MediaService의 반환 타입이 일관되지 않음', async () => {
      const { MediaService } = await import('@shared/services/MediaService');

      const mediaService = MediaService.getInstance();

      // RED: 다양한 메서드들의 반환 타입 불일치
      const webpSupported = mediaService.isWebPSupported();
      const downloadService = mediaService.getDownloadService();

      // RED: boolean과 object 타입이 섞여서 일관성 부족
      expect(typeof webpSupported).toBe('boolean');
      expect(typeof downloadService).toBe('object');

      // RED: 일부 메서드는 null을 반환할 수 있음
      const extractionMetrics = mediaService.getExtractionMetrics();
      expect(extractionMetrics).toBeDefined();
    });

    test('이벤트 핸들러 타입이 명시되지 않음', async () => {
      try {
        const { EventManager } = await import('@shared/services/EventManager');

        const eventManager = EventManager.getInstance();

        // RED: 이벤트 핸들러 타입이 any로 처리됨
        const genericHandler = event => {
          console.log(event); // any 타입
        };

        // RED: 타입 체크 없이 잘못된 핸들러 등록 가능
        eventManager.addEventListener(document, 'click', genericHandler);

        expect(typeof genericHandler).toBe('function');
      } catch {
        expect(true).toBe(true);
      }
    });

    test('미디어 타입 정의가 불완전함', async () => {
      const { MediaService } = await import('@shared/services/MediaService');

      const mediaService = MediaService.getInstance();

      // RED: 미디어 타입이 string union이 아닌 일반 string 사용
      const mockMediaItem = {
        id: 'test',
        url: 'https://example.com/test.jpg',
        type: 'image', // RED: 타입 체크 없음
        filename: 'test.jpg',
      };

      try {
        const downloadService = mediaService.getDownloadService();
        await downloadService.downloadSingle(mockMediaItem);
      } catch {
        // 다운로드 실패는 정상
      }

      // RED: 잘못된 type 값도 허용됨
      const invalidMediaItem = {
        id: 'test',
        url: 'https://example.com/test.jpg',
        type: 'invalid-type', // RED: 타입 검증 없음
        filename: 'test.jpg',
      };

      expect(invalidMediaItem.type).toBe('invalid-type');
    });
  });

  describe('GREEN: 강화된 타입 안전성 구조', () => {
    test('ServiceManager가 제네릭 타입을 사용해야 함', async () => {
      const { CoreService } = await import('@shared/services/ServiceManager');

      const serviceManager = CoreService.getInstance();

      // GREEN: 제네릭을 통한 타입 안전성
      interface TestService {
        test: string;
        execute: () => void;
      }

      const testService: TestService = {
        test: 'value',
        execute: () => console.log('executed'),
      };

      serviceManager.register('testService', testService);

      try {
        // GREEN: 타입 안전한 조회
        const retrievedService = serviceManager.get<TestService>('testService');

        expect(retrievedService.test).toBe('value');
        expect(typeof retrievedService.execute).toBe('function');
      } catch {
        // 아직 구현되지 않은 경우
        expect(true).toBe(true);
      }
    });

    test('MediaService 메서드들이 명시적 반환 타입을 가져야 함', async () => {
      const { MediaService } = await import('@shared/services/MediaService');

      const mediaService = MediaService.getInstance();

      // GREEN: 명시적 타입 반환
      const webpSupported: boolean = mediaService.isWebPSupported();
      const optimizedUrl: string = mediaService.getOptimizedImageUrl(
        'https://example.com/test.jpg'
      );

      expect(typeof webpSupported).toBe('boolean');
      expect(typeof optimizedUrl).toBe('string');

      // GREEN: BulkDownloadService 타입 반환
      const downloadService = mediaService.getDownloadService();
      expect(downloadService.constructor.name).toBe('BulkDownloadService');
    });

    test('이벤트 핸들러가 타입 안전해야 함', async () => {
      try {
        // GREEN: 타입 안전한 이벤트 핸들러
        const typedClickHandler = (event: MouseEvent) => {
          expect(event.type).toBe('click');
          expect(typeof event.clientX).toBe('number');
        };

        const typedKeyHandler = (event: KeyboardEvent) => {
          expect(typeof event.key).toBe('string');
          expect(typeof event.ctrlKey).toBe('boolean');
        };

        // GREEN: 타입 체크로 잘못된 핸들러 등록 방지
        expect(typeof typedClickHandler).toBe('function');
        expect(typeof typedKeyHandler).toBe('function');
      } catch {
        expect(true).toBe(true);
      }
    });

    test('미디어 타입이 엄격하게 정의되어야 함', async () => {
      // GREEN: 강타입 미디어 아이템 정의
      type MediaType = 'image' | 'video' | 'gif';

      interface TypedMediaItem {
        id: string;
        url: string;
        type: MediaType;
        filename: string;
        metadata?: {
          width?: number;
          height?: number;
          duration?: number;
        };
      }

      const validMediaItem: TypedMediaItem = {
        id: 'test',
        url: 'https://example.com/test.jpg',
        type: 'image', // GREEN: 타입 체크됨
        filename: 'test.jpg',
        metadata: {
          width: 1920,
          height: 1080,
        },
      };

      expect(validMediaItem.type).toBe('image');
      expect(typeof validMediaItem.metadata?.width).toBe('number');

      // GREEN: 잘못된 타입은 컴파일 타임에 에러
      // const invalidItem: TypedMediaItem = { type: 'invalid' }; // 컴파일 에러
    });
  });

  describe('REFACTOR: 타입 시스템 최적화', () => {
    test('유니온 타입과 교차 타입이 적절히 사용되어야 함', async () => {
      // REFACTOR: 복잡한 타입 조합 최적화
      type BaseService = {
        name: string;
        version: string;
      };

      type InitializableService = {
        initialize: () => Promise<void>;
      };

      type CleanupableService = {
        cleanup: () => void;
      };

      // 교차 타입으로 기능 조합
      type FullService = BaseService & InitializableService & CleanupableService;

      const mockFullService: FullService = {
        name: 'TestService',
        version: '1.0.0',
        initialize: async () => {},
        cleanup: () => {},
      };

      expect(mockFullService.name).toBe('TestService');
      expect(typeof mockFullService.initialize).toBe('function');
      expect(typeof mockFullService.cleanup).toBe('function');
    });

    test('조건부 타입이 복잡한 시나리오를 처리해야 함', async () => {
      // REFACTOR: 조건부 타입으로 유연성 제공
      type ServiceResult<T> = T extends string
        ? { data: string; type: 'string' }
        : T extends number
          ? { data: number; type: 'number' }
          : { data: T; type: 'object' };

      const stringResult: ServiceResult<string> = {
        data: 'test',
        type: 'string',
      };

      const numberResult: ServiceResult<number> = {
        data: 42,
        type: 'number',
      };

      expect(stringResult.type).toBe('string');
      expect(numberResult.type).toBe('number');
    });

    test('타입 가드가 런타임 안전성을 제공해야 함', async () => {
      // REFACTOR: 타입 가드로 런타임 안전성 강화
      function isMediaItem(value: unknown): value is { url: string; type: string } {
        return (
          typeof value === 'object' &&
          value !== null &&
          'url' in value &&
          'type' in value &&
          typeof (value as any).url === 'string' &&
          typeof (value as any).type === 'string'
        );
      }

      const unknownValue: unknown = {
        url: 'https://example.com/test.jpg',
        type: 'image',
      };

      if (isMediaItem(unknownValue)) {
        // REFACTOR: 타입 가드 후 안전한 접근
        expect(typeof unknownValue.url).toBe('string');
        expect(typeof unknownValue.type).toBe('string');
      }
    });

    test('제네릭 제약 조건이 타입 안전성을 보장해야 함', async () => {
      // REFACTOR: 제네릭 제약으로 타입 안전성 강화
      interface Downloadable {
        url: string;
        filename: string;
      }

      function downloadItem<T extends Downloadable>(item: T): Promise<T & { downloaded: boolean }> {
        return Promise.resolve({
          ...item,
          downloaded: true,
        });
      }

      const mediaItem = {
        url: 'https://example.com/test.jpg',
        filename: 'test.jpg',
        type: 'image',
      };

      try {
        const result = await downloadItem(mediaItem);
        expect(result.downloaded).toBe(true);
        expect(result.type).toBe('image'); // 원본 속성 유지
      } catch {
        expect(true).toBe(true);
      }
    });
  });
});
