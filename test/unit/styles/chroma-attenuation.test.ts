import { describe, it, expect } from 'vitest';
import {
  attenuateChroma,
  parseOKLCH,
  formatOKLCH,
  attenuateOKLCHString,
} from '@/shared/styles/chroma-attenuation';

describe('chroma-attenuation', () => {
  it('고채도(dark) 색상 감쇠: threshold 초과 시 감소', () => {
    const before = { l: 0.62, c: 0.24, h: 250 };
    const after = attenuateChroma(before, { mode: 'dark' });
    expect(after.c).toBeLessThan(before.c);
    expect(after.c).toBeGreaterThan(0.039); // floor 보호
    expect(after.l).toBe(before.l);
  });

  it('저채도(threshold 이하) 색상은 변화 없음', () => {
    const before = { l: 0.7, c: 0.08, h: 120 };
    const after = attenuateChroma(before, { mode: 'dark' });
    expect(after.c).toBe(before.c);
  });

  it('문자열 파서/포매터 round-trip & light 감쇠', () => {
    const s = 'oklch(0.55 0.2 40)';
    const atten = attenuateOKLCHString(s, { mode: 'light' });
    const parsed = parseOKLCH(atten)!;
    expect(parsed.c).toBeLessThan(0.2);
    expect(formatOKLCH(parsed)).toContain('oklch');
  });
});
