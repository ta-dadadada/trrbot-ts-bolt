/**
 * アプリケーション全体で使用する定数を定義するファイル
 */

/**
 * ボットのメンション名
 * 環境変数 BOT_MENTION_NAME が設定されていない場合は '@trrbot' をデフォルト値として使用
 */
export const BOT_MENTION_NAME = process.env.BOT_MENTION_NAME || '@trrbot';