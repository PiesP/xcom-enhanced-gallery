/**
 * @fileoverview Tests for bootstrap utilities
 */


import { executeStage, executeStages, loadService, withInitContext, withRetry } from '@/bootstrap/utils';

// Mock dependencies
vi.mock('@shared/error', () => ({
  bootstrapErrorReporter: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Bootstrap Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeStage', () => {
    it('should execute a successful stage', async () => {
      const stage = {
        label: 'Test Stage',
        run: vi.fn().mockResolvedValue(undefined),
      };

      const result = await executeStage(stage);

      expect(result.success).toBe(true);
      expect(result.label).toBe('Test Stage');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(stage.run).toHaveBeenCalledOnce();
    });

    it('should handle synchronous stage functions', async () => {
      const stage = {
        label: 'Sync Stage',
        run: vi.fn(),
      };

      const result = await executeStage(stage);

      expect(result.success).toBe(true);
      expect(stage.run).toHaveBeenCalledOnce();
    });

    it('should handle stage failure', async () => {
      const stage = {
        label: 'Failing Stage',
        run: vi.fn().mockRejectedValue(new Error('Stage failed')),
      };

      const result = await executeStage(stage);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should mark optional stage failures as warnings', async () => {
      const { bootstrapErrorReporter } = await import('@shared/error');
      const stage = {
        label: 'Optional Stage',
        run: vi.fn().mockRejectedValue(new Error('Optional failed')),
        optional: true,
      };

      const result = await executeStage(stage);

      expect(result.success).toBe(false);
      expect(bootstrapErrorReporter.warn).toHaveBeenCalled();
    });
  });

  describe('executeStages', () => {
    it('should execute all stages in sequence', async () => {
      const order: number[] = [];
      const stages = [
        { label: 'Stage 1', run: () => { order.push(1); } },
        { label: 'Stage 2', run: () => { order.push(2); } },
        { label: 'Stage 3', run: () => { order.push(3); } },
      ];

      const results = await executeStages(stages);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(order).toEqual([1, 2, 3]);
    });

    it('should stop on first non-optional failure by default', async () => {
      const stage1Run = vi.fn();
      const stage2Run = vi.fn().mockRejectedValue(new Error('Fail'));
      const stage3Run = vi.fn();
      const stages = [
        { label: 'Stage 1', run: stage1Run },
        { label: 'Stage 2', run: stage2Run },
        { label: 'Stage 3', run: stage3Run },
      ];

      const results = await executeStages(stages);

      expect(results).toHaveLength(2);
      expect(stage3Run).not.toHaveBeenCalled();
    });

    it('should continue past optional failures', async () => {
      const stage1Run = vi.fn();
      const stage2Run = vi.fn().mockRejectedValue(new Error('Fail'));
      const stage3Run = vi.fn();
      const stages = [
        { label: 'Stage 1', run: stage1Run },
        { label: 'Stage 2', run: stage2Run, optional: true },
        { label: 'Stage 3', run: stage3Run },
      ];

      const results = await executeStages(stages);

      expect(results).toHaveLength(3);
      expect(stage3Run).toHaveBeenCalled();
    });

    it('should not stop on failure when stopOnFailure is false', async () => {
      const stage1Run = vi.fn();
      const stage2Run = vi.fn().mockRejectedValue(new Error('Fail'));
      const stage3Run = vi.fn();
      const stages = [
        { label: 'Stage 1', run: stage1Run },
        { label: 'Stage 2', run: stage2Run },
        { label: 'Stage 3', run: stage3Run },
      ];

      const results = await executeStages(stages, { stopOnFailure: false });

      expect(results).toHaveLength(3);
      expect(stage3Run).toHaveBeenCalled();
    });
  });

  describe('loadService', () => {
    it('should load service successfully', async () => {
      const mockService = { name: 'TestService' };
      const loader = vi.fn().mockResolvedValue(mockService);

      const result = await loadService(loader, { name: 'TestService' });

      expect(result.success).toBe(true);
      expect(result.service).toBe(mockService);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle loader failure', async () => {
      const loader = vi.fn().mockRejectedValue(new Error('Load failed'));

      const result = await loadService(loader, { name: 'FailingService' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Load failed');
      expect(result.service).toBeUndefined();
    });

    it('should timeout after specified duration', async () => {
      const loader = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 500)),
      );

      const result = await loadService(loader, {
        name: 'SlowService',
        timeoutMs: 50,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    it('should use recoverable error handling when specified', async () => {
      const { bootstrapErrorReporter } = await import('@shared/error');
      const loader = vi.fn().mockRejectedValue(new Error('Recoverable'));

      await loadService(loader, { name: 'RecoverableService', recoverable: true });

      expect(bootstrapErrorReporter.warn).toHaveBeenCalled();
    });
  });

  describe('withInitContext', () => {
    it('should return result on success', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withInitContext('Test', fn);

      expect(result).toBe('success');
    });

    it('should throw on failure when not recoverable', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Failed'));

      await expect(withInitContext('Test', fn)).rejects.toThrow('Failed');
    });

    it('should return default value on recoverable failure', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Failed'));

      const result = await withInitContext('Test', fn, {
        recoverable: true,
        defaultValue: 'fallback',
      });

      expect(result).toBe('fallback');
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const wrapped = withRetry(fn);

      const result = await wrapped();

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledOnce();
    });

    it('should retry on failure', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const wrapped = withRetry(fn, { maxAttempts: 3, delayMs: 10 });

      const result = await wrapped();

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Always fails'));
      const wrapped = withRetry(fn, { maxAttempts: 2, delayMs: 10 });

      await expect(wrapped()).rejects.toThrow('Always fails');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
