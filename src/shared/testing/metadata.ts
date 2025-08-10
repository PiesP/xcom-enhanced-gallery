/**
 * @fileoverview 테스트 메타데이터 관리 시스템
 * TDD Phase 5c: Testing Strategy Unification - Metadata System
 */

import type { TestMetadata } from './types';

// 메타데이터 저장소
const testMetadataStore = new Map<string, TestMetadata>();

/**
 * 테스트에 메타데이터 추가
 */
export function addTestMetadata(testId: string, metadata: TestMetadata): void {
  testMetadataStore.set(testId, {
    ...metadata,
    // 기본값 설정
    priority: metadata.priority || 'medium',
    tags: metadata.tags || [],
  });
}

/**
 * 테스트 메타데이터 조회
 */
export function getTestMetadata(testId: string): TestMetadata | undefined {
  return testMetadataStore.get(testId);
}

/**
 * 모든 메타데이터 조회
 */
export function getAllTestMetadata(): Map<string, TestMetadata> {
  return new Map(testMetadataStore);
}

/**
 * 메타데이터 필터링
 */
export function filterTestsByMetadata(filter: Partial<TestMetadata>): string[] {
  const results: string[] = [];

  for (const [testId, metadata] of testMetadataStore) {
    if (matchesFilter(metadata, filter)) {
      results.push(testId);
    }
  }

  return results;
}

/**
 * 메타데이터 초기화
 */
export function clearTestMetadata(): void {
  testMetadataStore.clear();
}

/**
 * 필터 일치 검사
 */
function matchesFilter(metadata: TestMetadata, filter: Partial<TestMetadata>): boolean {
  if (filter.category && metadata.category !== filter.category) {
    return false;
  }

  if (filter.priority && metadata.priority !== filter.priority) {
    return false;
  }

  if (filter.tags && filter.tags.length > 0) {
    const hasAllTags = filter.tags.every(tag => metadata.tags.includes(tag));
    if (!hasAllTags) {
      return false;
    }
  }

  return true;
}

/**
 * 테스트 메타데이터 데코레이터 (함수형)
 */
export function createTestMetadataDecorator(metadata: TestMetadata) {
  return function <T extends (...args: unknown[]) => unknown>(
    target: T,
    propertyKey?: string | symbol
  ): T {
    const testId = propertyKey ? `${target.name}.${String(propertyKey)}` : target.name;
    addTestMetadata(testId, metadata);
    return target;
  };
}

// 별칭 export
export { createTestMetadataDecorator as TestMetadata };
