import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    // ビルド出力先
    outDir: 'dist',
    // ソースマップの生成
    sourcemap: true,
    // ライブラリモードで構築
    lib: {
      // エントリーポイント
      entry: resolve(__dirname, 'src/index.ts'),
      // 出力ファイル名
      name: 'trrbot',
      // 出力形式
      formats: ['es'],
      fileName: 'index',
    },
    // 依存関係を外部化
    rollupOptions: {
      external: [
        '@slack/bolt',
        'dotenv',
        'better-sqlite3',
        'pino',
        'pino-pretty',
        // Node.js 組み込みモジュール
        'path',
        'fs',
        'os',
        'http',
        'https',
        'url',
        'util',
        'stream',
        'events',
      ],
      output: {
        // 外部化された依存関係の処理
        exports: 'named',
      },
    },
    // Node.js 環境向けの最適化
    target: 'node16',
    // ミニファイしない
    minify: false,
  },
});
