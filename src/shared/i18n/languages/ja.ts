import type { LanguageStrings } from '../language-types';

export const ja: LanguageStrings = {
  toolbar: {
    previous: '前へ',
    next: '次へ',
    download: 'ダウンロード',
    downloadAll: 'ZIPダウンロード',
    settings: '設定',
    close: '閉じる',
  },
  settings: {
    title: '設定',
    theme: 'テーマ',
    language: '言語',
    themeAuto: '自動',
    themeLight: 'ライト',
    themeDark: 'ダーク',
    languageAuto: '自動 / Auto / 자동',
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
      single: { error: { title: 'ダウンロード失敗', body: 'ファイルを取得できません: {error}' } },
      allFailed: {
        title: 'ダウンロード失敗',
        body: 'すべての項目をダウンロードできませんでした。',
      },
      partial: { title: '一部失敗', body: '{count}個の項目を取得できませんでした。' },
      retry: {
        action: '再試行',
        success: { title: '再試行成功', body: '失敗していた項目をすべて取得しました。' },
      },
      cancelled: {
        title: 'ダウンロードがキャンセルされました',
        body: '要求したダウンロードはキャンセルされました。',
      },
    },
    gallery: {
      emptyTitle: 'メディアがありません',
      emptyDescription: '表示する画像や動画がありません。',
      failedToLoadImage: '{type} の読み込みに失敗しました',
    },
  },
};

export default ja;
