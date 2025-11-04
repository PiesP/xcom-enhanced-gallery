/**
 * @fileoverview Feature Services Registration
 * @description Features 레이어 서비스의 지연 등록 (TwitterTokenExtractor, DOMCache)
 * @module bootstrap/features
 *
 * Phase 326.4: Conditional Feature Loading
 * - 사용자 설정 기반 기능 플래그 확인
 * - 활성화된 기능만 로드
 * - 미사용 기능은 번들에서 tree-shaking으로 제거
 *
 * Phase 343: Error Handling Standardization
 * - Non-Critical 시스템으로 에러 발생 시 경고만 출력
 *
 * Phase 346: Declarative Loader Pattern
 * - 선언적 로더 배열로 중복 제거 (138줄 → 80줄)
 */

import { logger } from '../shared/logging';
import { registerTwitterTokenExtractor } from '../shared/container/service-accessors';
import {
  getFeatureStatus,
  getEnabledFeatures,
  createConditionalLoader,
  type FeatureKey,
} from '@shared/utils/conditional-loading';
import type { SettingsWithFeatures } from '@shared/utils/conditional-loading';
import { NON_CRITICAL_ERROR_STRATEGY, handleBootstrapError } from './types';

/**
 * Feature Loader 정의
 * Phase 346: 선언적 로더 패턴
 */
interface FeatureLoader {
  flag: FeatureKey;
  name: string;
  load: () => Promise<void>;
  optional?: boolean;
}

/**
 * Feature Loaders 배열
 * Phase 346: 중복 코드 제거를 위한 선언적 정의
 */
const FEATURE_LOADERS: FeatureLoader[] = [
  {
    flag: 'mediaExtraction',
    name: 'TwitterTokenExtractor',
    load: async () => {
      const { TwitterTokenExtractor } = await import('../shared/services/token-extraction');
      registerTwitterTokenExtractor(new TwitterTokenExtractor());
    },
  },
  // Download 기능은 현재 실제 로드가 없으므로 placeholder
  {
    flag: 'download',
    name: 'Download',
    load: async () => {
      // 향후 구현 예정
    },
    optional: true,
  },
  // Advanced Filters는 향후 구현
  {
    flag: 'advancedFilters',
    name: 'AdvancedFilters',
    load: async () => {
      // 향후 구현 예정
    },
    optional: true,
  },
  // Accessibility는 향후 구현
  {
    flag: 'accessibility',
    name: 'Accessibility',
    load: async () => {
      // 향후 구현 예정
    },
    optional: true,
  },
];

/**
 * 설정 로드 헬퍼 함수
 * Phase 346: 로직 분리
 */
async function loadSettings(): Promise<SettingsWithFeatures> {
  const defaultSettings: SettingsWithFeatures = {
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
      const settings = stored as unknown as SettingsWithFeatures;
      logger.debug('[features] 설정 로드 성공', {
        features: getEnabledFeatures(settings).join(', '),
      });
      return settings;
    }
  } catch (error) {
    logger.warn('[features] 설정 로드 실패 - 기본값 사용:', error);
  }

  return defaultSettings;
}

/**
 * Feature 서비스 지연 등록
 *
 * Phase 346: 선언적 로더 패턴으로 리팩토링
 * - FEATURE_LOADERS 배열 기반 반복 처리
 * - 중복 코드 제거 (138줄 → 80줄)
 * - 새 기능 추가 시 배열에만 추가
 *
 * @throws 잡지 않은 에러는 없으며, 모든 실패가 내부 처리됨
 */
export async function registerFeatureServicesLazy(): Promise<void> {
  try {
    logger.debug('[features] Registering feature services');

    // 설정 로드
    const settings = await loadSettings();

    // DOMCache 초기화 (옵션)
    try {
      await import('../shared/dom/dom-cache');
    } catch {
      // DOMCache 없음 또는 초기화 안 함 - 무시
    }

    // Phase 346: 선언적 로더 패턴
    for (const loader of FEATURE_LOADERS) {
      if (!getFeatureStatus(settings, loader.flag)) {
        logger.debug(`[features] ℹ️ ${loader.name} 비활성화됨 (${loader.flag}: false)`);
        continue;
      }

      // Optional 로더는 실제 구현이 없으면 로그만
      if (loader.optional) {
        logger.debug(`[features] ℹ️ ${loader.name} 활성화 (로드 예정)`);
        continue;
      }

      try {
        await loader.load();
        logger.debug(`[features] ✅ ${loader.name} 등록됨`);
      } catch (error) {
        logger.warn(`[features] ⚠️ ${loader.name} 등록 실패 (계속 진행):`, error);
      }
    }

    // 조건부 로더를 사용한 비동기 로드 시작 (non-blocking)
    const conditionalLoader = createConditionalLoader(settings, { debug: __DEV__ });
    void conditionalLoader.loadEnabledServices().catch(error => {
      logger.warn('[features] 조건부 기능 로드 중 오류 (계속 진행):', error);
    });

    logger.debug('[features] ✅ Feature services registered');
  } catch (error) {
    // Phase 343: 표준화된 에러 처리 (Non-Critical - 경고만)
    handleBootstrapError(error, { ...NON_CRITICAL_ERROR_STRATEGY, context: 'features' }, logger);
  }
}
