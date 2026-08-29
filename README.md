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

## 開発者向け情報

### Node.js

[Node.jsのリリーススケジュール](https://nodejs.org/en/about/previous-releases)に基づき、Node.js 26系を使用します。2026年8月時点ではCurrentリリースで、2026年10月にLTSへ移行する予定です。

### TypeScript

[TypeScript 7.0の公式案内](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)にあるネイティブコンパイラーを使用しています。

- `typescript`: TypeScript 7の`tsc`を提供し、`tsc --noEmit`による型検査に使用
- `oxlint-tsgolint`: TypeScript 7を基盤とするOxlintの型情報Lintに使用

コード品質チェックにはOxlint、フォーマットにはOxfmtを使用します。

```bash
npm run lint
npm run format
npm run format:check
```

### Git Hooks

このプロジェクトでは、コード品質を保つためにGit Hooksを使用しています。`npm install`を実行すると、Huskyが自動的に以下のフックを設定します：

#### pre-commit

コミット前に以下の処理が自動実行されます：

- **Oxlint**: JavaScript・TypeScriptの静的解析と安全な自動修正
- **Oxfmt**: 対応するファイルのコードフォーマットを自動適用

これにより、ステージされたJavaScript・TypeScriptファイルはLintとフォーマット、それ以外のOxfmt対応ファイルはフォーマットが実行されます。

#### pre-push

プッシュ前に以下の処理が自動実行されます：

- **テスト実行**: 全てのテストが実行され、失敗するとpushがブロックされます

#### commit-msg

コミットメッセージが[Conventional Commits](https://www.conventionalcommits.org/)形式に従っているかチェックされます。

**利用可能なコミットタイプ:**

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: フォーマット等
- `refactor`: リファクタリング
- `perf`: パフォーマンス改善
- `test`: テスト追加・修正
- `build`: ビルドシステム
- `ci`: CI設定
- `chore`: その他の変更
- `revert`: 取り消し

**コミットメッセージ例:**

```bash
git commit -m "feat: ユーザー認証機能を追加"
git commit -m "fix: メッセージ送信時のエラーを修正"
```

#### Git Hooksを一時的にスキップする方法

緊急時など、Hooksをスキップしたい場合：

```bash
git commit --no-verify -m "message"
git push --no-verify
```

## セキュリティ

### 自動セキュリティ対策

このプロジェクトでは、以下の自動化されたセキュリティ対策を実施しています：

#### Dependabot

- **セキュリティアップデート**: 脆弱性のある依存関係を自動検出し、修正PRを作成
- **自動マージ**: パッチ・マイナーバージョンの更新は自動的にマージされます
- **定期チェック**: 毎週月曜日 9:00 (JST)に依存関係をスキャン

#### Trivy

- **依存関係スキャン**: PRと`main`へのpushで、開発依存を含むnpm依存関係を検査
- **CIゲート**: 修正版が存在するHIGHまたはCRITICALの脆弱性を検出した場合、CIを失敗させます
- **GitHub連携**: 検査結果をGitHub Code Scanningへ送信し、Securityタブで管理。forkからのPRでは権限制約によりSARIF送信をスキップしますが、脆弱性検査とCIゲートは実行します

#### Secret Scanning

- **シークレット検出**: APIキーやトークンの誤コミットを自動検出
- **Push Protection**: シークレットを含むコミットのpushを自動的にブロック

### 脆弱性の報告

セキュリティ上の問題を発見した場合は、[SECURITY.md](SECURITY.md)を参照して報告してください。

### セキュリティポリシー

詳細なセキュリティポリシーについては[SECURITY.md](SECURITY.md)を参照してください。

### CI/CD環境でのGit Hooksスキップ

CI環境（GitHub Actions等）でGit Hooksをスキップするには、`HUSKY=0`環境変数を設定します。

本プロジェクトのCIワークフローでは設定済みです。

## Dockerを使用したデプロイ

### GitHub Container Registryからイメージを取得する

このプロジェクトのDockerイメージはGitHub Container Registryで公開されています。

- `latest`: `main`ブランチで最後に公開に成功したイメージ
- `stable`: SemVerタグで最後に公開に成功したイメージ
- バージョン番号: 指定したリリースのイメージ

```bash
# mainブランチの最新ビルドを取得
docker pull ghcr.io/ta-dadadada/trrbot-ts-bolt:latest

# 最後に公開された安定版を取得
docker pull ghcr.io/ta-dadadada/trrbot-ts-bolt:stable

# 特定のバージョンを取得
docker pull ghcr.io/ta-dadadada/trrbot-ts-bolt:1.0.0
```

公開イメージを使用してコンテナを起動する場合：

```bash
# .envファイルを作成して環境変数を設定
cp .env.example .env
# .envファイルを編集してSlack APIトークンを設定

# コンテナを起動
docker run -d \
  --name trrbot \
  --env-file .env \
  -v trrbot-data:/app/data \
  ghcr.io/ta-dadadada/trrbot-ts-bolt:latest
```

### ローカルでイメージをビルドする

公開イメージを使用せず、ローカルでDockerイメージをビルドすることもできます。

#### 環境変数の設定

1. `.env.example`ファイルをコピーして`.env`ファイルを作成します：

```bash
cp .env.example .env
```

2. `.env`ファイルを編集して、必要なSlack APIトークンを設定します：

```
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token
SLACK_SOCKET_MODE=true
PORT=3000
LOG_LEVEL=info  # オプション: trace | debug | info | warn | error | fatal | silent（デフォルト: info）
```

**環境変数の説明**:

- `SLACK_BOT_TOKEN`: Slack Bot User OAuth Token（必須）
- `SLACK_SIGNING_SECRET`: Slack Signing Secret（必須）
- `SLACK_APP_TOKEN`: Slack App-Level Token（Socket Mode使用時に必須）
- `SLACK_SOCKET_MODE`: `"true"` または `"false"`（デフォルト: `"true"`）
- `PORT`: HTTPサーバーのポート番号。1〜65535の10進整数（デフォルト: `3000`）
- `BOT_MENTION_NAME`: ヘルプメッセージ表示用のボットメンション名（デフォルト: @trrbot）
- `LOG_LEVEL`: ログ出力レベル（オプション、大文字・小文字どちらでも可）
  - `trace`: 最も詳細なログ（パフォーマンストレース用）
  - `debug`: 詳細なデバッグログ（開発環境推奨）
  - `info`: 一般的な情報ログ（本番環境推奨、デフォルト）
  - `warn`: 警告メッセージのみ
  - `error`: エラーメッセージのみ
  - `fatal`: 致命的エラーのみ
  - `silent`: ログ出力なし

#### Dockerイメージのビルドと起動

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
  - `index.ts`: 環境変数とプロセス終了処理を扱うエントリーポイント
  - `app.ts`: 起動設定からBoltアプリケーションを生成するFactory
  - `runtime.ts`: DB・Repository・Service・Command・Handlerの組み立てとリソース管理
  - `config/`: 環境変数から起動設定を生成する処理
  - `db/`: データベース接続・スキーマ管理
  - `models/`: 永続化対象のデータ型
  - `repositories/`: SQLiteへのデータアクセスとトランザクション
  - `services/`: Repositoryを利用するビジネスロジック
  - `commands/`: Slackコマンドの解析・実行
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

このアプリはデフォルトではHTTPエンドポイントを公開せずに動作するため、「Socket Mode」をオンにします。これにより、WebSocketを使用してSlack APIと通信します。

環境変数 `SLACK_SOCKET_MODE` は未設定時に `"true"` として扱われます。`"false"` を設定すると、Socket Modeを利用しないHTTPベースでイベントを受け取る構成で起動します。それ以外の値は設定エラーになります。HTTP Modeでは `SLACK_APP_TOKEN` は不要です。

### トークンの取得

設定が完了したら、以下のトークンを取得し、`.env`ファイルに設定します：

- **Bot User OAuth Token**: 「OAuth & Permissions」セクションで取得できます（`SLACK_BOT_TOKEN`として設定）
- **Signing Secret**: 「Basic Information」セクションで取得できます（`SLACK_SIGNING_SECRET`として設定）
- **App-Level Token**: 「Basic Information」>「App-Level Tokens」で新しいトークンを生成します（`connections:write`スコープが必要、`SLACK_APP_TOKEN`として設定）

### アプリのインストール

設定が完了したら、「Install to Workspace」ボタンをクリックしてワークスペースにアプリをインストールします。インストール後、ボットをチャンネルに招待することで使用できるようになります。
