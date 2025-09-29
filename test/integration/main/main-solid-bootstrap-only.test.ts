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

    expect(getSolidCoreMock).toHaveBeenCalledTimes(1);
    expect(getSolidWebMock).toHaveBeenCalledTimes(1);

    await main.start();

    expect(getSolidCoreMock).toHaveBeenCalledTimes(1);
    expect(getSolidWebMock).toHaveBeenCalledTimes(1);

    await main.cleanup();
  });
});
