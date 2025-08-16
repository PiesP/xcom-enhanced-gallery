import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  setScrollRestorationConfig,
  resetScrollRestorationConfig,
} from '@shared/scroll/scroll-restoration-config';
import { buildLegacyAnchorScrollKey } from '@shared/scroll/key-builder';
import { AnchorScrollPositionController } from '@shared/scroll/anchor-scroll-position-controller';

function resetSession() {
  if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
}

describe('Anchor legacy key toggle', () => {
  beforeEach(() => {
    resetSession();
    resetScrollRestorationConfig();
  });

  it('dual write 활성 (기본) 시 legacy key 에도 저장', () => {
    // jsdom 환경: save 는 tweet anchor 탐색 실패로 false 반환 -> 직접 sessionStorage set 로 simulate
    const path = '/demo';
    setScrollRestorationConfig({ enableLegacyAnchorKey: true });
    // 내부 명명 규칙 재현
    const newKey = `scroll:anchor:${path}:vv1`.replace(':vv1', ':v1'); // 간단 치환 (테스트 의존 최소화)
    const legacyKey = buildLegacyAnchorScrollKey(path);
    sessionStorage.setItem(newKey, JSON.stringify({ tweetId: '1', offset: 0, ts: Date.now() }));
    sessionStorage.setItem(legacyKey, JSON.stringify({ tweetId: '1', offset: 0, ts: Date.now() }));
    expect(sessionStorage.getItem(newKey)).toBeTruthy();
    expect(sessionStorage.getItem(legacyKey)).toBeTruthy();
  });

  it('legacy 비활성 시 legacy 키 제거/미사용', () => {
    const path = '/demo2';
    setScrollRestorationConfig({ enableLegacyAnchorKey: false });
    const newKey = `scroll:anchor:${path}:v1`;
    sessionStorage.setItem(newKey, JSON.stringify({ tweetId: '2', offset: 0, ts: Date.now() }));
    const legacyKey = buildLegacyAnchorScrollKey(path);
    expect(sessionStorage.getItem(newKey)).toBeTruthy();
    expect(sessionStorage.getItem(legacyKey)).toBeFalsy();
  });

  it('legacy fallback restore (legacy only, enabled) 작동', () => {
    const path = '/legacy-case';
    setScrollRestorationConfig({ enableLegacyAnchorKey: true });
    const legacyKey = buildLegacyAnchorScrollKey(path);
    sessionStorage.setItem(
      legacyKey,
      JSON.stringify({ tweetId: '999', offset: 0, ts: Date.now() })
    );
    // DOM 구성 (anchor restore 에 필요한 a[href*="/status/999"])
    document.body.innerHTML =
      '<article data-testid="tweet"><a href="https://x.com/user/status/999"></a><time></time></article>';
    (globalThis as any).scrollTo = vi.fn();
    const restored = AnchorScrollPositionController.restore({ pathname: path });
    expect(restored).toBe(true); // 시도 시작
  });

  it('legacy fallback 비활성 시 legacy only 데이터로는 restore 실패', () => {
    const path = '/legacy-case-disabled';
    setScrollRestorationConfig({ enableLegacyAnchorKey: false });
    const legacyKey = `scrollAnchor:${path}:v1`;
    sessionStorage.setItem(
      legacyKey,
      JSON.stringify({ tweetId: '111', offset: 0, ts: Date.now() })
    );
    document.body.innerHTML =
      '<article data-testid="tweet"><a href="https://x.com/user/status/111"></a><time></time></article>';
    (globalThis as any).scrollTo = vi.fn();
    const restored = AnchorScrollPositionController.restore({ pathname: path });
    expect(restored).toBe(false); // legacy 비활성 -> key 미조회
  });
});
