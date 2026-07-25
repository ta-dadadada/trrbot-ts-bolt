import type { Logger } from '@slack/logger';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppConfig } from './config/appConfig';

const { appConstructor, appInstance } = vi.hoisted(() => {
  const appInstance = {
    message: vi.fn(),
    event: vi.fn(),
    start: vi.fn().mockResolvedValue(undefined),
  };

  return {
    appConstructor: vi.fn(function MockApp() {
      return appInstance;
    }),
    appInstance,
  };
});

vi.mock('@slack/bolt', () => ({
  App: appConstructor,
}));

import { createSlackApp } from './app';

const logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  setLevel: vi.fn(),
  getLevel: vi.fn(),
  setName: vi.fn(),
} as unknown as Logger;

const baseConfig: AppConfig = {
  botToken: 'test-bot-token',
  signingSecret: 'test-signing-secret',
  appToken: 'test-app-token',
  socketMode: true,
  port: 3000,
};

describe('createSlackApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Socket Mode設定からSlack Appを作成する', () => {
    const app = createSlackApp(baseConfig, logger);

    expect(appConstructor).toHaveBeenCalledWith({
      token: 'test-bot-token',
      signingSecret: 'test-signing-secret',
      socketMode: true,
      appToken: 'test-app-token',
      logger,
    });
    expect(app).toBe(appInstance);
  });

  it('HTTP Mode設定では未指定のApp Tokenをそのまま渡す', () => {
    createSlackApp(
      {
        ...baseConfig,
        appToken: undefined,
        socketMode: false,
      },
      logger,
    );

    expect(appConstructor).toHaveBeenCalledWith({
      token: 'test-bot-token',
      signingSecret: 'test-signing-secret',
      socketMode: false,
      appToken: undefined,
      logger,
    });
  });
});
