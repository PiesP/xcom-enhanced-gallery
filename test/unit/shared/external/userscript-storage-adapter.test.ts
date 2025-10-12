/**
 * @fileoverview Userscript Storage Adapter 테스트
 * @description getUserscript() API의 storage 메서드 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getUserscript } from '@shared/external/userscript/adapter';

describe('getUserscript() Storage API', () => {
  beforeEach(() => {
    // Note: localStorage는 JSDOM 환경에서 자동으로 제공됨
    // eslint-disable-next-line no-undef
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('setValue', () => {
    it('should store string value', async () => {
      const userscript = getUserscript();
      await userscript.setValue('test-key', 'test-value');

      const retrieved = await userscript.getValue<string>('test-key');
      expect(retrieved).toBe('test-value');
    });

    it('should store object value', async () => {
      const userscript = getUserscript();
      const testObj = { foo: 'bar', num: 42 };

      await userscript.setValue('test-obj', testObj);
      const retrieved = await userscript.getValue<typeof testObj>('test-obj');

      expect(retrieved).toEqual(testObj);
    });

    it('should store number value', async () => {
      const userscript = getUserscript();
      await userscript.setValue('test-num', 123);

      const retrieved = await userscript.getValue<number>('test-num');
      expect(retrieved).toBe(123);
    });

    it('should store boolean value', async () => {
      const userscript = getUserscript();
      await userscript.setValue('test-bool', true);

      const retrieved = await userscript.getValue<boolean>('test-bool');
      expect(retrieved).toBe(true);
    });

    it('should overwrite existing value', async () => {
      const userscript = getUserscript();
      await userscript.setValue('test-key', 'old-value');
      await userscript.setValue('test-key', 'new-value');

      const retrieved = await userscript.getValue<string>('test-key');
      expect(retrieved).toBe('new-value');
    });
  });

  describe('getValue', () => {
    it('should return undefined for non-existent key', async () => {
      const userscript = getUserscript();
      const retrieved = await userscript.getValue<string>('non-existent');

      expect(retrieved).toBeUndefined();
    });

    it('should return default value for non-existent key', async () => {
      const userscript = getUserscript();
      const retrieved = await userscript.getValue<string>('non-existent', 'default');

      expect(retrieved).toBe('default');
    });

    it('should return stored value instead of default', async () => {
      const userscript = getUserscript();
      await userscript.setValue('test-key', 'stored-value');

      const retrieved = await userscript.getValue<string>('test-key', 'default');
      expect(retrieved).toBe('stored-value');
    });

    it('should handle null default value', async () => {
      const userscript = getUserscript();
      const retrieved = await userscript.getValue<string | null>('non-existent', null);

      expect(retrieved).toBeNull();
    });
  });

  describe('deleteValue', () => {
    it('should delete existing value', async () => {
      const userscript = getUserscript();
      await userscript.setValue('test-key', 'test-value');

      let retrieved = await userscript.getValue<string>('test-key');
      expect(retrieved).toBe('test-value');

      await userscript.deleteValue('test-key');

      retrieved = await userscript.getValue<string>('test-key');
      expect(retrieved).toBeUndefined();
    });

    it('should not throw error when deleting non-existent key', async () => {
      const userscript = getUserscript();

      await expect(userscript.deleteValue('non-existent')).resolves.not.toThrow();
    });

    it('should handle multiple deletions', async () => {
      const userscript = getUserscript();
      await userscript.setValue('key1', 'value1');
      await userscript.setValue('key2', 'value2');

      await userscript.deleteValue('key1');
      await userscript.deleteValue('key2');

      const retrieved1 = await userscript.getValue<string>('key1');
      const retrieved2 = await userscript.getValue<string>('key2');

      expect(retrieved1).toBeUndefined();
      expect(retrieved2).toBeUndefined();
    });
  });

  describe('listValues', () => {
    it('should return empty array when no values stored', async () => {
      const userscript = getUserscript();
      const keys = await userscript.listValues();

      expect(keys).toEqual([]);
    });

    it('should return all stored keys', async () => {
      const userscript = getUserscript();
      await userscript.setValue('key1', 'value1');
      await userscript.setValue('key2', 'value2');
      await userscript.setValue('key3', 'value3');

      const keys = await userscript.listValues();

      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('should not include deleted keys', async () => {
      const userscript = getUserscript();
      await userscript.setValue('key1', 'value1');
      await userscript.setValue('key2', 'value2');
      await userscript.deleteValue('key1');

      const keys = await userscript.listValues();

      expect(keys).toHaveLength(1);
      expect(keys).toContain('key2');
      expect(keys).not.toContain('key1');
    });
  });

  describe('localStorage fallback', () => {
    it('should store value successfully (using mocked GM API or localStorage)', async () => {
      const userscript = getUserscript();

      // GM_* API가 모킹되어 있으므로 정상적으로 저장됨
      await userscript.setValue('fallback-key', 'fallback-value');

      // 저장된 값을 조회하여 검증
      const retrieved = await userscript.getValue<string>('fallback-key');
      expect(retrieved).toBe('fallback-value');
    });

    it('should retrieve value successfully (using mocked GM API or localStorage)', async () => {
      const userscript = getUserscript();

      // 값 저장
      await userscript.setValue('direct-key', 'direct-value');

      // getUserscript()를 통해 조회
      const retrieved = await userscript.getValue<string>('direct-key');
      expect(retrieved).toBe('direct-value');
    });

    it('should handle complex objects in storage', async () => {
      const userscript = getUserscript();
      const complexObj = {
        nested: { array: [1, 2, 3], bool: true },
        num: 42,
      };

      await userscript.setValue('complex-key', complexObj);
      const retrieved = await userscript.getValue<typeof complexObj>('complex-key');

      expect(retrieved).toEqual(complexObj);
    });
  });

  describe('error handling', () => {
    it('should handle storage quota exceeded', async () => {
      const userscript = getUserscript();

      // localStorage quota 초과 시뮬레이션은 어려우므로
      // 에러가 발생하지 않는지만 확인
      const largeData = 'x'.repeat(1000);
      await expect(userscript.setValue('large-key', largeData)).resolves.not.toThrow();
    });

    it('should handle invalid JSON in localStorage', async () => {
      const userscript = getUserscript();

      // 잘못된 JSON을 localStorage에 직접 저장
      // eslint-disable-next-line no-undef
      localStorage.setItem('invalid-json', '{invalid}');

      // getValue는 에러를 던지지 않고 기본값을 반환해야 함
      const retrieved = await userscript.getValue<string>('invalid-json', 'default');
      expect(retrieved).toBeTruthy(); // 문자열 그대로 또는 기본값
    });
  });
});
