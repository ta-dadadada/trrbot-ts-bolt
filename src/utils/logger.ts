import { ConsoleLogger, LogLevel } from '@slack/logger';
import type { Logger } from '@slack/logger';

/**
 * LOG_LEVEL環境変数からLogLevelを取得
 * @returns LogLevel (デフォルト: INFO)
 */
function getLogLevelFromEnv(): LogLevel {
  const level = process.env.LOG_LEVEL?.toUpperCase();
  const validLevels: Record<string, LogLevel> = {
    DEBUG: LogLevel.DEBUG,
    INFO: LogLevel.INFO,
    WARN: LogLevel.WARN,
    ERROR: LogLevel.ERROR,
  };

  return validLevels[level || ''] || LogLevel.INFO;
}

/**
 * グローバルLoggerインスタンス（アプリ全体で共有）
 * Boltアプリと同じLoggerインスタンスを使用
 */
export const logger = (() => {
  const consoleLogger = new ConsoleLogger();
  consoleLogger.setLevel(getLogLevelFromEnv());
  consoleLogger.setName('trrbot');
  return consoleLogger;
})();

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
 * ```
 */
export function createLogger(moduleName: string): Logger {
  const moduleLogger = new ConsoleLogger();
  moduleLogger.setLevel(getLogLevelFromEnv());
  moduleLogger.setName(moduleName);
  return moduleLogger;
}
