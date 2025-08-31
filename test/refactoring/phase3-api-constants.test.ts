/**
 * @fileoverview TDD Phase 3.3 - API 상수 분리 테스트
 * @description constants.ts에서 API 관련 상수들을 src/shared/constants/api.constants.ts로 분리
 */

import { describe, expect, it } from 'vitest';

// TDD Phase 3.3: API 상수 분리
describe('APIConstants - TDD Phase 3.3', () => {
  // RED 단계: 실패하는 테스트부터 작성

  describe('API 엔드포인트 상수', () => {
    it('API 엔드포인트가 정의되어야 한다', async () => {
      // Given: API 상수 모듈을 import
      const { API_ENDPOINTS } = await import('@shared/constants/api.constants');

      // Then: 필수 엔드포인트가 존재해야 함
      expect(API_ENDPOINTS).toBeDefined();
      expect(API_ENDPOINTS.TWITTER_API).toBe('https://api.twitter.com');
      expect(API_ENDPOINTS.MEDIA_PROXY).toBe('/media');
      expect(API_ENDPOINTS.USER_TIMELINE).toBe('/timeline');
    });

    it('API 엔드포인트가 불변이어야 한다', async () => {
      // Given: API 상수 모듈을 import
      const { API_ENDPOINTS } = await import('@shared/constants/api.constants');

      // When & Then: 엔드포인트 변경 시도시 에러 발생
      expect(() => {
        // @ts-expect-error - 의도적으로 불변성 테스트
        API_ENDPOINTS.TWITTER_API = 'https://fake.api.com';
      }).toThrow();
    });
  });

  describe('HTTP 메서드 상수', () => {
    it('HTTP 메서드가 정의되어야 한다', async () => {
      // Given: API 상수 모듈을 import
      const { HTTP_METHODS } = await import('@shared/constants/api.constants');

      // Then: 표준 HTTP 메서드가 존재해야 함
      expect(HTTP_METHODS).toBeDefined();
      expect(HTTP_METHODS.GET).toBe('GET');
      expect(HTTP_METHODS.POST).toBe('POST');
      expect(HTTP_METHODS.PUT).toBe('PUT');
      expect(HTTP_METHODS.DELETE).toBe('DELETE');
    });

    it('HTTP 메서드가 올바른 문자열이어야 한다', async () => {
      // Given: API 상수 모듈을 import
      const { HTTP_METHODS } = await import('@shared/constants/api.constants');

      // Then: 모든 메서드가 대문자여야 함
      Object.values(HTTP_METHODS).forEach(method => {
        expect(method).toMatch(/^[A-Z]+$/);
      });
    });
  });

  describe('HTTP 상태 코드', () => {
    it('HTTP 상태 코드가 정의되어야 한다', async () => {
      // Given: API 상수 모듈을 import
      const { HTTP_STATUS } = await import('@shared/constants/api.constants');

      // Then: 주요 상태 코드가 존재해야 함
      expect(HTTP_STATUS).toBeDefined();
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
    });

    it('상태 코드가 올바른 범위여야 한다', async () => {
      // Given: API 상수 모듈을 import
      const { HTTP_STATUS } = await import('@shared/constants/api.constants');

      // Then: 모든 상태 코드가 유효한 범위여야 함
      Object.values(HTTP_STATUS).forEach(status => {
        expect(status).toBeGreaterThanOrEqual(100);
        expect(status).toBeLessThan(600);
      });
    });
  });

  describe('요청 헤더 상수', () => {
    it('요청 헤더가 정의되어야 한다', async () => {
      // Given: API 상수 모듈을 import
      const { REQUEST_HEADERS } = await import('@shared/constants/api.constants');

      // Then: 필수 헤더가 존재해야 함
      expect(REQUEST_HEADERS).toBeDefined();
      expect(REQUEST_HEADERS.CONTENT_TYPE).toBe('Content-Type');
      expect(REQUEST_HEADERS.AUTHORIZATION).toBe('Authorization');
      expect(REQUEST_HEADERS.USER_AGENT).toBe('User-Agent');
      expect(REQUEST_HEADERS.ACCEPT).toBe('Accept');
    });

    it('헤더 이름이 표준 형식이어야 한다', async () => {
      // Given: API 상수 모듈을 import
      const { REQUEST_HEADERS } = await import('@shared/constants/api.constants');

      // Then: 헤더 이름이 적절한 케이스여야 함
      Object.values(REQUEST_HEADERS).forEach(header => {
        expect(header).toMatch(/^[A-Z][a-z-A-Z]*$/); // Pascal-Case 또는 Kebab-Case
      });
    });
  });

  describe('콘텐츠 타입 상수', () => {
    it('콘텐츠 타입이 정의되어야 한다', async () => {
      // Given: API 상수 모듈을 import
      const { CONTENT_TYPES } = await import('@shared/constants/api.constants');

      // Then: 주요 콘텐츠 타입이 존재해야 함
      expect(CONTENT_TYPES).toBeDefined();
      expect(CONTENT_TYPES.JSON).toBe('application/json');
      expect(CONTENT_TYPES.XML).toBe('application/xml');
      expect(CONTENT_TYPES.HTML).toBe('text/html');
      expect(CONTENT_TYPES.PLAIN_TEXT).toBe('text/plain');
    });

    it('콘텐츠 타입이 MIME 형식이어야 한다', async () => {
      // Given: API 상수 모듈을 import
      const { CONTENT_TYPES } = await import('@shared/constants/api.constants');

      // Then: 모든 콘텐츠 타입이 MIME 형식이어야 함
      Object.values(CONTENT_TYPES).forEach(contentType => {
        expect(contentType).toMatch(/^[a-z]+\/[a-z-]+$/);
      });
    });
  });

  describe('타임아웃 설정', () => {
    it('타임아웃 설정이 정의되어야 한다', async () => {
      // Given: API 상수 모듈을 import
      const { TIMEOUT_SETTINGS } = await import('@shared/constants/api.constants');

      // Then: 타임아웃 설정이 존재해야 함
      expect(TIMEOUT_SETTINGS).toBeDefined();
      expect(TIMEOUT_SETTINGS.DEFAULT).toBe(30000); // 30초
      expect(TIMEOUT_SETTINGS.FAST).toBe(5000); // 5초
      expect(TIMEOUT_SETTINGS.SLOW).toBe(60000); // 60초
    });

    it('타임아웃 값이 합리적이어야 한다', async () => {
      // Given: API 상수 모듈을 import
      const { TIMEOUT_SETTINGS } = await import('@shared/constants/api.constants');

      // Then: 타임아웃 값이 적절한 범위여야 함
      Object.values(TIMEOUT_SETTINGS).forEach(timeout => {
        expect(timeout).toBeGreaterThan(1000); // 1초 이상
        expect(timeout).toBeLessThanOrEqual(300000); // 5분 이하
      });
    });
  });

  describe('API 유틸리티 함수', () => {
    it('URL 빌더 함수가 동작해야 한다', async () => {
      // Given: API 상수 모듈을 import
      const { buildApiUrl, buildQueryString } = await import('@shared/constants/api.constants');

      // When: URL 구성
      const url = buildApiUrl('/users', { id: '123', filter: 'active' });
      const queryString = buildQueryString({ page: 1, limit: 10 });

      // Then: 올바른 URL이 생성되어야 함
      expect(url).toBe('/users?id=123&filter=active');
      expect(queryString).toBe('page=1&limit=10');
    });

    it('요청 헤더 빌더가 동작해야 한다', async () => {
      // Given: API 상수 모듈을 import
      const { buildRequestHeaders } = await import('@shared/constants/api.constants');

      // When: 헤더 구성
      const headers = buildRequestHeaders({
        contentType: 'application/json',
        authorization: 'Bearer token123',
      });

      // Then: 올바른 헤더가 생성되어야 함
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token123',
      });
    });

    it('상태 코드 체크 함수가 동작해야 한다', async () => {
      // Given: API 상수 모듈을 import
      const { isSuccessStatus, isErrorStatus } = await import('@shared/constants/api.constants');

      // When & Then: 상태 코드 체크
      expect(isSuccessStatus(200)).toBe(true);
      expect(isSuccessStatus(201)).toBe(true);
      expect(isSuccessStatus(400)).toBe(false);

      expect(isErrorStatus(400)).toBe(true);
      expect(isErrorStatus(500)).toBe(true);
      expect(isErrorStatus(200)).toBe(false);
    });
  });

  describe('상수 간 일관성', () => {
    it('모든 API 상수가 타입 안전성을 보장해야 한다', async () => {
      // Given: API 상수 모듈을 import
      const apiConstants = await import('@shared/constants/api.constants');

      // Then: 모든 상수가 정의되어야 함
      expect(apiConstants.API_ENDPOINTS).toBeDefined();
      expect(apiConstants.HTTP_METHODS).toBeDefined();
      expect(apiConstants.HTTP_STATUS).toBeDefined();
      expect(apiConstants.REQUEST_HEADERS).toBeDefined();
      expect(apiConstants.CONTENT_TYPES).toBeDefined();
      expect(apiConstants.TIMEOUT_SETTINGS).toBeDefined();
    });

    it('HTTP 메서드와 상태 코드가 일관성 있게 연결되어야 한다', async () => {
      // Given: API 상수 모듈을 import
      const { HTTP_METHODS, HTTP_STATUS } = await import('@shared/constants/api.constants');

      // Then: GET 요청과 200 OK가 연결되어야 함
      expect(HTTP_METHODS.GET).toBeDefined();
      expect(HTTP_STATUS.OK).toBe(200);

      // POST 요청과 201 Created가 연결되어야 함
      expect(HTTP_METHODS.POST).toBeDefined();
      expect(HTTP_STATUS.CREATED).toBe(201);
    });
  });
});
