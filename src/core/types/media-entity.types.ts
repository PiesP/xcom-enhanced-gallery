/**
 * @fileoverview Media Entity Types
 * @version 2.0.1 - Simplified without Domain layer
 *
 * 미디어 관련 타입들 - 도메인 계층 제거로 단순화
 */

import { buildSafeObject } from '@core/utils/type-safety-helpers';

// ================================
// 간단한 인터페이스 정의
// ================================

/**
 * 단순한 값 객체 인터페이스
 */
interface ValueObject<T> {
  readonly value: T;
  equals(other: ValueObject<T>): boolean;
}

/**
 * 단순한 엔티티 인터페이스
 */
interface MediaEntityInterface {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ================================
// Value Objects
// ================================

/**
 * 미디어 URL 값 객체
 * URL의 유효성과 접근 가능성을 보장합니다.
 */
export class MediaUrl implements ValueObject<string> {
  readonly value: string;

  constructor(url: string) {
    if (!this.isValidUrl(url)) {
      throw new Error(`Invalid media URL: ${url}`);
    }
    this.value = url;
  }

  equals(other: ValueObject<string>): boolean {
    return this.value === other.value;
  }

  isValid(): boolean {
    return this.isValidUrl(this.value);
  }

  toString(): string {
    return this.value;
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * 원본 해상도 URL로 변환
   */
  toOriginalUrl(): MediaUrl {
    let originalUrl = this.value;

    // Twitter/X.com 미디어 URL 변환 규칙
    if (this.value.includes('pbs.twimg.com')) {
      // 이미지 품질 파라미터 제거
      originalUrl = this.value.replace(/&name=\w+|&format=\w+/g, '');
      // 원본 품질로 설정
      originalUrl += originalUrl.includes('?') ? '&name=orig' : '?name=orig';
    }

    return new MediaUrl(originalUrl);
  }

  /**
   * 썸네일 URL로 변환
   */
  toThumbnailUrl(): MediaUrl {
    let thumbnailUrl = this.value;

    if (this.value.includes('pbs.twimg.com')) {
      thumbnailUrl = this.value.replace(/&name=\w+/g, '');
      thumbnailUrl += thumbnailUrl.includes('?') ? '&name=small' : '?name=small';
    }

    return new MediaUrl(thumbnailUrl);
  }
}

/**
 * 미디어 타입 값 객체
 */
export class MediaType implements ValueObject<string> {
  readonly value: 'image' | 'video' | 'gif';

  private static readonly VALID_TYPES = ['image', 'video', 'gif'] as const;

  constructor(type: string) {
    if (!MediaType.VALID_TYPES.includes(type as 'image' | 'video' | 'gif')) {
      throw new Error(`Invalid media type: ${type}`);
    }
    this.value = type as 'image' | 'video' | 'gif';
  }

  equals(other: ValueObject<string>): boolean {
    return this.value === other.value;
  }

  isValid(): boolean {
    return MediaType.VALID_TYPES.includes(this.value);
  }

  toString(): string {
    return this.value;
  }

  isImage(): boolean {
    return this.value === 'image';
  }

  isVideo(): boolean {
    return this.value === 'video';
  }

  isGif(): boolean {
    return this.value === 'gif';
  }

  /**
   * 파일 확장자에서 미디어 타입 추론
   */
  static fromFileExtension(extension: string): MediaType {
    const ext = extension.toLowerCase().replace('.', '');

    const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'bmp'];
    const videoExts = ['mp4', 'webm', 'mov', 'avi'];
    const gifExts = ['gif'];

    if (imageExts.includes(ext)) {
      return new MediaType('image');
    }
    if (videoExts.includes(ext)) {
      return new MediaType('video');
    }
    if (gifExts.includes(ext)) {
      return new MediaType('gif');
    }

    throw new Error(`Cannot determine media type from extension: ${extension}`);
  }
}

/**
 * 파일명 값 객체
 */
export class Filename implements ValueObject<string> {
  readonly value: string;

  constructor(filename: string) {
    if (!this.isValidFilename(filename)) {
      throw new Error(`Invalid filename: ${filename}`);
    }
    this.value = filename;
  }

  equals(other: ValueObject<string>): boolean {
    return this.value === other.value;
  }

  isValid(): boolean {
    return this.isValidFilename(this.value);
  }

  toString(): string {
    return this.value;
  }

  private isValidFilename(filename: string): boolean {
    // 기본 파일명 유효성 검사
    if (!filename || filename.trim().length === 0) {
      return false;
    }

    // 금지된 문자 검사
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(filename)) {
      return false;
    }

    // 최대 길이 검사 (255자)
    if (filename.length > 255) {
      return false;
    }

    return true;
  }

  /**
   * 파일 확장자 반환
   */
  getExtension(): string {
    const lastDot = this.value.lastIndexOf('.');
    if (lastDot === -1) {
      return '';
    }
    return this.value.substring(lastDot + 1);
  }

  /**
   * 확장자 없는 파일명 반환
   */
  getBasename(): string {
    const lastDot = this.value.lastIndexOf('.');
    if (lastDot === -1) {
      return this.value;
    }
    return this.value.substring(0, lastDot);
  }

  /**
   * 안전한 파일명으로 변환
   */
  toSafeFilename(): Filename {
    let safeName = this.value
      .replace(/[<>:"/\\|?*]/g, '_') // 금지 문자를 언더스코어로 변경
      .replace(/\s+/g, '_') // 공백을 언더스코어로 변경
      .replace(/_+/g, '_') // 연속된 언더스코어를 하나로 변경
      .replace(/^_|_$/g, ''); // 시작/끝 언더스코어 제거

    // 최대 길이 제한
    if (safeName.length > 200) {
      const ext = this.getExtension();
      const basename = safeName.substring(0, 200 - ext.length - 1);
      safeName = ext ? `${basename}.${ext}` : basename;
    }

    return new Filename(safeName);
  }
}

/**
 * 미디어 차원 값 객체 (너비/높이)
 */
export class MediaDimensions implements ValueObject<{ width: number; height: number }> {
  readonly value: { width: number; height: number };

  constructor(width: number, height: number) {
    if (width <= 0 || height <= 0) {
      throw new Error(`Invalid dimensions: ${width}x${height}`);
    }
    this.value = { width, height };
  }

  equals(other: ValueObject<{ width: number; height: number }>): boolean {
    return this.value.width === other.value.width && this.value.height === other.value.height;
  }

  isValid(): boolean {
    return this.value.width > 0 && this.value.height > 0;
  }

  toString(): string {
    return `${this.value.width}x${this.value.height}`;
  }

  /**
   * 종횡비 계산
   */
  getAspectRatio(): number {
    return this.value.width / this.value.height;
  }

  /**
   * 가로형 여부
   */
  isLandscape(): boolean {
    return this.value.width > this.value.height;
  }

  /**
   * 세로형 여부
   */
  isPortrait(): boolean {
    return this.value.height > this.value.width;
  }

  /**
   * 정사각형 여부
   */
  isSquare(): boolean {
    return this.value.width === this.value.height;
  }
}

// ================================
// Domain Entity
// ================================

/**
 * 불변 미디어 엔티티
 * 단순화된 구조로 변경
 */
export class MediaEntity implements MediaEntityInterface {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // Value Objects
  readonly url: MediaUrl;
  readonly type: MediaType;
  readonly filename: Filename;
  readonly dimensions?: MediaDimensions;
  readonly originalUrl?: MediaUrl;
  readonly thumbnailUrl?: MediaUrl;

  // Primitive Properties
  readonly fileSize?: number;
  readonly alt?: string;

  // Twitter/X Specific
  readonly tweetId?: string;
  readonly tweetUsername?: string;
  readonly tweetUrl?: string;

  // Metadata
  readonly metadata: Readonly<Record<string, unknown>>;

  constructor(config: {
    id?: string;
    url: string;
    type: string;
    filename?: string;
    width?: number;
    height?: number;
    originalUrl?: string;
    thumbnailUrl?: string;
    fileSize?: number;
    alt?: string;
    tweetId?: string;
    tweetUsername?: string;
    tweetUrl?: string;
    metadata?: Record<string, unknown>;
  }) {
    // ID 생성 (제공되지 않은 경우)
    this.id = config.id ?? this.generateId();

    // 시간 정보
    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;

    // Value Objects 생성
    this.url = new MediaUrl(config.url);
    this.type = new MediaType(config.type);

    // 파일명 처리
    if (config.filename) {
      this.filename = new Filename(config.filename);
    } else {
      this.filename = this.generateFilename();
    }

    // 차원 정보
    if (config.width && config.height) {
      this.dimensions = new MediaDimensions(config.width, config.height);
    }

    // URL 처리
    if (config.originalUrl) {
      this.originalUrl = new MediaUrl(config.originalUrl);
    } else {
      this.originalUrl = this.url.toOriginalUrl();
    }

    if (config.thumbnailUrl) {
      this.thumbnailUrl = new MediaUrl(config.thumbnailUrl);
    } else if (this.type.isVideo()) {
      // 비디오의 경우 썸네일 URL 생성 시도
      this.thumbnailUrl = this.url.toThumbnailUrl();
    }

    // 기본 속성 (조건부 할당으로 undefined 회피)
    if (config.fileSize !== undefined) {
      this.fileSize = config.fileSize;
    }
    if (config.alt !== undefined) {
      this.alt = config.alt;
    }

    // Twitter/X 관련 정보 (조건부 할당으로 undefined 회피)
    if (config.tweetId !== undefined) {
      this.tweetId = config.tweetId;
    }
    if (config.tweetUsername !== undefined) {
      this.tweetUsername = config.tweetUsername;
    }
    if (config.tweetUrl !== undefined) {
      this.tweetUrl = config.tweetUrl;
    }

    // 메타데이터 (불변 객체로 복사)
    this.metadata = Object.freeze({ ...config.metadata });

    // 유효성 검증
    if (!this.isValid()) {
      throw new Error('Invalid media entity configuration');
    }
  }

  isValid(): boolean {
    return (
      !!this.id &&
      this.url.isValid() &&
      this.type.isValid() &&
      this.filename.isValid() &&
      (this.dimensions?.isValid() ?? true) &&
      (this.originalUrl?.isValid() ?? true) &&
      (this.thumbnailUrl?.isValid() ?? true)
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      url: this.url.value,
      type: this.type.value,
      filename: this.filename.value,
      dimensions: this.dimensions?.value,
      originalUrl: this.originalUrl?.value,
      thumbnailUrl: this.thumbnailUrl?.value,
      fileSize: this.fileSize,
      alt: this.alt,
      tweetId: this.tweetId,
      tweetUsername: this.tweetUsername,
      tweetUrl: this.tweetUrl,
      metadata: this.metadata,
    };
  }

  /**
   * 다운로드 가능한 URL 반환
   * 원본 URL 우선, 없으면 기본 URL 사용
   */
  getDownloadUrl(): string {
    return this.originalUrl?.value ?? this.url.value;
  }

  /**
   * 표시용 URL 반환
   * 기본 URL 사용
   */
  getDisplayUrl(): string {
    return this.url.value;
  }

  /**
   * 썸네일 URL 반환
   * 썸네일이 있으면 썸네일, 없으면 기본 URL
   */
  getThumbnailUrl(): string {
    return this.thumbnailUrl?.value ?? this.url.value;
  }

  /**
   * 미디어가 다운로드 가능한지 확인
   */
  isDownloadable(): boolean {
    return !!this.originalUrl || !!this.url;
  }

  /**
   * 트위터/X 미디어인지 확인
   */
  isTwitterMedia(): boolean {
    return !!this.tweetId || this.url.value.includes('pbs.twimg.com');
  }

  /**
   * 새로운 엔티티 생성 (불변성 유지)
   */
  withUpdates(updates: {
    filename?: string;
    fileSize?: number;
    alt?: string;
    metadata?: Record<string, unknown>;
  }): MediaEntity {
    const config = buildSafeObject<{
      id?: string;
      url: string;
      type: string;
      filename?: string;
      width?: number;
      height?: number;
      originalUrl?: string;
      thumbnailUrl?: string;
      fileSize?: number;
      alt?: string;
      tweetId?: string;
      tweetUsername?: string;
      tweetUrl?: string;
      metadata?: Record<string, unknown>;
    }>(builder => {
      builder.set('id', this.id);
      builder.set('url', this.url.value);
      builder.set('type', this.type.value);
      builder.set('filename', updates.filename ?? this.filename.value);
      builder.set('width', this.dimensions?.value.width);
      builder.set('height', this.dimensions?.value.height);
      builder.set('originalUrl', this.originalUrl?.value);
      builder.set('thumbnailUrl', this.thumbnailUrl?.value);
      builder.set('fileSize', updates.fileSize ?? this.fileSize);
      builder.set('alt', updates.alt ?? this.alt);
      builder.set('tweetId', this.tweetId);
      builder.set('tweetUsername', this.tweetUsername);
      builder.set('tweetUrl', this.tweetUrl);
      builder.set('metadata', { ...this.metadata, ...updates.metadata });
    });

    return new MediaEntity(
      config as {
        id?: string;
        url: string;
        type: string;
        filename?: string;
        width?: number;
        height?: number;
        originalUrl?: string;
        thumbnailUrl?: string;
        fileSize?: number;
        alt?: string;
        tweetId?: string;
        tweetUsername?: string;
        tweetUrl?: string;
        metadata?: Record<string, unknown>;
      }
    );
  }

  /**
   * 고유 ID 생성 - crypto.randomUUID() 우선 사용
   */
  private generateId(): string {
    try {
      // crypto.randomUUID() 사용 (Node.js 16+, 모던 브라우저)
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `media_${crypto.randomUUID()}`;
      }
    } catch {
      // crypto.randomUUID() 실패 시 폴백
    }

    // 폴백: 강화된 랜덤 생성
    const timestamp = Date.now();
    const random1 = Math.random().toString(36).substring(2, 15);
    const random2 = Math.random().toString(36).substring(2, 15);

    return `media_${timestamp}_${random1}_${random2}`;
  }

  /**
   * 파일명 자동 생성
   */
  private generateFilename(): Filename {
    const url = this.url.value;
    const type = this.type.value;

    // URL에서 파일명 추출 시도
    try {
      const pathname = new URL(url).pathname;
      const segments = pathname.split('/');
      const lastSegment = segments[segments.length - 1];

      if (lastSegment?.includes('.')) {
        return new Filename(lastSegment);
      }
    } catch {
      // URL 파싱 실패 시 기본 파일명 생성
    }

    // 기본 파일명 생성
    const timestamp = Date.now();
    const extension = this.getDefaultExtension();
    const defaultName = `${type}_${timestamp}.${extension}`;

    return new Filename(defaultName);
  }

  /**
   * 미디어 타입별 기본 확장자 반환
   */
  private getDefaultExtension(): string {
    switch (this.type.value) {
      case 'image':
        return 'jpg';
      case 'video':
        return 'mp4';
      case 'gif':
        return 'gif';
      default:
        return 'bin';
    }
  }
}

// ================================
// Factory Functions
// ================================

/**
 * 기존 MediaInfo에서 MediaEntity 생성
 */
export function createMediaEntity(mediaInfo: {
  id?: string;
  url: string;
  type: string;
  filename?: string;
  width?: number;
  height?: number;
  originalUrl?: string;
  thumbnailUrl?: string;
  fileSize?: number;
  alt?: string;
  tweetId?: string;
  tweetUsername?: string;
  tweetUrl?: string;
  metadata?: Record<string, unknown>;
}): MediaEntity {
  return new MediaEntity(mediaInfo);
}

/**
 * MediaEntity에서 기존 MediaInfo 타입으로 변환
 */
export function toMediaInfo(entity: MediaEntity): {
  id: string;
  url: string;
  originalUrl?: string;
  type: 'image' | 'video' | 'gif';
  filename: string;
  fileSize?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  alt?: string;
  tweetUsername?: string;
  tweetId?: string;
  tweetUrl?: string;
  metadata?: Record<string, unknown>;
} {
  const result = buildSafeObject<{
    id: string;
    url: string;
    originalUrl?: string;
    type: 'image' | 'video' | 'gif';
    filename: string;
    fileSize?: number;
    width?: number;
    height?: number;
    thumbnailUrl?: string;
    alt?: string;
    tweetUsername?: string;
    tweetId?: string;
    tweetUrl?: string;
    metadata?: Record<string, unknown>;
  }>(builder => {
    builder.set('id', entity.id);
    builder.set('url', entity.url.value);
    builder.set('originalUrl', entity.originalUrl?.value);
    builder.set('type', entity.type.value);
    builder.set('filename', entity.filename.value);
    builder.set('fileSize', entity.fileSize);
    builder.set('width', entity.dimensions?.value.width);
    builder.set('height', entity.dimensions?.value.height);
    builder.set('thumbnailUrl', entity.thumbnailUrl?.value);
    builder.set('alt', entity.alt);
    builder.set('tweetUsername', entity.tweetUsername);
    builder.set('tweetId', entity.tweetId);
    builder.set('tweetUrl', entity.tweetUrl);
    builder.set('metadata', entity.metadata);
  });

  return result as {
    id: string;
    url: string;
    originalUrl?: string;
    type: 'image' | 'video' | 'gif';
    filename: string;
    fileSize?: number;
    width?: number;
    height?: number;
    thumbnailUrl?: string;
    alt?: string;
    tweetUsername?: string;
    tweetId?: string;
    tweetUrl?: string;
    metadata?: Record<string, unknown>;
  };
}
