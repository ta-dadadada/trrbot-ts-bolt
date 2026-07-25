export interface AppConfig {
  botToken: string;
  signingSecret: string;
  appToken: string | undefined;
  socketMode: boolean;
  port: number;
}

type AppConfigVariable =
  'SLACK_BOT_TOKEN' | 'SLACK_SIGNING_SECRET' | 'SLACK_APP_TOKEN' | 'SLACK_SOCKET_MODE' | 'PORT';

export class AppConfigurationError extends Error {
  constructor(
    readonly variable: AppConfigVariable,
    readonly reason: string,
  ) {
    super(`${variable}: ${reason}`);
    this.name = 'AppConfigurationError';
    Error.captureStackTrace(this, this.constructor);
  }
}

function getRequiredString(env: NodeJS.ProcessEnv, variable: AppConfigVariable): string {
  const value = env[variable];

  if (value === undefined || value === '') {
    throw new AppConfigurationError(variable, '値が設定されていません');
  }

  return value;
}

function parseSocketMode(value: string | undefined): boolean {
  if (value === undefined || value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new AppConfigurationError('SLACK_SOCKET_MODE', '"true" または "false" を指定してください');
}

function parsePort(value: string | undefined): number {
  if (value === undefined) {
    return 3000;
  }

  if (!/^\d+$/.test(value)) {
    throw new AppConfigurationError('PORT', '1から65535までの10進整数を指定してください');
  }

  const port = Number(value);
  if (port < 1 || port > 65535) {
    throw new AppConfigurationError('PORT', '1から65535までの10進整数を指定してください');
  }

  return port;
}

/**
 * 環境変数を検証し、アプリケーションの起動設定へ変換する。
 */
export function loadAppConfig(env: NodeJS.ProcessEnv): AppConfig {
  const socketMode = parseSocketMode(env.SLACK_SOCKET_MODE);
  const botToken = getRequiredString(env, 'SLACK_BOT_TOKEN');
  const signingSecret = getRequiredString(env, 'SLACK_SIGNING_SECRET');
  const appToken = socketMode ? getRequiredString(env, 'SLACK_APP_TOKEN') : env.SLACK_APP_TOKEN;

  return {
    botToken,
    signingSecret,
    appToken,
    socketMode,
    port: parsePort(env.PORT),
  };
}
