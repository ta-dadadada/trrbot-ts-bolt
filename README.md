# trrbot-ts-bolt

![CI](https://github.com/ta-dadadada/trrbot-ts-bolt/workflows/CI/badge.svg)

Slack Bolt フレームワークを使用したTypeScriptベースのSlackボットアプリケーション。

## 使用方法

### 開発モード

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### 本番実行

```bash
npm start
```

### テスト

```bash
npm test
```

## Dockerを使用したデプロイ

### 環境変数の設定

1. `.env.example`ファイルをコピーして`.env`ファイルを作成します：

```bash
cp .env.example .env
```

2. `.env`ファイルを編集して、必要なSlack APIトークンを設定します：

```
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token
PORT=3000
```

### Dockerイメージのビルドと起動

```bash
# イメージをビルドしてコンテナを起動
docker-compose up -d

# ログの確認
docker-compose logs -f

# コンテナの停止
docker-compose down

# コンテナの停止とボリュームの削除（データベースも削除されます）
docker-compose down -v
```

### データの永続化

アプリケーションのデータ（SQLiteデータベース）は`trrbot-data`という名前のDockerボリュームに保存されます。このボリュームは`docker-compose down`コマンドを実行しても保持されます。データを完全に削除するには`docker-compose down -v`コマンドを使用してください。

## プロジェクト構成

- `src/`: ソースコード
  - `app.ts`: Boltアプリケーションの設定
  - `index.ts`: アプリケーションのエントリーポイント
  - `config/`: 設定関連
  - `models/`: データモデル
  - `services/`: ビジネスロジック
  - `handlers/`: イベントハンドラ
  - `utils/`: ユーティリティ関数
- `dist/`: ビルド成果物
- `data/`: データベースファイル（自動生成）
- `src/**/*.spec.ts`: テストコード

## Slack App設定

このボットをSlackワークスペースで使用するためには、Slack APIでアプリを作成し、適切な権限を設定する必要があります。

### アプリの作成手順

1. [Slack API](https://api.slack.com/apps)にアクセスし、「Create New App」をクリックします
2. 「From scratch」を選択し、アプリ名と使用するワークスペースを設定します
3. 作成したアプリの設定ページで以下の設定を行います

### 必要な権限（OAuth & Permissions）

「OAuth & Permissions」セクションで以下のスコープを追加します：

#### Bot Token Scopes

- `app_mentions:read` - ボットへのメンションを読み取るために必要
- `chat:write` - チャンネルにメッセージを送信するために必要
- `reactions:read` - リアクションを読み取るために必要
- `reactions:write` - メッセージにリアクションを追加するために必要
- `files:write` - ファイルをアップロードするために必要（リアクションマッピングのエクスポート機能）
- `channels:history` - チャンネルのメッセージ履歴を読み取るために必要
- `groups:history` - プライベートチャンネルのメッセージ履歴を読み取るために必要
- `im:history` - ダイレクトメッセージの履歴を読み取るために必要
- `mpim:history` - グループDMの履歴を読み取るために必要

### イベント設定（Event Subscriptions）

「Event Subscriptions」をオンにし、以下のイベントを購読します：

#### Bot Events

- `app_mention` - ボットへのメンションを受け取るために必要
- `message.channels` - パブリックチャンネルのメッセージを受け取るために必要
- `message.groups` - プライベートチャンネルのメッセージを受け取るために必要
- `message.im` - ダイレクトメッセージを受け取るために必要
- `message.mpim` - グループDMのメッセージを受け取るために必要

### ソケットモードの有効化（Socket Mode）

このアプリはHTTPエンドポイントを公開せずに動作するため、「Socket Mode」をオンにします。これにより、WebSocketを使用してSlack APIと通信します。

### トークンの取得

設定が完了したら、以下のトークンを取得し、`.env`ファイルに設定します：

- **Bot User OAuth Token**: 「OAuth & Permissions」セクションで取得できます（`SLACK_BOT_TOKEN`として設定）
- **Signing Secret**: 「Basic Information」セクションで取得できます（`SLACK_SIGNING_SECRET`として設定）
- **App-Level Token**: 「Basic Information」>「App-Level Tokens」で新しいトークンを生成します（`connections:write`スコープが必要、`SLACK_APP_TOKEN`として設定）

### アプリのインストール

設定が完了したら、「Install to Workspace」ボタンをクリックしてワークスペースにアプリをインストールします。インストール後、ボットをチャンネルに招待することで使用できるようになります。