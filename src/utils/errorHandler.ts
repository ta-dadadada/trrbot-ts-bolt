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
 * 構造化ログ出力
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
  // 開発環境（DEBUG）では整形あり、本番環境では単一行で効率化
  const isDevelopment = process.env.LOG_LEVEL === 'DEBUG';
  const contextStr = isDevelopment
    ? JSON.stringify(context, null, 2) // 開発: 読みやすさ優先
    : JSON.stringify(context); // 本番: 効率優先
  logger[level](message, '\nContext:', contextStr);
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
 * デバッグログ出力
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
  if (data) {
    // 開発環境（DEBUG）では整形あり、本番環境では単一行で効率化
    const isDevelopment = process.env.LOG_LEVEL === 'DEBUG';
    const dataStr = isDevelopment ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    logger.debug(message, '\nData:', dataStr);
  } else {
    logger.debug(message);
  }
}
