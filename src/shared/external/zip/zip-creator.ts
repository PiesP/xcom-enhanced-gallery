/**
 * @fileoverview ZIP 파일 생성 유틸리티 (X.com Enhanced Gallery용)
 * @description 미디어 아이템 배열로부터 ZIP 파일(Uint8Array) 생성
 * @version 11.0.0 - Phase 200: 주석 명확화, 타입 개선
 *
 * - StoreZipWriter 기반의 가볍고 의존성 없는 구현
 * - 이미 압축된 미디어(JPEG, PNG 등)에는 압축 미적용 (STORE method)
 */

import { logger } from '../../logging';
import { StoreZipWriter } from './store-zip-writer';

/**
 * 미디어 아이템 (ZIP 생성용)
 */
export interface MediaItemForZip {
  /** 주 URL (다운로드 대상) */
  url: string;
  /** 고해상도 URL (있을 경우) */
  originalUrl?: string;
  /** 파일명 */
  filename?: string;
}

/**
 * ZIP 생성 진행률 콜백
 */
export type ZipProgressCallback = (progress: number) => void;

/**
 * ZIP 생성 설정
 */
export interface ZipCreationConfig {
  /** 압축 레벨 (0-9, 0=비압축) */
  compressionLevel: number;
  /** 아이템당 최대 크기 (바이트) */
  maxFileSize: number;
  /** 요청 타임아웃 (ms) */
  requestTimeout: number;
  /** 동시 다운로드 최대 개수 */
  maxConcurrent: number;
}

/**
 * 메모리 파일 맵으로부터 ZIP Uint8Array 생성
 *
 * @param files 파일명-바이트 맵
 * @param _config ZIP 생성 설정 (현재는 미사용)
 * @returns ZIP 파일 Uint8Array
 * @throws ZIP 생성 실패 시
 *
 * @note
 * - StoreZipWriter 기반 (의존성 최소)
 * - STORE method (압축 미적용) - 이미 압축된 미디어용
 * - 로깅으로 크기/파일 수 추적
 */
export async function createZipBytesFromFileMap(
  files: Record<string, Uint8Array>,
  _config: Partial<ZipCreationConfig> = {}
): Promise<Uint8Array> {
  try {
    logger.time('[ZipCreator] createZipBytesFromFileMap');

    const writer = new StoreZipWriter();

    // 모든 파일 추가
    for (const [filename, data] of Object.entries(files)) {
      writer.addFile(filename, data);
    }

    // ZIP 빌드
    const zipBytes = writer.build();

    logger.info(
      `[ZipCreator] ZIP 생성 완료: ${zipBytes.byteLength} bytes, ${Object.keys(files).length} files`
    );
    logger.timeEnd('[ZipCreator] createZipBytesFromFileMap');

    return zipBytes;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('[ZipCreator] createZipBytesFromFileMap 실패:', msg);
    throw new Error(`ZIP 생성 실패: ${msg}`);
  }
}
