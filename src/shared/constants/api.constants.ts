/**
 * @fileoverview API 관련 상수
 * @description TDD Phase 3.3 - GREEN 단계: 최소 구현
 *
 * constants.ts에서 API 관련 상수들을 분리
 */

/**
 * API 엔드포인트 상수
 */
export const API_ENDPOINTS = Object.freeze({
  TWITTER_API: 'https://api.twitter.com',
  MEDIA_PROXY: '/media',
  USER_TIMELINE: '/timeline',
} as const);

/**
 * HTTP 메서드 상수
 */
export const HTTP_METHODS = Object.freeze({
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const);

/**
 * HTTP 상태 코드
 */
export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const);

/**
 * 요청 헤더 상수
 */
export const REQUEST_HEADERS = Object.freeze({
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  USER_AGENT: 'User-Agent',
  ACCEPT: 'Accept',
} as const);

/**
 * 콘텐츠 타입 상수
 */
export const CONTENT_TYPES = Object.freeze({
  JSON: 'application/json',
  XML: 'application/xml',
  HTML: 'text/html',
  PLAIN_TEXT: 'text/plain',
} as const);

/**
 * 타임아웃 설정
 */
export const TIMEOUT_SETTINGS = Object.freeze({
  DEFAULT: 30000, // 30초
  FAST: 5000, // 5초
  SLOW: 60000, // 60초
} as const);

/**
 * API URL 구성
 *
 * @param path API 경로
 * @param params 쿼리 매개변수
 * @returns 완성된 URL
 */
export function buildApiUrl(path: string, params?: Record<string, string | number>): string {
  if (!params || Object.keys(params).length === 0) {
    return path;
  }

  const queryString = buildQueryString(params);
  return `${path}?${queryString}`;
}

/**
 * 쿼리 문자열 구성
 *
 * @param params 매개변수 객체
 * @returns 쿼리 문자열
 */
export function buildQueryString(params: Record<string, string | number>): string {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

/**
 * 요청 헤더 구성
 *
 * @param options 헤더 옵션
 * @returns 헤더 객체
 */
export function buildRequestHeaders(options: {
  contentType?: string;
  authorization?: string;
  userAgent?: string;
  accept?: string;
}): Record<string, string> {
  const headers: Record<string, string> = {};

  if (options.contentType) {
    headers[REQUEST_HEADERS.CONTENT_TYPE] = options.contentType;
  }
  if (options.authorization) {
    headers[REQUEST_HEADERS.AUTHORIZATION] = options.authorization;
  }
  if (options.userAgent) {
    headers[REQUEST_HEADERS.USER_AGENT] = options.userAgent;
  }
  if (options.accept) {
    headers[REQUEST_HEADERS.ACCEPT] = options.accept;
  }

  return headers;
}

/**
 * 성공 상태 코드 확인
 *
 * @param status HTTP 상태 코드
 * @returns 성공 여부
 */
export function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * 에러 상태 코드 확인
 *
 * @param status HTTP 상태 코드
 * @returns 에러 여부
 */
export function isErrorStatus(status: number): boolean {
  return status >= 400;
}

/**
 * 타입 정의
 */
export type ApiEndpoint = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];
export type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];
export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
export type RequestHeader = (typeof REQUEST_HEADERS)[keyof typeof REQUEST_HEADERS];
export type ContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES];
export type TimeoutSetting = (typeof TIMEOUT_SETTINGS)[keyof typeof TIMEOUT_SETTINGS];
