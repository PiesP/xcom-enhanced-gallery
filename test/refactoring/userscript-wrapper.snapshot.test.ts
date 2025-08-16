import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// RED 단계: 현재 dist 산출물에서 wrapper 구조를 스냅샷/토큰 기반으로 검증
// 추후 리팩터링 후 안정된 wrapper 생성 유틸을 통해 동일 테스트를 통과하게 함.

describe('userscript wrapper (dev build)', () => {
  const devFile = path
    .resolve(__dirname, '../../dist/xcom-enhanced-gallery.dev.user.js')
    .replace(/\\/g, '/');

  function load(): string {
    return fs.readFileSync(devFile, 'utf8');
  }

  it('헤더 섹션 존재', () => {
    const content = load();
    expect(content.startsWith('// ==UserScript==')).toBe(true);
  });

  it('스타일 인젝션 IIFE가 올바른 안전 패턴을 사용 (document undefined 방어 + 기존 style 교체)', () => {
    const content = load();
    const goodPattern =
      /if \(typeof document === 'undefined'\) return;[\s\S]*?const existingStyle = document\.getElementById\('xeg-styles'\);[\s\S]*?existingStyle\.remove\(\);/;
    expect(goodPattern.test(content)).toBe(true);
  });

  it('잘못된 줄바꿈 누락 패턴이 더 이상 존재하지 않는다', () => {
    const content = load();
    const brokenPattern = /if \(typeof document === 'undefined'\)\n\s+const existingStyle/;
    expect(brokenPattern.test(content)).toBe(false);
  });
});
