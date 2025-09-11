/**
 * Phase 4 RED 테스트 — LanguageService Missing-Key Guard
 * 요구사항:
 *  - 모든 지원 로케일(en, ko, ja)의 키 구조가 동일해야 한다
 *  - languageService.getIntegrityReport() API 제공 (missing/extra 구조 보고)
 */
import { describe, it, expect } from 'vitest';
import { languageService } from '@shared/services/LanguageService';

describe('i18n.missing-keys (RED)', () => {
  it('getIntegrityReport API가 각 로케일 키 정합을 보고하고, 현재 상태는 missing/extra 0이어야 한다', () => {
    // 아직 구현되지 않은 메서드 → RED
    const report = (
      languageService as unknown as { getIntegrityReport(): unknown }
    ).getIntegrityReport();
    expect(report).toBeDefined();
    expect(report.missing).toEqual({ en: [], ko: [], ja: [] });
    expect(report.extra).toEqual({ en: [], ko: [], ja: [] });
  });
});
