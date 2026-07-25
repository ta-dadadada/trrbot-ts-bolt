import { describe, expect, it } from 'vitest';
import { AppConfigurationError, loadAppConfig } from './appConfig';

describe('loadAppConfig', () => {
  it('Socket Modeを既定値として設定を読み込む', () => {
    expect(
      loadAppConfig({
        SLACK_BOT_TOKEN: 'bot-token',
        SLACK_SIGNING_SECRET: 'signing-secret',
        SLACK_APP_TOKEN: 'app-token',
      }),
    ).toEqual({
      botToken: 'bot-token',
      signingSecret: 'signing-secret',
      appToken: 'app-token',
      socketMode: true,
      port: 3000,
    });
  });

  it('HTTP ModeではApp Tokenを必須としない', () => {
    expect(
      loadAppConfig({
        SLACK_BOT_TOKEN: 'bot-token',
        SLACK_SIGNING_SECRET: 'signing-secret',
        SLACK_SOCKET_MODE: 'false',
        PORT: '8080',
      }),
    ).toEqual({
      botToken: 'bot-token',
      signingSecret: 'signing-secret',
      appToken: undefined,
      socketMode: false,
      port: 8080,
    });
  });

  it('false以外のSocket Mode設定は従来どおり有効として扱う', () => {
    expect(
      loadAppConfig({
        SLACK_BOT_TOKEN: 'bot-token',
        SLACK_SIGNING_SECRET: 'signing-secret',
        SLACK_APP_TOKEN: 'app-token',
        SLACK_SOCKET_MODE: 'FALSE',
      }).socketMode,
    ).toBe(true);
  });

  it('PORTは従来どおり10進整数へ変換する', () => {
    expect(
      loadAppConfig({
        SLACK_BOT_TOKEN: 'bot-token',
        SLACK_SIGNING_SECRET: 'signing-secret',
        SLACK_APP_TOKEN: 'app-token',
        PORT: '8080px',
      }).port,
    ).toBe(8080);
  });

  it('Socket Modeの必須設定が不足している場合は必要項目を返す', () => {
    expect(() =>
      loadAppConfig({
        SLACK_SIGNING_SECRET: 'signing-secret',
        SLACK_APP_TOKEN: 'app-token',
      }),
    ).toThrow(
      expect.objectContaining({
        name: 'AppConfigurationError',
        message: '必要な環境変数が設定されていません',
        required: ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET', 'SLACK_APP_TOKEN'],
        socketMode: true,
      }) satisfies Partial<AppConfigurationError>,
    );
  });

  it('HTTP Modeの必須設定にApp Tokenを含めない', () => {
    expect(() =>
      loadAppConfig({
        SLACK_BOT_TOKEN: 'bot-token',
        SLACK_SOCKET_MODE: 'false',
      }),
    ).toThrow(
      expect.objectContaining({
        required: ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET'],
        socketMode: false,
      }) satisfies Partial<AppConfigurationError>,
    );
  });
});
