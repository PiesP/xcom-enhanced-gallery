/**
 * Phase 4 GREEN — LanguageService Missing-Key Guard
 */
import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { createLanguageIntegrityReport } from '@shared/constants/i18n/language-integrity';

describe('i18n.missing-keys', () => {
  setupGlobalTestIsolation();

  it('모든 지원 로케일(en, ko, ja)의 키 구조가 동일하다', () => {
    const report = createLanguageIntegrityReport();
    expect(report.missing).toEqual({ en: [], ko: [], ja: [] });
    expect(report.extra).toEqual({ en: [], ko: [], ja: [] });
  });
});
