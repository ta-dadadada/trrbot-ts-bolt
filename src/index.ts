import 'dotenv/config';
import { createSlackApp } from './app';
import { AppConfigurationError, loadAppConfig } from './config/appConfig';
import { openDatabase } from './db/connection';
import { createApplicationRuntime } from './runtime';
import { createLogger, logger as slackLogger } from './utils/logger';
import { getRandomItem } from './utils/random';

const appLogger = createLogger('app');

async function main(): Promise<void> {
  try {
    const config = loadAppConfig(process.env);
    const app = createSlackApp(config, slackLogger);
    const db = openDatabase();
    const runtime = createApplicationRuntime({ app, db, pickRandomItem: getRandomItem });

    const shutdown = async (signal: 'SIGINT' | 'SIGTERM'): Promise<never> => {
      appLogger.info(`アプリを終了します（${signal}）`);

      try {
        await runtime.stop();
        process.exit(0);
      } catch (error) {
        appLogger.error('アプリ終了失敗', {
          error: error instanceof Error ? error.message : String(error),
        });
        process.exit(1);
      }
    };

    process.on('SIGINT', () => {
      void shutdown('SIGINT');
    });
    process.on('SIGTERM', () => {
      void shutdown('SIGTERM');
    });

    await runtime.start(config.port);
    appLogger.info('Boltアプリ起動', {
      port: config.port,
      mode: config.socketMode ? 'socket' : 'http',
    });
  } catch (error) {
    if (error instanceof AppConfigurationError) {
      slackLogger.error(error.message, {
        variable: error.variable,
        reason: error.reason,
      });
    } else {
      appLogger.error('アプリ起動失敗', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    process.exit(1);
  }
}

void main();
