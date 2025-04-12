# ビルドステージ
FROM node:24-slim AS builder

# 作業ディレクトリを設定
WORKDIR /app

# パッケージ管理ファイルをコピー
COPY package*.json ./

# 依存関係のインストール（開発依存関係を含む）
RUN npm ci

# アプリケーションのソースコードをコピー
COPY . .

# TypeScriptのビルド
RUN npm run build

# 本番ステージ
FROM node:24-slim AS production

# 作業ディレクトリを設定
WORKDIR /app

# パッケージ管理ファイルをコピー
COPY package*.json ./

# 本番依存関係のみインストール
RUN npm ci --omit=dev

# ビルドステージからビルド済みのファイルをコピー
COPY --from=builder /app/dist ./dist

# データディレクトリを作成
RUN mkdir -p /app/data

# 非rootユーザーを作成
RUN groupadd -r trrbot && useradd -r -g trrbot trrbot

# データディレクトリの所有権を変更
RUN chown -R trrbot:trrbot /app

# 非rootユーザーに切り替え
USER trrbot

# アプリケーションの起動
CMD ["npm", "start"]