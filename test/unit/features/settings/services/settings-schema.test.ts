import {
  computeSettingsSchemaHashFrom,
  computeCurrentSettingsSchemaHash,
  __private
} from '@features/settings/services/settings-schema';
import { DEFAULT_SETTINGS } from '@/constants';

describe('Settings Schema', () => {
  describe('computeHash', () => {
    const { computeHash } = __private;

    it('should produce deterministic hash for same input', () => {
      const input = { foo: 'bar' };
      // JSON.stringify order is not guaranteed for objects in JS generally,
      // but for simple objects in V8 it often is.
      // However, the implementation uses JSON.stringify(input).
      // Let's rely on the fact that for the same object reference or simple structure it should be same.
      expect(computeHash(input)).toBe(computeHash({ foo: 'bar' }));
    });

    it('should produce different hash for different input', () => {
      expect(computeHash({ foo: 'bar' })).not.toBe(computeHash({ foo: 'baz' }));
    });

    it('should handle empty string', () => {
        expect(computeHash("")).toBeDefined();
    });

    it('should handle special characters', () => {
        const input = { text: 'Hello World! @#$%^&*()' };
        expect(computeHash(input)).toBeDefined();
    });
  });

  describe('computeSettingsSchemaHashFrom', () => {
    it('should exclude __schemaHash property', () => {
      const obj1 = { foo: 'bar', __schemaHash: '123' };
      const obj2 = { foo: 'bar', __schemaHash: '456' };
      const obj3 = { foo: 'bar' };

      expect(computeSettingsSchemaHashFrom(obj1)).toBe(computeSettingsSchemaHashFrom(obj2));
      expect(computeSettingsSchemaHashFrom(obj1)).toBe(computeSettingsSchemaHashFrom(obj3));
    });

    it('should handle null/undefined/primitives by treating them as empty object', () => {
       // The code: const filtered = obj && typeof obj === 'object' ? obj : {};
       expect(computeSettingsSchemaHashFrom(null)).toBe(computeSettingsSchemaHashFrom({}));
       expect(computeSettingsSchemaHashFrom(undefined)).toBe(computeSettingsSchemaHashFrom({}));
       expect(computeSettingsSchemaHashFrom(123)).toBe(computeSettingsSchemaHashFrom({}));
       expect(computeSettingsSchemaHashFrom('string')).toBe(computeSettingsSchemaHashFrom({}));
    });

    it('should include nested properties', () => {
        const obj1 = { nested: { a: 1 } };
        const obj2 = { nested: { a: 2 } };
        expect(computeSettingsSchemaHashFrom(obj1)).not.toBe(computeSettingsSchemaHashFrom(obj2));
    });
  });

  describe('computeCurrentSettingsSchemaHash', () => {
    it('should return a hash for default settings', () => {
      const hash = computeCurrentSettingsSchemaHash();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should match hash of DEFAULT_SETTINGS', () => {
        expect(computeCurrentSettingsSchemaHash()).toBe(computeSettingsSchemaHashFrom(DEFAULT_SETTINGS));
    });
  });
});
