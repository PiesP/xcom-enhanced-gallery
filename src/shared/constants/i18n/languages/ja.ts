import type { LanguageStrings } from '@shared/constants/i18n/language-types';

export const ja: LanguageStrings = {
  toolbar: {
    previous: '前へ',
    previousWithShortcut: '前へ (左矢印)',
    next: '次へ',
    nextWithShortcut: '次へ (右矢印)',
    download: 'ダウンロード',
    downloadCurrentWithShortcut: '現在のファイルをダウンロード',
    downloadAll: 'ZIPダウンロード',
    downloadAllWithCount: 'すべての{count}件をZIPでダウンロード',
    settings: '設定',
    openSettings: '設定を開く',
    close: '閉じる',
    closeWithShortcut: '閉じる (Esc)',
    tweetText: 'ツイートテキスト',
    tweetTextPanel: 'ツイートテキストパネル',
    fitOriginal: '原寸',
    fitOriginalTitle: '原寸サイズ (1:1)',
    fitWidth: '幅に合わせる',
    fitWidthTitle: '幅に合わせる',
    fitHeight: '高さに合わせる',
    fitHeightTitle: '高さに合わせる',
    fitContainer: 'ウィンドウに合わせる',
    fitContainerTitle: 'ウィンドウに合わせる',
  },
  settings: {
    title: '設定',
    theme: 'テーマ',
    language: '言語',
    themeAuto: '自動',
    themeLight: 'ライト',
    themeDark: 'ダーク',
    languageAuto: 'Auto / 자동 / 自動',
    languageKo: '한국어',
    languageEn: 'English',
    languageJa: '日本語',
    close: '閉じる',
    gallery: {
      sectionTitle: 'ギャラリー',
    },
  },
  messages: {
    errorBoundary: {
      title: 'エラーが発生しました',
      body: '予期しないエラーが発生しました: {error}',
    },
    keyboardHelp: {
      title: 'キーボードショートカット',
      navPrevious: 'ArrowLeft: 前のメディア',
      navNext: 'ArrowRight: 次のメディア',
      close: 'Escape: ギャラリーを閉じる',
      toggleHelp: '?: このヘルプを表示',
    },
    download: {
      single: {
        error: {
          title: 'ダウンロード失敗',
          body: 'ファイルを取得できません: {error}',
        },
      },
      allFailed: {
        title: 'ダウンロード失敗',
        body: 'すべての項目をダウンロードできませんでした。',
      },
      partial: {
        title: '一部失敗',
        body: '{count}個の項目を取得できませんでした。',
      },
      retry: {
        action: '再試行',
        success: {
          title: '再試行成功',
          body: '失敗していた項目をすべて取得しました。',
        },
      },
      cancelled: {
        title: 'ダウンロードがキャンセルされました',
        body: '要求したダウンロードはキャンセルされました。',
      },
    },
    gallery: {
      emptyTitle: 'メディアがありません',
      emptyDescription: '表示する画像や動画がありません。',
      mediaItemLabel: 'メディア {index}: {filename}',
      failedToLoadImage: '{type} の読み込みに失敗しました',
    },
  },
};
