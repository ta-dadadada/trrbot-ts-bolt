/**
 * ボット用のカスタムエラークラス
 * すべてのボット固有エラーの基底クラス
 */
export class BotError extends Error {
  /**
   * @param message 内部エラーメッセージ（ログ用）
   * @param userMessage ユーザーに表示するエラーメッセージ
   * @param context エラーコンテキスト情報（ユーザーID、コマンド引数など）
   * @param isRetryable リトライ可能なエラーかどうか
   * @param severity ログレベル（'error' | 'warn'）
   */
  constructor(
    message: string,
    public readonly userMessage: string,
    public readonly context?: Record<string, unknown>,
    public readonly isRetryable: boolean = false,
    public readonly severity: 'error' | 'warn' = 'error',
  ) {
    super(message);
    this.name = 'BotError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * バリデーションエラー（ユーザー入力起因）
 * ユーザーの入力が不正な場合に使用
 * - リトライ不可（ユーザーが入力を修正する必要がある）
 * - 警告レベル（システムエラーではない）
 */
export class ValidationError extends BotError {
  constructor(message: string, userMessage: string, context?: Record<string, unknown>) {
    super(message, userMessage, context, false, 'warn');
    this.name = 'ValidationError';
  }
}

/**
 * データベースエラー（リトライ可能）
 * データベース操作中のエラーに使用
 * - リトライ可能（一時的な問題の可能性）
 * - エラーレベル（システムエラー）
 */
export class DatabaseError extends BotError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(
      message,
      'データベース操作中にエラーが発生しました。しばらく待ってから再試行してください。',
      context,
      true,
      'error',
    );
    this.name = 'DatabaseError';
  }
}

/**
 * Slack APIエラー（リトライ可能）
 * Slack API通信中のエラーに使用
 * - リトライ可能（一時的なネットワーク問題の可能性）
 * - エラーレベル（システムエラー）
 */
export class SlackAPIError extends BotError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(
      message,
      'Slack APIとの通信中にエラーが発生しました。しばらく待ってから再試行してください。',
      context,
      true,
      'error',
    );
    this.name = 'SlackAPIError';
  }
}
