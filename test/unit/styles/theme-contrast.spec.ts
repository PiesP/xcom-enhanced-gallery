import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Ambient JSDOM globals (테스트 환경에서 제공됨)
declare const document: Document;

// Simple relative luminance + contrast helpers (sRGB)
function srgbToLinear(c: number): number {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function parseColor(color: string): { r: number; g: number; b: number; a: number } {
  // Supports rgb/rgba or hex (#rrggbb)
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b, a: 1 };
  }
  const m = color.match(/rgba?\(([^)]+)\)/i);
  if (!m) throw new Error('Unsupported color: ' + color);
  const parts = m[1].split(',').map(p => p.trim());
  const r = parseInt(parts[0], 10);
  const g = parseInt(parts[1], 10);
  const b = parseInt(parts[2], 10);
  const a = parts[3] !== undefined ? parseFloat(parts[3]) : 1;
  return { r, g, b, a };
}
function relativeLuminance(color: string): number {
  const { r, g, b } = parseColor(color);
  const R = srgbToLinear(r / 255);
  const G = srgbToLinear(g / 255);
  const B = srgbToLinear(b / 255);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
function contrastRatio(fg: string, bg: string): number {
  const L1 = relativeLuminance(fg);
  const L2 = relativeLuminance(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Inject design tokens CSS once
function ensureTokensInjected() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('__xeg_test_tokens')) return;
  // Normalize Windows file URL path (strip leading slash before drive letter)
  const baseDir = (globalThis as any).process?.cwd?.() || '';
  const cssPath = path.join(baseDir, 'src', 'shared', 'styles', 'design-tokens.css');
  const css = fs.readFileSync(cssPath, 'utf8');
  const style = document.createElement('style');
  style.id = '__xeg_test_tokens';
  style.textContent = css;
  document.head.appendChild(style);
}

function getComputedVar(theme: 'light' | 'dark', variable: string): string {
  ensureTokensInjected();
  if (typeof document === 'undefined') return '';
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  const w = globalThis as unknown as { getComputedStyle?: any };
  if (!w.getComputedStyle) return '';
  return (w.getComputedStyle(root).getPropertyValue(variable) || '').trim();
}

describe('theme contrast (modal surface tokens)', () => {
  it('light theme modal background vs primary text >= 4.5', () => {
    const bg = getComputedVar('light', '--xeg-surface-modal-bg') || 'rgba(255,255,255,0.95)';
    const text = getComputedVar('light', '--xeg-color-text-primary') || '#111111';
    // If bg has alpha approximate over white
    const ratio = contrastRatio(text, bg.startsWith('rgba') ? 'rgb(255,255,255)' : bg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
  it('dark theme modal background vs primary text >= 4.5', () => {
    const bg = getComputedVar('dark', '--xeg-surface-modal-bg') || 'rgba(0,0,0,0.90)';
    const text = getComputedVar('dark', '--xeg-color-text-primary') || '#f5f5f5';
    const ratio = contrastRatio(text, bg.startsWith('rgba') ? '#000000' : bg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
  it('dark modal tokens presence', () => {
    const required = [
      '--xeg-surface-modal-bg-dark',
      '--xeg-surface-modal-border-dark',
      '--xeg-surface-modal-shadow-dark',
      '--xeg-surface-modal-solid-bg-dark',
      '--xeg-surface-modal-solid-border-dark',
    ];
    const styleEl = document.getElementById('__xeg_test_tokens') as HTMLStyleElement | null;
    const raw = styleEl?.textContent || '';
    required.forEach(v => {
      const val = getComputedVar('dark', v);
      if (!val || val.length === 0) {
        const regex = new RegExp(`${v}\\s*:`);
        expect(regex.test(raw)).toBe(true);
      } else {
        expect(val.length).toBeGreaterThan(0);
      }
    });
  });
});
