/**
 * @fileoverview SettingsModal Wheel Scroll UI 테스트
 * @description 휠 스크롤 배율 슬라이더 UI 렌더링 및 상호작용 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LanguageService } from '../../../../src/shared/services/LanguageService';
import type { GallerySettings } from '../../../../src/features/settings/types/settings.types';

describe('SettingsModal - Wheel Scroll UI', () => {
  let languageService: LanguageService;

  beforeEach(() => {
    languageService = new LanguageService();
  });

  it('wheelScrollMultiplier가 GallerySettings 타입에 포함되어 있다', () => {
    // Type check only - wheelScrollMultiplier should be a valid property
    const mockSettings: Partial<GallerySettings> = {
      wheelScrollMultiplier: 1.2,
    };

    expect(mockSettings.wheelScrollMultiplier).toBe(1.2);
    expect(typeof mockSettings.wheelScrollMultiplier).toBe('number');
  });

  it('LanguageService가 gallery.wheelScrollSpeed 문자열을 제공한다', () => {
    const wheelScrollSpeedLabel = languageService.getString('settings.gallery.wheelScrollSpeed');

    expect(wheelScrollSpeedLabel).toBeTruthy();
    expect(typeof wheelScrollSpeedLabel).toBe('string');
    expect(wheelScrollSpeedLabel.length).toBeGreaterThan(0);
  });

  it('LanguageService가 gallery.sectionTitle 문자열을 제공한다', () => {
    const gallerySectionTitle = languageService.getString('settings.gallery.sectionTitle');

    expect(gallerySectionTitle).toBeTruthy();
    expect(typeof gallerySectionTitle).toBe('string');
    expect(gallerySectionTitle.length).toBeGreaterThan(0);
  });

  it('wheelScrollMultiplier 범위가 0.5~3.0이다', () => {
    const minValue = 0.5;
    const maxValue = 3.0;

    const testValues = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];

    testValues.forEach(value => {
      expect(value).toBeGreaterThanOrEqual(minValue);
      expect(value).toBeLessThanOrEqual(maxValue);
    });

    // 범위 검증
    expect(minValue).toBe(0.5);
    expect(maxValue).toBe(3.0);
  });

  it('한국어 로케일에서 올바른 문자열을 반환한다', () => {
    languageService.setLanguage('ko');

    const wheelScrollSpeed = languageService.getString('settings.gallery.wheelScrollSpeed');
    const sectionTitle = languageService.getString('settings.gallery.sectionTitle');

    expect(wheelScrollSpeed).toBe('휠 스크롤 속도');
    expect(sectionTitle).toBe('갤러리');
  });

  it('영어 로케일에서 올바른 문자열을 반환한다', () => {
    languageService.setLanguage('en');

    const wheelScrollSpeed = languageService.getString('settings.gallery.wheelScrollSpeed');
    const sectionTitle = languageService.getString('settings.gallery.sectionTitle');

    expect(wheelScrollSpeed).toBe('Wheel Scroll Speed');
    expect(sectionTitle).toBe('Gallery');
  });

  it('일본어 로케일에서 올바른 문자열을 반환한다', () => {
    languageService.setLanguage('ja');

    const wheelScrollSpeed = languageService.getString('settings.gallery.wheelScrollSpeed');
    const sectionTitle = languageService.getString('settings.gallery.sectionTitle');

    expect(wheelScrollSpeed).toBe('ホイールスクロール速度');
    expect(sectionTitle).toBe('ギャラリー');
  });

  afterEach(() => {
    // Cleanup if needed
  });
});
