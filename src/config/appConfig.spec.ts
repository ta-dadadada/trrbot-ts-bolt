import { describe, expect, it } from 'vitest';
import { AppConfigurationError, loadAppConfig } from './appConfig';

const socketModeEnv: NodeJS.ProcessEnv = {
  SLACK_BOT_TOKEN: 'bot-token',
  SLACK_SIGNING_SECRET: 'signing-secret',
  SLACK_APP_TOKEN: 'app-token',
};

function expectConfigurationError(env: NodeJS.ProcessEnv, variable: string, reason: string): void {
  expect(() => loadAppConfig(env)).toThrow(
    expect.objectContaining({
      name: 'AppConfigurationError',
      variable,
      reason,
      message: `${variable}: ${reason}`,
    }) satisfies Partial<AppConfigurationError>,
  );
}

describe('loadAppConfig', () => {
  it('Socket ModeとPORTの既定値を設定する', () => {
    expect(loadAppConfig(socketModeEnv)).toEqual({
      botToken: 'bot-token',
      signingSecret: 'signing-secret',
      appToken: 'app-token',
      socketMode: true,
      port: 3000,
    });
  });

  it('明示的にSocket Modeを有効にする', () => {
    expect(
      loadAppConfig({
        ...socketModeEnv,
        SLACK_SOCKET_MODE: 'true',
      }).socketMode,
    ).toBe(true);
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

  it.each([
    ['SLACK_BOT_TOKEN', undefined],
    ['SLACK_BOT_TOKEN', ''],
    ['SLACK_SIGNING_SECRET', undefined],
    ['SLACK_SIGNING_SECRET', ''],
    ['SLACK_APP_TOKEN', undefined],
    ['SLACK_APP_TOKEN', ''],
  ])('%sが未設定または空文字の場合は拒否する', (variable, value) => {
    expectConfigurationError(
      {
        ...socketModeEnv,
        [variable]: value,
      },
      variable,
      '値が設定されていません',
    );
  });

  it.each(['FALSE', '1', ''])('不正なSocket Mode設定 %j を拒否する', (value) => {
    expectConfigurationError(
      {
        ...socketModeEnv,
        SLACK_SOCKET_MODE: value,
      },
      'SLACK_SOCKET_MODE',
      '"true" または "false" を指定してください',
    );
  });

  it.each([
    ['1', 1],
    ['65535', 65535],
  ])('PORTの境界値 %s を受理する', (value, expected) => {
    expect(loadAppConfig({ ...socketModeEnv, PORT: value }).port).toBe(expected);
  });

  it.each(['0', '65536', '8080px', '1.5', '+3000', '-1', ''])(
    '不正なPORT設定 %j を拒否する',
    (value) => {
      expectConfigurationError(
        {
          ...socketModeEnv,
          PORT: value,
        },
        'PORT',
        '1から65535までの10進整数を指定してください',
      );
    },
  );
});
