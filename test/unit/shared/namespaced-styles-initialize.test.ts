import { describe, it, expect } from 'vitest';
import {
  initializeNamespacedStyles,
  cleanupNamespacedStyles,
} from '@/shared/styles/namespaced-styles';
import { STYLE_ID } from '@/shared/styles/constants';

/**
 * 목적: namespaced-styles 초기화 기본 동작 커버(커버리지 보강)
 * - 첫 호출 시 style 노드 생성
 * - 두 번째 호출 시 중복 생성 방지 (isInitialized 가드)
 * - cleanup 후 재초기화 가능
 */

describe('NamespacedStyles initialization', () => {
  it('초기화 → 중복 방지 → cleanup → 재초기화 동작', () => {
    // js 환경 호환: 전역 document 참조
    // @ts-ignore - vitest jsdom 환경에서 제공
    const doc = globalThis && globalThis.document;
    expect(doc).toBeTruthy();
    // 사전 정리
    cleanupNamespacedStyles();
    const pre = doc.getElementById(STYLE_ID);
    if (pre) pre.remove();

    // 1. 초기화
    initializeNamespacedStyles();
    const first = doc.getElementById(STYLE_ID);
    expect(first).not.toBeNull();
    // 초기 outerHTML (현재 테스트에서는 사용하지 않음)

    // 2. 중복 호출 - 동일 노드 유지
    initializeNamespacedStyles();
    const second = doc.getElementById(STYLE_ID);
    expect(second).toBe(first);

    // 3. cleanup 후 제거
    cleanupNamespacedStyles();
    const removed = doc.getElementById(STYLE_ID);
    expect(removed).toBeNull();

    // 4. 재초기화 - 새 노드
    initializeNamespacedStyles();
    const third = doc.getElementById(STYLE_ID);
    expect(third).not.toBeNull();
    expect(third).not.toBe(first); // 새 인스턴스
    expect(third?.outerHTML).toContain('style');
    // 내용은 동일할 수 있으므로 outerHTML 비교는 제거 (재생성은 노드 참조 변경으로 충분)
  });
});
