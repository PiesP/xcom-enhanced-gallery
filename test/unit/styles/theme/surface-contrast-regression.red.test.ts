import { describe, it, expect } from 'vitest';

// RED: 대비 회귀 테스트 - 아직 surface token set 이 fgPrimary/fgSecondary 미노출 상태라 실패 예상
// 목표: 각 surface level(light/dark) 에서 텍스트 대비 최소 기준 충족 (primary >=4.5, secondary >=3.0)
// 현재 구현에는 foreground 정보가 없어 대비 계산 자체가 불가 → 실패 유도

function relativeLuminance(rgb: string): number {
  // 지원 패턴: #rrggbb
  const m = /^#?([0-9a-f]{6})$/i.exec(rgb.trim());
  if (!m) throw new Error('Unsupported color format in test (expects #rrggbb): ' + rgb);
  const hex = m[1];
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const srgbToLin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const R = srgbToLin(r);
  const G = srgbToLin(g);
  const B = srgbToLin(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrast(c1: string, c2: string): number {
  const L1 = relativeLuminance(c1);
  const L2 = relativeLuminance(c2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Phase22 Surface Contrast Regression (RED)', () => {
  it('should expose foreground tokens for contrast evaluation (and meet minimum contrast)', async () => {
    const mod: any = await import('@/shared/styles/surface-tokens');
    const levels: string[] = mod.SURFACE_LEVELS;
    const failures: string[] = [];

    for (const darkMode of [false, true]) {
      for (const level of levels) {
        const set = mod.getSurfaceTokenSet({ level, darkMode });
        // 기대: set.fgPrimary / set.fgSecondary 존재 (아직 없음 → 실패)
        if (!('fgPrimary' in set) || !('fgSecondary' in set)) {
          failures.push(`${darkMode ? 'dark' : 'light'}:${level}:missing-foreground`);
          continue;
        }

        // var() 참조일 경우 resolvedFg* / resolvedBg 사용 (없으면 실패)
        const bgColor = /^var\(/.test(set.bg) ? set.resolvedBg : set.bg;
        const fgPrimary = /^var\(/.test(set.fgPrimary) ? set.resolvedFgPrimary : set.fgPrimary;
        const fgSecondary = /^var\(/.test(set.fgSecondary)
          ? set.resolvedFgSecondary
          : set.fgSecondary;
        if (!bgColor || !fgPrimary || !fgSecondary) {
          failures.push(`${darkMode ? 'dark' : 'light'}:${level}:missing-resolved`);
          continue;
        }

        try {
          const primaryContrast = contrast(bgColor, fgPrimary);
          const secondaryContrast = contrast(bgColor, fgSecondary);
          if (primaryContrast < 4.5) {
            failures.push(
              `${darkMode ? 'dark' : 'light'}:${level}:primary<4.5(${primaryContrast.toFixed(2)})`
            );
          }
          if (secondaryContrast < 3.0) {
            failures.push(
              `${darkMode ? 'dark' : 'light'}:${level}:secondary<3.0(${secondaryContrast.toFixed(2)})`
            );
          }
        } catch (e: any) {
          failures.push(`${darkMode ? 'dark' : 'light'}:${level}:contrast-error:${e.message}`);
        }
      }
    }

    expect(failures).toEqual([]); // 현재는 foreground & resolved 미구현으로 실패해야 RED 유지
  });
});
