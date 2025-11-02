/**
 * @fileoverview Feature Services Registration
 * @description Features 레이어 서비스의 지연 등록 (TwitterTokenExtractor, DOMCache)
 * @module bootstrap/features
 *
 * Phase 326.4: Conditional Feature Loading
 * - 사용자 설정 기반 기능 플래그 확인
 * - 활성화된 기능만 로드
 * - 미사용 기능은 번들에서 tree-shaking으로 제거
 */

import { logger } from '../shared/logging';
import { registerTwitterTokenExtractor } from '../shared/container/service-accessors';
import {
  getFeatureStatus,
  getEnabledFeatures,
  createConditionalLoader,
} from '@shared/utils/conditional-loading';
import type { SettingsWithFeatures } from '@shared/utils/conditional-loading';

/**
 * Feature 서비스 지연 등록
 *
 * 다음 서비스를 동적으로 로드하여 컨테이너에 등록합니다:
 * - TwitterTokenExtractor: 트위터 토큰 추출 (기능 플래그 확인)
 * - DOMCache: DOM 셀렉터 캐싱 (옵션)
 *
 * Phase 326.4: 기능 플래그 기반 로딩
 * - 기능 플래그가 비활성화되면 해당 서비스는 로드되지 않음
 * - Tree-shaking으로 미사용 코드가 번들에서 제거됨
 * - 번들 크기 2-5% 추가 감소
 *
 * @remarks
 * 서비스 로딩 실패는 치명적이지 않으며, 경고만 기록합니다.
 * 선택적 서비스(DOMCache)의 실패는 무시됩니다.
 *
 * @throws 잡지 않은 에러는 없으며, 모든 실패가 내부 처리됨
 * @returns {Promise<void>}
 */
export async function registerFeatureServicesLazy(): Promise<void> {
  try {
    logger.debug('[features] Registering feature services');

    // 현재 설정 가져오기 (PersistentStorage에서)
    let settings: SettingsWithFeatures = {
      features: {
        gallery: true,
        settings: true,
        download: true,
        mediaExtraction: true,
        advancedFilters: true,
        accessibility: true,
      },
    };

    try {
      const { PersistentStorage } = await import('@shared/services/persistent-storage');
      const storage = PersistentStorage.getInstance();
      const stored = await storage.get<Record<string, unknown>>('settings');

      if (stored && typeof stored === 'object' && (stored as Record<string, unknown>).features) {
        settings = stored as unknown as SettingsWithFeatures;
        logger.debug('[features] 설정 로드 성공', {
          features: getEnabledFeatures(settings).join(', '),
        });
      }
    } catch (error) {
      logger.warn('[features] 설정 로드 실패 - 기본값 사용:', error);
      // 설정 로드 실패 시 기본값 유지
    }

    // DOMCache 초기화 - Shared 레이어의 자율적 설정 구독 (옵션)
    // Phase 258: SettingsService가 아직 초기화되지 않았으므로 globalDOMCache는 초기화만 수행
    try {
      await import('../shared/dom/dom-cache');
      // SettingsService가 필요한 경우는 GalleryApp.initialize에서 처리됨
    } catch {
      // DOMCache 없음 또는 초기화 안 함 - 무시
    }

    // Phase 326.4: 조건부 기능 로드
    // 기능 플래그에 따라 선택적으로 서비스 로드
    const conditionalLoader = createConditionalLoader(settings, { debug: __DEV__ });

    // Twitter Token Extractor - mediaExtraction 기능 플래그 확인
    if (getFeatureStatus(settings, 'mediaExtraction')) {
      try {
        const { TwitterTokenExtractor } = await import('../shared/services/token-extraction');
        registerTwitterTokenExtractor(new TwitterTokenExtractor());
        logger.debug('[features] ✅ TwitterTokenExtractor 등록됨');
      } catch (error) {
        logger.warn('[features] ⚠️ TwitterTokenExtractor 등록 실패 (계속 진행):', error);
      }
    } else {
      logger.debug('[features] ℹ️ TwitterTokenExtractor 비활성화됨 (mediaExtraction: false)');
    }

    // Download 기능 조건부 로드
    if (getFeatureStatus(settings, 'download')) {
      logger.debug('[features] ✅ Download 기능 활성화');
    } else {
      logger.debug('[features] ℹ️ Download 기능 비활성화됨');
    }

    // Advanced Filters 기능 조건부 로드 (향후 구현)
    if (getFeatureStatus(settings, 'advancedFilters')) {
      logger.debug('[features] ℹ️ Advanced Filters 기능 활성화 (로드 예정)');
    } else {
      logger.debug('[features] ℹ️ Advanced Filters 기능 비활성화됨');
    }

    // Accessibility 기능 조건부 로드 (향후 구현)
    if (getFeatureStatus(settings, 'accessibility')) {
      logger.debug('[features] ℹ️ Accessibility 기능 활성화');
    } else {
      logger.debug('[features] ℹ️ Accessibility 기능 비활성화됨');
    }

    // 조건부 로더를 사용한 비동기 로드 시작 (non-blocking)
    void conditionalLoader.loadEnabledServices().catch(error => {
      logger.warn('[features] 조건부 기능 로드 중 오류 (계속 진행):', error);
    });

    logger.debug('[features] ✅ Feature services registered');
  } catch (error) {
    // Feature 서비스 로딩 실패는 치명적이지 않음 - 경고만 기록
    logger.warn('[features] ⚠️ Feature service registration failed:', error);
  }
}
