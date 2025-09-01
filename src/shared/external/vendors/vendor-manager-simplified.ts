/**
 * @fileoverview Simplified Vendor Manager (Phase 2.2 GREEN)
 * @description 간소화된 vendor manager - 자동 초기화 제거, 명시적 초기화만 제공
 *
 * TDD Phase: GREEN - 복잡한 자동화 제거
 */

import { logger } from '@shared/logging';

// vendor API들을 직접 import (simplified approach)
import {
  getFflateSafe,
  getPreactSafe,
  getPreactHooksSafe,
  getPreactSignalsSafe,
  getPreactCompatSafe,
  getNativeDownloadAPISafe,
} from './vendor-api-safe-simplified'; // vendor

/**
 * 간소화된 Static Vendor Manager
 * - 자동 초기화 로직 제거
 * - 명시적 initialize() 호출만 제공
 * - 복잡한 메모리 관리 로직 제거
 */
export class SimplifiedVendorManager {
  private static instance: SimplifiedVendorManager | null = null;
  private isInitialized = false;

  private constructor() {
    // 생성자는 단순화 - 자동 초기화 없음
  }

  /**
   * 싱글톤 인스턴스 반환 (단순화)
   */
  static getInstance(): SimplifiedVendorManager {
    if (!SimplifiedVendorManager.instance) {
      SimplifiedVendorManager.instance = new SimplifiedVendorManager();
    }
    return SimplifiedVendorManager.instance;
  }

  /**
   * 명시적 초기화 (자동화 없음)
   */
  initialize(): boolean {
    try {
      // 단순한 초기화 로직
      this.isInitialized = true;
      logger.info('SimplifiedVendorManager 초기화 완료');
      return true;
    } catch (error) {
      logger.error('SimplifiedVendorManager 초기화 실패:', error);
      return false;
    }
  }

  /**
   * 초기화 상태 확인
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * vendor API 접근자들 (단순화)
   */
  getVendors() {
    if (!this.isInitialized) {
      throw new Error(
        'SimplifiedVendorManager가 초기화되지 않았습니다. initialize()를 호출하세요.'
      );
    }

    return {
      fflate: getFflateSafe(),
      preact: getPreactSafe(),
      preactHooks: getPreactHooksSafe(),
      preactSignals: getPreactSignalsSafe(),
      preactCompat: getPreactCompatSafe(),
      nativeDownload: getNativeDownloadAPISafe(),
    };
  }

  /**
   * 정리 (단순화)
   */
  cleanup(): void {
    this.isInitialized = false;
    logger.info('SimplifiedVendorManager 정리 완료');
  }
}

// 기본 export
export const SimplifiedStaticVendorManager = SimplifiedVendorManager;
