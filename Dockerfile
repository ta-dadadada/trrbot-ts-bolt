# ==============================================================================
# 共通ベースステージ（ビルドツールを含む）
# ==============================================================================
FROM node:22.22.0-alpine AS base-builder

WORKDIR /app

# better-sqlite3のビルドに必要なパッケージをインストール
RUN apk add --no-cache python3 make g++ sqlite-dev

# ==============================================================================
# ビルドステージ
# ==============================================================================
FROM base-builder AS builder

# パッケージ管理ファイルをコピー（依存関係のキャッシュを活用）
COPY package*.json ./

# 依存関係のインストール（開発依存関係を含む）
# HUSKY=0でprepareスクリプトのHusky実行をスキップ（Docker内ではGit hooksは不要）
RUN HUSKY=0 npm ci

# アプリケーションのソースコードをコピー
COPY . .

# TypeScriptのビルド
RUN npm run build

# ==============================================================================
# 本番依存関係ステージ
# ==============================================================================
FROM base-builder AS prod-deps

COPY package*.json ./

# 本番依存関係のみインストール（ネイティブモジュールを含む）
RUN HUSKY=0 npm ci --omit=dev

# ==============================================================================
# 本番ステージ
# ==============================================================================
FROM node:22.22.0-alpine AS production

# 実行時に必要な最小限のパッケージのみインストール
RUN apk add --no-cache sqlite-libs dumb-init

# 作業ディレクトリを設定
WORKDIR /app

# 非rootユーザーでの実行のため、適切な権限でディレクトリを作成
RUN mkdir -p /app/data && chown -R node:node /app

# ユーザーをnodeに切り替え
USER node

# パッケージ管理ファイルをコピー
COPY --chown=node:node package*.json ./

# ビルドステージからビルド済みのファイルをコピー
COPY --from=builder --chown=node:node /app/dist ./dist

# 本番依存関係ステージからnode_modulesをコピー
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules

# dumb-initを使用してプロセスを適切に管理
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# アプリケーションの起動
CMD ["node", "dist/index.js"]
