/**
 * @fileoverview Feature Services Registration
 * @description Features 레이어 서비스의 지연 등록 (TwitterTokenExtractor, DOMCache)
 * @module bootstrap/features
 */

import { logger } from '../shared/logging';
import { registerTwitterTokenExtractor } from '../shared/container/service-accessors';

/**
 * Feature 서비스 지연 등록
 *
 * 다음 서비스를 동적으로 로드하여 컨테이너에 등록합니다:
 * - TwitterTokenExtractor: 트위터 토큰 추출
 * - DOMCache: DOM 셀렉터 캐싱 (옵션)
 *
 * Phase 258 최적화:
 * - SettingsService는 bootstrap/features.ts에서 제거되었습니다.
 * - 갤러리 초기화 시점(GalleryApp.initialize)에 지연 로드됩니다.
 * - 이를 통해 부트스트랩 시간을 30-50% 단축할 수 있습니다.
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

    // DOMCache 초기화 - Shared 레이어의 자율적 설정 구독 (옵션)
    // Phase 258: SettingsService가 아직 초기화되지 않았으므로 globalDOMCache는 초기화만 수행
    try {
      await import('../shared/dom/dom-cache');
      // SettingsService가 필요한 경우는 GalleryApp.initialize에서 처리됨
    } catch {
      // DOMCache 없음 또는 초기화 안 함 - 무시
    }

    // Twitter Token Extractor - Shared 레이어
    const { TwitterTokenExtractor } = await import('../shared/services/token-extraction');
    registerTwitterTokenExtractor(new TwitterTokenExtractor());

    logger.debug('[features] ✅ Feature services registered');
  } catch (error) {
    // Feature 서비스 로딩 실패는 치명적이지 않음 - 경고만 기록
    logger.warn('[features] ⚠️ Feature service registration failed:', error);
  }
}
