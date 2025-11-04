/**
 * @fileoverview Base Services Initialization
 * @description Phase 2.1: BaseService 생명주기 중앙화
 * Phase A5.2에서 분리된 기본 서비스 초기화
 * Phase 343: 표준화된 에러 처리
 */

import { logger, tracePoint } from '../shared/logging';
import {
  registerCoreBaseServices,
  initializeBaseServices,
} from '../shared/container/service-accessors';
import { NON_CRITICAL_ERROR_STRATEGY, handleBootstrapError } from './types';

/**
 * Phase A5.2: BaseService 생명주기 중앙화 초기화
 *
 * 책임:
 * - AnimationService 등록 및 초기화
 * - ThemeService 등록 및 초기화
 * - LanguageService 등록 및 초기화
 * - service-manager에서 중앙 관리
 *
 * Phase 343: Non-Critical 시스템으로 실패 시 경고만 출력하고 앱은 계속 진행
 *
 * @note 실패 시 경고만 출력하고 앱은 계속 진행 (non-critical)
 */
export async function initializeCoreBaseServices(): Promise<void> {
  try {
    logger.debug('🔄 BaseService 레지스트리 등록 중...');
    if (__DEV__ && tracePoint) tracePoint('baseservice:register:start');
    registerCoreBaseServices();

    logger.debug('🔄 BaseService 초기화 중...');
    if (__DEV__ && tracePoint) tracePoint('baseservice:init:start');
    await initializeBaseServices();

    logger.debug('✅ BaseService 초기화 완료');
    if (__DEV__ && tracePoint) tracePoint('baseservice:init:done');
  } catch (error) {
    // Phase 343: 표준화된 에러 처리 (Non-Critical - 경고만)
    handleBootstrapError(
      error,
      { ...NON_CRITICAL_ERROR_STRATEGY, context: 'base-services' },
      logger
    );
  }
}
