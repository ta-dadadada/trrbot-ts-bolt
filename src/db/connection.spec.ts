import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { closeDatabase, getDatabase, openDatabase } from './connection';

describe('database connection', () => {
  let temporaryDirectory: string | undefined;

  afterEach(() => {
    closeDatabase();
    if (temporaryDirectory) {
      fs.rmSync(temporaryDirectory, { recursive: true, force: true });
      temporaryDirectory = undefined;
    }
    vi.restoreAllMocks();
  });

  it('接続を開くまではデータベースを取得できないこと', () => {
    expect(() => getDatabase()).toThrow('データベースが初期化されていません');
  });

  it('in-memory接続で外部キー制約を有効にすること', () => {
    const db = openDatabase(':memory:');

    expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(getDatabase()).toBe(db);
  });

  it('開かれている接続を再利用すること', () => {
    const first = openDatabase(':memory:');

    expect(openDatabase(':memory:')).toBe(first);
  });

  it('終了後に新しい接続を開けること', () => {
    const first = openDatabase(':memory:');
    closeDatabase();

    expect(() => getDatabase()).toThrow('データベースが初期化されていません');
    expect(openDatabase(':memory:')).not.toBe(first);
  });

  it('未接続でも安全に終了できること', () => {
    expect(() => closeDatabase()).not.toThrow();
  });

  it('ファイルDBの親ディレクトリを作成すること', () => {
    temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'trrbot-db-'));
    const dbPath = path.join(temporaryDirectory, 'nested', 'test.db');

    openDatabase(dbPath);

    expect(fs.existsSync(dbPath)).toBe(true);
  });

  it('既定ではdata/trrbot.dbを開くこと', () => {
    temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'trrbot-default-db-'));
    vi.spyOn(process, 'cwd').mockReturnValue(temporaryDirectory);

    openDatabase();

    expect(fs.existsSync(path.join(temporaryDirectory, 'data', 'trrbot.db'))).toBe(true);
  });
});
