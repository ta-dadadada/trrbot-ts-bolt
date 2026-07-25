export interface AppConfig {
  botToken: string;
  signingSecret: string;
  appToken: string | undefined;
  socketMode: boolean;
  port: number;
}

export class AppConfigurationError extends Error {
  constructor(
    readonly required: string[],
    readonly socketMode: boolean,
  ) {
    super('必要な環境変数が設定されていません');
    this.name = 'AppConfigurationError';
  }
}

/**
 * 環境変数をアプリケーションの起動設定へ変換する。
 */
export function loadAppConfig(env: NodeJS.ProcessEnv): AppConfig {
  const socketMode = env.SLACK_SOCKET_MODE !== 'false';
  const required = [
    'SLACK_BOT_TOKEN',
    'SLACK_SIGNING_SECRET',
    ...(socketMode ? ['SLACK_APP_TOKEN'] : []),
  ];

  if (!env.SLACK_BOT_TOKEN || !env.SLACK_SIGNING_SECRET || (socketMode && !env.SLACK_APP_TOKEN)) {
    throw new AppConfigurationError(required, socketMode);
  }

  return {
    botToken: env.SLACK_BOT_TOKEN,
    signingSecret: env.SLACK_SIGNING_SECRET,
    appToken: env.SLACK_APP_TOKEN,
    socketMode,
    port: env.PORT ? parseInt(env.PORT, 10) : 3000,
  };
}
