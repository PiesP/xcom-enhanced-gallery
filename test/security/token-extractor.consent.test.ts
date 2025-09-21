/**
 * Phase 1 — 보안/네트워크: TwitterTokenExtractor 동의 게이트 테스트 (RED → GREEN)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TwitterTokenExtractor } from '@/features/settings/services/TwitterTokenExtractor';
// 동의 토글 API
import {
  setTokenExtractionConsent,
  isTokenExtractionConsentEnabled,
} from '@/features/settings/services/token-consent';

function injectScriptWithToken(token: string) {
  const script = document.createElement('script');
  // TwitterTokenExtractor는 여러 패턴을 검색한다. 여기서는 "BEARER_TOKEN" 패턴으로 주입한다.
  script.textContent = `(() => { const __twcfg = { "BEARER_TOKEN": "${token}" }; void __twcfg; })();`;
  document.body.appendChild(script);
}

describe('TwitterTokenExtractor - Consent Gate', () => {
  beforeEach(() => {
    // 동의 기본값: Off
    setTokenExtractionConsent(false);
  });

  afterEach(() => {
    // cleanup scripts
    document.body.innerHTML = '';
  });

  it('동의 Off 상태에서는 토큰 추출을 시도하지 않고 null을 반환한다', async () => {
    const extractor = new TwitterTokenExtractor();

    await extractor.initialize();
    const token = await extractor.getToken();

    expect(isTokenExtractionConsentEnabled()).toBe(false);
    expect(token).toBeNull();
  });

  it('동의 On 상태에서만 스크립트로부터 토큰을 추출한다', async () => {
    const extractor = new TwitterTokenExtractor();
    const fakeToken = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3DTESTTOKENMASK';
    injectScriptWithToken(fakeToken);

    setTokenExtractionConsent(true);

    await extractor.initialize();
    const token = await extractor.getToken();

    expect(token).toBe(fakeToken);
  });

  it('로그에 민감 토큰 값이 직접 노출되지 않는다(간단 스냅샷)', async () => {
    const extractor = new TwitterTokenExtractor();
    const fakeToken = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3DTESTTOKENMASK';
    injectScriptWithToken(fakeToken);

    const infoSpy = vi.spyOn(globalThis.console as any, 'info');
    const warnSpy = vi.spyOn(globalThis.console as any, 'warn');
    const logSpy = vi.spyOn(globalThis.console as any, 'log');

    setTokenExtractionConsent(true);

    await extractor.initialize();
    await extractor.getToken();

    // 어떤 로그에도 토큰 원문이 포함되면 안 됨
    const logs = [
      ...((infoSpy.mock.calls as unknown[]) || []),
      ...((warnSpy.mock.calls as unknown[]) || []),
      ...((logSpy.mock.calls as unknown[]) || []),
    ]
      .flat()
      .map(String);

    for (const line of logs) {
      expect(line.includes(fakeToken)).toBe(false);
    }
  });
});
