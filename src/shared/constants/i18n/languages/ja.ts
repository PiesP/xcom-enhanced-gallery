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
    dlAllCt: '表示中の{count}件をZIPでダウンロード',
    setOpen: '設定を開く',
    cls: '閉じる',
    twTxt: 'ツイートを見る',
    twPanel: 'ツイートテキストパネル',
    twUrl: '元のツイートを見る',
    fitOri: '原寸',
    fitW: '幅に合わせる',
    fitH: '高さに合わせる',
    fitC: 'ウィンドウに合わせる',
    currentFit: '表示: {mode}',
    mediaPosition: 'メディア {index}/{total}',
    noMedia: 'メディアなし',
    galleryToolbar: 'ギャラリーツールバー',
    navigationGroup: '移動と現在位置',
    fitGroup: '表示サイズ',
    downloadGroup: 'ダウンロード',
    auxGroup: 'その他の操作',
    settingsPanel: '設定パネル',
  },
  st: {
    th: 'テーマ',
    lang: '言語',
    thAuto: '自動',
    thLt: 'ライト',
    thDk: 'ダーク',
    langAuto: '自動',
    langKo: '韓国語',
    langEn: '英語',
    langJa: '日本語',
    langZhCn: '簡体字中国語',
    langEs: 'スペイン語',
    langAr: 'アラビア語',
    videoClickMode: '動画のクリック',
    videoClickNative: '動画のクリックをXで処理',
    videoClickSurfaces: '動画画面からギャラリーを開く',
    videoClickUnmarked: '対象の再生ボタンもギャラリーで開く',
    videoClickHelp:
      '後ろの2つのモードでは対象の動画画面からギャラリーを開きます。最後のモードのみ、検証済みの目印のない再生ボタンも対象です。通常のプレーヤー操作はXで行います。',
    videoClickSaveError:
      '動画のクリック設定を保存できませんでした。現在の設定が引き続き有効です。もう一度お試しください。',
  },
  msg: {
    err: {
      t: 'エラーが発生しました',
      b: '予期しないエラーが発生しました: {error}',
      loadMedia: {
        title: 'メディアの読み込みに失敗しました',
        body: '画像や動画が見つかりませんでした。',
        unsupported:
          'この動画にはHLSストリーミングソースしかありません。ギャラリーでの再生と保存には、確認済みのMP4ソースが必要です。',
        noMedia: 'この投稿のメディアが返されませんでした。',
        denied: 'メディアサービスがリクエストを拒否しました。後でもう一度お試しください。',
        unreadable: 'メディアの応答を読み取れませんでした。後でもう一度お試しください。',
        rateLimited: 'メディアサービスのリクエスト制限に達しました。後でもう一度お試しください。',
        deferred: 'メディアサービスから待機を求められました。後でもう一度お試しください。',
        providerError:
          'メディアサービスからこの投稿を取得できませんでした。後でもう一度お試しください。',
        transport: 'メディアサービスに接続できませんでした。後でもう一度お試しください。',
        ownerUnconfirmed: '選択したメディアの投稿元を確認できませんでした。',
        mismatch: '取得したメディアが選択した項目と一致しません。',
        cancelled: 'メディアの読み込みがキャンセルされました。',
        nativeVideoRecovery:
          'Xの動画の再生・一時停止ボタンを使うか、Alt+Shift+Vを押して動画のクリックをXで処理してください。',
        nativeVideoControls: '視聴を続けるには、Xの動画の再生・一時停止ボタンを使ってください。',
        nativeVideoEnabled:
          '動画のクリックはXで処理されます。再びギャラリーを使うには、ギャラリー設定の「動画のクリック」を変更してください。',
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
      status: {
        working: 'ダウンロードを準備中…',
        handedOff: 'ブラウザーに引き渡しました',
        error: 'ダウンロードに失敗しました',
      },
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
        resourceLimit:
          'ZIPには{count}個のファイルが含まれますが、{failed}個のファイルは含まれません。ダウンロード用のメモリ上限に達しました。まず進行中のダウンロードが終わるまで待ってください。進行中のダウンロードがなくても上限に達する場合は、このページを再読み込みしてください。その後、ファイル数を減らして再試行してください。',
      },
      noMedia: 'メディアが選択されていません。ギャラリーを開き直してお試しください。',
      zipFail: 'ZIPファイルの保存に失敗しました',
      sourceUnavailable:
        '元画像のソースを確認できなかったため、この項目は保存されませんでした。投稿を開き直して再試行してください。',
      resourceLimit:
        'ダウンロード用のメモリ上限に達しました。まず進行中のダウンロードが終わるまで待ってください。進行中のダウンロードがなくても上限に達する場合は、このページを再読み込みしてください。その後、ファイル数を減らして再試行してください。',
    },
    gal: {
      video: {
        playbackFallback:
          '別の画質で再生します。ダウンロードには利用可能な最良のソースを使用します。',
      },
      observedQuality: {
        title: '復元したソースの品質',
        body: '一部の項目のソース品質を確認できませんでした。元画像を確認できない画像は保存できません。復元した動画は画面で確認したソースで保存されます。',
      },
      partialRecovery: {
        title: '表示中のメディアのみ',
        body: 'このタイルのメディアのみを復元しました。一括ダウンロードには表示中の項目のみが含まれます。',
      },
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
