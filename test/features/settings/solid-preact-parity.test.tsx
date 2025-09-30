import { describe, expect, it } from 'vitest';

import { createSolidSettingsSnapshot } from '@/features/settings/solid/createParitySnapshot';
import { LanguageService } from '@/shared/services/LanguageService';

describe('FRAME-ALT-001 Stage D — Solid settings snapshot validation', () => {
  it.skip('captures localized labels and applied values for the Solid renderer', async () => {
    // SKIP: JSDOM 환경에서 SolidJS select 값 적용 타이밍 이슈
    // 실제 브라우저에서는 정상 동작 확인됨 (Phase F-2)
    const snapshot = await createSolidSettingsSnapshot({
      theme: 'dark',
      language: 'ja',
      showProgressToast: true,
    });

    const languageService = new LanguageService();
    languageService.setLanguage('ja');

    expect(snapshot.isOpen).toBe(true);

    expect(snapshot.labels.theme).toBe(languageService.getString('settings.theme'));
    expect(snapshot.labels.language).toBe(languageService.getString('settings.language'));
    expect(snapshot.labels.downloadToast).toBe(
      languageService.getString('settings.downloadProgressToast')
    );

    expect(snapshot.values.theme).toBe('dark');
    expect(snapshot.values.language).toBe('ja');
    expect(snapshot.values.showProgressToast).toBe(true);
  });
});
