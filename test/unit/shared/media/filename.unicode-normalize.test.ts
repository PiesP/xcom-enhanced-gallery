import { describe, it, expect } from 'vitest';
import { FilenameService } from '@shared/media/FilenameService';

describe('FilenameService - Unicode normalization and sanitization (NFKC)', () => {
  const svc = new FilenameService();

  it('normalizes composed/decomposed Hangul to same filename', () => {
    // 가(AC00) vs ᄀ+ᅡ (1100 + 1161)
    const composed = '가나다.txt';
    const decomposed = '\u1100\u1161\u1102\u1161\u1103\u1161.txt';

    const a = (svc as any).sanitizeForWindows(composed) as string;
    const b = (svc as any).sanitizeForWindows(decomposed) as string;
    expect(a).toBe(b);
  });

  it('removes zero-width and bidi control characters', () => {
    const withControls = 'file\u200B\u200C\u200D\u200E\u200Fname.jpg';
    const sanitized = (svc as any).sanitizeForWindows(withControls) as string;
    expect(sanitized).toBe('filename.jpg');
  });

  it('keeps Windows reserved filtering and forbidden chars replacement', () => {
    const reserved = 'CON.txt';
    const forbidden = 'a<b>:"/\\|?*.txt';
    const sanitizedReserved = (svc as any).sanitizeForWindows(reserved) as string;
    const sanitizedForbidden = (svc as any).sanitizeForWindows(forbidden) as string;

    expect(sanitizedReserved).toBe('_CON.txt');
    expect(sanitizedForbidden).toBe('a_b________.txt');
  });

  it('caps total length to 255 characters', () => {
    const long = 'a'.repeat(300) + '.png';
    const sanitized = (svc as any).sanitizeForWindows(long) as string;
    expect(sanitized.length).toBeLessThanOrEqual(255);
  });
});
