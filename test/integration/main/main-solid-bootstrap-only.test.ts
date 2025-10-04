/**
 * @fileoverview Integration spec ensuring Solid bootstrap runs without feature flags.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { importMainWithMocks } from '../../utils/helpers/import-main-with-mocks';
import { resetFeatureFlagOverrides } from '@/shared/config/feature-flags';

describe('main solid bootstrap integration (Stage D)', () => {
  afterEach(() => {
    resetFeatureFlagOverrides();
    vi.unstubAllEnvs();
  });

  it('warms up Solid vendors via the real bootstrap module', async () => {
    const { main } = await importMainWithMocks({ mockSolidBootstrap: false });

    const vendors = await import('@/shared/external/vendors');
    const getSolidCoreMock = vi.mocked(vendors.getSolidCore);
    const getSolidWebMock = vi.mocked(vendors.getSolidWeb);

    expect(getSolidCoreMock).not.toHaveBeenCalled();
    expect(getSolidWebMock).not.toHaveBeenCalled();

    await main.start();

    // Vendor getters는 여러 컴포넌트에서 호출될 수 있으므로 최소 1번 이상 호출되었는지만 확인
    expect(getSolidCoreMock).toHaveBeenCalled();
    expect(getSolidWebMock).toHaveBeenCalled();

    const firstCallCount = getSolidCoreMock.mock.calls.length;
    const firstWebCallCount = getSolidWebMock.mock.calls.length;

    // 두 번째 start() 호출 시 vendor warmup은 재실행되지 않아야 함 (캐시 사용)
    await main.start();

    // 호출 횟수가 증가하지 않았는지 확인 (warmup은 한 번만)
    expect(getSolidCoreMock.mock.calls.length).toBe(firstCallCount);
    expect(getSolidWebMock.mock.calls.length).toBe(firstWebCallCount);

    await main.cleanup();
  });
});
