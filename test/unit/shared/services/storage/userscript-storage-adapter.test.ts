/**
 * @fileoverview UserscriptStorageAdapter 테스트
 * @description StorageAdapter 인터페이스 구현 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserscriptStorageAdapter } from '@features/settings/services/storage/userscript-storage-adapter';
import type { UserscriptAPI } from '@shared/external/userscript/adapter';

describe('UserscriptStorageAdapter', () => {
  let mockUserscript: UserscriptAPI;
  let adapter: UserscriptStorageAdapter;

  beforeEach(() => {
    // getUserscript() 모킹
    const storage = new Map<string, unknown>();

    mockUserscript = {
      hasGM: true,
      manager: 'tampermonkey',
      info: vi.fn(() => null),
      download: vi.fn(),
      xhr: vi.fn(),
      setValue: vi.fn(async (key: string, value: unknown) => {
        storage.set(key, value);
      }),
      getValue: vi.fn(async <T>(key: string, defaultValue?: T) => {
        return (storage.get(key) ?? defaultValue) as T | undefined;
      }),
      deleteValue: vi.fn(async (key: string) => {
        storage.delete(key);
      }),
      listValues: vi.fn(async () => {
        return Array.from(storage.keys());
      }),
    };

    adapter = new UserscriptStorageAdapter(mockUserscript);
  });

  describe('getItem', () => {
    it('should return null for non-existent key', async () => {
      const result = await adapter.getItem('non-existent');
      expect(result).toBeNull();
    });

    it('should return string value', async () => {
      await mockUserscript.setValue('test-key', 'test-value');
      const result = await adapter.getItem('test-key');
      expect(result).toBe('test-value');
    });

    it('should return JSON-serialized object', async () => {
      const obj = { foo: 'bar', num: 42 };
      await mockUserscript.setValue('obj-key', obj);
      const result = await adapter.getItem('obj-key');
      expect(result).toBe(JSON.stringify(obj));
    });

    it('should return null when value is null', async () => {
      await mockUserscript.setValue('null-key', null);
      const result = await adapter.getItem('null-key');
      expect(result).toBeNull();
    });

    it('should return null when value is undefined', async () => {
      // undefined는 저장되지 않으므로 null 반환
      const result = await adapter.getItem('undefined-key');
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockUserscript.getValue = vi.fn().mockRejectedValue(new Error('Storage error'));
      const result = await adapter.getItem('error-key');
      expect(result).toBeNull();
    });
  });

  describe('setItem', () => {
    it('should store string value', async () => {
      await adapter.setItem('string-key', 'string-value');
      expect(mockUserscript.setValue).toHaveBeenCalledWith('string-key', 'string-value');
    });

    it('should store JSON object', async () => {
      const obj = { foo: 'bar', num: 42 };
      await adapter.setItem('obj-key', JSON.stringify(obj));
      expect(mockUserscript.setValue).toHaveBeenCalledWith('obj-key', obj);
    });

    it('should store JSON array', async () => {
      const arr = [1, 2, 3, 4, 5];
      await adapter.setItem('arr-key', JSON.stringify(arr));
      expect(mockUserscript.setValue).toHaveBeenCalledWith('arr-key', arr);
    });

    it('should handle non-JSON strings', async () => {
      await adapter.setItem('plain-key', 'not-json');
      expect(mockUserscript.setValue).toHaveBeenCalledWith('plain-key', 'not-json');
    });

    it('should throw error on storage failure', async () => {
      mockUserscript.setValue = vi.fn().mockRejectedValue(new Error('Storage quota exceeded'));
      await expect(adapter.setItem('fail-key', 'value')).rejects.toThrow();
    });

    it('should overwrite existing value', async () => {
      await adapter.setItem('overwrite-key', 'old-value');
      await adapter.setItem('overwrite-key', 'new-value');

      const result = await adapter.getItem('overwrite-key');
      expect(result).toBe('new-value');
    });
  });

  describe('removeItem', () => {
    it('should remove existing item', async () => {
      await adapter.setItem('remove-key', 'remove-value');
      await adapter.removeItem('remove-key');

      expect(mockUserscript.deleteValue).toHaveBeenCalledWith('remove-key');

      const result = await adapter.getItem('remove-key');
      expect(result).toBeNull();
    });

    it('should not throw when removing non-existent key', async () => {
      await expect(adapter.removeItem('non-existent')).resolves.not.toThrow();
    });

    it('should throw error on deletion failure', async () => {
      mockUserscript.deleteValue = vi.fn().mockRejectedValue(new Error('Delete failed'));
      await expect(adapter.removeItem('fail-key')).rejects.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all items', async () => {
      await adapter.setItem('key1', 'value1');
      await adapter.setItem('key2', 'value2');
      await adapter.setItem('key3', 'value3');

      await adapter.clear();

      expect(mockUserscript.deleteValue).toHaveBeenCalledTimes(3);

      const result1 = await adapter.getItem('key1');
      const result2 = await adapter.getItem('key2');
      const result3 = await adapter.getItem('key3');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
    });

    it('should not throw when clearing empty storage', async () => {
      await expect(adapter.clear()).resolves.not.toThrow();
    });

    it('should throw error on clear failure', async () => {
      await adapter.setItem('key1', 'value1');
      mockUserscript.deleteValue = vi.fn().mockRejectedValue(new Error('Delete failed'));
      await expect(adapter.clear()).rejects.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple operations in sequence', async () => {
      await adapter.setItem('seq1', 'value1');
      await adapter.setItem('seq2', 'value2');

      const v1 = await adapter.getItem('seq1');
      expect(v1).toBe('value1');

      await adapter.removeItem('seq1');
      const v1After = await adapter.getItem('seq1');
      expect(v1After).toBeNull();

      const v2 = await adapter.getItem('seq2');
      expect(v2).toBe('value2');

      await adapter.clear();
      const v2After = await adapter.getItem('seq2');
      expect(v2After).toBeNull();
    });

    it('should preserve object structure through save/load cycle', async () => {
      const complexObj = {
        str: 'hello',
        num: 123,
        bool: true,
        arr: [1, 2, 3],
        nested: { foo: 'bar' },
      };

      await adapter.setItem('complex', JSON.stringify(complexObj));
      const retrieved = await adapter.getItem('complex');

      expect(JSON.parse(retrieved!)).toEqual(complexObj);
    });
  });
});
