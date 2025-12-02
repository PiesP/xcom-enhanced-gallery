import { initializeCriticalSystems } from '@/bootstrap/critical-systems';
import { bootstrapErrorReporter } from '@shared/error';

// Mock logger
vi.mock('@shared/logging', () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
}));

// Mock dependencies
vi.mock('@shared/container', () => ({
  warmupCriticalServices: vi.fn(),
}));

vi.mock('@shared/services/service-initialization', () => ({
  registerCoreServices: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@shared/error', () => ({
  bootstrapErrorReporter: {
    critical: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('initializeCriticalSystems', () => {
  it('should register core services and warmup critical services', async () => {
    const { registerCoreServices } = await import('@shared/services/service-initialization');
    const { warmupCriticalServices } = await import('@shared/container');

    await initializeCriticalSystems();

    expect(registerCoreServices).toHaveBeenCalled();
    expect(warmupCriticalServices).toHaveBeenCalled();
  });

  it('should report error on failure', async () => {
    const { registerCoreServices } = await import('@shared/services/service-initialization');
    const error = new Error('fail');

    (registerCoreServices as any).mockRejectedValueOnce(error);

    await initializeCriticalSystems();

    expect(vi.mocked(bootstrapErrorReporter.critical)).toHaveBeenCalledWith(
      error,
      { code: 'CRITICAL_SYSTEMS_INIT_FAILED' }
    );
  });
});
