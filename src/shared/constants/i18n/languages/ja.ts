import type { LanguageStrings } from '@shared/constants/i18n/language-types';

export const ja: LanguageStrings = {
  tb: {
    prev: '前へ',
    prevSc: '前へ (左矢印)',
    next: '次へ',
    nextSc: '次へ (右矢印)',
    dl: 'ダウンロード',
    dlCurSc: '現在のファイルをダウンロード',
    dlAll: 'ZIPダウンロード',
    dlAllCt: 'すべての{count}件をZIPでダウンロード',
    set: '設定',
    setOpen: '設定を開く',
    cls: '閉じる',
    clsSc: '閉じる (Esc)',
    twTxt: 'ツイートテキスト',
    twPanel: 'ツイートテキストパネル',
    fitOri: '原寸',
    fitOriT: '原寸サイズ (1:1)',
    fitW: '幅に合わせる',
    fitWT: '幅に合わせる',
    fitH: '高さに合わせる',
    fitHT: '高さに合わせる',
    fitC: 'ウィンドウに合わせる',
    fitCT: 'ウィンドウに合わせる',
  },
  st: {
    ttl: '設定',
    th: 'テーマ',
    lang: '言語',
    thAuto: '自動',
    thLt: 'ライト',
    thDk: 'ダーク',
    langAuto: 'Auto / 자동 / 自動',
    langKo: '한국어',
    langEn: 'English',
    langJa: '日本語',
    cls: '閉じる',
    gal: {
      sec: 'ギャラリー',
    },
  },
  msg: {
    err: {
      t: 'エラーが発生しました',
      b: '予期しないエラーが発生しました: {error}',
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
      retry: {
        act: '再試行',
        ok: {
          t: '再試行成功',
          b: '失敗していた項目をすべて取得しました。',
        },
      },
      cancel: {
        t: 'ダウンロードがキャンセルされました',
        b: '要求したダウンロードはキャンセルされました。',
      },
    },
    gal: {
      emptyT: 'メディアがありません',
      emptyD: '表示する画像や動画がありません。',
      itemLbl: 'メディア {index}: {filename}',
      loadFail: '{type} の読み込みに失敗しました',
    },
  },
};
