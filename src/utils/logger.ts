import pino from 'pino';
import type { Logger as BoltLogger } from '@slack/logger';
import { LogLevel } from '@slack/logger';

/**
 * Pino loggerインスタンスを作成（環境変数を考慮）
 */
function createPinoInstance(): pino.Logger {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() || 'info';
  // Pinoの有効なlog level: trace, debug, info, warn, error, fatal, silent
  const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'];
  const level = validLevels.includes(envLevel) ? envLevel : 'info';

  return pino({
    level,
    // 明示的にJSON出力を指定（改行なし、単一行JSON）
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    // タイムスタンプをミリ秒で出力
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

/**
 * グローバルPino logger（アプリ起動時の設定を保持）
 */
const globalPinoInstance = createPinoInstance();

/**
 * Bolt Logger interface実装（Pinoベース）
 * @slack/loggerのインターフェースを満たしつつ、内部でpinoを使用
 */
class PinoBoltLogger implements BoltLogger {
  private logger: pino.Logger;

  constructor(moduleName: string, baseLogger?: pino.Logger) {
    // baseLogger指定がなければ、現在の環境変数から新しいインスタンスを作成（テスト用・特殊用途のみ推奨）
    // ※本番環境では、グローバルインスタンスまたはexportされたcreateLogger関数を使用してください
    const pinoInstance = baseLogger || createPinoInstance();
    this.logger = pinoInstance.child({ module: moduleName });
  }

  debug(...msg: unknown[]): void {
    const formatted = this.formatArgs(msg);
    // Pinoはオブジェクトまたは文字列を受け取る（両方を渡してはいけない）
    this.logger.debug(formatted);
  }

  info(...msg: unknown[]): void {
    const formatted = this.formatArgs(msg);
    this.logger.info(formatted);
  }

  warn(...msg: unknown[]): void {
    const formatted = this.formatArgs(msg);
    this.logger.warn(formatted);
  }

  error(...msg: unknown[]): void {
    const formatted = this.formatArgs(msg);
    this.logger.error(formatted);
  }

  setLevel(level: string): void {
    this.logger.level = level.toLowerCase();
  }

  getLevel(): LogLevel {
    // Pinoのログレベル（trace, debug, info, warn, error, fatal, silent）を
    // BoltのLogLevel（DEBUG, INFO, WARN, ERROR）にマッピング
    const pinoLevel = this.logger.level;
    switch (pinoLevel) {
      case 'trace':
      case 'debug':
        return LogLevel.DEBUG;
      case 'info':
        return LogLevel.INFO;
      case 'warn':
        return LogLevel.WARN;
      case 'error':
      case 'fatal':
        return LogLevel.ERROR;
      case 'silent':
        // Pinoの'silent'レベルは全てのログを無効化しますが、BoltのLogLevelにはSILENT相当がありません。
        // そのため、ERRORにフォールバックします。
        // 注意: この場合、実際のログ動作はPino側で制御されるため、
        // このマッピングはBoltのLogLevel型を満たすための形式的なものです。
        return LogLevel.ERROR;
      default:
        return LogLevel.ERROR;
    }
  }

  setName(_name: string): void {
    // Pinoでは子ロガーとして既に実装済み（moduleフィールド）
    // setNameの代わりにchild loggerを使用
  }

  /**
   * ログ引数をPino用の構造化オブジェクトに変換
   * 常にオブジェクトを返すことで、Pinoが正しくJSON出力できるようにする
   */
  private formatArgs(args: unknown[]): Record<string, unknown> {
    // 引数なし
    if (args.length === 0) {
      return { message: '' };
    }

    // 単一引数: JSON文字列の場合はパースして返す（errorHandlerとの互換性）
    if (args.length === 1 && typeof args[0] === 'string') {
      try {
        const parsed = JSON.parse(args[0]);
        // パース成功: オブジェクトとして返す
        return parsed as Record<string, unknown>;
      } catch {
        // パース失敗: 通常の文字列メッセージとして扱う
        return { message: args[0] };
      }
    }

    // 単一引数: オブジェクトの場合はそのまま
    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
      return args[0] as Record<string, unknown>;
    }

    // 複数引数: 最初の引数が文字列で、2番目がオブジェクトの場合はマージ
    if (
      args.length === 2 &&
      typeof args[0] === 'string' &&
      typeof args[1] === 'object' &&
      args[1] !== null
    ) {
      return { message: args[0], ...(args[1] as Record<string, unknown>) };
    }

    // その他の複数引数: 最初をmessage、残りをdataとして
    if (args.length > 1) {
      return { message: args[0], data: args.slice(1) };
    }

    // その他: messageフィールドとして
    return { message: args[0] };
  }
}

/**
 * グローバルLoggerインスタンス（アプリ全体で共有）
 * Boltアプリと同じLoggerインスタンスを使用
 */
export const logger = new PinoBoltLogger('trrbot', globalPinoInstance);

/**
 * モジュール別Loggerを作成
 * @param moduleName モジュール名（例: 'database', 'app', 'config'）
 * @returns 指定されたモジュール名を持つLoggerインスタンス
 *
 * @example
 * ```typescript
 * import { createLogger } from './utils/logger';
 * const logger = createLogger('database');
 * logger.info('データベース初期化完了');
 * // 出力: {"level":"info","time":1234567890,"module":"database","message":"データベース初期化完了"}
 * ```
 */
export function createLogger(moduleName: string): BoltLogger {
  return new PinoBoltLogger(moduleName);
}
