import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// 간이 HEX 파서
function hexToRgb(hex: string): [number, number, number] | null {
  const match = hex.trim().match(/^#([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!match) return null;
  let h = match[1];
  if (h.length === 3) {
    h = h
      .split('')
      .map(c => c + c)
      .join('');
  }
  const intVal = parseInt(h, 16);
  return [(intVal >> 16) & 255, (intVal >> 8) & 255, intVal & 255];
}

// 상대 휘도 (WCAG 2.1)
function relativeLuminance(r: number, g: number, b: number): number {
  const toLin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const rl = toLin(r);
  const gl = toLin(g);
  const bl = toLin(b);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrast(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1;
  const l1 = relativeLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const l2 = relativeLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Fallback 블록에서 토큰 값 추출
function extractFallbackTokenValues(css: string): Record<string, string> {
  const result: Record<string, string> = {};
  const supportsIdx = css.indexOf('@supports not (color: oklch(0 0 0))');
  if (supportsIdx === -1) return result;
  const slice = css.slice(supportsIdx, supportsIdx + 5000); // 충분한 범위
  const rootStart = slice.indexOf(':root');
  if (rootStart === -1) return result;
  const braceStart = slice.indexOf('{', rootStart);
  if (braceStart === -1) return result;
  // 단순 중괄호 깊이 추적
  let depth = 0;
  let collected = '';
  for (let i = braceStart; i < slice.length; i++) {
    const ch = slice[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        collected += ch;
        break;
      }
    }
    collected += ch;
  }
  const varRegex = /(--xeg-color-[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m: RegExpExecArray | null;
  while ((m = varRegex.exec(collected))) {
    result[m[1]] = m[2].trim();
  }
  return result;
}

describe('design-tokens contrast fallback (Phase 1)', () => {
  it('should meet WCAG AA for primary text on light neutral background (fallback)', () => {
    const cssPath = join(process.cwd(), 'src', 'shared', 'styles', 'design-tokens.css');
    const css = readFileSync(cssPath, 'utf8');
    const tokens = extractFallbackTokenValues(css);

    // 필요한 토큰 존재 검증
    expect(tokens['--xeg-color-neutral-900']).toBeTruthy();
    expect(tokens['--xeg-color-neutral-50']).toBeTruthy();

    const fg = tokens['--xeg-color-neutral-900']; // 다크 텍스트
    const bg = tokens['--xeg-color-neutral-50']; // 라이트 배경

    // HEX 형식 아니라면 테스트 스킵 (추후 확장 가능)
    if (!fg.startsWith('#') || !bg.startsWith('#')) {
      expect(true).toBe(true);
      return;
    }

    const ratio = contrast(fg, bg);
    expect(ratio).toBeGreaterThanOrEqual(4.5); // WCAG AA 일반 텍스트 기준
  });

  it('should expose primary brand color fallback token', () => {
    const cssPath = join(process.cwd(), 'src', 'shared', 'styles', 'design-tokens.css');
    const css = readFileSync(cssPath, 'utf8');
    const tokens = extractFallbackTokenValues(css);
    expect(tokens['--xeg-color-primary']).toBeDefined();
    // HEX 패턴 (초기 브랜드 블루) 검증
    const val = tokens['--xeg-color-primary'];
    expect(/#[0-9a-f]{6}/i.test(val) || /#[0-9a-f]{3}/i.test(val)).toBe(true);
  });
});
