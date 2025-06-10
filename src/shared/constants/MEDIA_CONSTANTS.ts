/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 * @fileoverview 미디어 관련 상수 정의
 */

/**
 * 파일명 생성 관련 상수
 */
export const FILENAME_CONSTANTS = {
  /** 기본 파일 확장자 */
  DEFAULT_EXTENSION: 'jpg',
  /** 기본 파일명 접두사 */
  DEFAULT_PREFIX: 'media',
  /** 파일명 구분자 */
  SEPARATOR: '_',
  /** 최소 인덱스 값 (1-based) */
  MIN_INDEX: 1,
  /** 지원되는 이미지 확장자 */
  SUPPORTED_IMAGE_EXTENSIONS: ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const,
  /** 지원되는 비디오 확장자 */
  SUPPORTED_VIDEO_EXTENSIONS: ['mp4', 'mov', 'avi', 'webm'] as const,
} as const;

/**
 * 타입 정의
 */
export type SupportedImageExtension =
  (typeof FILENAME_CONSTANTS.SUPPORTED_IMAGE_EXTENSIONS)[number];
export type SupportedVideoExtension =
  (typeof FILENAME_CONSTANTS.SUPPORTED_VIDEO_EXTENSIONS)[number];
export type SupportedExtension = SupportedImageExtension | SupportedVideoExtension;

/**
 * 성능 최적화된 확장자 체크용 Set
 */
export const SUPPORTED_EXTENSIONS_SET = new Set<string>([
  ...FILENAME_CONSTANTS.SUPPORTED_IMAGE_EXTENSIONS,
  ...FILENAME_CONSTANTS.SUPPORTED_VIDEO_EXTENSIONS,
]);

/**
 * 파일명 형식 패턴
 */
export const FILENAME_PATTERNS = {
  /** 새로운 형식: {유저ID}_{트윗ID}_{인덱스}.{확장자} */
  MEDIA_FILENAME: /^[^_\s]+_\d+_\d+\.\w+$/,
  /** 미디어 ID에서 인덱스 추출: {tweetId}_media_{index} */
  MEDIA_ID_INDEX: /_media_(\d+)$/,
  /** 레거시 형식 지원 */
  LEGACY_INDEX: /_(\d+)(?=\.\w+$)/,
} as const;

/**
 * ZIP 파일 관련 상수
 */
export const ZIP_CONSTANTS = {
  /** 기본 압축 레벨 (0-9) */
  DEFAULT_COMPRESSION_LEVEL: 0,
  /** 최대 파일 크기 (바이트) */
  MAX_FILE_SIZE_BYTES: 100 * 1024 * 1024, // 100MB
  /** 요청 타임아웃 (밀리초) */
  REQUEST_TIMEOUT_MS: 30000, // 30초
  /** 기본 동시 다운로드 수 */
  DEFAULT_CONCURRENT_DOWNLOADS: 4,
} as const;

/**
 * 유니크 파일명 생성 관련 상수
 */
export const UNIQUE_FILENAME_CONSTANTS = {
  /** 파일명 중복 시 추가할 숫자 시작값 */
  COUNTER_START: 1,
  /** 파일명과 카운터 사이 구분자 */
  COUNTER_SEPARATOR: '_',
} as const;

/**
 * 국제화 지원 파일명 상수
 */
export const I18N_FILENAME_CONSTANTS = {
  /** 다국어 지원 기본 접두사 */
  DEFAULT_PREFIX_I18N: {
    en: 'media',
    ko: '미디어',
    ja: 'メディア',
    zh: '媒体',
  } as const,
  /** 다국어 지원 분리자 (URL 안전) */
  SAFE_SEPARATORS: ['_', '-', '.'] as const,
  /** 파일명에서 제거할 특수문자 패턴 */
  // eslint-disable-next-line no-control-regex
  UNSAFE_CHARS_PATTERN: /[<>:"/\\|?*\u0000-\u001f]/g,
  /** 윈도우 예약어 */
  WINDOWS_RESERVED_NAMES: [
    'CON',
    'PRN',
    'AUX',
    'NUL',
    'COM1',
    'COM2',
    'COM3',
    'COM4',
    'COM5',
    'COM6',
    'COM7',
    'COM8',
    'COM9',
    'LPT1',
    'LPT2',
    'LPT3',
    'LPT4',
    'LPT5',
    'LPT6',
    'LPT7',
    'LPT8',
    'LPT9',
  ] as const,
} as const;
