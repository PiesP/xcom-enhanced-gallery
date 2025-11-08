/**
 * ServiceHarness Contract Test
 * - 목적: AppContainer 없이 테스트용 DI/초기화가 가능한지 검증
 * - Phase 226: service-harness.ts 제거로 인한 import 경로 변경
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import { createTestHarness } from '@shared/container';
import { SERVICE_KEYS } from '@/constants';

describe('ServiceHarness — 경량 테스트 하네스', () => {
  setupGlobalTestIsolation();

  let harness: ReturnType<typeof createTestHarness>;

  beforeEach(() => {
    harness = createTestHarness();
  });

  afterEach(() => {
    // 하네스 리셋은 싱글톤 코어 서비스까지 초기화한다
    harness.reset();
  });

  it('core services를 초기화하고 기본 서비스에 접근할 수 있어야 한다', async () => {
    await harness.initCoreServices();

    // 필수 서비스들이 등록되어야 함
    const theme = harness.get<unknown>(SERVICE_KEYS.THEME);
    const media = harness.get<unknown>(SERVICE_KEYS.MEDIA_SERVICE);

    expect(theme).toBeDefined();
    expect(media).toBeDefined();
  });

  it('reset() 호출로 등록 상태를 초기화할 수 있어야 한다', async () => {
    await harness.initCoreServices();
    expect(harness.get<unknown>(SERVICE_KEYS.THEME)).toBeDefined();

    harness.reset();

    // tryGet은 null을 반환해야 함 (등록 해제 상태)
    expect(harness.tryGet<unknown>(SERVICE_KEYS.THEME)).toBeNull();
  });
});
