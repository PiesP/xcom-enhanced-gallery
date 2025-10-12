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
import type { NestedSettingKey } from '@features/settings/types/settings.types';

/**
 * Features 레이어 서비스를 지연 등록합니다
 * - SettingsManager: 사용자 설정 관리
 * - TwitterTokenExtractor: 트위터 토큰 추출
 * - DOMCache 연동: 설정 변경 시 캐시 TTL 동기화
 *
 * @returns {Promise<void>}
 *
 * @todo DOMCache 연동 로직을 DOMCache 또는 SettingsService로 이동
 *       현재 bootstrap 레이어에서 처리하고 있으나, shared/services 레이어의 책임
 */
export async function registerFeatureServicesLazy(): Promise<void> {
  try {
    logger.debug('Features 서비스 지연 등록 시작');

    // Settings Manager - Features 레이어
    const { getSettingsService } = await import('@features/settings/services/settings-factory');
    const settingsService = await getSettingsService();
    registerSettingsManager(settingsService);

    // 성능 설정(cacheTTL) 변화를 DOMCache에 반영
    try {
      const { globalDOMCache } = await import('@shared/dom/DOMCache');
      const initialTTL = settingsService.get<number>('performance.cacheTTL' as NestedSettingKey);
      if (typeof initialTTL === 'number') {
        globalDOMCache.setDefaultTTL(initialTTL);
      }
      if (typeof settingsService.subscribe === 'function') {
        settingsService.subscribe(event => {
          if (
            (event.key as NestedSettingKey) === 'performance.cacheTTL' &&
            typeof event.newValue === 'number'
          ) {
            globalDOMCache.setDefaultTTL(event.newValue);
          }
        });
      }
    } catch {
      // DOMCache가 없거나 초기화 전이면 무시
    }

    // Twitter Token Extractor - Features 레이어
    const { TwitterTokenExtractor } = await import(
      '@features/settings/services/twitter-token-extractor'
    );
    registerTwitterTokenExtractor(new TwitterTokenExtractor());

    logger.debug('✅ Features 서비스 지연 등록 완료');
  } catch (error) {
    // Features 레이어 서비스 로딩 실패는 치명적이지 않음
    logger.warn('⚠️ Features 서비스 지연 로딩 실패:', error);
  }
}
