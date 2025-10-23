import { Logger } from '@slack/bolt';
import { WebClient, ChatPostMessageResponse } from '@slack/web-api';
import type { GenericMessageEvent, Block, MessageAttachment } from '@slack/types';

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
        blocks?: Block[];
        attachments?: MessageAttachment[];
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
 * 通常のメッセージの場合は undefined を返す（チャンネルに直接返信）
 * @param event Slackイベント
 * @returns スレッドTS（存在する場合）
 */
export const getThreadTs = (event: SlackEvent): string | undefined => {
  return event.thread_ts;
};
