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
  let stop: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    db = openDatabase(':memory:');
    message = vi.fn();
    event = vi.fn();
    start = vi.fn().mockResolvedValue(undefined);
    stop = vi.fn().mockResolvedValue(undefined);
    app = { message, event, start, stop } as unknown as App;
  });

  afterEach(() => {
    if (db.open) {
      db.close();
    }
  });

  it('スキーマと依存関係を組み立ててHandlerを登録する', async () => {
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

    await runtime.stop();
    expect(stop).not.toHaveBeenCalled();
  });

  it('指定されたポートでSlack Appを起動する', async () => {
    const runtime = createApplicationRuntime({
      app,
      db,
      pickRandomItem: (items) => items[0],
    });

    await runtime.start(8080);

    expect(start).toHaveBeenCalledWith(8080);
    await runtime.stop();
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
    expect(stop).not.toHaveBeenCalled();
  });

  it('起動後はSlack Appの停止を待ってからDB接続を閉じる', async () => {
    let completeStop: (() => void) | undefined;
    stop.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          completeStop = resolve;
        }),
    );
    const runtime = createApplicationRuntime({
      app,
      db,
      pickRandomItem: (items) => items[0],
    });
    await runtime.start(3000);

    const stopping = runtime.stop();

    expect(stop).toHaveBeenCalledOnce();
    expect(db.open).toBe(true);

    completeStop?.();
    await stopping;

    expect(db.open).toBe(false);
  });

  it('並行して終了処理を呼び出しても同じ処理を共有する', async () => {
    const runtime = createApplicationRuntime({
      app,
      db,
      pickRandomItem: (items) => items[0],
    });
    await runtime.start(3000);

    const firstStop = runtime.stop();
    const secondStop = runtime.stop();

    expect(firstStop).toBe(secondStop);
    await Promise.all([firstStop, secondStop]);

    expect(stop).toHaveBeenCalledOnce();
    expect(db.open).toBe(false);
  });

  it('Slack Appの停止に失敗してもDB接続を閉じる', async () => {
    const error = new Error('stop failed');
    stop.mockRejectedValue(error);
    const runtime = createApplicationRuntime({
      app,
      db,
      pickRandomItem: (items) => items[0],
    });
    await runtime.start(3000);

    await expect(runtime.stop()).rejects.toBe(error);

    expect(db.open).toBe(false);
  });
});
