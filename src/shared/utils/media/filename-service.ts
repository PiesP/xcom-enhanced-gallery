/**
 * Media Filename Service - 고급 미디어 파일명 생성 및 관리
 *
 * 트위터/X.com 미디어를 위한 체계적인 파일명 생성 시스템
 * 충돌 방지, 캐싱, 히스토리 추적 기능 포함
 */

/**
 * 파일명 생성 옵션
 */
export interface FilenameOptions {
  /** 트윗 사용자명 */
  username?: string;
  /** 트윗 ID */
  tweetId?: string;
  /** 타임스탬프 포함 여부 */
  includeTimestamp?: boolean;
  /** 인덱스 번호 */
  index?: number;
  /** 커스텀 접두사 */
  prefix?: string;
  /** 커스텀 접미사 */
  suffix?: string;
  /** 최대 파일명 길이 */
  maxLength?: number;
  /** 기본 확장자 */
  defaultExtension?: string;
}

/**
 * ZIP 파일명 생성 옵션
 */
export interface ZipFilenameOptions {
  /** 트윗 사용자명 */
  username?: string;
  /** 트윗 ID */
  tweetId?: string;
  /** 미디어 개수 */
  mediaCount?: number;
  /** 커스텀 접두사 */
  prefix?: string;
  /** 타임스탬프 포함 여부 */
  includeTimestamp?: boolean;
}

/**
 * 안전한 파일명 문자로 변환
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/%[0-9A-Fa-f]{2}/g, '_') // URL 인코딩된 문자 제거
    .replace(/[<>:"/\\|?*]/g, '_') // 윈도우 예약 문자
    .replace(/[!@#$%^&*()+={};':",./<>?]/g, '_') // 추가 특수문자
    .replace(/[^\w\-._]/g, '_') // 영문, 숫자, 하이픈, 점, 밑줄 외 모든 문자를 밑줄로
    .replace(/\s+/g, '_') // 공백을 밑줄로
    .replace(/_{2,}/g, '_') // 연속된 밑줄 정리
    .replace(/^_|_$/g, ''); // 앞뒤 밑줄 제거
}

/**
 * URL에서 파일 확장자 추출
 */
function getFileExtension(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // format 파라미터에서 확장자 추출
    const formatParam = urlObj.searchParams.get('format');
    if (formatParam) {
      return `.${formatParam}`;
    }

    // 경로에서 확장자 추출
    const extMatch = pathname.match(/\.([a-zA-Z0-9]+)$/);
    if (extMatch) {
      return extMatch[0];
    }

    // 기본 확장자
    return '.jpg';
  } catch {
    return '.jpg';
  }
}

/**
 * 타임스탬프 생성 (YYYY-MM-DD 형식)
 */
function generateTimestamp(): string {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * 미디어 파일명 생성
 * 기본 형식: {유저ID}_{트윗ID}_{첨자}.{확장자}
 */
export function generateMediaFilename(url: string, options: FilenameOptions = {}): string {
  if (!url || typeof url !== 'string') {
    return `media_${Date.now()}_1.jpg`;
  }

  const {
    username,
    tweetId,
    includeTimestamp = false,
    index = 1,
    prefix,
    suffix,
    maxLength = 255,
  } = options;

  let filename = '';

  // 기본 형식: {유저ID}_{트윗ID}_{첨자}
  if (prefix) {
    // 커스텀 접두사가 있으면 사용
    filename = `${prefix}_${index}`;
  } else if (username && tweetId) {
    // 유저ID_트윗ID_첨자 형식 (요구사항에 맞는 올바른 형식)
    filename = `${username}_${tweetId}_${index}`;
  } else {
    // 기본 파일명: media_타임스탬프_인덱스 형식
    filename = `media_${Date.now()}_${index}`;
  }

  // 타임스탬프 추가 (선택적)
  if (includeTimestamp) {
    filename += `_${generateTimestamp()}`;
  }

  // 접미사 추가 (선택적)
  if (suffix) {
    filename += `_${suffix}`;
  }

  // 파일명 정리
  filename = sanitizeFilename(filename);

  // 확장자 추가
  const extension = getFileExtension(url);
  filename += extension;

  // 길이 제한
  if (filename.length > maxLength) {
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    const ext = filename.substring(filename.lastIndexOf('.'));
    const maxNameLength = maxLength - ext.length;
    filename = nameWithoutExt.substring(0, maxNameLength) + ext;
  }

  return filename;
}

/**
 * ZIP 파일명 생성
 */
export function generateZipFilename(options: ZipFilenameOptions = {}): string {
  const { username, tweetId, mediaCount, prefix, includeTimestamp = true } = options;

  let filename = '';

  // 커스텀 접두사가 있으면 사용
  if (prefix) {
    filename = prefix;
  } else if (username && tweetId) {
    filename = `${username}_${tweetId}`;
  } else {
    filename = 'twitter-gallery';
  }

  // 타임스탬프 추가
  if (includeTimestamp) {
    filename += `-${generateTimestamp()}`;
  }

  // 미디어 개수 추가
  if (mediaCount && mediaCount > 0) {
    filename += `_${mediaCount}items`;
  }

  // 파일명 정리 및 확장자 추가
  filename = `${sanitizeFilename(filename)}.zip`;

  return filename;
}

/**
 * 미디어 파일명 유효성 검사
 */
export function isValidMediaFilename(filename: string): boolean {
  if (!filename || typeof filename !== 'string') {
    return false;
  }

  // 빈 파일명이나 확장자만 있는 경우 거부
  if (filename.trim() === '' || filename.startsWith('.')) {
    return false;
  }

  // 확장자가 없는 경우 거부
  if (!filename.includes('.')) {
    return false;
  }

  // 기본 패턴 검사
  const mediaExtensions = /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i;
  if (!mediaExtensions.test(filename)) {
    return false;
  }

  // 금지된 문자 검사 (공백 포함)
  const invalidChars = /[<>:"/\\|?*\s]/;
  if (invalidChars.test(filename)) {
    return false;
  }

  // 길이 검사
  if (filename.length > 255) {
    return false;
  }

  return true;
}

/**
 * ZIP 파일명 유효성 검사
 */
export function isValidZipFilename(filename: string): boolean {
  if (!filename || typeof filename !== 'string') {
    return false;
  }

  // 빈 파일명이나 확장자만 있는 경우 거부
  if (filename.trim() === '' || filename === '.zip') {
    return false;
  }

  // ZIP 확장자 검사
  if (!filename.toLowerCase().endsWith('.zip')) {
    return false;
  }

  // 금지된 문자 검사 (공백 포함)
  const invalidChars = /[<>:"/\\|?*\s]/;
  if (invalidChars.test(filename)) {
    return false;
  }

  // 길이 검사
  if (filename.length > 255) {
    return false;
  }

  return true;
}

/**
 * MediaFilenameService 클래스 - 고급 파일명 관리
 */
export class MediaFilenameService {
  private filenameHistory: Map<string, string> = new Map();
  private filenameCache: Map<string, string> = new Map();
  private filenameCounters: Map<string, number> = new Map();

  /**
   * 파일명 생성 (캐싱 포함)
   */
  generateFilename(url: string, options: FilenameOptions = {}): string {
    const cacheKey = this.getCacheKey(url, options);

    // 캐시에서 확인
    const cachedFilename = this.filenameCache.get(cacheKey);
    if (cachedFilename) {
      return cachedFilename;
    }

    // 새로운 파일명 생성
    const filename = generateMediaFilename(url, options);

    // 캐시 및 히스토리에 저장
    this.filenameCache.set(cacheKey, filename);
    this.filenameHistory.set(cacheKey, filename);

    return filename;
  }

  /**
   * 고유한 파일명 생성 (충돌 방지)
   */
  generateUniqueFilename(url: string, options: FilenameOptions = {}): string {
    const baseFilename = generateMediaFilename(url, options);
    const baseKey = this.getBaseKey(baseFilename);

    // 카운터 증가
    const currentCount = this.filenameCounters.get(baseKey) ?? 0;
    this.filenameCounters.set(baseKey, currentCount + 1);

    // 고유한 파일명 생성
    if (currentCount > 0) {
      const extIndex = baseFilename.lastIndexOf('.');
      const nameWithoutExt = baseFilename.substring(0, extIndex);
      const ext = baseFilename.substring(extIndex);
      return `${nameWithoutExt}_${currentCount + 1}${ext}`;
    }

    return baseFilename;
  }

  /**
   * 캐시된 파일명 반환
   */
  getCachedFilename(url: string, options: FilenameOptions = {}): string | null {
    const cacheKey = this.getCacheKey(url, options);
    return this.filenameCache.get(cacheKey) ?? null;
  }

  /**
   * 생성된 파일명 히스토리 반환
   */
  getGeneratedFilenames(): string[] {
    return Array.from(this.filenameHistory.values());
  }

  /**
   * 캐시 정리
   */
  clearCache(): void {
    this.filenameCache.clear();
    this.filenameHistory.clear();
    this.filenameCounters.clear();
  }

  /**
   * 캐시 키 생성
   */
  private getCacheKey(url: string, options: FilenameOptions): string {
    return `${url}_${JSON.stringify(options)}`;
  }

  /**
   * 베이스 키 생성 (충돌 방지용)
   */
  private getBaseKey(filename: string): string {
    const extIndex = filename.lastIndexOf('.');
    return filename.substring(0, extIndex);
  }
}
