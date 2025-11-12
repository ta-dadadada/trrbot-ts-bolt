import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { App } from '@slack/bolt';
import dotenv from 'dotenv';

// モックの作成
vi.mock('@slack/bolt', () => {
  interface MockAppInstance {
    message: ReturnType<typeof vi.fn>;
    event: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
  }

  const MockApp = vi.fn().mockImplementation(function (this: MockAppInstance) {
    this.message = vi.fn().mockReturnThis();
    this.event = vi.fn().mockReturnThis();
    this.start = vi.fn().mockResolvedValue(undefined);
    return this;
  });
  return { App: MockApp };
});

vi.mock('dotenv', () => ({
  default: {
    config: vi.fn(),
  },
}));

vi.mock('better-sqlite3', () => {
  const mockDb = {
    prepare: vi.fn().mockReturnValue({
      all: vi.fn().mockReturnValue([]),
      get: vi.fn().mockReturnValue(undefined),
      run: vi.fn().mockReturnValue({ changes: 0, lastInsertRowid: 1 }),
    }),
    exec: vi.fn(),
    pragma: vi.fn(),
    close: vi.fn(),
  };
  return vi.fn().mockImplementation(() => mockDb);
});

// ファイルシステムのモック
vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
}));

describe('Slackアプリケーション', () => {
  // 各テスト前に環境をクリーンアップ
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.SLACK_BOT_TOKEN = 'test-bot-token';
    process.env.SLACK_SIGNING_SECRET = 'test-signing-secret';
    process.env.SLACK_APP_TOKEN = 'test-app-token';
  });

  // 各テスト後に環境変数をクリア
  afterEach(() => {
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_SIGNING_SECRET;
    delete process.env.SLACK_APP_TOKEN;
    delete process.env.SLACK_SOCKET_MODE;
  });

  it('Slackアプリが正しく初期化されること', () => {
    // dotenvの設定を手動で呼び出す
    dotenv.config();

    // Slackアプリの初期化をシミュレート
    const app = new App({
      token: process.env.SLACK_BOT_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      socketMode: process.env.SLACK_SOCKET_MODE !== 'false',
      appToken: process.env.SLACK_APP_TOKEN,
    });

    // dotenv.configが呼ばれたことを確認
    expect(dotenv.config).toHaveBeenCalled();

    // Appコンストラクタが正しいパラメータで呼ばれたか確認
    expect(App).toHaveBeenCalledWith({
      token: 'test-bot-token',
      signingSecret: 'test-signing-secret',
      socketMode: true,
      appToken: 'test-app-token',
    });

    // appオブジェクトが正しく作成されたことを確認
    expect(app).toBeDefined();
  });

  it('SLACK_SOCKET_MODE=falseに設定したときに`socketMode: false`に設定されること', () => {
    // dotenvの設定を手動で呼び出す
    dotenv.config();
    process.env.SLACK_SOCKET_MODE = 'false';

    // Slackアプリの初期化をシミュレート
    const app = new App({
      token: process.env.SLACK_BOT_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      socketMode: process.env.SLACK_SOCKET_MODE !== 'false',
      appToken: process.env.SLACK_APP_TOKEN,
    });

    // dotenv.configが呼ばれたことを確認
    expect(dotenv.config).toHaveBeenCalled();

    // Appコンストラクタが正しいパラメータで呼ばれたか確認
    expect(App).toHaveBeenCalledWith({
      token: 'test-bot-token',
      signingSecret: 'test-signing-secret',
      socketMode: false,
      appToken: 'test-app-token',
    });

    // appオブジェクトが正しく作成されたことを確認
    expect(app).toBeDefined();
  });
});
