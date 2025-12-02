import { promisifyCallback, promisifyVoidCallback } from '@shared/utils/async/promise-helpers';

describe('promise-helpers', () => {
  describe('promisifyCallback', () => {
    it('should resolve with result when callback is called with success', async () => {
      const executor = (cb: (result?: string, error?: string) => void) => {
        cb('success', undefined);
      };
      const result = await promisifyCallback(executor);
      expect(result).toBe('success');
    });

    it('should reject when callback is called with error and no fallback', async () => {
      const executor = (cb: (result?: string, error?: string) => void) => {
        cb(undefined, 'failure');
      };
      await expect(promisifyCallback(executor)).rejects.toThrow('failure');
    });

    it('should resolve with fallback when callback is called with error and fallback is provided', async () => {
      const executor = (cb: (result?: string, error?: string) => void) => {
        cb(undefined, 'failure');
      };
      const fallback = vi.fn().mockReturnValue('fallback');
      const result = await promisifyCallback(executor, { fallback });
      expect(result).toBe('fallback');
      expect(fallback).toHaveBeenCalled();
    });

    it('should reject when executor throws and no fallback', async () => {
      const executor = () => {
        throw new Error('executor error');
      };
      await expect(promisifyCallback(executor)).rejects.toThrow('executor error');
    });

    it('should resolve with fallback when executor throws and fallback is provided', async () => {
      const executor = () => {
        throw new Error('executor error');
      };
      const fallback = vi.fn().mockReturnValue('fallback');
      const result = await promisifyCallback(executor, { fallback });
      expect(result).toBe('fallback');
      expect(fallback).toHaveBeenCalled();
    });

    it('should handle non-Error objects thrown in executor', async () => {
      const executor = () => {
        throw 'string error';
      };
      await expect(promisifyCallback(executor)).rejects.toThrow('string error');
    });
  });

  describe('promisifyVoidCallback', () => {
    it('should resolve when callback is called without error', async () => {
      const executor = (cb: (error?: string) => void) => {
        cb();
      };
      await expect(promisifyVoidCallback(executor)).resolves.toBeUndefined();
    });

    it('should reject when callback is called with error', async () => {
      const executor = (cb: (error?: string) => void) => {
        cb('failure');
      };
      await expect(promisifyVoidCallback(executor)).rejects.toThrow('failure');
    });

    it('should reject when executor throws', async () => {
      const executor = () => {
        throw new Error('executor error');
      };
      await expect(promisifyVoidCallback(executor)).rejects.toThrow('executor error');
    });

    it('should handle non-Error objects thrown in executor', async () => {
      const executor = () => {
        throw 'string error';
      };
      await expect(promisifyVoidCallback(executor)).rejects.toThrow('string error');
    });
  });
});
