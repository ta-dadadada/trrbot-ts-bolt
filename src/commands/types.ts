import { Logger } from '@slack/bolt';
import { WebClient, ChatPostMessageResponse } from '@slack/web-api';
import type { GenericMessageEvent } from '@slack/types';

/**
 * Slackイベントの型定義
 * @slack/types の GenericMessageEvent を使用
 */
export type SlackEvent = GenericMessageEvent;

/**
 * Slackメッセージ送信関数の型定義
 * 文字列またはメッセージオプションを受け取る
 */
export type SayFunction = (
  message:
    | string
    | {
        text: string;
        thread_ts?: string;
        blocks?: unknown[];
        attachments?: unknown[];
        mrkdwn?: boolean;
        unfurl_links?: boolean;
        unfurl_media?: boolean;
      },
) => Promise<ChatPostMessageResponse>;

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
   * コマンドの説明（ヘルプ表示用）
   */
  description: string;

  /**
   * コマンドの使用例を生成する
   * @param commandName コマンド名（エイリアスまたは正式名）
   * @returns 使用例の配列
   */
  getExamples(commandName: string): string[];

  /**
   * コマンドを実行する
   * @param context コマンド実行コンテキスト
   */
  execute(context: CommandContext): Promise<void>;

  /**
   * カスタムヘルプテキストを生成する（オプション）
   * サブコマンド型コマンドなど、複雑なヘルプが必要な場合に実装する
   * @param commandName コマンド名（エイリアスまたは正式名）
   * @returns フォーマットされたヘルプテキスト
   */
  getHelpText?(commandName: string): string;
}

/**
 * スレッド内で返信するためのヘルパー関数
 * スレッド内のメッセージの場合は thread_ts を返す
 * スレッドのルートメッセージの場合は ts を返す（新しいスレッドを開始）
 * 通常のメッセージの場合は undefined を返す（チャンネルに直接返信）
 * @param event Slackイベント
 * @returns スレッドTS（存在する場合）
 */
export const getThreadTs = (event: SlackEvent): string | undefined => {
  // thread_ts が存在する場合、これはスレッド内のメッセージなのでそれを返す
  if (event.thread_ts) {
    return event.thread_ts;
  }
  // thread_ts がない場合、通常のメッセージなので undefined を返す
  return undefined;
};
