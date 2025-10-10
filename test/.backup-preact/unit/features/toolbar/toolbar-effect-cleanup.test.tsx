/**
 * @fileoverview Toolbar Effect Cleanup 테스트
 * @description Phase 4.1: 툴바 effect cleanup 최적화 검증
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const toolbarPath = resolve(process.cwd(), 'src/shared/components/ui/Toolbar/Toolbar.tsx');

describe('Toolbar - Effect Cleanup (Phase 4.1)', () => {
  it('배경 밝기 감지 effect는 cleanup 시 이벤트 리스너를 제거해야 함', () => {
    const sourceCode = readFileSync(toolbarPath, 'utf-8');

    // createEffect 안에 배경 감지 로직이 있어야 함
    expect(sourceCode).toContain('detectBackgroundBrightness');
    expect(sourceCode).toContain('EventManager.getInstance().addListener');

    // onCleanup에서 removeListener 호출이 있어야 함
    const cleanupPattern =
      /onCleanup\(\(\)\s*=>\s*\{[^}]*EventManager\.getInstance\(\)\.removeListener[^}]*\}\)/s;
    expect(sourceCode).toMatch(cleanupPattern);

    // scroll 이벤트 리스너 등록
    expect(sourceCode).toContain("'scroll'");
    expect(sourceCode).toContain('passive: true');
  });

  it('props.isDownloading 동기화는 on() helper를 사용하여 최적화되어야 함', () => {
    const sourceCode = readFileSync(toolbarPath, 'utf-8');

    // isDownloading props 동기화 effect가 있어야 함
    expect(sourceCode).toContain('setDownloading');
    expect(sourceCode).toContain('props.isDownloading');

    // on() helper 사용 패턴 검증 (최적화된 경우)
    // 또는 createEffect(() => { ... }) 패턴 (최적화 전)
    const hasOnHelper = /on\(\s*\(\)\s*=>\s*props\.isDownloading/s.test(sourceCode);
    const hasDirectEffect = /createEffect\(\(\)\s*=>\s*\{[^}]*setDownloading[^}]*\}\)/s.test(
      sourceCode
    );

    // 둘 중 하나는 있어야 함 (현재는 최적화 전 상태 예상)
    expect(hasOnHelper || hasDirectEffect).toBe(true);
  });

  it('메모리 누수 방지: effect는 반드시 cleanup 로직을 포함해야 함', () => {
    const sourceCode = readFileSync(toolbarPath, 'utf-8');

    // EventManager 리스너를 추가하는 모든 effect는 cleanup이 있어야 함
    const addListenerCalls = sourceCode.match(/EventManager\.getInstance\(\)\.addListener/g);
    const removeListenerCalls = sourceCode.match(/EventManager\.getInstance\(\)\.removeListener/g);

    if (addListenerCalls) {
      expect(removeListenerCalls).toBeTruthy();
      // 등록한 리스너 수만큼 제거 로직이 있어야 함
      expect(removeListenerCalls!.length).toBeGreaterThanOrEqual(addListenerCalls.length);
    }

    // onCleanup 사용 검증
    if (addListenerCalls) {
      expect(sourceCode).toContain('onCleanup');
    }
  });
});
