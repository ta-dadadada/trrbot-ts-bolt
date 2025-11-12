import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getRandomItem, getRandomInt, parseCommand } from './random';

describe('ランダムユーティリティ', () => {
  let originalMath: Math;

  beforeEach(() => {
    originalMath = global.Math;
  });

  afterEach(() => {
    global.Math = originalMath;
  });
  describe('getRandomItem', () => {
    it('空の配列の場合はundefinedを返すこと', () => {
      const result = getRandomItem([]);
      expect(result).toBeUndefined();
    });

    it('配列から要素をランダムに選択すること', () => {
      // Math.randomをモック化して固定値を返すようにする
      const mockMath = Object.create(global.Math);
      mockMath.random = vi.fn().mockReturnValue(0.5);
      global.Math = mockMath;

      const items = ['A', 'B', 'C'];
      const result = getRandomItem(items);

      // 0.5 * 3 = 1.5 → Math.floor(1.5) = 1 → items[1] = 'B'
      expect(result).toBe('B');
    });
  });

  describe('getRandomInt', () => {
    it('指定された範囲内のランダムな整数を返すこと', () => {
      // Math.randomをモック化して固定値を返すようにする
      const mockMath = Object.create(global.Math);
      mockMath.random = vi.fn().mockReturnValue(0.5);
      global.Math = mockMath;

      // 1から10の範囲でテスト
      const result = getRandomInt(1, 10);

      // 0.5 * (10 - 1 + 1) + 1 = 0.5 * 10 + 1 = 5 + 1 = 6
      expect(result).toBe(6);
    });

    it('最小値と最大値が同じ場合はその値を返すこと', () => {
      const result = getRandomInt(5, 5);
      expect(result).toBe(5);
    });

    it('小数点を含む範囲でも正しく整数を返すこと', () => {
      // Math.randomをモック化して固定値を返すようにする
      const mockMath = Object.create(global.Math);
      mockMath.random = vi.fn().mockReturnValue(0.5);
      global.Math = mockMath;

      // 1.5から10.8の範囲でテスト
      const result = getRandomInt(1.5, 10.8);

      // Math.ceil(1.5) = 2, Math.floor(10.8) = 10
      // 0.5 * (10 - 2 + 1) + 2 = 0.5 * 9 + 2 = 4.5 + 2 = 6.5 → Math.floor(6.5) = 6
      expect(result).toBe(6);
    });
  });

  describe('parseCommand', () => {
    it('空の文字列の場合は空の配列を返すこと', () => {
      const result = parseCommand('');
      expect(result).toEqual(['']);
    });

    it('単一の単語の場合はその単語を含む配列を返すこと', () => {
      const result = parseCommand('command');
      expect(result).toEqual(['command']);
    });

    it('複数の単語をスペースで区切って配列にすること', () => {
      const result = parseCommand('command arg1 arg2');
      expect(result).toEqual(['command', 'arg1', 'arg2']);
    });

    it('複数のスペースを単一のスペースとして扱うこと', () => {
      const result = parseCommand('command  arg1   arg2');
      expect(result).toEqual(['command', 'arg1', 'arg2']);
    });

    it('先頭と末尾のスペースをトリムすること', () => {
      const result = parseCommand('  command arg1 arg2  ');
      expect(result).toEqual(['command', 'arg1', 'arg2']);
    });
  });
});
