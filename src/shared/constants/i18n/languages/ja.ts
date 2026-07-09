// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { LanguageStrings } from '@shared/constants/i18n/language-types';

/**
 * Japanese language strings for the application
 */
export const ja: LanguageStrings = {
  tb: {
    prev: '前へ',
    next: '次へ',
    dl: 'ダウンロード',
    dlAllCt: 'すべての{count}件をZIPでダウンロード',
    setOpen: '設定を開く',
    cls: '閉じる',
    twTxt: 'ツイートを見る',
    twPanel: 'ツイートテキストパネル',
    twUrl: '元のツイートを見る',
    fitOri: '原寸',
    fitW: '幅に合わせる',
    fitH: '高さに合わせる',
    fitC: 'ウィンドウに合わせる',
    galleryToolbar: 'ギャラリーツールバー',
    progress: '進捗',
    settingsPanel: '設定パネル',
  },
  st: {
    th: 'テーマ',
    lang: 'Language / 언어 / 言語 / Idioma / اللغة',
    thAuto: '自動',
    thLt: 'ライト',
    thDk: 'ダーク',
    langAuto: 'Auto / 자동 / 自動 / Auto / تلقائي',
    langKo: '韓国語',
    langEn: '英語',
    langJa: '日本語',
    langZhCn: '簡体字中国語',
    langEs: 'スペイン語',
    langAr: 'アラビア語',
  },
  msg: {
    err: {
      t: 'エラーが発生しました',
      b: '予期しないエラーが発生しました: {error}',
      loadMedia: {
        title: 'メディアの読み込みに失敗しました',
        body: '画像や動画が見つかりませんでした。',
      },
      generic: 'エラーが発生しました',
      loadGallery: 'ギャラリーの読み込みに失敗しました',
      settingsUnavailable: {
        title: '設定を利用できません',
        body: '設定が読み込まれるまでデフォルト値が使用されます。',
      },
      retry: '再試行',
      noMoreRetries: '再試行できません',
      reset: 'リセット',
    },
    kb: {
      t: 'キーボードショートカット',
      prev: 'ArrowLeft: 前のメディア',
      next: 'ArrowRight: 次のメディア',
      cls: 'Escape: ギャラリーを閉じる',
      toggle: '?: このヘルプを表示',
    },
    dl: {
      one: {
        err: {
          t: 'ダウンロード失敗',
          b: 'ファイルを取得できません: {error}',
        },
      },
      allFail: {
        t: 'ダウンロード失敗',
        b: 'すべての項目をダウンロードできませんでした。',
      },
      part: {
        t: '一部失敗',
        b: '{count}個の項目を取得できませんでした。',
      },
      noMedia: 'メディアが選択されていません。ギャラリーを開き直してお試しください。',
      zipFail: 'ZIPファイルの保存に失敗しました',
    },
    gal: {
      emptyT: 'メディアがありません',
      emptyD: '表示する画像や動画がありません。',
      itemLbl: 'メディア {index}: {filename}',
      loadFail: '{type} の読み込みに失敗しました',
      imageGallery: '画像ギャラリー',
      loading: '読み込み中',
      videoCount: '動画 {index}/{total}',
      imageCount: '画像 {index}/{total}: {alt}',
      hashtagLabel: 'ハッシュタグ {value}',
    },
  },
};
