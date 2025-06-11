/**
 * ZIP 파일 생성을 위한 유틸리티 클래스
 * fflate 라이브러리를 사용하여 ZIP 파일을 생성하고 관리합니다.
 */

import { logger } from '@infrastructure/logging/logger';
import { getFflate } from '@shared/utils/vendors';

// ZIP 파일 내 파일 엔트리 타입
export interface ZipFileEntry {
  filename: string;
  data: Uint8Array;
  lastModified?: Date;
  uncompressedSize: number;
  compressedSize?: number;
}

// ZIP 파일 생성 옵션
export interface ZipCreationOptions {
  compressionLevel?: number; // 0-9, 기본값: 6
  includeTimestamp?: boolean;
  comment?: string;
}

// ZIP 생성 결과
export interface ZipCreationResult {
  success: boolean;
  blob?: Blob;
  filename?: string;
  size?: number;
  error?: Error;
  statistics?: {
    totalFiles: number;
    uncompressedSize: number;
    compressedSize: number;
    compressionRatio: number;
  };
}

// 파일 검증 결과
export interface FileValidationResult {
  isValid: boolean;
  reason?: string;
  maxFilenameLength?: number;
  maxFileSize?: number;
  maxFileCount?: number;
}

/**
 * ZIP 파일 생성을 위한 유틸리티 클래스
 */
export class ZipCreator {
  private files: Map<string, ZipFileEntry> = new Map();
  private readonly maxFilenameLength: number = 255;
  private readonly maxFileSize: number = 100 * 1024 * 1024; // 100MB
  private readonly maxFileCount: number = 1000;

  /**
   * 새 ZipCreator 인스턴스를 생성합니다
   */
  constructor() {
    logger.debug('ZipCreator instance created');
  }

  /**
   * ZIP에 이미지 파일을 추가합니다
   */
  async addImageFile(
    filename: string,
    data: Uint8Array | ArrayBuffer | Blob,
    options?: {
      lastModified?: Date;
      validateImage?: boolean;
    }
  ): Promise<boolean> {
    try {
      // 파일명 검증
      const validation = this.validateFilename(filename);
      if (!validation.isValid) {
        throw new Error(`Invalid filename: ${validation.reason}`);
      }

      // 데이터 변환
      let uint8Data: Uint8Array;
      if (data instanceof Uint8Array) {
        uint8Data = data;
      } else if (data instanceof ArrayBuffer) {
        uint8Data = new Uint8Array(data);
      } else if (data instanceof Blob) {
        const arrayBuffer = await data.arrayBuffer();
        uint8Data = new Uint8Array(arrayBuffer);
      } else {
        throw new Error('Unsupported data type');
      }

      // 파일 크기 검증
      if (uint8Data.length > this.maxFileSize) {
        throw new Error(`File size exceeds maximum limit: ${this.maxFileSize} bytes`);
      }

      // 파일 개수 검증
      if (this.files.size >= this.maxFileCount) {
        throw new Error(`File count exceeds maximum limit: ${this.maxFileCount}`);
      }

      // 이미지 검증 (옵션)
      if (options?.validateImage) {
        if (!this.isValidImageData(uint8Data)) {
          throw new Error('Invalid image data');
        }
      }

      // 파일 엔트리 생성
      const entry: ZipFileEntry = {
        filename: this.sanitizeFilename(filename),
        data: uint8Data,
        lastModified: options?.lastModified ?? new Date(),
        uncompressedSize: uint8Data.length,
      };

      this.files.set(entry.filename, entry);
      logger.debug(`Added image file: ${entry.filename} (${uint8Data.length} bytes)`);

      return true;
    } catch (error) {
      logger.error('Failed to add image file:', error);
      throw error;
    }
  }

  /**
   * URL에서 파일을 다운로드하여 ZIP에 추가합니다
   */
  async addFileFromUrl(filename: string, url: string): Promise<boolean> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
      }

      const blob = await response.blob();
      return await this.addImageFile(filename, blob);
    } catch (error) {
      logger.error('Failed to add file from URL:', error);
      return false;
    }
  }

  /**
   * ZIP에 디렉토리를 추가합니다
   */
  addDirectory(path: string): boolean {
    try {
      const normalizedPath = this.normalizePath(path);
      let dirPath = normalizedPath;
      if (!dirPath.endsWith('/')) {
        dirPath = `${normalizedPath}/`;
      }

      const validation = this.validateFilename(dirPath);
      if (!validation.isValid) {
        throw new Error(`Invalid directory path: ${validation.reason}`);
      }

      // 빈 디렉토리 엔트리 생성
      const entry: ZipFileEntry = {
        filename: dirPath,
        data: new Uint8Array(0),
        lastModified: new Date(),
        uncompressedSize: 0,
      };

      this.files.set(dirPath, entry);
      logger.debug(`Added directory: ${dirPath}`);

      return true;
    } catch (error) {
      logger.error('Failed to add directory:', error);
      throw error;
    }
  }

  /**
   * ZIP 파일을 생성합니다
   */
  async createZip(
    options?: ZipCreationOptions,
    progressCallback?: (progress: number) => void
  ): Promise<Blob> {
    try {
      const fflate = getFflate();

      if (this.files.size === 0) {
        throw new Error('No files to zip');
      }

      // ZIP 파일 데이터 준비
      const zipData: Record<string, Uint8Array> = {};

      for (const [filename, entry] of this.files) {
        zipData[filename] = entry.data;
      }

      // ZIP 압축 실행
      const compressed = await new Promise<Uint8Array>((resolve, reject) => {
        fflate.zip(zipData, (err: Error | null, data: Uint8Array) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });

      const blob = new Blob([new Uint8Array(compressed)], { type: 'application/zip' });
      logger.debug(`ZIP created successfully: ${blob.size} bytes`);

      if (progressCallback) {
        progressCallback(100);
      }

      return blob;
    } catch (error) {
      logger.error('Failed to create ZIP:', error);
      throw error;
    }
  }

  /**
   * 파일을 제거합니다
   */
  removeFile(filename: string): boolean {
    const result = this.files.delete(filename);
    if (result) {
      logger.debug(`Removed file: ${filename}`);
    }
    return result;
  }

  /**
   * 모든 파일을 클리어합니다
   */
  clear(): void {
    this.files.clear();
    logger.debug('ZipCreator cleared');
  }

  /**
   * 추가된 파일 목록을 반환합니다
   */
  getFileList(): string[] {
    return Array.from(this.files.keys());
  }

  /**
   * 파일이 존재하는지 확인합니다
   */
  hasFile(filename: string): boolean {
    return this.files.has(filename);
  }

  /**
   * 예상 ZIP 파일 크기를 계산합니다
   */
  getEstimatedSize(): number {
    let totalSize = 0;
    for (const entry of this.files.values()) {
      // 대략적인 압축률 0.7 적용
      totalSize += entry.uncompressedSize * 0.7;
      // ZIP 헤더 오버헤드 추가 (파일당 약 30바이트)
      totalSize += 30;
    }
    return Math.round(totalSize);
  }

  /**
   * 압축되지 않은 총 크기를 반환합니다
   */
  getUncompressedSize(): number {
    return Array.from(this.files.values()).reduce((sum, entry) => sum + entry.uncompressedSize, 0);
  }

  /**
   * ZIP 파일 통계를 반환합니다
   */
  getStatistics() {
    const totalFiles = this.files.size;
    const uncompressedSize = this.getUncompressedSize();

    return {
      totalFiles,
      uncompressedSize,
      estimatedCompressedSize: this.getEstimatedSize(),
      estimatedCompressionRatio:
        uncompressedSize > 0 ? this.getEstimatedSize() / uncompressedSize : 0,
    };
  }

  /**
   * 리소스를 정리합니다
   */
  destroy(): void {
    this.clear();
    logger.debug('ZipCreator destroyed');
  }

  /**
   * 파일명을 검증합니다
   */
  private validateFilename(filename: string): FileValidationResult {
    if (!filename || filename.trim().length === 0) {
      return {
        isValid: false,
        reason: 'Filename cannot be empty',
        maxFilenameLength: this.maxFilenameLength,
      };
    }

    if (filename.length > this.maxFilenameLength) {
      return {
        isValid: false,
        reason: `Filename exceeds maximum length: ${this.maxFilenameLength}`,
        maxFilenameLength: this.maxFilenameLength,
      };
    }

    // 위험한 문자 검사 - ASCII 제어 문자 (0-31) 제외
    const dangerousChars = /[<>:"|?*]/;
    const hasControlChars = filename.split('').some(char => char.charCodeAt(0) < 32);
    if (dangerousChars.test(filename) || hasControlChars) {
      return {
        isValid: false,
        reason: 'Filename contains dangerous characters',
        maxFilenameLength: this.maxFilenameLength,
      };
    }

    return {
      isValid: true,
      maxFilenameLength: this.maxFilenameLength,
    };
  }

  /**
   * 파일명을 안전하게 정리합니다
   */
  private sanitizeFilename(filename: string): string {
    // Control characters (0x00-0x1F) 제거 - 정규식 대신 함수로 처리
    let sanitized = filename
      .split('')
      .map(char => {
        const code = char.charCodeAt(0);
        return code >= 0 && code <= 31 ? '_' : char;
      })
      .join('');

    // 파일시스템에서 금지된 문자들 제거
    sanitized = sanitized.replace(/[<>:"|?*]/g, '_');
    return sanitized.replace(/\\/g, '/').replace(/\/+/g, '/').substring(0, this.maxFilenameLength);
  }

  /**
   * 경로를 정규화합니다
   */
  private normalizePath(path: string): string {
    return path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\//, '').replace(/\/$/, '');
  }

  /**
   * 이미지 데이터가 유효한지 검증합니다
   */
  private isValidImageData(data: Uint8Array): boolean {
    try {
      // JPEG 시그니처 확인
      if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
        return true;
      }

      // PNG 시그니처 확인
      if (
        data.length >= 8 &&
        data[0] === 0x89 &&
        data[1] === 0x50 &&
        data[2] === 0x4e &&
        data[3] === 0x47 &&
        data[4] === 0x0d &&
        data[5] === 0x0a &&
        data[6] === 0x1a &&
        data[7] === 0x0a
      ) {
        return true;
      }

      // GIF 시그니처 확인
      if (
        data.length >= 6 &&
        data[0] === 0x47 &&
        data[1] === 0x49 &&
        data[2] === 0x46 &&
        data[3] === 0x38 &&
        (data[4] === 0x37 || data[4] === 0x39) &&
        data[5] === 0x61
      ) {
        return true;
      }

      // WebP 시그니처 확인
      if (
        data.length >= 12 &&
        data[0] === 0x52 &&
        data[1] === 0x49 &&
        data[2] === 0x46 &&
        data[3] === 0x46 &&
        data[8] === 0x57 &&
        data[9] === 0x45 &&
        data[10] === 0x42 &&
        data[11] === 0x50
      ) {
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error validating image data:', error);
      return false;
    }
  }
}

// 편의 함수들

/**
 * 단일 파일로 ZIP을 생성합니다
 */
export async function createSingleFileZip(
  filename: string,
  data: Uint8Array | ArrayBuffer | Blob,
  options?: ZipCreationOptions
): Promise<Blob> {
  const zipCreator = new ZipCreator();
  await zipCreator.addImageFile(filename, data);
  return zipCreator.createZip(options);
}

/**
 * 여러 파일로 ZIP을 생성합니다
 */
export async function createMultiFileZip(
  files: Array<{ filename: string; data: Uint8Array | ArrayBuffer | Blob }>,
  options?: ZipCreationOptions
): Promise<Blob> {
  const zipCreator = new ZipCreator();

  for (const file of files) {
    await zipCreator.addImageFile(file.filename, file.data);
  }

  return zipCreator.createZip(options);
}

/**
 * ZIP 파일 검증 함수
 */
export function validateZipFile(
  files: Array<{ filename: string; size: number }>,
  options?: {
    maxFileSize?: number;
    maxFileCount?: number;
    maxFilenameLength?: number;
  }
): FileValidationResult {
  const maxFileSize = options?.maxFileSize ?? 100 * 1024 * 1024;
  const maxFileCount = options?.maxFileCount ?? 1000;
  const maxFilenameLength = options?.maxFilenameLength ?? 255;

  if (files.length > maxFileCount) {
    return {
      isValid: false,
      reason: `Too many files: ${files.length} > ${maxFileCount}`,
      maxFileCount,
    };
  }

  for (const file of files) {
    if (file.filename.length > maxFilenameLength) {
      return {
        isValid: false,
        reason: `Filename too long: ${file.filename.length} > ${maxFilenameLength}`,
        maxFilenameLength,
      };
    }

    if (file.size > maxFileSize) {
      return {
        isValid: false,
        reason: `File too large: ${file.size} > ${maxFileSize}`,
        maxFileSize,
      };
    }
  }

  return { isValid: true };
}

/**
 * 기본 ZIP 생성기 인스턴스
 */
export const zipCreator = new ZipCreator();
