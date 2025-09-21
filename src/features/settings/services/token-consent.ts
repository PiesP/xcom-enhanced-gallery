/**
 * Token extraction consent gate (module-scoped toggle)
 * 기본값: false (사용자 동의 없이는 토큰 경로 차단)
 */
let consentEnabled = false;

export function setTokenExtractionConsent(enabled: boolean): void {
  consentEnabled = !!enabled;
}

export function isTokenExtractionConsentEnabled(): boolean {
  return consentEnabled;
}
