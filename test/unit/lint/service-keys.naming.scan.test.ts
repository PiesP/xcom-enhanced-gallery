/**
 * 서비스 키 중복 및 명명 규칙 검증 테스트
 * 동일한 서비스 인스턴스를 여러 키로 참조하는 중복을 방지하고
 * 의미있는 이름과 일관된 명명 규칙을 강제합니다.
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { SERVICE_KEYS } from '@/constants';

describe('Service Keys Lint Policy', () => {
  setupGlobalTestIsolation();

  it('should not have duplicate service identifier values', () => {
    const values = Object.values(SERVICE_KEYS);
    const uniqueValues = new Set(values);

    if (values.length !== uniqueValues.size) {
      const duplicates = values.filter((value, index, arr) => arr.indexOf(value) !== index);

      expect.fail(`Duplicate service keys found: ${duplicates.join(', ')}`);
    }

    expect(values.length).toBe(uniqueValues.size);
  });

  it('should have meaningful key names (UPPER_SNAKE_CASE)', () => {
    const keys = Object.keys(SERVICE_KEYS);

    for (const key of keys) {
      // 상수 명명 규칙: UPPER_SNAKE_CASE
      expect(key).toMatch(/^[A-Z_]+$/);
      // 최소 길이 요구
      expect(key.length).toBeGreaterThan(3);
    }
  });

  it('should map keys to consistent service identifiers', () => {
    const serviceValues = Object.values(SERVICE_KEYS);
    const duplicateValues = serviceValues.filter(
      (value, index, arr) => arr.indexOf(value) === index && arr.lastIndexOf(value) !== index
    );

    expect(duplicateValues).toEqual([]);
  });
});
