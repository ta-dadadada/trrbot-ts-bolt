import type { Logger } from '@slack/logger';
import { CommandContext, getThreadTs } from '../commands/types';
import { BotError } from './errors';

/**
 * 構造化ログコンテキストの型定義
 */
interface LogContext {
  command?: string;
  user?: string;
  channel?: string;
  channelType?: string;
  timestamp?: string;
  errorName?: string;
  isRetryable?: boolean;
  [key: string]: unknown;
}

/**
 * 構造化ログ出力（単一行JSON形式）
 * Pinoが自動的にオブジェクトをJSONに変換
 * @param logger Slack Bolt Logger
 * @param level ログレベル
 * @param message メインメッセージ
 * @param context コンテキスト情報
 */
function logStructured(
  logger: Logger,
  level: 'error' | 'warn' | 'info' | 'debug',
  message: string,
  context: LogContext,
): void {
  // Pinoがオブジェクトを単一行JSONに自動変換
  const logEntry = {
    message,
    ...context,
  };
  logger[level](logEntry);
}

/**
 * コマンド実行時のエラーハンドリング
 * @param error エラーオブジェクト
 * @param context コマンド実行コンテキスト
 * @param commandName コマンド名（オプション）
 */
export async function handleCommandError(
  error: unknown,
  context: CommandContext,
  commandName?: string,
): Promise<void> {
  const { logger, say, event } = context;
  const threadTs = getThreadTs(event);

  if (commandName) {
    logger.setName(`cmd:${commandName}`);
  }

  const logContext: LogContext = {
    command: commandName || event.text?.split(' ')[0],
    user: event.user,
    channel: event.channel,
    channelType: event.channel_type,
    timestamp: event.ts,
  };

  let userMessage = 'エラーが発生しました。';
  let logMessage = 'Unknown error occurred';
  let severity: 'error' | 'warn' = 'error';

  if (error instanceof BotError) {
    userMessage = error.userMessage;
    logMessage = error.message;
    severity = error.severity;
    logContext.errorName = error.name;
    logContext.isRetryable = error.isRetryable;
    Object.assign(logContext, error.context);
  } else if (error instanceof Error) {
    logMessage = error.message;
    logContext.errorName = error.name;
    logContext.stack = error.stack;
  } else {
    logMessage = String(error);
  }

  logStructured(logger, severity, logMessage, logContext);

  try {
    await say({
      text: userMessage,
      ...(threadTs && { thread_ts: threadTs }),
    });
  } catch (sayError) {
    logger.error(
      'Failed to send error message to user',
      '\nOriginal error:',
      logMessage,
      '\nSay error:',
      sayError instanceof Error ? sayError.message : String(sayError),
    );
  }
}

/**
 * 成功時の情報ログ出力
 * @param logger Logger
 * @param commandName コマンド名
 * @param context ログコンテキスト
 */
export function logCommandSuccess(
  logger: Logger,
  commandName: string,
  context: Partial<LogContext>,
): void {
  logger.setName(`cmd:${commandName}`);
  logStructured(logger, 'info', 'Command executed successfully', context as LogContext);
}

/**
 * デバッグログ出力（単一行JSON形式）
 * Pinoが自動的にオブジェクトをJSONに変換
 * @param logger Logger
 * @param commandName コマンド名
 * @param message メッセージ
 * @param data データ（オプション）
 */
export function logDebug(
  logger: Logger,
  commandName: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  logger.setName(`cmd:${commandName}`);
  const logEntry = data ? { message, ...data } : { message };
  logger.debug(logEntry);
}
