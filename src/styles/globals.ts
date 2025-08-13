/**
 * @fileoverview 통합 스타일 시스템 진입점 (v6.0.0)
 * @description 새로운 통합 스타일 관리자를 사용한 안정적인 CSS 주입
 * @version 6.0.0
 */

// 통합 스타일 시스템 사용
import { initializeStyleSystem } from '@shared/styles/style-bootstrapper';
import { createScopedLogger } from '@shared/logging';

const logger = createScopedLogger('GlobalStyles');

/**
 * 스타일 시스템 초기화 실행
 */
async function initGlobalStyles(): Promise<void> {
  try {
    await initializeStyleSystem();
    logger.info('✅ 글로벌 스타일 시스템 초기화 완료');
  } catch (error) {
    logger.error('❌ 글로벌 스타일 시스템 초기화 실패:', error);
    // 스타일 로딩 실패는 치명적이지 않으므로 앱 실행 계속
  }
}

// DOM 준비 상태에 관계없이 안전하게 실행
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalStyles);
  } else {
    // DOM이 이미 준비된 경우 비동기 실행
    setTimeout(initGlobalStyles, 0);
  }
} else {
  // 서버 사이드 렌더링 또는 테스트 환경
  logger.debug('비브라우저 환경에서 스타일 초기화 건너뛰기');
}
