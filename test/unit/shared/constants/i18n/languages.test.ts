import { en } from '@/shared/constants/i18n/languages/en';
import { ko } from '@/shared/constants/i18n/languages/ko';
import { ja } from '@/shared/constants/i18n/languages/ja';
import { isBaseLanguageCode } from '@/shared/constants/i18n/language-types';
import type { LanguageStrings } from '@/shared/constants/i18n/language-types';

describe('language dictionaries', () => {
  const samples = [
    {
      code: 'en',
      dictionary: en,
      expected: {
        toolbarPrevious: 'Previous',
        settingsTitle: 'Settings',
        keyboardHelpTitle: 'Keyboard shortcuts',
        downloadErrorTitle: 'Download Failed',
        galleryEmptyTitle: 'No media available',
      },
    },
    {
      code: 'ko',
      dictionary: ko,
      expected: {
        toolbarPrevious: '이전',
        settingsTitle: '설정',
        keyboardHelpTitle: '키보드 단축키',
        downloadErrorTitle: '다운로드 실패',
        galleryEmptyTitle: '미디어 없음',
      },
    },
    {
      code: 'ja',
      dictionary: ja,
      expected: {
        toolbarPrevious: '前へ',
        settingsTitle: '設定',
        keyboardHelpTitle: 'キーボードショートカット',
        downloadErrorTitle: 'ダウンロード失敗',
        galleryEmptyTitle: 'メディアがありません',
      },
    },
  ] as const;

  samples.forEach(({ code, dictionary, expected }) => {
    describe(`dictionary for ${code}`, () => {
      it('exposes toolbar, settings, and message scaffolding', () => {
        expect(dictionary.toolbar.previous).toBe(expected.toolbarPrevious);
        expect(dictionary.toolbar.downloadAll.length).toBeGreaterThan(0);
        expect(dictionary.settings.title).toBe(expected.settingsTitle);
        expect(dictionary.settings.gallery.sectionTitle.length).toBeGreaterThan(0);
        expect(dictionary.messages.keyboardHelp.title).toBe(expected.keyboardHelpTitle);
        expect(dictionary.messages.download.single.error.title).toBe(expected.downloadErrorTitle);
        expect(dictionary.messages.gallery.emptyTitle).toBe(expected.galleryEmptyTitle);
        expect(dictionary.messages.gallery.failedToLoadImage).toContain('{type}');
      });
    });
  });

  describe('English (en) translations', () => {
    describe('toolbar', () => {
      it('should have all toolbar translations', () => {
        expect(en.toolbar.previous).toBe('Previous');
        expect(en.toolbar.next).toBe('Next');
        expect(en.toolbar.download).toBe('Download');
        expect(en.toolbar.downloadAll).toBe('Download ZIP');
        expect(en.toolbar.settings).toBe('Settings');
        expect(en.toolbar.close).toBe('Close');
        expect(en.toolbar.tweetText).toBe('Tweet text');
        expect(en.toolbar.tweetTextPanel).toBe('Tweet text panel');
      });
    });

    describe('settings', () => {
      it('should have all settings translations', () => {
        expect(en.settings.title).toBe('Settings');
        expect(en.settings.theme).toBe('Theme');
        expect(en.settings.language).toBe('Language');
        expect(en.settings.themeAuto).toBe('Auto');
        expect(en.settings.themeLight).toBe('Light');
        expect(en.settings.themeDark).toBe('Dark');
        expect(en.settings.languageAuto).toBe('Auto / 자동 / 自動');
        expect(en.settings.languageKo).toBe('한국어');
        expect(en.settings.languageEn).toBe('English');
        expect(en.settings.languageJa).toBe('日本語');
        expect(en.settings.close).toBe('Close');
        expect(en.settings.gallery.sectionTitle).toBe('Gallery');
      });
    });

    describe('messages', () => {
      it('should have error boundary messages', () => {
        expect(en.messages.errorBoundary.title).toBe('An error occurred');
        expect(en.messages.errorBoundary.body).toContain('{error}');
      });

      it('should have keyboard help messages', () => {
        expect(en.messages.keyboardHelp.title).toBe('Keyboard shortcuts');
        expect(en.messages.keyboardHelp.navPrevious).toContain('ArrowLeft');
        expect(en.messages.keyboardHelp.navNext).toContain('ArrowRight');
        expect(en.messages.keyboardHelp.close).toContain('Escape');
        expect(en.messages.keyboardHelp.toggleHelp).toContain('?');
      });

      it('should have download messages', () => {
        expect(en.messages.download.single.error.title).toBe('Download Failed');
        expect(en.messages.download.single.error.body).toContain('{error}');
        expect(en.messages.download.allFailed.title).toBe('Download Failed');
        expect(en.messages.download.partial.title).toBe('Partial Failure');
        expect(en.messages.download.partial.body).toContain('{count}');
        expect(en.messages.download.retry.action).toBe('Retry');
        expect(en.messages.download.retry.success.title).toBe('Retry Successful');
        expect(en.messages.download.cancelled.title).toBe('Download Cancelled');
      });

      it('should have gallery messages', () => {
        expect(en.messages.gallery.emptyTitle).toBe('No media available');
        expect(en.messages.gallery.emptyDescription.length).toBeGreaterThan(0);
        expect(en.messages.gallery.failedToLoadImage).toContain('{type}');
      });
    });
  });

  describe('Korean (ko) translations', () => {
    describe('toolbar', () => {
      it('should have all toolbar translations', () => {
        expect(ko.toolbar.previous).toBe('이전');
        expect(ko.toolbar.next).toBe('다음');
        expect(ko.toolbar.download).toBe('다운로드');
        expect(ko.toolbar.downloadAll).toBe('ZIP 다운로드');
        expect(ko.toolbar.settings).toBe('설정');
        expect(ko.toolbar.close).toBe('닫기');
        expect(ko.toolbar.tweetText).toBe('트윗 텍스트');
        expect(ko.toolbar.tweetTextPanel).toBe('트윗 텍스트 패널');
      });
    });

    describe('settings', () => {
      it('should have all settings translations', () => {
        expect(ko.settings.title).toBe('설정');
        expect(ko.settings.theme).toBe('테마');
        expect(ko.settings.language).toBe('언어');
        expect(ko.settings.themeAuto).toBe('자동');
        expect(ko.settings.themeLight).toBe('라이트');
        expect(ko.settings.themeDark).toBe('다크');
        expect(ko.settings.close).toBe('닫기');
        expect(ko.settings.gallery.sectionTitle).toBe('갤러리');
      });
    });

    describe('messages', () => {
      it('should have all download messages', () => {
        expect(ko.messages.download.single.error.title).toBe('다운로드 실패');
        expect(ko.messages.download.allFailed.title).toBe('다운로드 실패');
        expect(ko.messages.download.partial.title).toBe('일부 실패');
        expect(ko.messages.download.retry.action).toBe('다시 시도');
        expect(ko.messages.download.cancelled.title).toBe('다운로드가 취소되었습니다');
      });
    });
  });

  describe('Japanese (ja) translations', () => {
    describe('toolbar', () => {
      it('should have all toolbar translations', () => {
        expect(ja.toolbar.previous).toBe('前へ');
        expect(ja.toolbar.next).toBe('次へ');
        expect(ja.toolbar.download).toBe('ダウンロード');
        expect(ja.toolbar.downloadAll).toBe('ZIPダウンロード');
        expect(ja.toolbar.settings).toBe('設定');
        expect(ja.toolbar.close).toBe('閉じる');
        expect(ja.toolbar.tweetText).toBe('ツイートテキスト');
        expect(ja.toolbar.tweetTextPanel).toBe('ツイートテキストパネル');
      });
    });

    describe('settings', () => {
      it('should have all settings translations', () => {
        expect(ja.settings.title).toBe('設定');
        expect(ja.settings.theme).toBe('テーマ');
        expect(ja.settings.language).toBe('言語');
        expect(ja.settings.themeAuto).toBe('自動');
        expect(ja.settings.themeLight).toBe('ライト');
        expect(ja.settings.themeDark).toBe('ダーク');
        expect(ja.settings.close).toBe('閉じる');
        expect(ja.settings.gallery.sectionTitle).toBe('ギャラリー');
      });
    });

    describe('messages', () => {
      it('should have all download messages', () => {
        expect(ja.messages.download.single.error.title).toBe('ダウンロード失敗');
        expect(ja.messages.download.allFailed.title).toBe('ダウンロード失敗');
        expect(ja.messages.download.partial.title).toBe('一部失敗');
        expect(ja.messages.download.retry.action).toBe('再試行');
        expect(ja.messages.download.cancelled.title).toBe('ダウンロードがキャンセルされました');
      });
    });
  });

  describe('translation consistency', () => {
    const languages = [
      { code: 'en', dict: en },
      { code: 'ko', dict: ko },
      { code: 'ja', dict: ja },
    ] as const;

    it('should have matching keys across all languages', () => {
      const getKeys = (obj: LanguageStrings): string[] => {
        const keys: string[] = [];
        const traverse = (o: object, prefix = ''): void => {
          Object.entries(o).forEach(([k, v]) => {
            const path = prefix ? `${prefix}.${k}` : k;
            if (typeof v === 'object' && v !== null) {
              traverse(v, path);
            } else {
              keys.push(path);
            }
          });
        };
        traverse(obj);
        return keys.sort();
      };

      const enKeys = getKeys(en);
      const koKeys = getKeys(ko);
      const jaKeys = getKeys(ja);

      expect(enKeys).toEqual(koKeys);
      expect(koKeys).toEqual(jaKeys);
    });

    it('should have non-empty values for all keys', () => {
      languages.forEach(({ code, dict }) => {
        const checkNonEmpty = (obj: object, path = ''): void => {
          Object.entries(obj).forEach(([k, v]) => {
            const currentPath = path ? `${path}.${k}` : k;
            if (typeof v === 'object' && v !== null) {
              checkNonEmpty(v, currentPath);
            } else if (typeof v === 'string') {
              expect(v.length, `${code}.${currentPath} should not be empty`).toBeGreaterThan(0);
            }
          });
        };
        checkNonEmpty(dict);
      });
    });

    it('should preserve placeholders consistently', () => {
      // Check {error} placeholder
      expect(en.messages.errorBoundary.body).toContain('{error}');
      expect(ko.messages.errorBoundary.body).toContain('{error}');
      expect(ja.messages.errorBoundary.body).toContain('{error}');

      // Check {count} placeholder
      expect(en.messages.download.partial.body).toContain('{count}');
      expect(ko.messages.download.partial.body).toContain('{count}');
      expect(ja.messages.download.partial.body).toContain('{count}');

      // Check {type} placeholder
      expect(en.messages.gallery.failedToLoadImage).toContain('{type}');
      expect(ko.messages.gallery.failedToLoadImage).toContain('{type}');
      expect(ja.messages.gallery.failedToLoadImage).toContain('{type}');
    });
  });

  it('isBaseLanguageCode should validate base codes', () => {
    expect(isBaseLanguageCode('en')).toBe(true);
    expect(isBaseLanguageCode('ko')).toBe(true);
    expect(isBaseLanguageCode('ja')).toBe(true);
    expect(isBaseLanguageCode('fr')).toBe(false);
  });
});
