# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

trrbot-ts-bolt is a TypeScript-based Slack bot built with the Slack Bolt framework. It provides various utility commands (dice rolls, random choices, shuffles, group management, etc.) and automatic reaction features based on message content.

## Development Commands

### Building and Running

- **Development mode with hot reload**: `npm run dev`
- **Build for production**: `npm run build`
- **Run production build**: `npm start`

### Testing and Code Quality

- **Run all tests**: `npm test`
- **Run tests in watch mode**: `npm test:watch`
- **Lint code**: `npm run lint`
- **Format code**: `npm run format`

### Running Single Tests

Use vitest's `-t` flag to run specific test files or test cases:

```bash
npx vitest run -t "test name pattern"
npx vitest run src/path/to/file.spec.ts
```

## Architecture

### Application Flow

1. **Entry Point** (`src/index.ts`): `.env`を読み込み、起動設定、Slack App、DB接続、Application Runtimeを生成し、プロセスシグナルを処理する
2. **App Configuration** (`src/config/appConfig.ts`): 環境変数を副作用のない起動設定へ変換する
3. **Slack App Factory** (`src/app.ts`): 起動設定とLoggerからBolt Appを生成する
4. **Application Runtime** (`src/runtime.ts`): Repository、Service、Command、Handlerを組み立て、起動とDB接続の終了を管理する
5. **Event Handlers**: Two main handler types registered at startup:
   - `mentionHandler`: Processes `app_mention` events
   - `messageHandler`: Handles all message events for DMs (processes as commands) and channel messages (applies automatic reactions)

### Command System

Commands follow a class-based pattern implementing the `Command` interface (`src/commands/types.ts`):

- **Interface**: 各コマンドは`description`、`getExamples(commandName)`、`execute(context)`を実装し、必要に応じて`getHelpText(commandName)`を実装する
- **Registration**: `src/commands/index.ts` の `createCommandRegistry` が、注入されたServiceから登録一覧とコマンド解決関数を生成する
- **Parsing**: `createCommandRouter`が`parseCommand()`を使ってコマンド名と引数を解析する
- **Execution**: コマンドは`event`、`say`、`logger`、`args`、`invokedName`、`client`を含む`CommandContext`を受け取る
- **Special case**: Dice notation (e.g., `2d6`) is automatically routed to `DiceCommand` even without explicit command name

### Database Layer

- **SQLite** via `better-sqlite3` for persistence
- **Database file**: `data/trrbot.db` (auto-created on first run)
- **Connection and schema** (`src/db/`): 呼び出しごとに独立した接続を開き、Application Runtimeが所有する接続のスキーマを初期化する
- **Models** (`src/models/`): `Group`、`GroupItem`、`ReactionMapping`などのデータ型を定義する
- **Repositories** (`src/repositories/`): 注入されたSQLite接続を使ってSQLとトランザクションを実行する
- **Services** (`src/services/`): 注入されたRepositoryを使ってGroup / Reactionのユースケースを実行する
- **Composition root** (`src/runtime.ts`): RepositoryとServiceを1回だけ生成し、Command registry、router、Handlerへ渡す

### Message Handling Strategy

- **DM messages**: Always processed as commands (no bot mention required)
- **Channel messages**:
  - If mentioned (`@trrbot command`), processed as command
  - If not mentioned, checked for automatic reaction triggers
- **Thread support**: Commands respond in thread if original message was in a thread

## Key Technical Details

### Socket Mode vs HTTP Mode

The bot defaults to Socket Mode (WebSocket connection) but can switch to HTTP mode by setting `SLACK_SOCKET_MODE=false` in environment variables.

### Build System

- **Vite** is used for building (not Webpack or tsc directly)
- Build output goes to `dist/` directory
- Output format is ES modules (`formats: ['es']`)
- External dependencies are not bundled (see `vite.config.ts` for full list)

### Test Framework

- **Vitest** (not Jest) for testing
- Test files follow `*.spec.ts` naming pattern
- Tests are colocated with source files in `src/`

### Code Quality

- **TypeScript** with strict mode enabled
- **ESLint** using flat config format (`eslint.config.js`)
- **Prettier** for formatting
- `@typescript-eslint/no-explicit-any` is enforced as error

### Type Safety

This project uses **Slack official type definitions** from `@slack/types` and `@slack/web-api` to ensure type safety:

- **SlackEvent**: Uses `GenericMessageEvent` from `@slack/types` instead of custom `any` types
  - Required properties: `type`, `user`, `channel`, `channel_type`, `event_ts`, `ts`
  - Optional properties: `text`, `thread_ts`, and many others
- **SayFunction**: Based on Slack's official types, accepts both string and object messages
  - Return type: `ChatPostMessageResponse` from `@slack/web-api`
- **Benefits**:
  - Complete IDE autocomplete for all Slack event properties
  - Compile-time type checking prevents runtime errors
  - Automatic updates when Slack SDK changes
  - Zero maintenance overhead for type definitions

**Test Mock Patterns**:

```typescript
// SlackEvent mock with required properties
const mockEvent: SlackEvent = {
  type: 'message',
  user: 'U123456',
  channel: 'C123456',
  channel_type: 'channel',
  event_ts: '1234567890.123456',
  ts: '1234567890.123456',
  text: 'test message',
} as SlackEvent;

// SayFunction mock with proper return type
const mockSay: SayFunction = vi.fn().mockResolvedValue({
  ok: true,
  channel: 'C123456',
  ts: '1234567890.123456',
});
```

See [src/commands/types.spec.ts](src/commands/types.spec.ts) for comprehensive type validation tests.

### Logging and Error Handling Strategy

**Unified Logger (`pino`)**:

- Global logger instance shared across the application ([src/utils/logger.ts](src/utils/logger.ts))
- Module-specific loggers created with `createLogger(moduleName)`
- Log level controlled by `LOG_LEVEL` environment variable (trace|debug|info|warn|error|fatal|silent)
- Bolt app uses the same logger instance for consistency via `PinoBoltLogger` wrapper

**Structured Logging**:

- All logs output as single-line JSON for easy parsing in CloudRun, CloudWatch, etc.
- Logs include contextual information (user, command, channel, timestamp, module)
- Pure JSON format: `{"level":"info","time":"2025-10-23T08:06:42.918Z","module":"database","message":"..."}`
- Severity levels: trace, debug, info (production default), warn, error, fatal, silent

**Error Handling Pattern**:

- Custom error classes in [src/utils/errors.ts](src/utils/errors.ts):
  - `BotError`: Base class with `userMessage`, `context`, `isRetryable`, `severity`
  - `ValidationError`: User input errors (non-retryable, warn level)
  - `DatabaseError`: DB operation errors (retryable, error level)
  - `SlackAPIError`: Slack API errors (retryable, error level)
- Centralized error handler in [src/utils/errorHandler.ts](src/utils/errorHandler.ts):
  - `handleCommandError()`: Unified error handling for commands
  - `logCommandSuccess()`: Success logging with context
  - `logDebug()`: Debug logging helper

**Usage in Commands**:

```typescript
import { handleCommandError, logCommandSuccess, logDebug } from '../utils/errorHandler';
import { ValidationError } from '../utils/errors';

async execute(context: CommandContext): Promise<void> {
  try {
    logDebug(logger, 'command-name', 'Operation start', { args });

    if (!isValid) {
      throw new ValidationError('Internal message', 'User message', { context });
    }

    // Command logic here

    logCommandSuccess(logger, 'command-name', { user, result });
  } catch (error) {
    await handleCommandError(error, context, 'command-name');
  }
}
```

### Git Hooks (Husky v9)

This project uses Git Hooks to ensure code quality:

- **pre-commit**: Runs `lint-staged` to automatically lint and format staged TypeScript files
  - ESLint with `--fix` flag
  - Prettier formatting
- **pre-push**: Runs `npm test` to ensure all tests pass before pushing
- **commit-msg**: Validates commit messages using `commitlint` (Conventional Commits format)

**Setup**: Hooks are automatically installed when running `npm install` via the `prepare` script.

**Configuration files**:

- `.husky/`: Hook scripts directory (no shebang needed in Husky v9)
- `commitlint.config.cjs`: Commit message rules (CommonJS format for ESM projects)
- `lint-staged` section in `package.json`: Staged files processing rules

**Commit Message Format** (Conventional Commits):

```
<type>: <subject>

[optional body]

[optional footer]
```

**Allowed types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style/formatting (no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or modifications
- `build`: Build system changes
- `ci`: CI configuration changes
- `chore`: Other changes (dependencies, etc.)
- `revert`: Revert a previous commit

**Examples**:

```bash
# Good commit messages
git commit -m "feat: add user authentication"
git commit -m "fix: resolve message sending error"
git commit -m "docs: update API documentation"
git commit -m "feat: グループ管理機能を追加"  # Japanese is allowed

# Bad commit messages (will be rejected)
git commit -m "updated files"  # Missing type
git commit -m "added feature"  # Missing colon after type
```

**Japanese commit messages are allowed** - the `subject-case` rule is disabled to support Japanese text.

**Bypassing hooks** (use sparingly):

```bash
git commit --no-verify
git push --no-verify
```

## Environment Variables

Required variables (see `.env.example`):

- `SLACK_BOT_TOKEN`: Bot User OAuth Token
- `SLACK_SIGNING_SECRET`: Signing secret from Slack
- `SLACK_APP_TOKEN`: App-level token (required for Socket Mode)
- `SLACK_SOCKET_MODE`: Set to `false` to use HTTP mode instead of Socket Mode (optional, defaults to true)
- `PORT`: Port for HTTP server (default: 3000)
- `BOT_MENTION_NAME`: Bot mention name for help display (default: @trrbot)
