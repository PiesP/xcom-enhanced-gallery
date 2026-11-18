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
    helpOpen: 'キーボードヘルプ',
    helpPanel: 'キーボードヘルプパネル',
    helpClose: 'ヘルプを閉じる',
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
    videoClickSurfaces: '動画エリアからギャラリーを開く',
    videoClickUnmarked: '対応する再生ボタンからも開く',
    videoClickHelp:
      '対象の動画クリックの動作を選びます。ギャラリーでは保存済みの音声設定を使い、別の一時停止したプレーヤーを最初から開きます。閉じてもXでの再生は自動的に再開しません。通常のプレーヤー操作はXで行います。',
    videoClickSaveError:
      '動画のクリック設定を保存できませんでした。現在の設定が引き続き有効です。もう一度お試しください。',
    unsavedSettings: '設定は現在のセッションで有効ですが、保存されていません。',
    unsavedSession: 'このセッションに適用中・未保存',
    retrySettingsSave: '保存を再試行',
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
        resourceLimit:
          'このポストの情報はサイズ制限を超えています。Xでポストを開いてメディアを確認してください。',
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
      prev: '左: 表示中の前の項目',
      next: '右: 表示中の次の項目',
      cls: 'Escape: ギャラリーを閉じる。ツールバー内にフォーカスがある場合、開いている設定またはキーボードヘルプを先に閉じる',
      toggle: '?: このヘルプを開く',
      firstLast: 'Home / End: 最初 / 最後の項目',
      five: 'PageUp / PageDown: 5項目戻る / 進む',
      vertical: '上 / 下: 画像の項目を移動、表示中のギャラリー動画では音量を調整',
      playback: 'Space: ギャラリー動画の再生・一時停止、M: ミュート切替',
      focus: 'Tab / Shift+Tab: コントロールを移動',
      context:
        'フォーカス中のボタンではSpace / Enterが使われ、フォームとパネルのキー操作はそれぞれで処理されます。',
      recovery: 'Alt+Shift+Vは対象の動画クリックに失敗した直後のみ利用できます。',
    },
    dl: {
      filenameNotice: {
        label: '保存されたファイル名',
        mismatch: '保存名が要求した名前と異なります。',
        dismiss: 'ファイル名の通知を閉じる',
      },
      bulkOutcome: {
        cancelRecoveryAndDismiss: '欠落項目の復旧をキャンセルして ZIP の結果を閉じる',
        details: 'ZIP の結果の詳細',
        titleHandedOff: 'ZIP をブラウザーに引き渡しました',
        titleFailed: 'ZIP を引き渡せませんでした',
        previous: '前回の ZIP 結果',
        scope: '対象: このギャラリーに表示されたメディア {total} 件。',
        scopeSupplementary: '対象: このギャラリーで先ほど欠落した項目 {total} 件。',
        counts: 'ZIP に含まれる: {included} 件、除外: {omitted} 件。',
        browserHandoff:
          'ブラウザーが ZIP のダウンロード要求を受け付けました。ディスクへの保存完了は確認できません。',
        noZip: 'ブラウザーに引き渡された ZIP はありません。',
        resourceLimit:
          'ダウンロード用メモリの上限に達しました。進行中のダウンロードを待ち、続く場合はページを再読み込みしてください。',
        sourceUnavailable:
          '元画像の取得元を確認できませんでした。その項目は元の投稿から再試行してください。',
        sourceFetchFailed:
          'メディアの取得元への要求に失敗しました（HTTP {statuses}）。元の投稿を開き直し、除外された項目を再試行してください。',
        zipSaveFailed: 'ZIP は準備できましたが、ブラウザーが保存要求を受け付けませんでした。',
        other: '一部の項目を含められませんでした。ギャラリーを開き直して再試行してください。',
        nextAction:
          'すべてダウンロードを再実行すると、引き渡し済みの項目も含めて新しい ZIP を作成します。必要なら投稿を開き直し、項目を減らして試してください。',
        nextActionSupplementary:
          'この ZIP には復旧した欠落項目のみが入っています。他の項目が入った前の ZIP も保管してください。',
        recoverMissing: '欠落した {count} 件を別の ZIP としてダウンロード',
        dismiss: 'ZIP の結果を閉じる',
      },
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
      sourceDetails: {
        title: 'メディアと保存の詳細',
        shown: '収集した{count}件 · 投稿にはほかにもある可能性があります',
        knownSubset: '対応する{count}件 · 一部のメディアは保存できません',
        cdnOriginal: '保存元: X の CDN で確認された元画像。',
        bestMp4: '保存元: X で利用可能な最良の MP4。',
        observed: '動画の保存画質を確認できません',
        observedDetail:
          '保存には確認した動画ソースを使用します。再生には別の映像が使われる場合があります。',
        unavailable: '元画像を保存できません',
        unavailableDetail:
          '確認済みの元画像が見つかりません。この項目は保存できず、低画質版で代用しません。',
        pending: '保存時に元画像を確認します',
        pendingDetail:
          'この画像はまだ確認していません。単体または ZIP の保存前に元画像のソースを確認します。',
        retryable: '元画像を確認できませんでした',
        retryableDetail:
          '元画像の有無を確認できませんでした。保存を再試行できます。低画質版では代用しません。',
      },
      entryFailureNext: 'X のポストでこのメディアを確認してください。',
      downloadFailureNext:
        'ブラウザーのダウンロード一覧で保存状況を確認するか、X のポストに戻ってください。',
      dismissFailure: 'エラー案内を閉じる',
      mediaType: { image: '画像', video: '動画' },
      video: {
        playbackFallback:
          '別の画質で再生します。ダウンロードには利用可能な最良のソースを使用します。',
      },
      observedQuality: {
        title: '復元したソースの品質',
        body: '一部の項目のソース品質を確認できませんでした。画像の保存前に元画像を確認します。復元した動画は画面で確認したソースで保存されます。',
      },
      partialRecovery: {
        title: '表示中のメディアのみ',
        body: '現在確認できるメディアのみを収集しました。投稿にはほかにもある可能性があり、一括ダウンロードには収集した項目のみが含まれます。',
      },
      knownSubset: {
        title: '一部のメディアは保存できません',
        body: 'ソースには未対応のメディアがあります。ギャラリーと ZIP には収集した対応項目のみが含まれます。',
      },
      emptyT: 'メディアがありません',
      emptyD: '表示する画像や動画がありません。',
      itemLbl: 'メディア {index}: {filename}',
      loadFail: '{type} の読み込みに失敗しました',
      imageGallery: '画像ギャラリー',
      loading: '読み込み中',
      opening: 'ギャラリーを開いています…',
      retryLoading: '再読み込み',
      retryExhausted: 'まだ読み込めません。ギャラリーを開き直すか、元の投稿でお試しください。',
      openOriginalPost: '元の投稿を開く',
      videoCount: '動画 {index}/{total}',
      imageCount: '画像 {index}/{total}: {alt}',
      hashtagLabel: 'ハッシュタグ {value}',
    },
  },
};
