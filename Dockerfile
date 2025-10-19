# ビルドステージ
FROM node:22-alpine AS builder

# 作業ディレクトリを設定
WORKDIR /app

# better-sqlite3のビルドに必要なパッケージをインストール
RUN apk add --no-cache python3 make g++ sqlite-dev

# パッケージ管理ファイルをコピー（依存関係のキャッシュを活用）
COPY package*.json ./

# 依存関係のインストール（開発依存関係を含む）
# HUSKY=0でprepareスクリプトのHusky実行をスキップ（Docker内ではGit hooksは不要）
RUN HUSKY=0 npm ci

# アプリケーションのソースコードをコピー
COPY . .

# TypeScriptのビルド
RUN npm run build

# 本番ステージ
FROM node:22-alpine AS production

# 実行時に必要な最小限のパッケージのみインストール
# better-sqlite3のネイティブモジュールは既にビルド済みなので、ビルドツールは不要
# 実行時に必要なのはsqlite-libsのみ
RUN apk add --no-cache sqlite-libs dumb-init

# 作業ディレクトリを設定
WORKDIR /app

# 非rootユーザーでの実行のため、適切な権限でディレクトリを作成
RUN mkdir -p /app/data && chown -R node:node /app

# ユーザーをnodeに切り替え
USER node

# パッケージ管理ファイルをコピー
COPY --chown=node:node package*.json ./

# 本番依存関係のみインストール
# HUSKY=0でprepareスクリプトのHusky実行をスキップ（Docker内ではGit hooksは不要）
RUN HUSKY=0 npm ci --omit=dev

# ビルドステージからビルド済みのファイルをコピー
COPY --from=builder --chown=node:node /app/dist ./dist

# ビルド済みのbetter-sqlite3ネイティブモジュールをコピー
COPY --from=builder --chown=node:node /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

# dumb-initを使用してプロセスを適切に管理
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# アプリケーションの起動
CMD ["node", "dist/index.js"]