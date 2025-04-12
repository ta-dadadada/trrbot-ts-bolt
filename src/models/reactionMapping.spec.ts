import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReactionMappingModel, CreateReactionMappingData } from './reactionMapping';
import db from '../config/database';

// データベースのモック
vi.mock('../config/database', () => {
  const mockDb = {
    prepare: vi.fn().mockReturnValue({
      all: vi.fn(),
      get: vi.fn(),
      run: vi.fn(),
    }),
  };
  return { default: mockDb };
});

describe('ReactionMappingModel', () => {
  let mockStmt: {
    all: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    run: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();
    
    // モックの設定
    mockStmt = {
      all: vi.fn(),
      get: vi.fn(),
      run: vi.fn().mockReturnValue({ changes: 1, lastInsertRowid: 1 }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.prepare as any).mockReturnValue(mockStmt);
  });

  describe('getAll', () => {
    it('すべてのリアクションマッピングを取得すること', () => {
      // モックの戻り値を設定
      const mockMappings = [
        { id: 1, triggerText: 'hello', reaction: ':wave:', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
        { id: 2, triggerText: 'good', reaction: ':thumbsup:', createdAt: '2023-01-02', updatedAt: '2023-01-02' },
      ];
      mockStmt.all.mockReturnValue(mockMappings);

      // メソッドを実行
      const result = ReactionMappingModel.getAll();

      // 期待する結果を検証
      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
      expect(mockStmt.all).toHaveBeenCalled();
      expect(result).toEqual(mockMappings);
    });
  });

  describe('getByTriggerText', () => {
    it('指定されたトリガーテキストに一致するリアクションマッピングを取得すること', () => {
      // モックの戻り値を設定
      const mockMappings = [
        { id: 1, triggerText: 'hello', reaction: ':wave:', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
      ];
      mockStmt.all.mockReturnValue(mockMappings);

      // メソッドを実行
      const result = ReactionMappingModel.getByTriggerText('hello');

      // 期待する結果を検証
      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE trigger_text = ?'));
      expect(mockStmt.all).toHaveBeenCalledWith('hello');
      expect(result).toEqual(mockMappings);
    });
  });

  describe('create', () => {
    it('新しいリアクションマッピングを作成すること', () => {
      // 作成データ
      const data: CreateReactionMappingData = {
        triggerText: 'hello',
        reaction: ':wave:',
      };

      // メソッドを実行
      const result = ReactionMappingModel.create(data);

      // 期待する結果を検証
      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO'));
      expect(mockStmt.run).toHaveBeenCalledWith('hello', ':wave:');
      expect(result).toBe(1);
    });
  });

  describe('delete', () => {
    it('指定されたIDのリアクションマッピングを削除すること', () => {
      // モックの戻り値を設定
      mockStmt.run.mockReturnValue({ changes: 1 });

      // メソッドを実行
      const result = ReactionMappingModel.delete(1);

      // 期待する結果を検証
      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'));
      expect(mockStmt.run).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('存在しないIDの場合はfalseを返すこと', () => {
      // モックの戻り値を設定
      mockStmt.run.mockReturnValue({ changes: 0 });

      // メソッドを実行
      const result = ReactionMappingModel.delete(999);

      // 期待する結果を検証
      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'));
      expect(mockStmt.run).toHaveBeenCalledWith(999);
      expect(result).toBe(false);
    });
  });

  describe('deleteByTriggerAndReaction', () => {
    it('指定されたトリガーテキストとリアクションのリアクションマッピングを削除すること', () => {
      // モックの戻り値を設定
      mockStmt.run.mockReturnValue({ changes: 1 });

      // メソッドを実行
      const result = ReactionMappingModel.deleteByTriggerAndReaction('hello', ':wave:');

      // 期待する結果を検証
      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'));
      expect(mockStmt.run).toHaveBeenCalledWith('hello', ':wave:');
      expect(result).toBe(true);
    });

    it('存在しないマッピングの場合はfalseを返すこと', () => {
      // モックの戻り値を設定
      mockStmt.run.mockReturnValue({ changes: 0 });

      // メソッドを実行
      const result = ReactionMappingModel.deleteByTriggerAndReaction('unknown', ':unknown:');

      // 期待する結果を検証
      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'));
      expect(mockStmt.run).toHaveBeenCalledWith('unknown', ':unknown:');
      expect(result).toBe(false);
    });
  });
});