import type { App } from '@slack/bolt';
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openDatabase } from './db/connection';
import { createApplicationRuntime } from './runtime';

describe('ApplicationRuntime', () => {
  let db: Database.Database;
  let app: App;
  let message: ReturnType<typeof vi.fn>;
  let event: ReturnType<typeof vi.fn>;
  let start: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    db = openDatabase(':memory:');
    message = vi.fn();
    event = vi.fn();
    start = vi.fn().mockResolvedValue(undefined);
    app = { message, event, start } as unknown as App;
  });

  afterEach(() => {
    if (db.open) {
      db.close();
    }
  });

  it('スキーマと依存関係を組み立ててHandlerを登録する', () => {
    const runtime = createApplicationRuntime({
      app,
      db,
      pickRandomItem: (items) => items[0],
    });

    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all() as Array<{ name: string }>;

    expect(tables).toEqual([
      { name: 'group_items' },
      { name: 'groups' },
      { name: 'reaction_mappings' },
    ]);
    expect(message).toHaveBeenCalledOnce();
    expect(event).toHaveBeenCalledWith('app_mention', expect.any(Function));

    runtime.stop();
  });

  it('指定されたポートでSlack Appを起動する', async () => {
    const runtime = createApplicationRuntime({
      app,
      db,
      pickRandomItem: (items) => items[0],
    });

    await runtime.start(8080);

    expect(start).toHaveBeenCalledWith(8080);
    runtime.stop();
  });

  it('起動に失敗した場合はDB接続を閉じて例外を再送出する', async () => {
    const error = new Error('start failed');
    start.mockRejectedValue(error);
    const runtime = createApplicationRuntime({
      app,
      db,
      pickRandomItem: (items) => items[0],
    });

    await expect(runtime.start(3000)).rejects.toBe(error);
    expect(db.open).toBe(false);
  });

  it('終了処理を複数回呼び出してもDB接続を一度だけ閉じる', () => {
    const runtime = createApplicationRuntime({
      app,
      db,
      pickRandomItem: (items) => items[0],
    });

    runtime.stop();

    expect(db.open).toBe(false);
    expect(() => runtime.stop()).not.toThrow();
  });
});
