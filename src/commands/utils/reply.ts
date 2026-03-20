import { SlackEvent } from '../types';

export interface ReplyOptions {
  thread_ts: string;
}

/**
 * スレッド対応の返信オプションを生成
 * 常に thread_ts を含む（スレッド内なら thread_ts、そうでなければ event.ts）
 */
export const getReplyOptions = (event: SlackEvent): ReplyOptions => ({
  thread_ts: event.thread_ts || event.ts,
});
