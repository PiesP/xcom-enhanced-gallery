/**
 * @fileoverview 다국어 시스템 내보내기
 * @description Phase 225: i18n 시스템 통합 및 명확화
 * @version 1.0.0
 * @see {@link ./language-types} - 언어 타입 및 검증
 * @see {@link ./translation-registry} - 번역 레지스트리
 */

export * from './language-types';
export * from './translation-registry';

// Lightweight module version helpers for test integrity checks
// The keys must align with EXPECTED_KEYS used in tests
export const moduleVersions: Record<string, number> = Object.freeze({
  'language-types': 1,
  'translation-registry': 1,
  'languages/en': 1,
  'languages/ja': 1,
  'languages/ko': 1,
});

export function resolveModuleKeys(): string[] {
  return Object.keys(moduleVersions);
}

export function buildModuleVersions(existing: Record<string, number> = {}): Record<string, number> {
  const result: Record<string, number> = {};
  for (const key of resolveModuleKeys()) {
    result[key] = existing[key] && existing[key] > 0 ? existing[key] : (moduleVersions[key] ?? 1);
  }
  return result;
}
