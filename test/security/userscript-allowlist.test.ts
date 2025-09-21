/**
 * Phase 1 — 보안/네트워크: Userscript 어댑터 Allowlist/차단 (RED → GREEN)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserscript, setUserscriptNetworkPolicy } from '@/shared/external/userscript/adapter';

// GM_* 모의는 test/setup.ts에서 자동 설정됨

describe('Userscript adapter - network allowlist', () => {
  beforeEach(() => {
    // 각 테스트 시작 시 정책 초기화
    setUserscriptNetworkPolicy({
      enabled: false,
      allowlist: ['x.com', 'pbs.twimg.com', 'video.twimg.com', 'api.twitter.com'],
      notifyOnBlock: true,
    });
  });

  it('정책 Off일 때는 모든 도메인을 허용한다', async () => {
    const api = getUserscript();
    const xhrSpy = vi.spyOn(globalThis as any, 'GM_xmlhttpRequest');
    const dlSpy = vi.spyOn(globalThis as any, 'GM_download');

    const req = api.xhr({ url: 'https://evil.example.com/data', method: 'GET' } as any);
    expect(req).toBeTruthy();

    await api.download('https://evil.example.com/file.jpg', 'file.jpg');

    expect(xhrSpy).toHaveBeenCalled();
    expect(dlSpy).toHaveBeenCalled();
  });

  it('정책 On일 때 허용 도메인만 통과하고, 차단 도메인은 알림 후 거부된다', async () => {
    const api = getUserscript();
    setUserscriptNetworkPolicy({ enabled: true });

    const notifySpy = vi.spyOn(globalThis as any, 'GM_notification');
    const xhrSpy = vi.spyOn(globalThis as any, 'GM_xmlhttpRequest');

    // 차단 케이스 (evil 도메인)
    const blocked = api.xhr({ url: 'https://evil.example.com/data', method: 'GET' } as any);
    expect(blocked).toBeUndefined();
    expect(notifySpy).toHaveBeenCalled();

    // 허용 케이스 (x.com)
    api.xhr({ url: 'https://x.com/i/api/2/timeline', method: 'GET' } as any);
    expect(xhrSpy).toHaveBeenCalled();

    // download 차단
    await expect(api.download('https://malware.test/payload.bin', 'p.bin')).rejects.toThrow(
      /blocked_by_network_policy/
    );
    expect(notifySpy).toHaveBeenCalled();

    // download 허용
    await expect(
      api.download('https://pbs.twimg.com/media/abc.jpg', 'abc.jpg')
    ).resolves.toBeUndefined();
  });
});
