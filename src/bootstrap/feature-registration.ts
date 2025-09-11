import { SERVICE_KEYS } from '@/constants';
import { logger } from '@/shared/logging';
import { bridgeRegister } from '@shared/container/service-bridge';
import type { NestedSettingKey } from '@features/settings/types/settings.types';

/**
 * Features 서비스 지연 등록 (초기화는 하지 않음)
 */
export async function registerFeatureServicesLazy(): Promise<void> {
  try {
    logger.debug('Features 서비스 지연 등록 시작');

    // Settings Manager - Features 레이어
    const { getSettingsService } = await import('@features/settings/services/settings-factory');
    const settingsService = await getSettingsService();
    bridgeRegister(SERVICE_KEYS.SETTINGS, settingsService);

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
      '@features/settings/services/TwitterTokenExtractor'
    );
    bridgeRegister(SERVICE_KEYS.TWITTER_TOKEN_EXTRACTOR, new TwitterTokenExtractor());

    logger.debug('✅ Features 서비스 지연 등록 완료');
  } catch (error) {
    // Features 레이어 서비스 로딩 실패는 치명적이지 않음
    logger.warn('⚠️ Features 서비스 지연 로딩 실패:', error);
  }
}
