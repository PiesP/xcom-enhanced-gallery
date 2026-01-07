import type { LanguageStrings } from '@shared/constants/i18n/language-types';
import { buildLanguageStringsFromValues } from '@shared/constants/i18n/translation-values';

/**
 * Japanese language translation values
 * Order must match the translation registry keys
 */
const JA_VALUES = [
  '前へ',
  '次へ',
  'ダウンロード',
  'すべての{count}件をZIPでダウンロード',
  '設定を開く',
  '閉じる',
  'ツイートを見る',
  'ツイートテキストパネル',
  '元のツイートを見る',
  '原寸',
  '幅に合わせる',
  '高さに合わせる',
  'ウィンドウに合わせる',
  'テーマ',
  'Language / 언어 / 言語',
  '自動',
  'ライト',
  'ダーク',
  'Auto / 자동 / 自動',
  '韓国語',
  '英語',
  '日本語',
  'エラーが発生しました',
  '予期しないエラーが発生しました: {error}',
  'キーボードショートカット',
  'ArrowLeft: 前のメディア',
  'ArrowRight: 次のメディア',
  'Escape: ギャラリーを閉じる',
  '?: このヘルプを表示',
  'ダウンロード失敗',
  'ファイルを取得できません: {error}',
  'ダウンロード失敗',
  'すべての項目をダウンロードできませんでした。',
  '一部失敗',
  '{count}個の項目を取得できませんでした。',
  'メディアがありません',
  '表示する画像や動画がありません。',
  'メディア {index}: {filename}',
  '{type} の読み込みに失敗しました',
] as const;

/**
 * Japanese language strings for the application
 */
export const ja: LanguageStrings = buildLanguageStringsFromValues(JA_VALUES);
