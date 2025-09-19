/**
 * CORE-REG-DEDUPE P1 (RED): 동일 키 중복 등록 제거
 * 목표: registerCoreServices() 실행 시 동일 키(특히 THEME)의 중복 register 호출이 없어야 한다.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { serviceManager } from '@/shared/services/ServiceManager';

describe('CORE-REG-DEDUPE P1 (RED)', () => {
  beforeEach(() => {
    // 테스트 격리를 위해 서비스 상태 초기화
    (serviceManager as any).reset?.();
  });

  it('registerCoreServices() 호출 시 SERVICE_KEYS.THEME는 정확히 1회만 등록되어야 한다', async () => {
    const { SERVICE_KEYS } = await import('@/constants');
    const { registerCoreServices } = await import('@/shared/services/service-initialization');

    const spy = vi.spyOn(serviceManager, 'register');

    await registerCoreServices();

    const themeCalls = spy.mock.calls.filter(([key]) => key === SERVICE_KEYS.THEME);
    // 기대: 중복 없음 → 1회만 호출
    expect(themeCalls.length).toBe(1);

    spy.mockRestore();
  });
});
