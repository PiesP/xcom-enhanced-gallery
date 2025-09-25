import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type TokenMap = Map<string, string>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TOKENS_DIR = resolve(__dirname, '../../src/shared/styles');
const TOKEN_FILES = [
  'design-tokens.primitive.css',
  'design-tokens.semantic.css',
  'design-tokens.component.css',
  'design-tokens.css',
];

interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

const WHITE: RGBA = { r: 255, g: 255, b: 255, a: 1 };
const BLACK: RGBA = { r: 0, g: 0, b: 0, a: 1 };

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function extractTokenEntries(css: string): Array<[string, string]> {
  const cleaned = stripComments(css);
  const regex = /--([\w-]+)\s*:\s*([^;]+);/g;
  const entries: Array<[string, string]> = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(cleaned))) {
    entries.push([`--${match[1]}`, match[2].trim()]);
  }
  return entries;
}

function stripMediaBlocks(css: string, query: string): string {
  let result = css;
  let index = result.indexOf(query);
  while (index !== -1) {
    let braceCount = 0;
    let started = false;
    let endIndex = index;
    for (let i = index; i < result.length; i++) {
      const char = result[i];
      if (char === '{') {
        braceCount += 1;
        started = true;
      } else if (char === '}') {
        braceCount -= 1;
        if (started && braceCount === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }
    result = result.slice(0, index) + result.slice(endIndex);
    index = result.indexOf(query);
  }
  return result;
}

function buildTokenMap(): { map: TokenMap; semanticCSS: string } {
  const map: TokenMap = new Map();
  let semanticCSS = '';
  for (const file of TOKEN_FILES) {
    const css = readFileSync(resolve(TOKENS_DIR, file), 'utf-8');
    if (file === 'design-tokens.semantic.css') {
      semanticCSS = css;
      const sanitized = stripMediaBlocks(css, '@media (prefers-contrast: high)');
      for (const [name, value] of extractTokenEntries(sanitized)) {
        map.set(name, value);
      }
      continue;
    }
    for (const [name, value] of extractTokenEntries(css)) {
      map.set(name, value);
    }
  }
  return { map, semanticCSS };
}

function resolveValue(value: string, map: TokenMap, depth = 0): string {
  if (depth > 12) {
    throw new Error(`Potential circular reference while resolving value: ${value}`);
  }
  const varRegex = /var\((--[\w-]+)(?:\s*,\s*([^()]+))?\)/g;
  let result = value;
  let match: RegExpExecArray | null;
  while ((match = varRegex.exec(value))) {
    const tokenName = match[1];
    const fallback = match[2]?.trim();
    const tokenValue = map.get(tokenName);
    if (tokenValue) {
      const resolvedToken = resolveValue(tokenValue.trim(), map, depth + 1);
      result = result.replace(match[0], resolvedToken);
    } else if (fallback) {
      result = result.replace(match[0], fallback);
    } else {
      throw new Error(`Unable to resolve token ${tokenName} within value: ${value}`);
    }
  }
  return result.trim();
}

function resolveToken(tokenName: string, map: TokenMap): string {
  const rawValue = map.get(tokenName);
  if (!rawValue) {
    throw new Error(`Token ${tokenName} not found in map`);
  }
  return resolveValue(rawValue, map);
}

function parseNumeric(value: string): number {
  return Number.parseFloat(value.trim());
}

function parseRGBA(input: string): RGBA {
  const normalized = input.replace(/\s+/g, '');
  const rgbaMatch = normalized.match(/^rgba?\(([^)]+)\)$/i);
  if (!rgbaMatch) {
    throw new Error(`Unsupported RGBA format: ${input}`);
  }
  const parts = rgbaMatch[1].split(',').map(part => part.trim());
  if (parts.length < 3 || parts.length > 4) {
    throw new Error(`Invalid rgba component count: ${input}`);
  }
  const [rRaw, gRaw, bRaw, aRaw] = parts;
  const r = parseNumeric(rRaw);
  const g = parseNumeric(gRaw);
  const b = parseNumeric(bRaw);
  const a = aRaw !== undefined ? parseNumeric(aRaw) : 1;
  return { r, g, b, a };
}

function parseColor(value: string): RGBA {
  const trimmed = value.trim();
  if (/^rgba?\(/i.test(trimmed)) {
    return parseRGBA(trimmed);
  }
  if (trimmed.toLowerCase() === 'canvas') {
    return { ...WHITE };
  }
  if (trimmed.toLowerCase() === 'canvastext') {
    return { ...BLACK };
  }
  if (trimmed.toLowerCase() === 'white') {
    return { ...WHITE };
  }
  if (trimmed.toLowerCase() === 'black') {
    return { ...BLACK };
  }
  if (trimmed.startsWith('oklch')) {
    // Only special-case pure white / pure black, other values are not required for this test suite.
    if (/oklch\(1\s+0\s+0\)/.test(trimmed)) {
      return { ...WHITE };
    }
    if (/oklch\(0\s+0\s+0\)/.test(trimmed)) {
      return { ...BLACK };
    }
  }
  throw new Error(`Unsupported color format encountered: ${value}`);
}

function compositeOver(base: RGBA, overlay: RGBA): RGBA {
  const alpha = overlay.a + base.a * (1 - overlay.a);
  if (alpha === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  const r = (overlay.r * overlay.a + base.r * base.a * (1 - overlay.a)) / alpha;
  const g = (overlay.g * overlay.a + base.g * base.a * (1 - overlay.a)) / alpha;
  const b = (overlay.b * overlay.a + base.b * base.a * (1 - overlay.a)) / alpha;
  return { r, g, b, a: alpha };
}

function channelToLinear(channel: number): number {
  const normalized = channel / 255;
  if (normalized <= 0.04045) {
    return normalized / 12.92;
  }
  return Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function relativeLuminance(color: RGBA): number {
  const r = channelToLinear(color.r);
  const g = channelToLinear(color.g);
  const b = channelToLinear(color.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground: RGBA, background: RGBA): number {
  const L1 = relativeLuminance(foreground);
  const L2 = relativeLuminance(background);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function extractMediaBlock(css: string, query: string): string {
  const index = css.indexOf(query);
  if (index === -1) {
    return '';
  }
  let braceCount = 0;
  let block = '';
  let started = false;
  for (let i = index; i < css.length; i++) {
    const char = css[i];
    block += char;
    if (char === '{') {
      braceCount += 1;
      started = true;
    } else if (char === '}') {
      braceCount -= 1;
      if (started && braceCount === 0) {
        break;
      }
    }
  }
  return block;
}

describe('Overlay design tokens accessibility contract', () => {
  const { map, semanticCSS } = buildTokenMap();
  const overlayDarkDefault = resolveToken('--xeg-color-overlay-dark', map);
  const overlaySubtleDefault = resolveToken('--xeg-color-overlay-subtle', map);
  const textInverse = resolveToken('--color-text-inverse', map);

  it('defines overlay tokens with expected default values', () => {
    expect(overlayDarkDefault).toBe('rgba(0, 0, 0, 0.95)');
    expect(overlaySubtleDefault).toBe('rgba(255, 255, 255, 0.1)');
  });

  it('provides explicit high-contrast overrides for overlay tokens', () => {
    const block = extractMediaBlock(semanticCSS, '@media (prefers-contrast: high)');
    expect(block.length).toBeGreaterThan(0);
    const highContrastEntries = extractTokenEntries(block);
    const highContrastMap = new Map(highContrastEntries);
    expect(highContrastMap.get('--xeg-color-overlay-dark')).toBe('CanvasText');
    expect(highContrastMap.get('--xeg-color-overlay-subtle')).toBe('Canvas');
  });

  it('meets WCAG AA contrast ratio for overlay backgrounds versus text', () => {
    const overlayDarkColor = parseColor(overlayDarkDefault);
    const textColor = parseColor(textInverse);
    const composedBackground = compositeOver(WHITE, overlayDarkColor);
    const ratioDefault = contrastRatio(textColor, composedBackground);
    expect(ratioDefault).toBeGreaterThanOrEqual(7);

    const highContrastBlock = extractMediaBlock(semanticCSS, '@media (prefers-contrast: high)');
    const highContrastEntries = extractTokenEntries(highContrastBlock);
    const highContrastMap = new Map(highContrastEntries);
    const overlayDarkHighContrast = highContrastMap.get('--xeg-color-overlay-dark');
    expect(overlayDarkHighContrast).toBeDefined();
    const highContrastBackground = parseColor(overlayDarkHighContrast!);
    const ratioHighContrast = contrastRatio(textColor, highContrastBackground);
    expect(ratioHighContrast).toBeGreaterThanOrEqual(12);
  });
});
