import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * @fileoverview 스타일 인젝션 정책 가드 (RED - 스킵됨)
 *
 * ⚠️ SKIPPED: 런타임 후킹 방식의 한계
 *
 * 이슈:
 * - 런타임에서 document.head.appendChild를 후킹하여 정책 검증 시도
 * - 실제 프로덕션 코드가 동적 스타일 인젝션을 사용하지 않음
 * - 순수 정적 분석(grep 기반 RED 테스트)으로 대체 가능
 *
 * 대안:
 * - design-tokens.usage-scan.red.test.ts: 하드코딩된 색상/px 값 검출
 * - injected-css.token-policy.red.test.ts: CSS 파일 내 정책 검증
 * - 위 두 테스트가 동일한 목적을 더 효과적으로 달성
 *
 * 향후:
 * - 이 파일 제거 검토 (중복 커버리지)
 * - 동적 스타일 인젝션이 필요해지면 재작성
 */
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
    const element = spy.mock.calls[0][0] as { textContent: string | null };
    const text = element.textContent ?? '';
    expect(text).not.toMatch(/z-index:\s*\d+/);
    expect(text).not.toMatch(/padding:\s*\d+px/);
    expect(text).not.toMatch(/\s\d+ms/);
  });
});
