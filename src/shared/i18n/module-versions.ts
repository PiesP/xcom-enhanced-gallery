// ⚠️ 이 파일은 module.autoupdate.js에 의해 유지됩니다.
// 모듈을 추가/삭제했다면 module.autoupdate.js를 실행해 버전 맵을 동기화하세요.

export const moduleVersions = {
  'language-types': 1,
  'translation-registry': 1,
  'languages/en': 1,
  'languages/ja': 1,
  'languages/ko': 1,
} as const;

export type ModuleVersionKey = keyof typeof moduleVersions;

export function getModuleVersion(key: ModuleVersionKey): number {
  return moduleVersions[key];
}
