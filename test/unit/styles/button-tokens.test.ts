/**
 * @file button-tokens.test.ts
 * @description Phase 2 GREEN: Button semantic token layer shape & policy tests
 */
import { describe, test, expect } from 'vitest';
import { getButtonTokens } from '../../../src/shared/styles/tokens/button';

function hasRawColor(str: string): boolean {
  return /(#[0-9a-fA-F]{3,8})|(rgba?\()/.test(str);
}

describe('Button Tokens - Semantic Layer', () => {
  const tokens = getButtonTokens();

  test('정의된 토큰 구조(shape)가 완전해야 한다', () => {
    expect(tokens.color.bg.primary).toMatch(/^var\(/);
    expect(tokens.color.bg.secondary).toMatch(/^var\(|transparent$/);
    expect(tokens.color.text.inverse).toMatch(/^var\(/);
    expect(tokens.color.state.focusRing).toMatch(/^var\(/);
    expect(tokens.radius.md).toMatch(/^var\(/);
    expect(tokens.spacing.padMd).toMatch(/^var\(/);
    expect(tokens.elevation.hover).toMatch(/^var\(/);
    expect(tokens.motion.lift).toMatch(/^var\(/);
    expect(tokens.opacity.disabled).toMatch(/^var\(/);
  });

  test('모든 토큰 값은 raw hex/rgba를 직접 포함하지 않아야 한다', () => {
    const raw = JSON.stringify(tokens);
    expect(hasRawColor(raw)).toBe(false);
  });

  test('ghost/icon 배경은 투명 허용 (transparent 또는 var())', () => {
    expect(['transparent', 'var('].some(p => tokens.color.bg.ghost.startsWith(p))).toBe(true);
    expect(['transparent', 'var('].some(p => tokens.color.bg.icon.startsWith(p))).toBe(true);
  });
});
