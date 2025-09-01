/**
 * @fileoverview Refactoring: initializeNamespacedStyles 재실행(idempotent) 검증
 */
import { describe, it, expect, beforeEach } from 'vitest';

describe('NamespacedStyles: idempotent initialization', () => {
  beforeEach(async () => {
    const doc = globalThis.document;
    if (doc) {
      doc.head.innerHTML = '';
      doc.body.innerHTML = '';
    }
    try {
      const { cleanupNamespacedStyles } = await import('@shared/styles/namespaced-styles');
      cleanupNamespacedStyles();
    } catch {
      /* noop */
    }
  });

  it('여러 번 호출해도 스타일 노드가 중복 생성되지 않아야 함', async () => {
    const { initializeNamespacedStyles } = await import('@shared/styles/namespaced-styles');

    initializeNamespacedStyles();
    const first = globalThis.document?.getElementById('xeg-styles');
    expect(first).toBeTruthy();

    initializeNamespacedStyles();
    const second = globalThis.document?.getElementById('xeg-styles');

    expect(second).toBe(first); // 동일 노드 유지
  });
});
