# ビルドステージ
FROM node:22-bullseye-slim AS builder

# 作業ディレクトリを設定
WORKDIR /app

# パッケージ管理ファイルをコピー
COPY package*.json ./

# 依存関係のインストール（開発依存関係を含む）
# SKIP_HUSKY=1でprepareスクリプトのHusky実行をスキップ（Docker内ではGit hooksは不要）
RUN SKIP_HUSKY=1 npm ci

# アプリケーションのソースコードをコピー
COPY . .

# TypeScriptのビルド
RUN npm run build

# 本番ステージ
FROM node:22-bullseye-slim AS production

RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 \
    libsqlite3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*
# 作業ディレクトリを設定
WORKDIR /app

# パッケージ管理ファイルをコピー
COPY package*.json ./

# 本番依存関係のみインストール
# NODE_ENV=productionでprepareスクリプトのHusky実行をスキップ
RUN NODE_ENV=production npm ci --omit=dev

# ビルドステージからビルド済みのファイルをコピー
COPY --from=builder /app/dist ./dist

# データディレクトリを作成
RUN mkdir -p /app/data

# アプリケーションの起動
CMD ["npm", "start"]