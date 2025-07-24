/**
 * @fileoverview 단순화된 서비스 시스템
 * @description 유저스크립트에 적합한 간단한 서비스 관리
 *
 * 변경사항:
 * - 복잡한 DI 시스템 제거
 * - 서비스 매니저 대신 직접 import 사용
 * - 지연 로딩 제거 (유저스크립트에서는 불필요)
 * - 싱글톤 패턴 단순화
 */

import { logger } from '@core/logging/logger';

/**
 * 기본 서비스 인터페이스
 */
export interface SimpleService {
  cleanup?(): void | Promise<void>;
}

/**
 * 갤러리 서비스 (핵심 기능만)
 */
export class GalleryService implements SimpleService {
  private static instance: GalleryService | null = null;

  public static getInstance(): GalleryService {
    if (!GalleryService.instance) {
      GalleryService.instance = new GalleryService();
    }
    return GalleryService.instance;
  }

  private constructor() {
    logger.debug('[GalleryService] 초기화됨');
  }

  public async cleanup(): Promise<void> {
    logger.debug('[GalleryService] 정리됨');
  }
}

/**
 * 미디어 서비스 (핵심 기능만)
 */
export class MediaService implements SimpleService {
  private static instance: MediaService | null = null;

  public static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  private constructor() {
    logger.debug('[MediaService] 초기화됨');
  }

  public async cleanup(): Promise<void> {
    logger.debug('[MediaService] 정리됨');
  }
}

/**
 * 다운로드 서비스 (핵심 기능만)
 */
export class DownloadService implements SimpleService {
  private static instance: DownloadService | null = null;

  public static getInstance(): DownloadService {
    if (!DownloadService.instance) {
      DownloadService.instance = new DownloadService();
    }
    return DownloadService.instance;
  }

  private constructor() {
    logger.debug('[DownloadService] 초기화됨');
  }

  public async cleanup(): Promise<void> {
    logger.debug('[DownloadService] 정리됨');
  }
}

/**
 * 간단한 서비스 컨테이너
 */
export class SimpleServiceContainer {
  private static instance: SimpleServiceContainer | null = null;
  private readonly services: SimpleService[] = [];

  public static getInstance(): SimpleServiceContainer {
    if (!SimpleServiceContainer.instance) {
      SimpleServiceContainer.instance = new SimpleServiceContainer();
    }
    return SimpleServiceContainer.instance;
  }

  private constructor() {
    logger.debug('[SimpleServiceContainer] 초기화됨');
  }

  /**
   * 서비스 등록
   */
  public register(service: SimpleService): void {
    this.services.push(service);
  }

  /**
   * 모든 서비스 정리
   */
  public async cleanup(): Promise<void> {
    logger.info('[SimpleServiceContainer] 서비스들 정리 중...');

    await Promise.all(
      this.services.map(async service => {
        try {
          await service.cleanup?.();
        } catch (error) {
          logger.warn('[SimpleServiceContainer] 서비스 정리 중 오류:', error);
        }
      })
    );

    this.services.length = 0;
    logger.info('[SimpleServiceContainer] 모든 서비스 정리 완료');
  }
}

/**
 * 핵심 서비스들 초기화
 */
export function initializeCoreServices(): SimpleServiceContainer {
  const container = SimpleServiceContainer.getInstance();

  // 핵심 서비스들 등록
  container.register(GalleryService.getInstance());
  container.register(MediaService.getInstance());
  container.register(DownloadService.getInstance());

  logger.info('[Services] 핵심 서비스들 초기화 완료');
  return container;
}

/**
 * 편의 함수들
 */
export function getGalleryService(): GalleryService {
  return GalleryService.getInstance();
}

export function getMediaService(): MediaService {
  return MediaService.getInstance();
}

export function getDownloadService(): DownloadService {
  return DownloadService.getInstance();
}
