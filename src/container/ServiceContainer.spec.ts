import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceContainer, TOKENS } from './ServiceContainer';

describe('ServiceContainer', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
  });

  describe('registerInstance / resolve', () => {
    it('登録したインスタンスを解決できる', () => {
      const instance = { value: 42 };
      container.registerInstance(TOKENS.Database, instance);

      const resolved = container.resolve<typeof instance>(TOKENS.Database);
      expect(resolved).toBe(instance);
    });

    it('同じトークンで上書き登録できる', () => {
      container.registerInstance(TOKENS.Database, { value: 1 });
      container.registerInstance(TOKENS.Database, { value: 2 });

      const resolved = container.resolve<{ value: number }>(TOKENS.Database);
      expect(resolved.value).toBe(2);
    });
  });

  describe('registerFactory / resolve', () => {
    it('ファクトリから生成したインスタンスを解決できる', () => {
      const instance = { value: 'created' };
      container.registerFactory(TOKENS.GroupService, () => instance);

      const resolved = container.resolve<typeof instance>(TOKENS.GroupService);
      expect(resolved).toBe(instance);
    });

    it('ファクトリは一度だけ呼ばれシングルトンとしてキャッシュされる', () => {
      let callCount = 0;
      container.registerFactory(TOKENS.GroupService, () => {
        callCount++;
        return { id: callCount };
      });

      const first = container.resolve<{ id: number }>(TOKENS.GroupService);
      const second = container.resolve<{ id: number }>(TOKENS.GroupService);

      expect(first).toBe(second);
      expect(callCount).toBe(1);
    });

    it('インスタンス登録がファクトリより優先される', () => {
      const directInstance = { source: 'instance' };
      container.registerFactory(TOKENS.Database, () => ({ source: 'factory' }));
      container.registerInstance(TOKENS.Database, directInstance);

      const resolved = container.resolve<{ source: string }>(TOKENS.Database);
      expect(resolved.source).toBe('instance');
    });
  });

  describe('resolve - エラー', () => {
    it('未登録のトークンを解決するとエラーを投げる', () => {
      const unknownToken = Symbol('Unknown');
      expect(() => container.resolve(unknownToken)).toThrow('No registration found for token');
    });
  });

  describe('has', () => {
    it('インスタンス登録済みのトークンでtrueを返す', () => {
      container.registerInstance(TOKENS.Database, {});
      expect(container.has(TOKENS.Database)).toBe(true);
    });

    it('ファクトリ登録済みのトークンでtrueを返す', () => {
      container.registerFactory(TOKENS.GroupService, () => ({}));
      expect(container.has(TOKENS.GroupService)).toBe(true);
    });

    it('未登録のトークンでfalseを返す', () => {
      expect(container.has(Symbol('Unknown'))).toBe(false);
    });
  });

  describe('clear', () => {
    it('すべての登録をクリアする', () => {
      container.registerInstance(TOKENS.Database, {});
      container.registerFactory(TOKENS.GroupService, () => ({}));

      container.clear();

      expect(container.has(TOKENS.Database)).toBe(false);
      expect(container.has(TOKENS.GroupService)).toBe(false);
    });
  });
});
