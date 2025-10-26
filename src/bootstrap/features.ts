/**
 * @fileoverview Bootstrap - Features Services Registration
 * @description Features 레이어 서비스의 지연 등록
 * @module bootstrap/features
 */
import { logger } from '@/shared/logging';
import {
  registerSettingsManager,
  registerTwitterTokenExtractor,
} from '@shared/container/service-accessors';

/**
 * Features 레이어 서비스를 지연 등록합니다
 * - SettingsManager: 사용자 설정 관리
 * - TwitterTokenExtractor: 트위터 토큰 추출
 *
 * @returns {Promise<void>}
 */
export async function registerFeatureServicesLazy(): Promise<void> {
  try {
    logger.debug('[features] Registering feature services');

    // Settings Manager - Features 레이어
    const { getSettingsService } = await import('@features/settings/services/settings-factory');
    const settingsService = await getSettingsService();
    registerSettingsManager(settingsService);

    // DOMCache 초기화 - Shared 레이어의 자율적 설정 구독
    try {
      const { globalDOMCache } = await import('@shared/dom/dom-cache');
      await globalDOMCache.initializeDOMCache(settingsService);
    } catch {
      // DOMCache가 없거나 초기화 전이면 무시
    }

    // Twitter Token Extractor - Features 레이어
    const { TwitterTokenExtractor } = await import(
      '@features/settings/services/twitter-token-extractor'
    );
    registerTwitterTokenExtractor(new TwitterTokenExtractor());

    logger.debug('[features] ✅ Feature services registered');
  } catch (error) {
    // Features 레이어 서비스 로딩 실패는 치명적이지 않음
    logger.warn('[features] ⚠️ Feature service registration failed:', error);
  }
}
