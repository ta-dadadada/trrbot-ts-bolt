import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // テスト環境
    environment: 'node',
    // テストファイルのパターン
    include: ['**/*.spec.ts'],
    // カバレッジ設定
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/'],
    },
    // グローバル変数
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});