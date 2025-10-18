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
1. **Entry Point** (`src/index.ts`): Initializes database, registers handlers, and starts the Bolt app
2. **App Configuration** (`src/app.ts`): Creates and configures the Bolt app instance with Socket Mode or HTTP mode based on `SLACK_SOCKET_MODE` environment variable
3. **Event Handlers**: Two main handler types registered at startup:
   - `mentionHandler`: Processes `app_mention` events
   - `messageHandler`: Handles all message events for DMs (processes as commands) and channel messages (applies automatic reactions)

### Command System
Commands follow a class-based pattern implementing the `Command` interface (`src/commands/types.ts`):
- **Interface**: Each command must have `name`, `description`, `examples`, and `execute(context)` method
- **Registration**: Commands are registered in `src/commands/index.ts` in a `commandMap`
- **Parsing**: Command text is parsed in `mentionHandler` using `parseCommand()` utility
- **Execution**: Commands receive a `CommandContext` containing `event`, `say`, `logger`, `args`, and `client`
- **Special case**: Dice notation (e.g., `2d6`) is automatically routed to `DiceCommand` even without explicit command name

### Database Layer
- **SQLite** via `better-sqlite3` for persistence
- **Database file**: `data/trrbot.db` (auto-created on first run)
- **Models** (`src/models/`): Static class methods for database operations (e.g., `ReactionMappingModel`, `GroupModel`)
- **Services** (`src/services/`): Business logic layer that uses models (e.g., `ReactionService`, `GroupService`)

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

## Environment Variables

Required variables (see `.env.example`):
- `SLACK_BOT_TOKEN`: Bot User OAuth Token
- `SLACK_SIGNING_SECRET`: Signing secret from Slack
- `SLACK_APP_TOKEN`: App-level token (required for Socket Mode)
- `SLACK_SOCKET_MODE`: Set to `false` to use HTTP mode instead of Socket Mode (optional, defaults to true)
- `PORT`: Port for HTTP server (default: 3000)
- `BOT_MENTION_NAME`: Bot mention name for help display (default: @trrbot)
