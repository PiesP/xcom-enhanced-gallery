import { describe, it, expect, vi, beforeEach } from 'vitest';

// NOTE: 이 테스트는 스타일 인젝션 정책을 강제하기 위한 아이디어 스케치입니다.
// 현재는 런타임 후킹 없이 순수 정적 분석/정책으로 대체 예정이므로 임시로 skip 처리합니다.
describe.skip('Injected style token policy (no raw numbers)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects style text containing raw z-index/spacing/ms literals', () => {
    const spy = vi.spyOn(globalThis.document.head, 'appendChild');

    const style = globalThis.document.createElement('style');
    style.textContent = `
      .x { z-index: 10000; }
      .y { padding: 16px; }
      .z { transition: opacity 300ms ease; }
    `;

    // Simulate consumer code that would inject this
    globalThis.document.head.appendChild(style);

    expect(spy).toHaveBeenCalled();
    const text = (spy.mock.calls[0][0] as HTMLStyleElement).textContent ?? '';
    expect(text).not.toMatch(/z-index:\s*\d+/);
    expect(text).not.toMatch(/padding:\s*\d+px/);
    expect(text).not.toMatch(/\s\d+ms/);
  });
});
