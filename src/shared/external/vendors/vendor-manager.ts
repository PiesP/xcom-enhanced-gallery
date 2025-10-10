/**
 * Core External Vendor Manager Implementation (Solid.js Dynamic Wrapper)
 *
 * @deprecated 테스트 전용 동적 VendorManager. 프로덕션 코드에서는
 * TDZ-safe 정적 API(`StaticVendorManager`)만 사용하세요.
 */

import { logger } from '../../logging';
import {
  StaticVendorManager,
  type NativeDownloadAPI,
  type SolidAPI,
  type SolidStoreAPI,
} from './vendor-manager-static';

export interface FflateAPI {
  zip: typeof import('fflate').zip;
  unzip: typeof import('fflate').unzip;
  strToU8: typeof import('fflate').strToU8;
  strFromU8: typeof import('fflate').strFromU8;
  zipSync: typeof import('fflate').zipSync;
  unzipSync: typeof import('fflate').unzipSync;
  deflate: typeof import('fflate').deflate;
  inflate: typeof import('fflate').inflate;
}

export class VendorManager {
  private static instance: VendorManager | null = null;

  private readonly cache = new Map<string, unknown>();

  private constructor() {
    logger.debug('VendorManager(Solid): 인스턴스 생성');
  }

  public static getInstance(): VendorManager {
    VendorManager.instance ??= new VendorManager();
    return VendorManager.instance;
  }

  private async ensureStaticManager(): Promise<StaticVendorManager> {
    const manager = StaticVendorManager.getInstance();
    const status = manager.getInitializationStatus();

    if (!status.isInitialized) {
      await manager.initialize();
    }

    return manager;
  }

  public async getFflate(): Promise<FflateAPI> {
    const cacheKey = 'fflate';

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as FflateAPI;
    }

    try {
      const fflate = await import('fflate');

      if (!fflate.deflate || typeof fflate.deflate !== 'function') {
        throw new Error('fflate 라이브러리 검증 실패');
      }

      const api: FflateAPI = {
        zip: fflate.zip,
        unzip: fflate.unzip,
        strToU8: fflate.strToU8,
        strFromU8: fflate.strFromU8,
        zipSync: fflate.zipSync,
        unzipSync: fflate.unzipSync,
        deflate: fflate.deflate,
        inflate: fflate.inflate,
      };

      this.cache.set(cacheKey, api);
      logger.debug('fflate 로드 성공');
      return api;
    } catch (error) {
      logger.error('fflate 로드 실패:', error);
      throw new Error('fflate 라이브러리를 사용할 수 없습니다');
    }
  }

  public async getSolid(): Promise<SolidAPI> {
    const manager = await this.ensureStaticManager();
    return manager.getSolid();
  }

  public async getSolidStore(): Promise<SolidStoreAPI> {
    const manager = await this.ensureStaticManager();
    return manager.getSolidStore();
  }

  public getNativeDownload(): NativeDownloadAPI {
    const manager = StaticVendorManager.getInstance();
    return manager.getNativeDownload();
  }

  public async validateAll(): Promise<{
    success: boolean;
    loadedLibraries: string[];
    errors: string[];
  }> {
    const manager = await this.ensureStaticManager();
    return manager.validateAll();
  }

  public getVersionInfo() {
    return StaticVendorManager.getInstance().getVersionInfo();
  }

  public getInitializationStatus() {
    return StaticVendorManager.getInstance().getInitializationStatus();
  }

  public cleanup(): void {
    this.cache.clear();
    StaticVendorManager.getInstance().cleanup();
  }

  public static resetInstance(): void {
    if (VendorManager.instance) {
      VendorManager.instance.cleanup();
      VendorManager.instance = null;
    }
  }
}
