/**
 * @fileoverview Dev tools bootstrap tests
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';

const sharedDiagnosticsPath = '../../../src/shared/services/diagnostics';
const bootstrapDevToolsPath = '../../../src/bootstrap/dev-tools';

describe('initializeDevTools', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv('DEV', true);
  });

  it('registers diagnostics without forcing manager scans', async () => {
    const registerDiagnosticsGlobal = vi.fn();
    const diagnoseServiceManager = vi.fn();

    vi.doMock(sharedDiagnosticsPath, () => ({
      registerDiagnosticsGlobal,
      diagnoseServiceManager,
    }));

    const { initializeDevTools } = await import(bootstrapDevToolsPath);

    await initializeDevTools();

    expect(registerDiagnosticsGlobal).toHaveBeenCalledTimes(1);
    expect(diagnoseServiceManager).not.toHaveBeenCalled();
  });

  it('only registers once per session', async () => {
    const registerDiagnosticsGlobal = vi.fn();

    vi.doMock(sharedDiagnosticsPath, () => ({
      registerDiagnosticsGlobal,
      diagnoseServiceManager: vi.fn(),
    }));

    const { initializeDevTools } = await import(bootstrapDevToolsPath);

    await initializeDevTools();
    await initializeDevTools();

    expect(registerDiagnosticsGlobal).toHaveBeenCalledTimes(1);
  });

  it('skips initialization when not in dev mode', async () => {
    vi.stubEnv('DEV', false);
    const registerDiagnosticsGlobal = vi.fn();

    vi.doMock(sharedDiagnosticsPath, () => ({
      registerDiagnosticsGlobal,
      diagnoseServiceManager: vi.fn(),
    }));

    const { initializeDevTools } = await import(bootstrapDevToolsPath);

    await initializeDevTools();

    expect(registerDiagnosticsGlobal).not.toHaveBeenCalled();
  });
});
