import { Logger } from '@slack/bolt';
import { WebClient } from '@slack/web-api';

/**
 * Slackイベントの型定義
 * 必要に応じて拡張可能
 */
export interface SlackEvent {
  text?: string;
  ts?: string;
  thread_ts?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Slackイベントの型互換性のために必要
}

/**
 * Slackメッセージ送信関数の型定義
 */
export type SayFunction = (message: {
  text: string;
  thread_ts?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Slackメッセージの型互換性のために必要
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) => Promise<any>; // Slack APIの戻り値型互換性のために必要

/**
 * コマンド実行に必要なコンテキスト
 */
export interface CommandContext {
  event: SlackEvent;
  say: SayFunction;
  logger: Logger;
  args: string[];
  client: WebClient;
}

/**
 * コマンドインターフェース
 */
export interface Command {
  /**
   * コマンド名
   */
  name: string;
  
  /**
   * コマンドの説明（ヘルプ表示用）
   */
  description: string;
  
  /**
   * コマンドの使用例（ヘルプ表示用）
   */
  examples: string[];
  
  /**
   * コマンドを実行する
   * @param context コマンド実行コンテキスト
   */
  execute(context: CommandContext): Promise<void>;
}

/**
 * スレッド内で返信するためのヘルパー関数
 * @param event Slackイベント
 * @returns スレッドTS（存在する場合）
 */
export const getThreadTs = (event: SlackEvent): string | undefined => {
  return event.thread_ts || (event.ts && event.thread_ts ? event.thread_ts : undefined);
};