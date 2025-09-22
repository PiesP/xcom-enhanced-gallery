/**
 * 런타임 환경 초기화(벤더/전역 설정)
 * - 사이드이펙트 없는 함수로 유지 (호출 시에만 동작)
 */
import { logger } from '@/shared/logging';
import { setUserscriptNetworkPolicy } from '@shared/external/userscript/adapter';

export async function initializeEnvironment(): Promise<void> {
  const { initializeVendors } = await import('@shared/external/vendors');
  await initializeVendors();

  // NetPolicy-001: 프로덕션에서 네트워크 정책 기본 활성화
  if (import.meta?.env?.PROD) {
    setUserscriptNetworkPolicy({
      enabled: true,
      // vite.config.ts 헤더의 @connect와 일치하도록 유지
      allowlist: [
        'x.com',
        'api.twitter.com',
        'pbs.twimg.com',
        'video.twimg.com',
        'abs.twimg.com',
        'abs-0.twimg.com',
      ],
      notifyOnBlock: true,
    });
    logger.debug('✅ Network policy enabled (prod)');
  } else {
    logger.debug('ℹ️ Network policy disabled (dev/test)');
  }
  logger.debug('✅ Environment: vendors initialized');
}
