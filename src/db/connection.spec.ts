import type Database from 'better-sqlite3';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { closeDatabase, openDatabase } from './connection';

describe('database connection', () => {
  let temporaryDirectory: string | undefined;
  const databases: Database.Database[] = [];

  const openTrackedDatabase = (dbPath?: string): Database.Database => {
    const database = dbPath === undefined ? openDatabase() : openDatabase(dbPath);
    databases.push(database);
    return database;
  };

  afterEach(() => {
    for (const database of databases.splice(0)) {
      closeDatabase(database);
    }
    if (temporaryDirectory) {
      fs.rmSync(temporaryDirectory, { recursive: true, force: true });
      temporaryDirectory = undefined;
    }
    vi.restoreAllMocks();
  });

  it('in-memory接続で外部キー制約を有効にすること', () => {
    const db = openTrackedDatabase(':memory:');

    expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
  });

  it('呼び出しごとに独立した接続を開くこと', () => {
    const first = openTrackedDatabase(':memory:');
    const second = openTrackedDatabase(':memory:');

    expect(second).not.toBe(first);
    closeDatabase(first);
    expect(first.open).toBe(false);
    expect(second.open).toBe(true);
  });

  it('同じ接続を複数回閉じても安全であること', () => {
    const db = openTrackedDatabase(':memory:');

    closeDatabase(db);

    expect(() => closeDatabase(db)).not.toThrow();
  });

  it('ファイルDBの親ディレクトリを作成すること', () => {
    temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'trrbot-db-'));
    const dbPath = path.join(temporaryDirectory, 'nested', 'test.db');

    openTrackedDatabase(dbPath);

    expect(fs.existsSync(dbPath)).toBe(true);
  });

  it('既定ではdata/trrbot.dbを開くこと', () => {
    temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'trrbot-default-db-'));
    vi.spyOn(process, 'cwd').mockReturnValue(temporaryDirectory);

    openTrackedDatabase();

    expect(fs.existsSync(path.join(temporaryDirectory, 'data', 'trrbot.db'))).toBe(true);
  });
});
