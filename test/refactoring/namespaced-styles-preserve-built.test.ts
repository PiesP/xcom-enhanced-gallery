/**
 * @fileoverview Refactoring: 이미 빌드된 스타일이 존재할 때 initializeNamespacedStyles 동작 검증
 * - 완전한(대용량) 빌드 스타일은 그대로 유지 (노드 동일)
 * - 불완전/짧은(incomplete) 스타일은 제거 후 네임스페이스 CSS로 교체
 */
import { describe, it, expect, beforeEach } from 'vitest';

describe('NamespacedStyles: existing built style preservation', () => {
  beforeEach(async () => {
    const doc = globalThis.document;
    if (doc) {
      doc.head.innerHTML = '';
      doc.body.innerHTML = '';
    }
    // initializeNamespacedStyles 내부의 모듈 상태(isInitialized) 리셋
    try {
      const { cleanupNamespacedStyles } = await import('@shared/styles/namespaced-styles');
      cleanupNamespacedStyles();
    } catch {
      /* noop */
    }
  });

  it('완전한 빌드 스타일(긴 CSS + -module__ 포함)은 그대로 유지해야 함', async () => {
    const doc = globalThis.document;
    const builtStyle = doc.createElement('style');
    builtStyle.id = 'xeg-styles';
    // 길이 > 10000 AND 모듈 클래스 토큰 포함
    builtStyle.textContent = `/* mock built css start */\n${'x'.repeat(12000)}\n.foo-module__hash123 { color: red; }/* end */`;
    doc.head.appendChild(builtStyle);

    const { initializeNamespacedStyles } = await import('@shared/styles/namespaced-styles');
    initializeNamespacedStyles();

    const after = doc.getElementById('xeg-styles');
    expect(after).toBe(builtStyle); // 동일 노드 유지
    expect(after?.textContent).toBe(builtStyle.textContent); // 내용 변경 없음
  });

  it('불완전/짧은 스타일은 네임스페이스 CSS로 교체해야 함', async () => {
    const doc = globalThis.document;
    const shortStyle = doc.createElement('style');
    shortStyle.id = 'xeg-styles';
    shortStyle.textContent = '/* incomplete */ .temp { color: blue; }'; // 짧고 -module__ 없음
    doc.head.appendChild(shortStyle);

    const { initializeNamespacedStyles, generateNamespacedCSS } = await import(
      '@shared/styles/namespaced-styles'
    );
    initializeNamespacedStyles();

    const after = doc.getElementById('xeg-styles');
    expect(after).not.toBe(shortStyle); // 교체됨
    expect(after?.textContent).toBe(generateNamespacedCSS()); // 생성된 네임스페이스 CSS 사용
  });
});
