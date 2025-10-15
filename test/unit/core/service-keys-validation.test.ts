/**
 * 서비스 키 중복 검증 테스트
 * 동일한 서비스 인스턴스를 여러 키로 참조하는 중복을 방지
 */

import { describe, it, expect } from 'vitest';
import { SERVICE_KEYS } from '@/constants';

describe('Service Keys Validation', () => {
  it('should not have duplicate service identifier values', () => {
    const values = Object.values(SERVICE_KEYS);
    const uniqueValues = new Set(values);

    if (values.length !== uniqueValues.size) {
      const duplicates = values.filter((value, index, arr) => arr.indexOf(value) !== index);

      expect.fail(`Duplicate service keys found: ${duplicates.join(', ')}`);
    }

    expect(values.length).toBe(uniqueValues.size);
  });

  it('should have meaningful key names', () => {
    const keys = Object.keys(SERVICE_KEYS);

    // 각 키가 의미있는 이름을 가져야 함
    for (const key of keys) {
      expect(key).toMatch(/^[A-Z_]+$/); // 상수 명명 규칙
      expect(key.length).toBeGreaterThan(3); // 최소 길이
    }
  });

  it('should map keys to consistent service identifiers', () => {
    // 중복된 서비스 식별자가 있는지 확인
    const serviceValues = Object.values(SERVICE_KEYS);
    const duplicateValues = serviceValues.filter(
      (value, index, arr) => arr.indexOf(value) === index && arr.lastIndexOf(value) !== index
    );

    expect(duplicateValues).toEqual([]);
  });
});
