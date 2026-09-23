# X.com Enhanced Gallery

[English](./README.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md)

X.com の投稿に含まれる画像や動画を、キーボードで操作しやすい専用ギャラリーで
閲覧し、元のメディアをダウンロードできます。ユーザースクリプト、展開して
読み込む Chrome 拡張機能、一時的な Firefox 拡張機能として利用できます。

## 機能

- 画像、動画、GIF、対応するカードメディアの縦型ギャラリー
- 元の品質での個別ダウンロードと ZIP 一括ダウンロード
- デスクトップブラウザーでのキーボード、ポインター、ホイール操作
- オリジナル、幅、高さ、コンテナーに合わせる画像表示モード
- テーマ、言語、再生、ギャラリー設定の保存
- プロジェクトによる解析、テレメトリー、開発者運営サーバーなし

## インストール

### ユーザースクリプト

[Tampermonkey](https://www.tampermonkey.net/) または
[Violentmonkey](https://violentmonkey.github.io/) などのユーザースクリプト
マネージャーをインストールしてから、
[最新のユーザースクリプト](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest/download/xcom-enhanced-gallery.user.js)を
インストールします。

ユーザースクリプトは、ヘッダーに埋め込まれたメタデータ URL から更新を
確認します。

### Chrome、Edge、Brave 拡張機能

リリースアーカイブは、展開して読み込む開発者向けビルドです。ブラウザー
ストアからはインストールされず、自動更新もされません。

1. [最新リリース](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest)から
   `xcom-enhanced-gallery-chrome.zip` をダウンロードします。
2. アーカイブを永続的に保存するディレクトリへ展開します。
3. `chrome://extensions` を開き、**デベロッパー モード**を有効にします。
4. **パッケージ化されていない拡張機能を読み込む**を選択し、展開した
   ディレクトリを指定します。

### Firefox 拡張機能

1. [最新リリース](https://github.com/PiesP/xcom-enhanced-gallery/releases/latest)から
   `xcom-enhanced-gallery-firefox.zip` をダウンロードします。
2. `about:debugging#/runtime/this-firefox` を開きます。
3. **一時的なアドオンを読み込む**を選択し、ZIP ファイルを指定します。

この開発者向けインストールは Firefox の再起動時に削除されます。永続的に
利用する場合はユーザースクリプトを使用してください。

## 使い方

1. メディアを含む X.com の投稿を開きます。
2. 画像または動画を選択して拡張ギャラリーを開きます。
3. 矢印キー、ナビゲーションボタン、ホイールで項目を移動します。
4. ツールバーで表示モードを変更するか、現在の項目またはすべてのメディアを
   ZIP としてダウンロードします。

このギャラリーはデスクトップブラウザー向けで、モバイルやタッチ操作には
対応していません。

## ブラウザー対応

| 配布方法 | 対応範囲 |
| --- | --- |
| ユーザースクリプト | Chrome/Edge 123+, Firefox 128+, Safari 17.5+ |
| Chromium 拡張機能 | 現行のデスクトップ版 Chrome、Edge、Brave のデベロッパー モード |
| Firefox 拡張機能 | Firefox 128+ の一時的な開発者向けインストール |

ユーザースクリプトの最低対応バージョンは、
[`tooling/vite/browser-support.ts`](./tooling/vite/browser-support.ts) の
`USERSCRIPT_BROWSER_SUPPORT` で定義されています。Firefox 拡張機能の最低
バージョンは、
[`extension/manifest.firefox.json`](./extension/manifest.firefox.json) で定義
されています。

## プライバシーとセキュリティ

ページの内容とダウンロードはブラウザー内で処理されます。実行時のリクエストは、
ギャラリーの抽出とダウンロードに必要な X/Twitter のページ、API、メディア
ホストに限られます。プラットフォームと保存領域の詳細は
[プライバシー](./PRIVACY.md)、脆弱性の報告方法は
[セキュリティポリシー](./.github/SECURITY.md)を参照してください。

## 開発

このプロジェクトは AI ツールの支援を受けて開発されています。

セットアップ、コマンド、プロジェクトの制約、プルリクエストの要件は
[コントリビューションガイド](./CONTRIBUTING.md)を参照してください。

## サポート

- バグ、機能要望、質問: [GitHub Issues](https://github.com/PiesP/xcom-enhanced-gallery/issues)
- リリース履歴: [変更履歴](./CHANGELOG.md)
- 脆弱性: [セキュリティポリシー](./.github/SECURITY.md)

## ライセンス

MIT。[LICENSE](./LICENSE)、[NOTICE](./NOTICE.md)、同梱の
[サードパーティライセンス](./LICENSES/)を参照してください。
