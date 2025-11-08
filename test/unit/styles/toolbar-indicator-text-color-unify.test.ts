/**
 * Phase: Toolbar Indicator Text Color Unification (RED)
 * - 목적: 툴바의 미디어 인디케이터(현재/전체) 텍스트 색상을 동일한 토큰으로 통일
 * - 추가 요구: 설정 메뉴(테마/언어)의 레이블/선택 텍스트도 동일 토큰을 사용
 */
import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { readFileSync } from 'node:fs';

const TOOLBAR_CSS = 'src/shared/components/ui/Toolbar/Toolbar.module.css';
const SETTINGS_CSS = 'src/shared/components/ui/Settings/SettingsControls.module.css';

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

function getBlock(css: string, className: string): string | null {
  const re = new RegExp(`\\.${className}\\s*\\{[^}]*\\}`, 's');
  const m = css.match(re);
  return m ? m[0] : null;
}

describe('Toolbar indicator text color unification', () => {
  setupGlobalTestIsolation();

  it('Toolbar: mediaCounter uses primary text color token', () => {
    const css = read(TOOLBAR_CSS);
    const block = getBlock(css, 'mediaCounter');
    expect(block, 'mediaCounter class should exist').toBeTruthy();
    // Should use primary text token and not the secondary/neutral token for base color
    expect(block!).toMatch(/color:\s*var\(--xeg-color-text-primary\)/);
    expect(block!).not.toMatch(/--xeg-text-counter|--xeg-color-text-secondary/);
  });

  it('Toolbar: currentIndex and totalCount do not diverge in color', () => {
    const css = read(TOOLBAR_CSS);
    const current = getBlock(css, 'currentIndex');
    const total = getBlock(css, 'totalCount');
    expect(current, 'currentIndex class should exist').toBeTruthy();
    expect(total, 'totalCount class should exist').toBeTruthy();

    // They should not specify different tokens; allow either no color (inherit) or same primary token
    const currentColor = current!.match(/color:\s*([^;]+);/);
    const totalColor = total!.match(/color:\s*([^;]+);/);

    // totalCount must not use neutral-600 (regression guard)
    expect(total!).not.toMatch(/--xeg-color-neutral-600/);

    // Accept either both undefined (inherit) or both primary token
    const primary = 'var(--xeg-color-text-primary)';
    const cVal = currentColor?.[1]?.trim();
    const tVal = totalColor?.[1]?.trim();

    const bothInherit = !cVal && !tVal;
    const bothPrimary = cVal === primary && tVal === primary;
    const oneInheritOneUndefinedPrimary =
      (!cVal && tVal === primary) || (!tVal && cVal === primary);

    expect(bothInherit || bothPrimary || oneInheritOneUndefinedPrimary).toBe(true);
  });

  it('Settings labels use the same primary text color token as toolbar', () => {
    const settings = read(SETTINGS_CSS);
    const label = getBlock(settings, 'label');
    expect(label, 'Settings .label should exist').toBeTruthy();
    expect(label!).toMatch(/color:\s*var\(--xeg-color-text-primary\)/);

    // Compact label can be secondary (allowed for density), but base label must be primary
    const compact = getBlock(settings, 'compactLabel');
    if (compact) {
      expect(compact).toMatch(/color:\s*var\(--xeg-color-text-secondary\)/);
    }
  });
});
