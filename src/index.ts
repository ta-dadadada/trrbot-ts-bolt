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

    const shutdown = (signal: 'SIGINT' | 'SIGTERM'): never => {
      appLogger.info(`アプリを終了します（${signal}）`);
      runtime.stop();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    await runtime.start(config.port);
    appLogger.info('Boltアプリ起動', {
      port: config.port,
      mode: config.socketMode ? 'socket' : 'http',
    });
  } catch (error) {
    if (error instanceof AppConfigurationError) {
      slackLogger.error(error.message, {
        required: error.required,
        socketMode: error.socketMode,
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
